

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."admin_delete_group"("p_group_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- 権限：該当グループの owner/admin のみ
  SELECT public.is_group_admin(p_group_id) INTO v_is_admin;  -- 定義あり :contentReference[oaicite:2]{index=2}
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  -- groupsを直接DELETE：
  --   group_members は FK ON DELETE CASCADE（トリガは pg_trigger_depth()>0 なので通過）
  --   posts.group_id は ON DELETE SET NULL（記事は残る）:contentReference[oaicite:3]{index=3}
  DELETE FROM public.groups WHERE id = p_group_id;

  -- 既存は void なのでRETURN値不要
END;
$$;


ALTER FUNCTION "public"."admin_delete_group"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."after_group_insert_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end$$;


ALTER FUNCTION "public"."after_group_insert_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_posts"("p_q" "text") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*)
  from public.posts p
  where p.is_published = true
    and (
      p_q is null or p_q = ''
      or to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(strip_markdown(p.body_md),''))
         @@ plainto_tsquery('simple', p_q)
    );
$$;


ALTER FUNCTION "public"."count_posts"("p_q" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_posts_with_tags"("p_q" "text", "p_tags" "text"[]) RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with tagged as (
    select pt.post_id
    from public.post_tags pt
    join public.tags t on t.id = pt.tag_id
    where t.name = any(p_tags)
    group by pt.post_id
    having count(distinct t.name) = cardinality(p_tags)
  )
  select count(*)
  from public.posts p
  join tagged tg on tg.post_id = p.id
  where p.is_published = true
    and (
      p_q is null or p_q = ''
      or to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(strip_markdown(p.body_md),''))
         @@ plainto_tsquery('simple', p_q)
    );
$$;


ALTER FUNCTION "public"."count_posts_with_tags"("p_q" "text", "p_tags" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_post_cascade"("p_post_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- 投稿者本人チェック（安全のため）
  if not exists (
    select 1 from posts where id = p_post_id and author_id = auth.uid()
  ) then
    raise exception 'forbidden';
  end if;

  delete from post_likes where post_id = p_post_id;
  delete from post_tags  where post_id = p_post_id;
  delete from posts where id = p_post_id;
end;
$$;


ALTER FUNCTION "public"."delete_post_cascade"("p_post_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_group_owner_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_limit int;
  v_count int;
  v_owner uuid;
begin
  v_owner := new.owner_id;
  v_limit := public.group_limit_for(v_owner);

  -- 既存所有グループ数（今の行を除外）
  select count(*) into v_count
  from public.groups
  where owner_id = v_owner
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if tg_op = 'INSERT' then
    if v_count + 1 > v_limit then
      raise exception 'GROUP_LIMIT_EXCEEDED: owner % has % groups (limit %)', v_owner, v_count, v_limit
        using errcode = 'P0001';
    end if;

  elsif tg_op = 'UPDATE' then
    -- owner_id を付け替える場合のみチェック
    if new.owner_id is distinct from old.owner_id then
      if v_count + 1 > v_limit then
        raise exception 'GROUP_LIMIT_EXCEEDED: owner % has % groups (limit %)', v_owner, v_count, v_limit
          using errcode = 'P0001';
      end if;
    end if;
  end if;

  return new;
end
$$;


ALTER FUNCTION "public"."enforce_group_owner_limit"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "body_md" "text" NOT NULL,
    "cover_image_url" "text",
    "visibility" "text" DEFAULT 'draft'::"text" NOT NULL,
    "link_token" "text",
    "group_id" "uuid",
    "is_published" boolean DEFAULT false NOT NULL,
    "read_minutes" integer,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fts" "tsvector" GENERATED ALWAYS AS (("setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("title", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("body_md", ''::"text")), 'B'::"char"))) STORED,
    CONSTRAINT "posts_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'link'::"text", 'group'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_post_by_token"("p_slug" "text", "p_token" "text") RETURNS "public"."posts"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select *
  from public.posts
  where slug = p_slug
    and is_published = true
    and visibility = 'link'
    and link_token = p_token
  limit 1
