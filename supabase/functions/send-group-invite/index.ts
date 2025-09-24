// supabase/functions/send-group-invite/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

type Payload = {
  group_id: string;
  emails: string[];
};

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { group_id, emails } = (await req.json()) as Payload;

    if (!group_id || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: "invalid payload" }, { status: 400 });
    }

    // 認証ユーザーを取得（フロントからの Authorization ヘッダを継承）
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    // 権限チェック（is_group_admin RPC を想定）
    const { data: isAdmin, error: rpcErr } = await supabase.rpc("is_group_admin", {
      p_group_id: group_id,
    });
    if (rpcErr) {
      return Response.json({ error: rpcErr.message }, { status: 500 });
    }
    if (!isAdmin) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }

    // 招待URL（/g/<token>）。グループに token がある想定
    const { data: group, error: gerr } = await supabase
      .from("groups")
      .select("name, invite_token")
      .eq("id", group_id)
      .maybeSingle();

    if (gerr) return Response.json({ error: gerr.message }, { status: 500 });
    if (!group?.invite_token) {
      return Response.json({ error: "invite_token not found" }, { status: 404 });
    }

    const siteUrl = Deno.env.get("SITE_URL") ?? new URL(req.url).origin;
    const inviteUrl = `${siteUrl}/g/${group.invite_token}`;

    // メール送信（Resend を例に）
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return Response.json({ error: "missing RESEND_API_KEY" }, { status: 500 });
    }

    const subject = `「${group.name}」への招待`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6;">
        <h2>グループに招待されています</h2>
        <p>以下のリンクから参加してください（要ログイン）。</p>
        <p><a href="${inviteUrl}" target="_blank" rel="noopener">参加する</a></p>
        <p style="color:#666;font-size:12px;">リンク：${inviteUrl}</p>
      </div>
    `;

    const results: { to: string; status: number; id?: string; error?: unknown }[] = [];
    for (const to of emails) {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Veenis <noreply@yourdomain.example>", // Verified Sender に置き換え
          to,
          subject,
          html,
        }),
      });
      const body = await resp.json().catch(() => ({}));
      results.push({ to, status: resp.status, id: body?.id, error: body?.error });
    }

    return Response.json({ ok: true, invite_url: inviteUrl, results });
  } catch (e) {
    return Response.json({ error: (e as Error)?.message ?? "internal error" }, { status: 500 });
  }
});
