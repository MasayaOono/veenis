"use client";
import { PropsWithChildren } from "react";

export default function LegalContainer({ children }: PropsWithChildren) {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "28px 16px" }}>
      {children}
    </main>
  );
}