$$;


ALTER FUNCTION "public"."get_post_by_token"("p_slug" "text", "p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."group_limit_for"("p_user" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  select 3::int;  -- ← 有料化時はここを CASE や別テーブル参照に置き換え
$$;


ALTER FUNCTION "public"."group_limit_for"("p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_email text := new.email;
  v_local text := split_part(new.email, '@', 1);
  v_username text;
  i int := 0;
begin
  -- sanitize: 半角英数._- のみ＆小文字化。落ちたら "user" をベースに
  v_username := regexp_replace(lower(v_local), '[^a-z0-9._-]', '', 'g');
  if v_username is null or length(v_username) < 3 then
    v_username := 'user';
  end if;

  -- ユニーク化（最大5回までサフィックス付け替え）
  while exists(select 1 from public.profiles p where p.username = v_username) loop
    v_username := v_username || to_char(floor(random()*8999 + 1000), 'FM0000');
    i := i + 1;
    exit when i >= 5;
  end loop;

  insert into public.profiles (user_id, username, display_name, avatar_url, job, onboarding_needed, created_at, updated_at)
  values (new.id, v_username, v_local, null, null, true, now(), now())
  on conflict (user_id) do nothing;

  return new;
end $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_admin"("p_group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = uid
      and gm.role in ('owner','admin')
  );
end$$;


ALTER FUNCTION "public"."is_group_admin"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_member"("p_group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = uid
  );
end$$;


ALTER FUNCTION "public"."is_group_member"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_group_by_token"("p_token" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_group record;
  v_uid uuid;
begin
  -- 認証必須
  select auth.uid() into v_uid;
  if v_uid is null then
    raise exception 'auth required';
  end if;

  -- 該当グループをロック付きで取得（同時実行での使用回数競合を防ぐ）
  select *
    into v_group
  from public.groups
  where invite_token = p_token
  for update;

  if not found then
    raise exception 'invalid token';
  end if;

  -- 期限チェック
  if v_group.invite_expires_at is not null
     and now() > v_group.invite_expires_at then
    raise exception 'token expired';
  end if;

  -- 上限チェック
  if v_group.invite_max_uses is not null
     and v_group.invite_use_count >= v_group.invite_max_uses then
    raise exception 'token usage exceeded';
  end if;

  -- 既メンバーなら冪等に終了
  if exists (
    select 1
    from public.group_members
    where group_id = v_group.id
      and user_id  = v_uid
  ) then
    return;
  end if;

  -- 参加（重複は無視）
  insert into public.group_members(group_id, user_id, role)
  values (v_group.id, v_uid, 'member')
  on conflict do nothing;

  -- 使用回数を消費
  update public.groups
  set invite_use_count = coalesce(invite_use_count, 0) + 1
  where id = v_group.id;
end
$$;


ALTER FUNCTION "public"."join_group_by_token"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_posts"("p_q" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" "uuid", "title" "text", "slug" "text", "cover_image_url" "text", "like_count" integer, "author_username" "text", "author_display_name" "text", "author_avatar_url" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with base as (
    select
      p.id,
      p.title,
      p.slug,
      p.cover_image_url,
      p.published_at,
      -- いいね数
      (select count(1) from public.post_likes pl where pl.post_id = p.id) as like_count,
      -- 著者プロフ
      pr.username as author_username,
      pr.display_name as author_display_name,
      pr.avatar_url as author_avatar_url,
      -- 検索ベクトル & ランク
      to_tsvector('simple',
        coalesce(p.title,'') || ' ' || coalesce(strip_markdown(p.body_md),'')
      ) as vec,
      case
        when p_q is null or p_q = '' then 0::float4
        else ts_rank(
          to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(strip_markdown(p.body_md),'')),
          plainto_tsquery('simple', p_q)
        )
      end as rnk
    from public.posts p
    left join public.profiles pr on pr.user_id = p.author_id
    where p.is_published = true
      and (
        p_q is null or p_q = ''
        or to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(strip_markdown(p.body_md),''))
           @@ plainto_tsquery('simple', p_q)
      )
  )
  select
    b.id, b.title, b.slug, b.cover_image_url,
    b.like_count, b.author_username, b.author_display_name, b.author_avatar_url
  from base b
  order by
    case when p_sort = 'popular' then b.like_count end desc nulls last,
    b.rnk desc,
    b.published_at desc nulls last,
    b.id desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;


