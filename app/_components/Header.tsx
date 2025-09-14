// app/_components/Header.tsx
"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  IconButton,
  Link,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Header() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user?.email ?? null);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
    });
    init();
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = q.trim();
    const usp = new URLSearchParams();
    if (val) usp.set("q", val);
    router.push(`/posts${usp.toString() ? `?${usp.toString()}` : ""}`);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAnchorEl(null);
    router.push("/posts");
  };

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ gap: 2 }}>
        {/* 左：ブランド */}
        <Typography variant="h6" sx={{ flexShrink: 0 }}>
          <Link component={NextLink} href="/" color="inherit" underline="none">
            Veenis
          </Link>
        </Typography>

        {/* スペーサ */}
        <Box sx={{ flexGrow: 1 }} />

        {/* 右側：検索 + （ログイン時のみ）記事作成 + ユーザーメニュー */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* 検索 */}
          <Box
            component="form"
            onSubmit={onSubmit}
            sx={{
              display: "flex",
              alignItems: "center",
              width: { xs: 220, sm: 360, md: 480 },
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="検索（タイトル・本文）"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit(e as any)}
            />
            <IconButton type="submit" aria-label="search" color="inherit">
              <SearchIcon />
            </IconButton>
          </Box>

          {/* 記事作成（ログイン時のみ表示） */}
          {email && (
            <>
              {/* PC/タブレット：テキストボタン */}
              <Button
                component={NextLink}
                href="/posts/new"
                color="inherit"
                variant="outlined"
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  borderColor: "rgba(255,255,255,0.6)",
                }}
                startIcon={<AddCircleOutlineIcon />}
              >
                記事作成
              </Button>

              {/* モバイル：アイコンボタン */}
              <Tooltip title="記事作成">
                <IconButton
                  component={NextLink}
                  href="/posts/new"
                  color="inherit"
                  sx={{ display: { xs: "inline-flex", sm: "none" } }}
                  aria-label="create post"
                >
                  <AddCircleOutlineIcon />
                </IconButton>
              </Tooltip>
            </>
          )}

          {/* ユーザーメニュー */}
          {email ? (
            <>
              <Tooltip title={email}>
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  color="inherit"
                >
                  <Avatar sx={{ width: 28, height: 28 }}>
                    {email.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem
                  component={NextLink}
                  href="/me"
                  onClick={() => setAnchorEl(null)}
                >
                  マイページ
                </MenuItem>
                <MenuItem
                  component={NextLink}
                  href="/groups"
                  onClick={() => setAnchorEl(null)}
                >
                  グループ一覧
                </MenuItem>
                <MenuItem onClick={logout}>ログアウト</MenuItem>
              </Menu>
            </>
          ) : (
            <Link
              component={NextLink}
              href="/auth/login"
              color="inherit"
              underline="hover"
              sx={{ whiteSpace: "nowrap" }}
            >
              ログイン
            </Link>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
