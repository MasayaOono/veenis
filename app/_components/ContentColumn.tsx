"use client";
import { PropsWithChildren } from "react";
import { Box } from "@mui/material";

/** 記事の入力/表示に使う共通の中央カラム */
export default function ContentColumn({
  children,
  maxWidth = 760, // ← ここを変えればサイト全体の本文幅が揃う
  px = 2, // サイド余白（レスポンシブ指定可）
  py = 0,
}: PropsWithChildren<{
  maxWidth?: number;
  px?: number | object;
  py?: number | object;
}>) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto", // 中央寄せ
        px,
        py,
      }}
    >
      {children}
    </Box>
  );
}
