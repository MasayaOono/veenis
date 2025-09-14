// app/groups/page.tsx
"use client";
import { useEffect, useState } from "react";
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
} from "@mui/material";
import NextLink from "next/link";
import { supabase } from "@/lib/supabaseClient";

type GroupRow = {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
};

export default function GroupsIndexPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromQuery = params.get("token"); // /groups?token=... にも対応

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinToken, setJoinToken] = useState("");

  // 所属一覧＋クエリtokenがあれば参加（クライアント側フォールバック）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: me } = await supabase.auth.getUser();
        const uid = me.user?.id;
        if (!uid) throw new Error("未ログインです");

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

        // クエリtokenがあれば参加→URL正規化
        if (tokenFromQuery) {
          const { data, error } = await supabase.rpc("join_group_by_token", {
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
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newName.trim()) return;
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) return setMsg("未ログインです");

    const { data, error } = await supabase
      .from("groups")
      .insert([{ name: newName.trim(), owner_id: uid }])
      .select("id")
      .single();
    if (error) return setMsg(error.message);

    setOpenCreate(false);
    setNewName("");
    setMsg("グループを作成しました");
    router.push(`/groups/${data!.id}`); // 詳細へ
  };

  const joinByToken = async () => {
    if (!joinToken.trim()) return;
    const { data, error } = await supabase.rpc("join_group_by_token", {
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

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: 2, py: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">グループ</Typography>
        <Button variant="contained" onClick={() => setOpenCreate(true)}>
          グループを作成
        </Button>
      </Stack>

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
            disabled={!newName.trim()}
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
