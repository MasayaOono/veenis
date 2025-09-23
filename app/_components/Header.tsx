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
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const BRAND = {
  plum: "#1B1430",
  rose: "#FF5C8A",
  violet: "#7B6EFF",
  gradient: (opacity = 0.9) =>
    `linear-gradient(90deg,
      rgba(27,20,48,${opacity}) 0%,
      rgba(123,110,255,${opacity * 0.75}) 55%,
      rgba(255,92,138,${opacity * 0.75}) 100%
    )`,
};

export default function Header() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const params = useSearchParams();

  const supabase = useMemo(() => createClient(), []);
  const [q, setQ] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false); // ← 認証確定フラグ
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  // 初期セッション確認 + 以降の状態変化を監視
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setEmail(data.session?.user?.email ?? null);

        // 初期セッションがあればサーバーCookieに同期
        if (data.session) {
          await fetch("/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "INITIAL_SESSION",
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          });
          router.refresh();
        }
      } finally {
        if (mounted) setAuthReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 変化発生中は一旦プレースホルダーに戻す
        setAuthReady(false);
        setEmail(session?.user?.email ?? null);

        await fetch("/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            access_token: session?.access_token ?? null,
            refresh_token: session?.refresh_token ?? null,
          }),
        });

        router.refresh();
        setAuthReady(true);
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = q.trim();
    const usp = new URLSearchParams();
    if (val) usp.set("q", val);
    router.push(`/posts${usp.toString() ? `?${usp.toString()}` : ""}`);
    setSearchOpen(false);
  };

  const logout = useCallback(async () => {
    setAuthReady(false);
    await supabase.auth.signOut();
    await fetch("/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "SIGNED_OUT",
        access_token: null,
        refresh_token: null,
      }),
    });
    setAnchorEl(null);
    router.refresh();
    router.push("/posts");
    setAuthReady(true);
  }, [router, supabase]);

  const inputBg = alpha("#FFFFFF", theme.palette.mode === "dark" ? 0.08 : 0.14);
  const inputBgHover = alpha(
    "#FFFFFF",
    theme.palette.mode === "dark" ? 0.12 : 0.18
  );
  const inputBorder = alpha("#FFFFFF", 0.25);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: BRAND.gradient(0.92),
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${alpha("#FFFFFF", 0.15)}`,
        }}
      >
        <Toolbar
          sx={{
            gap: 1.5,
            minHeight: { xs: 56, sm: 72 },
            px: { xs: 1.5, sm: 3 },
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* 左：ブランド */}
          <Typography
            variant="h6"
            sx={{
              flexShrink: 1,
              minWidth: 0,
              fontWeight: 800,
              letterSpacing: 0.2,
              color: "#fff",
              textShadow: `0 1px 0 ${alpha("#000", 0.2)}`,
              maxWidth: { xs: 140, sm: "unset" },
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            <Link
              component={NextLink}
              href="/"
              color="inherit"
              underline="none"
            >
              Veenis
            </Link>
          </Typography>

          {/* 可変スペーサ */}
          <Box sx={{ flexGrow: 1, minWidth: 8 }} />

          {/* 右：検索 + 作成 + ユーザー */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flexShrink: 1,
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            {/* 検索（xsはアイコン化→ダイアログ） */}
            {isXs ? (
              <Tooltip title="検索">
                <IconButton
                  aria-label="open search"
                  onClick={() => setSearchOpen(true)}
                  sx={{ color: "#fff" }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Box
                component="form"
                onSubmit={onSubmit}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: { sm: 360, md: 480 },
                  minWidth: 0,
                  flexShrink: 1,
                }}
              >
                <TextField
                  size="small"
                  fullWidth
                  placeholder="検索（タイトル・本文）"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  InputProps={{
                    sx: {
                      color: "#fff",
                      bgcolor: inputBg,
                      borderRadius: 2,
                      "&:hover": { bgcolor: inputBgHover },
                      "& fieldset": { borderColor: inputBorder },
                      "&:hover fieldset": {
                        borderColor: alpha("#FFFFFF", 0.35),
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: alpha("#FFFFFF", 0.8),
                      },
                    },
                    endAdornment: (
                      <IconButton
                        type="submit"
                        aria-label="search"
                        sx={{ color: "#fff" }}
                      >
                        <SearchIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            )}

            {/* 認証確定前：Skeletonでチラ見え抑止 */}
            {!authReady ? (
              <>
                <Skeleton
                  variant="rounded"
                  width={110}
                  height={36}
                  sx={{ display: { xs: "none", sm: "block" } }}
                />
                <Skeleton
                  variant="circular"
                  width={36}
                  height={36}
                  sx={{ display: { xs: "inline-flex", sm: "none" } }}
                />
                <Skeleton variant="circular" width={32} height={32} />
              </>
            ) : email ? (
              // ログイン済み
              <>
                <Button
                  component={NextLink}
                  href="/posts/new"
                  variant="contained"
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 999,
                    px: 2,
                    background: `linear-gradient(90deg, ${BRAND.violet} 0%, ${BRAND.rose} 100%)`,
                    boxShadow: `0 6px 16px ${alpha(BRAND.rose, 0.35)}`,
                    "&:hover": {
                      boxShadow: `0 8px 20px ${alpha(BRAND.rose, 0.5)}`,
                      filter: "brightness(1.02)",
                    },
                    whiteSpace: "nowrap",
                  }}
                  startIcon={<AddCircleOutlineIcon />}
                >
                  記事作成
                </Button>

                <Tooltip title="記事作成">
                  <IconButton
                    component={NextLink}
                    href="/posts/new"
                    aria-label="create post"
                    sx={{
                      display: { xs: "inline-flex", sm: "none" },
                      color: "#fff",
                      bgcolor: alpha("#000", 0.15),
                      "&:hover": { bgcolor: alpha("#000", 0.25) },
                      flexShrink: 0,
                    }}
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title={email}>
                  <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                      color: "#fff",
                      bgcolor: alpha("#000", 0.15),
                      "&:hover": { bgcolor: alpha("#000", 0.25) },
                      flexShrink: 0,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: alpha("#000", 0.35),
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {email.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={() => setAnchorEl(null)}
                  slotProps={{ paper: { sx: { mt: 1, borderRadius: 2 } } }}
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
              // 未ログイン
              <Link
                component={NextLink}
                href="/auth/login"
                color="inherit"
                underline="hover"
                sx={{
                  whiteSpace: "nowrap",
                  color: "#fff",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ログイン
              </Link>
            )}
          </Box>

          {/* 折返し調整 */}
          <Box sx={{ width: "100%", display: { xs: "block", sm: "none" } }} />
        </Toolbar>
      </AppBar>

      {/* モバイル検索ダイアログ */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth>
        <DialogTitle>検索</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onSubmit} sx={{ mt: 1, mb: 2 }}>
            <TextField
              autoFocus
              fullWidth
              placeholder="検索（タイトル・本文）"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton type="submit" aria-label="search">
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
