// app/g/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const token = params.token;

  // 未ログインならログインへ（戻り先を携帯）
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect_to", `/g/${encodeURIComponent(token)}`);
    return NextResponse.redirect(url);
  }

  // サーバー側で参加
  const { data, error } = await supabase.rpc("join_group_by_token", { p_token: token });
  if (error) {
    const url = new URL("/groups/join", req.url);
    url.searchParams.set("err", error.message);
    return NextResponse.redirect(url);
  }

  // 成功→詳細へリダイレクト
  return NextResponse.redirect(new URL(`/groups/${data as string}`, req.url));
}