ALTER FUNCTION "public"."list_posts"("p_q" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_posts_with_tags"("p_q" "text", "p_sort" "text", "p_tags" "text"[], "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" "uuid", "title" "text", "slug" "text", "cover_image_url" "text", "like_count" integer, "author_username" "text", "author_display_name" "text", "author_avatar_url" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with tagged as (
    select pt.post_id
    from public.post_tags pt
    join public.tags t on t.id = pt.tag_id
    where t.name = any(p_tags)
    group by pt.post_id
    having count(distinct t.name) = cardinality(p_tags)  -- 全タグ一致
  ),
  base as (
    select
      p.id,
      p.title,
      p.slug,
      p.cover_image_url,
      p.published_at,
      (select count(1) from public.post_likes pl where pl.post_id = p.id) as like_count,
      pr.username as author_username,
      pr.display_name as author_display_name,
      pr.avatar_url as author_avatar_url,
      to_tsvector('simple',
        coalesce(p.title,'') || ' ' || coalesce(strip_markdown(p.body_md),'')
      ) as vec,
      case
        when p_q is null or p_q = '' then 0::float4
        else ts_rank(
          to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(strip_markdown(p.body_md),'')),
          plainto_tsquery('simple', p_q)
        )
      end as rnk
    from public.posts p
    join tagged tg on tg.post_id = p.id
    left join public.profiles pr on pr.user_id = p.author_id
    where p.is_published = true
      and (
        p_q is null or p_q = ''
        or to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(strip_markdown(p.body_md),''))
           @@ plainto_tsquery('simple', p_q)
      )
  )
  select
    b.id, b.title, b.slug, b.cover_image_url,
    b.like_count, b.author_username, b.author_display_name, b.author_avatar_url
  from base b
  order by
    case when p_sort = 'popular' then b.like_count end desc nulls last,
    b.rnk desc,
    b.published_at desc nulls last,
    b.id desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;


