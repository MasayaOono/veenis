// components/InfoStrip.tsx
"use client";
import { useEffect, useState } from "react";
import { Paper, Stack, Typography, Button } from "@mui/material";
import NextLink from "next/link";

export default function InfoStrip() {
  const KEY = "veenis_info_seen";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(!localStorage.getItem(KEY)), []);
  if (!open) return null;

  return (
    <Paper variant="outlined" sx={{ p: 1.25, mb: 2, borderRadius: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}
             alignItems={{ sm: "center" }} justifyContent="space-between">
        <Typography variant="body2">
          <b>Veenis</b>：美容・サロン向けに、現場の手順やプロトコルを
          Markdownで共有できる場所です。
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={NextLink} href="/about" size="small">詳しく</Button>
          <Button
            size="small"
            onClick={() => { localStorage.setItem(KEY, "1"); setOpen(false); }}
          >
            閉じる
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
