// app/api/og/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

function truncate(str: string, n = 80) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = truncate(searchParams.get("title") || "記事");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0f172a,#1f2937)",
          color: "white",
          fontSize: 64,
          fontWeight: 800,
          padding: "80px",
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
