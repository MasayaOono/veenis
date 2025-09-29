// app/_components/Footer.tsx
"use client";

import NextLink from "next/link";
import {
  Box,
  Container,
  Divider,
  Link,
  Stack,
  Typography,
  IconButton,
  alpha,
  useTheme,
  SvgIcon,
} from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";

/** 簡易 Threads アイコン（必要なら公式SVGに差し替えてOK） */
function ThreadsIcon(props: React.ComponentProps<typeof SvgIcon>) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* outer ring */}
      <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
      {/* stylized @-like curve */}
      <path
        d="M15.8 12.2c0 2.35-1.83 3.8-3.96 3.8-1.46 0-2.68-.6-3.44-1.6l1.23-.94c.51.62 1.33 1.04 2.23 1.04 1.2 0 2.06-.72 2.06-1.9 0-1.16-.77-1.84-1.92-1.84-.64 0-1.2.18-1.76.58l-.16-1.4c.64-.39 1.32-.58 2.03-.58.9 0 1.68.26 2.27.77.43.38.74.9.88 1.54.29.03.61.07 1.04.13-.24-1.19-.79-2.07-1.62-2.73-.8-.63-1.87-.98-3.09-.98-1.02 0-1.98.23-2.85.69l-.07.04-.06-1.42c1.01-.45 2.09-.68 3.2-.68 1.6 0 2.98.45 4 1.31 1.01.84 1.58 2.02 1.58 3.65z"
        fillRule="evenodd"
      />
    </SvgIcon>
  );
}

const footerLinksPrimary = [
  { label: "利用規約", href: "/legal/terms" },
  { label: "プライバシーポリシー", href: "/legal/privacy" },
  // { label: "特定商取引法に基づく表記", href: "/legal/tokushoho" },
  { label: "ヘルプ", href: "/help" },
];

const footerLinksSecondary = [
  { label: "ガイドライン", href: "/legal/guidelines" },
  { label: "著作権・コンテンツポリシー", href: "/legal/copyright" },
  { label: "問い合わせ", href: "/contact" },
  { label: "サイトマップ", href: "/sitemap" },
];

export default function Footer() {
  const theme = useTheme();
  const now = new Date();
  const year = now.getFullYear();

  const bg =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha("#0f0a1f", 0.04);

  return (
    <Box component="footer" sx={{ mt: "auto", bgcolor: bg }}>
      <Divider sx={{ opacity: 0.3 }} />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* 上段：リンク */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.5, sm: 2 }}
          useFlexGap
          flexWrap="wrap"
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
            sx={{ "& a": { color: "text.secondary" } }}
          >
            {footerLinksPrimary.map((l) => (
              <Link
                key={l.href}
                component={NextLink}
                href={l.href}
                underline="hover"
                variant="body2"
              >
                {l.label}
              </Link>
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
            sx={{ "& a": { color: "text.secondary" } }}
          >
            {footerLinksSecondary.map((l) => (
              <Link
                key={l.href}
                component={NextLink}
                href={l.href}
                underline="hover"
                variant="body2"
              >
                {l.label}
              </Link>
            ))}
          </Stack>
        </Stack>

        {/* 中段：ブランド＆SNS */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ mt: 2.5 }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, letterSpacing: 0.2 }}
          >
            Veenis
          </Typography>

          <Stack direction="row" spacing={0.5}>
            {/* Instagram */}
            <IconButton
              aria-label="Instagram"
              href="https://www.instagram.com/veenis_official"
              target="_blank"
              rel="noreferrer"
              size="small"
            >
              <InstagramIcon fontSize="small" />
            </IconButton>

            {/* Threads */}
            <IconButton
              aria-label="Threads"
              href="https://www.threads.com/@veenis_official"
              target="_blank"
              rel="noreferrer"
              size="small"
            >
              <ThreadsIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* 下段：コピーライト */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5 }}
        >
          © {year} Veenis. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
