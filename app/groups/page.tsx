// app/groups/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Link,
  Tooltip,
} from "@mui/material";
import NextLink from "next/link";
import { createClient } from "@/lib/supabase";

type GroupRow = {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
};

const MAX_FREE_GROUPS = 3; // 自分が owner のグループ最大数（無料）

export default function GroupsIndexPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromQuery = params.get("token"); // /groups?token=... にも対応

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinToken, setJoinToken] = useState("");

  // 上限判定用：自分が owner のグループ数
  const [ownedCount, setOwnedCount] = useState<number>(0);
  const [limitsLoading, setLimitsLoading] = useState<boolean>(true);

  // 将来の課金対応フラグ（今は常に false）
  const canExceedLimit = false;

  // 自分が owner のグループ数を取得
  const refreshOwnedCount = async () => {
    setLimitsLoading(true);
    try {
      const { data: me } = await supabase.auth.getUser();
      const uid = me.user?.id;
      if (!uid) throw new Error("未ログインです");

      const { count, error } = await supabase
        .from("groups")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", uid);

      if (error) throw error;
      setOwnedCount(count ?? 0);
    } catch (e: any) {
      setMsg(e?.message ?? "上限情報の取得に失敗しました");
    } finally {
      setLimitsLoading(false);
    }
  };

  // 所属一覧＋クエリtokenがあれば参加（クライアント側フォールバック）＋上限取得
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: me } = await supabase.auth.getUser();
        const uid = me.user?.id;
        if (!uid) throw new Error("未ログインです");

        // 所属グループ一覧
        const { data: gm, error: e1 } = await supabase
          .from("group_members")
          .select("group_id, role")
          .eq("user_id", uid);
        if (e1) throw e1;

        const ids = (gm ?? []).map((x: any) => x.group_id);
        let list: GroupRow[] = [];
        if (ids.length) {
          const { data: gs, error: e2 } = await supabase
            .from("groups")
            .select("id, name")
            .in("id", ids);
          if (e2) throw e2;
          list = (gs ?? []).map((g: any) => ({
            id: g.id,
            name: g.name,
            role: (gm ?? []).find((m: any) => m.group_id === g.id)!.role,
          }));
        }
        if (!cancelled) setGroups(list);

        // 自分が owner の数も更新
        await refreshOwnedCount();

        // クエリtokenがあれば参加→URL正規化
        if (tokenFromQuery) {
          const { error } = await supabase.rpc("join_group_by_token", {
            p_token: tokenFromQuery,
          });
          if (error) throw error;
          setMsg("グループに参加しました");
          router.replace("/groups");
        }
      } catch (e: any) {
        if (!cancelled) setMsg(e.message ?? "読み込みに失敗しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenFromQuery, router]);

  const reload = async () => {
    setLoading(true);
    try {
      const { data: me } = await supabase.auth.getUser();
      const uid = me.user?.id;
      if (!uid) throw new Error("未ログインです");

      const { data: gm } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", uid);
      const ids = (gm ?? []).map((x: any) => x.group_id);
      let list: GroupRow[] = [];
      if (ids.length) {
        const { data: gs } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", ids);
        list = (gs ?? []).map((g: any) => ({
          id: g.id,
          name: g.name,
          role: (gm ?? []).find((m: any) => m.group_id === g.id)!.role,
        }));
      }
      setGroups(list);
      await refreshOwnedCount();
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newName.trim()) return;

    try {
      const { data: me } = await supabase.auth.getUser();
      const uid = me.user?.id;
      if (!uid) {
        setMsg("未ログインです");
        return;
      }

      // 作成直前にも最新カウント確認（同時実行対策）
      const { count, error: cntErr } = await supabase
        .from("groups")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", uid);
      if (cntErr) throw cntErr;

      const currentCount = count ?? 0;
      if (!canExceedLimit && currentCount >= MAX_FREE_GROUPS) {
        setMsg(
          `無料プランではグループ作成は最大 ${MAX_FREE_GROUPS} 件までです。`
        );
        return;
      }

      const { data, error } = await supabase
        .from("groups")
        .insert([{ name: newName.trim(), owner_id: uid }])
        .select("id")
        .single();
      if (error) throw error;

      setOpenCreate(false);
      setNewName("");
      setMsg("グループを作成しました");
      // 成功後に自前カウント更新
      await refreshOwnedCount();
      router.push(`/groups/${data!.id}`); // 詳細へ
    } catch (e: any) {
      setMsg(e?.message ?? "グループ作成に失敗しました");
    }
  };

  const joinByToken = async () => {
    if (!joinToken.trim()) return;
    const { error } = await supabase.rpc("join_group_by_token", {
      p_token: joinToken.trim(),
    });
    if (error) {
      setMsg(error.message);
    } else {
      setMsg("グループに参加しました");
      setJoinToken("");
      await reload();
    }
  };

  const reachedLimit = !canExceedLimit && ownedCount >= MAX_FREE_GROUPS;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: 2, py: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="h5">グループ</Typography>

        <Tooltip
          arrow
          title={
            reachedLimit
              ? `無料プランでは最大 ${MAX_FREE_GROUPS} 件まで作成できます`
              : ""
          }
        >
          <span>
            <Button
              variant="contained"
              onClick={() => setOpenCreate(true)}
              disabled={reachedLimit || limitsLoading}
            >
              グループを作成
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 2, display: "block" }}
      >
        {limitsLoading
          ? "作成上限を確認中…"
          : `自分がオーナーのグループ: ${ownedCount}/${MAX_FREE_GROUPS}${
              canExceedLimit ? "（上限解除中）" : ""
            }`}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <TextField
          label="招待トークンで参加"
          placeholder="例: xxxxx-yyyyy..."
          value={joinToken}
          onChange={(e) => setJoinToken(e.target.value)}
          fullWidth
        />
        <Button
          variant="outlined"
          onClick={joinByToken}
          sx={{ whiteSpace: "nowrap" }}
        >
          参加する
        </Button>
        <Button
          component={NextLink}
          href="/groups/join"
          sx={{ whiteSpace: "nowrap" }}
        >
          招待リンクから参加
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : groups.length === 0 ? (
        <Alert severity="info">所属しているグループはありません。</Alert>
      ) : (
        <Stack spacing={1}>
          {groups.map((g) => (
            <Card key={g.id} variant="outlined">
              <CardActionArea component={NextLink} href={`/groups/${g.id}`}>
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle1">{g.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {g.role}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
        <DialogTitle>グループを作成</DialogTitle>
        <DialogContent>
          {!canExceedLimit && (
            <Alert severity={reachedLimit ? "warning" : "info"} sx={{ mb: 2 }}>
              無料プランでは最大 {MAX_FREE_GROUPS} 件まで作成できます。
              {reachedLimit && " 既に上限に達しています。"}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            label="グループ名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={createGroup}
            disabled={!newName.trim() || reachedLimit}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!msg}
        autoHideDuration={2600}
        onClose={() => setMsg(null)}
      >
        <Alert onClose={() => setMsg(null)} severity="info" variant="filled">
          {msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