ALTER FUNCTION "public"."list_posts_with_tags"("p_q" "text", "p_sort" "text", "p_tags" "text"[], "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."make_tsquery"("p_q" "text") RETURNS "tsquery"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
  SELECT CASE
    WHEN p_q IS NULL OR btrim(replace(p_q,'　',' ')) = '' THEN NULL
    ELSE websearch_to_tsquery('simple', replace(p_q,'　',' '))
  END;
$$;


ALTER FUNCTION "public"."make_tsquery"("p_q" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_owner_leave"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 直接操作（DELETE発行者がユーザー）のみ禁止。CASCADE等は許可。
  IF TG_OP = 'DELETE' AND OLD.role = 'owner' AND pg_trigger_depth() = 0 THEN
    RAISE EXCEPTION 'owner cannot leave';
  END IF;
  RETURN OLD;
END$$;


ALTER FUNCTION "public"."prevent_owner_leave"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'extensions'
    AS $$
declare
  v_is_admin boolean;
  v_token    text;
begin
  -- 権限チェック（owner/adminのみ）
  select public.is_group_admin(p_group_id) into v_is_admin;
  if not coalesce(v_is_admin, false) then
    raise exception 'permission denied: admin only';
  end if;

  -- 16バイト乱数 → Base64URL（= をトリム）
  v_token := rtrim(
               replace(replace(encode(gen_random_bytes(16), 'base64'), '/', '_'), '+', '-'),
               '='
             );

  update public.groups
     set invite_token = v_token,
         updated_at   = now()
   where id = p_group_id;

  return v_token;
end;
$$;


ALTER FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid", "p_ttl_minutes" integer DEFAULT NULL::integer, "p_max_uses" integer DEFAULT NULL::integer) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_token text;
begin
  -- 権限チェック：管理者のみ（既存の is_group_admin を想定）
  if not public.is_group_admin(p_group_id) then
    raise exception 'not allowed';
  end if;

  v_token := encode(gen_random_bytes(24), 'base64')
             -- URL-safe
             |> replace('+/','-_')
             |> replace('=','');

  update public.groups
  set invite_token = v_token,
      invite_use_count = 0,
      invite_expires_at = case when p_ttl_minutes is null then null else now() + (p_ttl_minutes || ' minutes')::interval end,
      invite_max_uses = p_max_uses
  where id = p_group_id;

  return v_token;
end$$;


ALTER FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid", "p_ttl_minutes" integer, "p_max_uses" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_comment_author"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if new.author_id is null then
    new.author_id := auth.uid();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_comment_author"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."strip_markdown"("t" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select
    regexp_replace(                                 -- 装飾記号・括弧など薄めに除去
      regexp_replace(                               -- インラインコード `code`
        regexp_replace(coalesce(t,''), E'`[^`]*`', ' ', 'g'),
        E'```[\\s\\S]*?```', ' ', 'g'              -- コードブロック ``` ```
      ),
      E'[#*_>\\[\\]\\(\\)!\\-]+', ' ', 'g'
    )
$$;


ALTER FUNCTION "public"."strip_markdown"("t" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_follow"("p_followee" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if p_followee = auth.uid() then
    return false; -- 自分は不可
  end if;

  if exists(select 1 from user_follows where follower_id = auth.uid() and followee_id = p_followee) then
    delete from user_follows where follower_id = auth.uid() and followee_id = p_followee;
    return false; -- 解除後は false
  else
    insert into user_follows(follower_id, followee_id) values (auth.uid(), p_followee);
    return true; -- フォロー後は true
  end if;
end;
$$;


ALTER FUNCTION "public"."toggle_follow"("p_followee" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_post_tags"("p_post_id" "uuid", "p_tag_names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  uid uuid := auth.uid();
  tname text;
  tid uuid;
begin
  if uid is null then raise exception 'auth required'; end if;

  delete from public.post_tags where post_id = p_post_id;

  if p_tag_names is null then return; end if;

  foreach tname in array p_tag_names loop
    tname := trim(tname);
    if tname = '' then continue; end if;

    insert into public.tags (name, owner_id)
    values (tname, uid)
    on conflict (owner_id, name) do update set name = excluded.name
    returning id into tid;

    insert into public.post_tags (post_id, tag_id)
    values (p_post_id, tid)
    on conflict do nothing;
  end loop;
end$$;


ALTER FUNCTION "public"."upsert_post_tags"("p_post_id" "uuid", "p_tag_names" "text"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "follower_id" "uuid" NOT NULL,
    "followee_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "followee_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "group_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "invite_token" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "invite_expires_at" timestamp with time zone,
    "invite_max_uses" integer,
    "invite_use_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_tags" (
    "post_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."post_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "username" "text",
    "display_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "job" "text",
    "onboarding_needed" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "follower_id" "uuid" NOT NULL,
    "followee_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_follows_check" CHECK (("follower_id" <> "followee_id"))
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."user_follow_counts" AS
 SELECT "u"."id" AS "user_id",
    COALESCE("fw"."followers", 0) AS "followers",
    COALESCE("fo"."following", 0) AS "following"
   FROM (("auth"."users" "u"
     LEFT JOIN ( SELECT "user_follows"."followee_id",
            ("count"(*))::integer AS "followers"
           FROM "public"."user_follows"
          GROUP BY "user_follows"."followee_id") "fw" ON (("fw"."followee_id" = "u"."id")))
     LEFT JOIN ( SELECT "user_follows"."follower_id",
            ("count"(*))::integer AS "following"
           FROM "public"."user_follows"
          GROUP BY "user_follows"."follower_id") "fo" ON (("fo"."follower_id" = "u"."id")))
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."user_follow_counts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "followee_id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."post_tags"
    ADD CONSTRAINT "post_tags_pkey" PRIMARY KEY ("post_id", "tag_id");



ALTER TABLE "public"."posts"
    ADD CONSTRAINT "posts_link_token_when_link" CHECK ((("visibility" <> 'link'::"text") OR ("link_token" IS NOT NULL))) NOT VALID;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."posts"
    ADD CONSTRAINT "posts_published_requires_published_at" CHECK ((("is_published" = false) OR ("published_at" IS NOT NULL))) NOT VALID;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_owner_id_name_key" UNIQUE ("owner_id", "name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("follower_id", "followee_id");



CREATE INDEX "comments_author_id_idx" ON "public"."comments" USING "btree" ("author_id");



CREATE INDEX "comments_post_id_idx" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_parent" ON "public"."comments" USING "btree" ("parent_id");



CREATE INDEX "idx_comments_post_created" ON "public"."comments" USING "btree" ("post_id", "created_at" DESC);



CREATE INDEX "idx_gm_user" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_group_members_group_id" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_user_id" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_groups_owner_id" ON "public"."groups" USING "btree" ("owner_id");



CREATE INDEX "idx_post_likes_post" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_post_id" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_postid" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_user_id" ON "public"."post_likes" USING "btree" ("user_id");



CREATE INDEX "idx_post_tags_post_id" ON "public"."post_tags" USING "btree" ("post_id");



CREATE INDEX "idx_post_tags_tag_id" ON "public"."post_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_posts_author_id" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_body_trgm" ON "public"."posts" USING "gin" ("body_md" "public"."gin_trgm_ops");



CREATE INDEX "idx_posts_feed_group" ON "public"."posts" USING "btree" ("group_id", "published_at" DESC) WHERE (("is_published" = true) AND ("visibility" = 'group'::"text"));



CREATE INDEX "idx_posts_feed_public" ON "public"."posts" USING "btree" ("published_at" DESC) WHERE (("is_published" = true) AND ("visibility" = 'public'::"text"));



CREATE INDEX "idx_posts_fts" ON "public"."posts" USING "gin" ("fts");



CREATE INDEX "idx_posts_group" ON "public"."posts" USING "btree" ("group_id");



CREATE INDEX "idx_posts_group_id" ON "public"."posts" USING "btree" ("group_id");



CREATE INDEX "idx_posts_published" ON "public"."posts" USING "btree" ("is_published", "visibility", "published_at" DESC);



CREATE INDEX "idx_posts_published_at" ON "public"."posts" USING "btree" ("is_published", "published_at" DESC);



CREATE INDEX "idx_posts_title_trgm" ON "public"."posts" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_profiles_display_trgm" ON "public"."profiles" USING "gin" ("display_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_profiles_displayname_trgm" ON "public"."profiles" USING "gin" ("display_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_profiles_username_trgm" ON "public"."profiles" USING "gin" ("username" "public"."gin_trgm_ops");



CREATE INDEX "idx_tags_owner" ON "public"."tags" USING "btree" ("owner_id");



CREATE INDEX "idx_tags_owner_id" ON "public"."tags" USING "btree" ("owner_id");



CREATE INDEX "idx_user_follows_followee" ON "public"."user_follows" USING "btree" ("followee_id");



CREATE INDEX "idx_user_follows_follower" ON "public"."user_follows" USING "btree" ("follower_id");



CREATE UNIQUE INDEX "mv_user_follow_counts_pk" ON "public"."user_follow_counts" USING "btree" ("user_id");



CREATE INDEX "posts_fts_simple_idx" ON "public"."posts" USING "gin" ("to_tsvector"('"simple"'::"regconfig", ((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("public"."strip_markdown"("body_md"), ''::"text"))));



CREATE INDEX "posts_published_at_idx" ON "public"."posts" USING "btree" ("is_published", "published_at" DESC);



CREATE OR REPLACE TRIGGER "trg_after_group_insert" AFTER INSERT ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."after_group_insert_owner"();



CREATE OR REPLACE TRIGGER "trg_comments_set_author" BEFORE INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_comment_author"();



CREATE OR REPLACE TRIGGER "trg_enforce_group_owner_limit_ins" BEFORE INSERT ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_group_owner_limit"();



CREATE OR REPLACE TRIGGER "trg_enforce_group_owner_limit_upd" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_group_owner_limit"();



CREATE OR REPLACE TRIGGER "trg_gm_owner_leave" BEFORE DELETE ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_owner_leave"();



CREATE OR REPLACE TRIGGER "trg_groups_insert_owner" AFTER INSERT ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."after_group_insert_owner"();



CREATE OR REPLACE TRIGGER "trg_groups_owner" AFTER INSERT ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."after_group_insert_owner"();



CREATE OR REPLACE TRIGGER "trg_groups_owner_limit" BEFORE INSERT OR UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_group_owner_limit"();



CREATE OR REPLACE TRIGGER "trg_groups_touch_updated_at" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_posts_touch" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_posts_touch_updated" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_touch" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_touch_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_posts" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_followee_id_fkey" FOREIGN KEY ("followee_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_tags"
    ADD CONSTRAINT "post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_tags"
    ADD CONSTRAINT "post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_followee_id_fkey" FOREIGN KEY ("followee_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments readable by anyone" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "comments: delete own" ON "public"."comments" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "comments: delete post owner" ON "public"."comments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."author_id" = "auth"."uid"())))));



CREATE POLICY "comments: insert group" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."posts" "p"
     JOIN "public"."group_members" "gm" ON ((("gm"."group_id" = "p"."group_id") AND ("gm"."user_id" = "auth"."uid"()))))
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."visibility" = 'group'::"text")))));



CREATE POLICY "comments: insert owner" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."author_id" = "auth"."uid"())))));



