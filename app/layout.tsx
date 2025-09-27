// app/layout.tsx
import type { Metadata } from "next";
import Providers from "./providers";
import { Suspense } from "react";
import ClientFrame from "./_components/ClientFrame";
import "./globals.css";
import AuthListener from "./_components/AuthListner";
import TopProgress from "./_components/TopProgress";
const site =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://veenis.vercel.app";

export const metadata: Metadata = {
  title: "Veenis",
  metadataBase: new URL(site),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      {/* body をフレックス親にするのは globals.css 側で実施 */}
      <body className="layout-root">
        <Suspense fallback={null}>
          <TopProgress />
          <AuthListener />
          <Providers>
            <ClientFrame>{children}</ClientFrame>
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
