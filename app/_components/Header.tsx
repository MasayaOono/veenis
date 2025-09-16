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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Brand tokens（Veenis）
 * - 深いプラム: 上質/落ち着き
 * - ローズ/コーラル: 美容らしい血色感
 * - バイオレット: クリーン＆テックのニュアンス
 *
 * 必要に応じてここだけ色を変えれば全体が追従します。
 */
const BRAND = {
  plum: "#1B1430", // 背面ベース
  rose: "#FF5C8A", // アクセント1
  violet: "#7B6EFF", // アクセント2
  // ヘッダーのグラデーション（左→右）
  gradient: (opacity = 0.9) =>
    `linear-gradient(90deg,
      rgba(27,20,48,${opacity}) 0%,
      rgba(123,110,255,${opacity * 0.75}) 55%,
      rgba(255,92,138,${opacity * 0.75}) 100%
    )`,
};

export default function Header() {
  const theme = useTheme();
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

  // ライト/ダークで検索ボックスの透明度を微調整
  const inputBg = alpha("#FFFFFF", theme.palette.mode === "dark" ? 0.08 : 0.14);
  const inputBgHover = alpha(
    "#FFFFFF",
    theme.palette.mode === "dark" ? 0.12 : 0.18
  );
  const inputBorder = alpha("#FFFFFF", 0.25);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        // グラデーション＋ガラス（ぼかし）
        background: BRAND.gradient(0.92),
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${alpha("#FFFFFF", 0.15)}`,
      }}
    >
      <Toolbar
        sx={{
          gap: 2,
          minHeight: { xs: 64, sm: 72 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 左：ブランドロゴ/テキスト */}
        <Typography
          variant="h6"
          sx={{
            flexShrink: 0,
            fontWeight: 800,
            letterSpacing: 0.2,
            // ロゴを強調しつつ白でコントラスト
            color: "#fff",
            textShadow: `0 1px 0 ${alpha("#000", 0.2)}`,
          }}
        >
          <Link component={NextLink} href="/" color="inherit" underline="none">
            Veenis
          </Link>
        </Typography>

        {/* スペーサ */}
        <Box sx={{ flexGrow: 1 }} />

        {/* 右側：検索 + 作成 + ユーザーメニュー */}
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
              InputProps={{
                sx: {
                  color: "#fff",
                  bgcolor: inputBg,
                  borderRadius: 2,
                  "&:hover": { bgcolor: inputBgHover },
                  "& fieldset": { borderColor: inputBorder },
                  "&:hover fieldset": { borderColor: alpha("#FFFFFF", 0.35) },
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

          {/* 記事作成（ログイン時のみ表示） */}
          {email && (
            <>
              {/* PC/タブレット：グラデボタン */}
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
                  aria-label="create post"
                  sx={{
                    display: { xs: "inline-flex", sm: "none" },
                    color: "#fff",
                    bgcolor: alpha("#000", 0.15),
                    "&:hover": { bgcolor: alpha("#000", 0.25) },
                  }}
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
                  sx={{
                    color: "#fff",
                    bgcolor: alpha("#000", 0.15),
                    "&:hover": { bgcolor: alpha("#000", 0.25) },
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
                open={open}
                onClose={() => setAnchorEl(null)}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                    },
                  },
                }}
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
              sx={{ whiteSpace: "nowrap", color: "#fff", fontWeight: 700 }}
            >
              ログイン
            </Link>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