CREATE POLICY "comments: insert public" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."visibility" = 'public'::"text")))));



CREATE POLICY "comments: select group" ON "public"."comments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."posts" "p"
     JOIN "public"."group_members" "gm" ON ((("gm"."group_id" = "p"."group_id") AND ("gm"."user_id" = "auth"."uid"()))))
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."visibility" = 'group'::"text")))));



CREATE POLICY "comments: select public" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."visibility" = 'public'::"text")))));



CREATE POLICY "comments: update own" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "delete by self" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "delete: only self follows" ON "public"."follows" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "delete: own comment" ON "public"."comments" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "delete: post owner can moderate" ON "public"."comments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."author_id" = "auth"."uid"())))));



CREATE POLICY "follow self-insert only" ON "public"."user_follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gm delete admin_or_self" ON "public"."group_members" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."is_group_admin"("group_id")));



CREATE POLICY "gm insert admin" ON "public"."group_members" FOR INSERT WITH CHECK ("public"."is_group_admin"("group_id"));



CREATE POLICY "gm insert owner bootstrap" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("g"."id" = "group_members"."group_id") AND ("g"."owner_id" = "auth"."uid"())))));



CREATE POLICY "gm select member" ON "public"."group_members" FOR SELECT USING ("public"."is_group_member"("group_id"));



