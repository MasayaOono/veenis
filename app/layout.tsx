// app/layout.tsx
import type { Metadata } from "next";
import Providers from "./providers";
import Header from "./_components/Header";
import { Container } from "@mui/material";
import "./globals.css";
import { Suspense } from "react";
export const metadata: Metadata = { title: "Veenis" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Suspense fallback={null}>
          <Providers>
            <Header />
            <Container
              maxWidth={false}
              disableGutters
              sx={{ py: 3, px: { xs: 2, sm: 3 } }}
            >
              {children}
            </Container>
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
