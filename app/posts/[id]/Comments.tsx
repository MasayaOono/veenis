// app/posts/[id]/Comments.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Divider,
  Avatar,
  IconButton,
} from "@mui/material";
import DeleteOutline from "@mui/icons-material/DeleteOutline";

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  parent_id: string | null;
};

type ProfileLite = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function Comments({ postId }: { postId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [me, setMe] = useState<string | null>(null);
  const [items, setItems] = useState<CommentRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const pageSize = 50;

  const loadProfiles = useCallback(
    async (userIds: string[]) => {
      const missing = userIds.filter((id) => !profiles[id]);
      if (missing.length === 0) return;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", missing);
      if (data?.length) {
        setProfiles((prev) => ({
          ...prev,
          ...Object.fromEntries(data.map((p) => [p.user_id, p as ProfileLite])),
        }));
      }
    },
    [profiles, supabase]
  );

  const fetchComments = useCallback(async () => {
    const { data: parents } = await supabase
      .from("comments")
      .select("id,post_id,author_id,body,created_at,deleted_at,parent_id")
      .eq("post_id", postId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(pageSize);

    const { data: replies } = await supabase
      .from("comments")
      .select("id,post_id,author_id,body,created_at,deleted_at,parent_id")
      .eq("post_id", postId)
      .not("parent_id", "is", null)
      .order("created_at", { ascending: true });

    const map: Record<string, CommentRow[]> = {};
    (replies ?? []).forEach((r) => {
      const pid = (r as CommentRow).parent_id!;
      (map[pid] ||= []).push(r as CommentRow);
    });

    const flattened: CommentRow[] = [];
    (parents ?? []).forEach((c) => {
      const parent = c as CommentRow;
      flattened.push(parent);
      (map[parent.id] ?? []).forEach((r) => flattened.push(r));
    });

    setItems(flattened);

    // プロフィールを一括ロード
    const ids = Array.from(new Set(flattened.map((c) => c.author_id)));
    await loadProfiles(ids);

    // 自分のID
    const { data: meRes } = await supabase.auth.getUser();
    setMe(meRes.user?.id ?? null);
  }, [postId, supabase, loadProfiles]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime: INSERT/DELETE 差分反映 + 必要ならプロフィール単発取得
  useEffect(() => {
    const ch = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload: any) => {
          const row = payload.new as CommentRow;
          // 先頭に追加（重複防止）
          setItems((prev) =>
            prev.some((x) => x.id === row.id) ? prev : [row, ...prev]
          );
          if (!profiles[row.author_id]) {
            await loadProfiles([row.author_id]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload: any) => {
          const row = payload.old as CommentRow;
          setItems((prev) => prev.filter((x) => x.id !== row.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, postId, profiles, loadProfiles]);

  // 送信：insert の戻り値を即追加（楽観更新）
  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setPosting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, body: text, parent_id: null })
      .select("id,post_id,author_id,body,created_at,deleted_at,parent_id")
      .single();

    setPosting(false);
    if (error) return;

    setBody("");
    if (data) {
      setItems((prev) =>
        prev.some((x) => x.id === data.id)
          ? prev
          : [data as CommentRow, ...prev]
      );
      // 自分のプロフィールが未登録なら足す
      const uid = (data as CommentRow).author_id;
      if (uid && !profiles[uid]) {
        await loadProfiles([uid]);
      }
    } else {
      fetchComments();
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id)); // 楽観削除
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) fetchComments(); // 失敗時は戻す
  };

  const displayNameOf = (uid: string) =>
    profiles[uid]?.display_name || profiles[uid]?.username || "ユーザー";

  const avatarOf = (uid: string) => profiles[uid]?.avatar_url || undefined;
  const initialOf = (uid: string) =>
    (
      profiles[uid]?.display_name?.charAt(0) ??
      profiles[uid]?.username?.charAt(0) ??
      "U"
    ).toUpperCase();

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        コメント
      </Typography>

      {/* 入力欄 */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="コメントを書く…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          size="small"
        />
        <Button
          onClick={submit}
          variant="contained"
          disabled={!body.trim() || posting}
        >
          送信
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* 一覧 */}
      <Stack spacing={1.5}>
        {items.map((c) => {
          const isReply = !!c.parent_id;
          const canDelete = me && me === c.author_id;
          const name = displayNameOf(c.author_id);
          return (
            <Stack
              key={c.id}
              direction="row"
              spacing={1.5}
              sx={{ pl: isReply ? 5 : 0 }}
            >
              <Avatar
                src={avatarOf(c.author_id)}
                sx={{ width: 28, height: 28 }}
              >
                {initialOf(c.author_id)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2">{name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(c.created_at).toLocaleString()}
                  </Typography>
                  {canDelete && (
                    <IconButton
                      onClick={() => remove(c.id)}
                      size="small"
                      aria-label="delete"
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {c.deleted_at ? "（削除されました）" : c.body}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