CREATE POLICY "gm_delete_self_or_admin" ON "public"."group_members" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."is_group_admin"("group_id")));



CREATE POLICY "gm_insert_admin" ON "public"."group_members" FOR INSERT WITH CHECK ("public"."is_group_admin"("group_id"));



CREATE POLICY "gm_read_member" ON "public"."group_members" FOR SELECT USING ("public"."is_group_member"("group_id"));



ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "groups delete owner" ON "public"."groups" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "groups insert self" ON "public"."groups" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "groups select member_or_owner" ON "public"."groups" FOR SELECT TO "authenticated", "anon" USING (((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "groups"."id") AND ("gm"."user_id" = "auth"."uid"())))) OR ("owner_id" = "auth"."uid"())));



CREATE POLICY "groups update owner" ON "public"."groups" FOR UPDATE USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "groups_delete" ON "public"."groups" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "groups_delete_owner" ON "public"."groups" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "groups_insert" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "groups_insert_owner" ON "public"."groups" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "groups_read_member" ON "public"."groups" FOR SELECT USING ("public"."is_group_member"("id"));



CREATE POLICY "groups_select" ON "public"."groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "groups_update" ON "public"."groups" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "groups_update_owner" ON "public"."groups" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "insert by self" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "insert: group post comment (member, self)" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."posts" "p"
     JOIN "public"."group_members" "gm" ON ((("gm"."group_id" = "p"."group_id") AND ("gm"."user_id" = "auth"."uid"()))))
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."visibility" = 'group'::"text"))))));



