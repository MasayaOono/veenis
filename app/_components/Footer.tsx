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
} from "@mui/material";
import XIcon from "@mui/icons-material/X";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";

const footerLinksPrimary = [
  { label: "利用規約", href: "/legal/terms" },
  { label: "プライバシーポリシー", href: "/legal/privacy" },
  { label: "特定商取引法に基づく表記", href: "/legal/tokushoho" },
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
            <IconButton
              aria-label="X"
              href="https://x.com/your_account"
              target="_blank"
              rel="noreferrer"
              size="small"
            >
              <XIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Instagram"
              href="https://instagram.com/your_account"
              target="_blank"
              rel="noreferrer"
              size="small"
            >
              <InstagramIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="YouTube"
              href="https://youtube.com/@your_account"
              target="_blank"
              rel="noreferrer"
              size="small"
            >
              <YouTubeIcon fontSize="small" />
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
