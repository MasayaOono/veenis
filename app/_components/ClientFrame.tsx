// app/_components/ClientFrame.tsx
"use client";

import { Container } from "@mui/material";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { Suspense } from "react";

export default function ClientFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPostNew = pathname?.startsWith("/posts/new");

  const showFooter = !isPostNew;
  const showHeader = !isPostNew;

  return (
    <>
      {showHeader && (
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      )}

      <main className="site-main">
        <Container
          maxWidth={false}
          disableGutters
          sx={{ py: 3, px: { xs: 2, sm: 3 } }}
        >
          {/* ← ここを Suspense で包む */}
          <Suspense fallback={null}>{children}</Suspense>
        </Container>
      </main>

      {showFooter && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </>
  );
}