CREATE POLICY "insert: only self follows" ON "public"."follows" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "insert: public post comment (self)" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."visibility" = 'public'::"text"))))));



CREATE POLICY "likes select all" ON "public"."post_likes" FOR SELECT USING (true);



CREATE POLICY "likes self rw" ON "public"."post_likes" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "likes_delete_self" ON "public"."post_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "likes_read_all" ON "public"."post_likes" FOR SELECT USING (true);



CREATE POLICY "likes_write_self" ON "public"."post_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_tags rw own" ON "public"."post_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_tags"."post_id") AND ("p"."author_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_tags"."post_id") AND ("p"."author_id" = "auth"."uid"())))));



CREATE POLICY "post_tags_owner" ON "public"."post_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_tags"."post_id") AND ("p"."author_id" = "auth"."uid"())))));



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts delete own" ON "public"."posts" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "posts insert own" ON "public"."posts" FOR INSERT WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "posts select matrix" ON "public"."posts" FOR SELECT USING (((("is_published" = true) AND ("visibility" = 'public'::"text")) OR ("author_id" = "auth"."uid"()) OR (("is_published" = true) AND ("visibility" = 'group'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "posts"."group_id") AND ("gm"."user_id" = "auth"."uid"())))))));



CREATE POLICY "posts update own" ON "public"."posts" FOR UPDATE USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "posts_read_public_group_self" ON "public"."posts" FOR SELECT USING (((("is_published" = true) AND (("visibility" = 'public'::"text") OR (("visibility" = 'group'::"text") AND "public"."is_group_member"("group_id")))) OR ("auth"."uid"() = "author_id")));



CREATE POLICY "posts_write_self" ON "public"."posts" TO "authenticated" USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles select all" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles self rw" ON "public"."profiles" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "read follows" ON "public"."user_follows" FOR SELECT USING (true);



CREATE POLICY "read: any" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "read: group post comments (member)" ON "public"."comments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."posts" "p"
     JOIN "public"."group_members" "gm" ON ((("gm"."group_id" = "p"."group_id") AND ("gm"."user_id" = "auth"."uid"()))))
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."visibility" = 'group'::"text")))));



CREATE POLICY "read: public post comments (anyone)" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "comments"."post_id") AND ("p"."visibility" = 'public'::"text")))));



ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags rw own" ON "public"."tags" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "tags_read_owner" ON "public"."tags" FOR SELECT USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "tags_write_owner" ON "public"."tags" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "unfollow self-delete only" ON "public"."user_follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "update by self" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "update: own comment" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



ALTER TABLE "public"."user_follows" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "veenis_app_admin";
GRANT USAGE ON SCHEMA "public" TO "veenis_app_writer";
GRANT USAGE ON SCHEMA "public" TO "veenis_app_reader";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."admin_delete_group"("p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_delete_group"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_group"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_group"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."after_group_insert_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."after_group_insert_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."after_group_insert_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_posts"("p_q" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."count_posts"("p_q" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_posts"("p_q" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_posts_with_tags"("p_q" "text", "p_tags" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."count_posts_with_tags"("p_q" "text", "p_tags" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_posts_with_tags"("p_q" "text", "p_tags" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_post_cascade"("p_post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_post_cascade"("p_post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_post_cascade"("p_post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_group_owner_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_group_owner_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_group_owner_limit"() TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."posts" TO "veenis_app_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."posts" TO "veenis_app_writer";
GRANT SELECT ON TABLE "public"."posts" TO "veenis_app_reader";



GRANT ALL ON FUNCTION "public"."get_post_by_token"("p_slug" "text", "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_post_by_token"("p_slug" "text", "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_post_by_token"("p_slug" "text", "p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."group_limit_for"("p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."group_limit_for"("p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."group_limit_for"("p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."join_group_by_token"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."join_group_by_token"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."join_group_by_token"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_group_by_token"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_posts"("p_q" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."list_posts"("p_q" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_posts"("p_q" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."list_posts_with_tags"("p_q" "text", "p_sort" "text", "p_tags" "text"[], "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."list_posts_with_tags"("p_q" "text", "p_sort" "text", "p_tags" "text"[], "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_posts_with_tags"("p_q" "text", "p_sort" "text", "p_tags" "text"[], "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."make_tsquery"("p_q" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."make_tsquery"("p_q" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."make_tsquery"("p_q" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_owner_leave"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_owner_leave"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_owner_leave"() TO "service_role";



GRANT ALL ON FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid", "p_ttl_minutes" integer, "p_max_uses" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid", "p_ttl_minutes" integer, "p_max_uses" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."regenerate_group_invite"("p_group_id" "uuid", "p_ttl_minutes" integer, "p_max_uses" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_comment_author"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_comment_author"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_comment_author"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strip_markdown"("t" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strip_markdown"("t" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strip_markdown"("t" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_follow"("p_followee" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_follow"("p_followee" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_follow"("p_followee" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_post_tags"("p_post_id" "uuid", "p_tag_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_post_tags"("p_post_id" "uuid", "p_tag_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_post_tags"("p_post_id" "uuid", "p_tag_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comments" TO "veenis_app_admin";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."follows" TO "veenis_app_admin";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."group_members" TO "veenis_app_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."group_members" TO "veenis_app_writer";
GRANT SELECT ON TABLE "public"."group_members" TO "veenis_app_reader";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."groups" TO "veenis_app_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."groups" TO "veenis_app_writer";
GRANT SELECT ON TABLE "public"."groups" TO "veenis_app_reader";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_likes" TO "veenis_app_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_likes" TO "veenis_app_writer";
GRANT SELECT ON TABLE "public"."post_likes" TO "veenis_app_reader";



GRANT ALL ON TABLE "public"."post_tags" TO "anon";
GRANT ALL ON TABLE "public"."post_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."post_tags" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_tags" TO "veenis_app_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_tags" TO "veenis_app_writer";
GRANT SELECT ON TABLE "public"."post_tags" TO "veenis_app_reader";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "veenis_app_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "veenis_app_writer";
GRANT SELECT ON TABLE "public"."profiles" TO "veenis_app_reader";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tags" TO "veenis_app_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tags" TO "veenis_app_writer";
GRANT SELECT ON TABLE "public"."tags" TO "veenis_app_reader";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_follows" TO "veenis_app_admin";



GRANT ALL ON TABLE "public"."user_follow_counts" TO "anon";
GRANT ALL ON TABLE "public"."user_follow_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follow_counts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_follow_counts" TO "veenis_app_admin";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "veenis_app_admin";






























RESET ALL;
