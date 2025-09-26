// app/posts/[id]/opengraph-image/route.ts
import { ImageResponse } from "next/og";

export const runtime = "edge"; // 速い＆PNG生成
export const alt = "Post cover";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function decode(s: string | null): string | null {
  try {
    return s ? decodeURIComponent(s) : null;
  } catch {
    return s;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = decode(searchParams.get("title")) || "記事";
  const author = decode(searchParams.get("author")) || "";

  // シンプルで読みやすいレイアウト（SVG的に描画）
  // ここでは Web フォントは使わず、system-ui で安定表示
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#CC66E8",
          padding: 40,
        }}
      >
        <div
          style={{
            flex: 1,
            borderRadius: 28,
            background: "white",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            padding: 56,
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Helvetica Neue', Arial",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#444",
              display: "block",
              overflow: "hidden",
              displayWebkitBox: "block",
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: 24,
              width: 520,
              height: 6,
              background: "#45D0CF",
              borderRadius: 3,
            }}
          />

          {author ? (
            <div
              style={{
                marginTop: 36,
                fontSize: 32,
                fontWeight: 700,
                color: "#666",
              }}
            >
              {author}
            </div>
          ) : null}

          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, opacity: 0.9 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background:
                  "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
                boxShadow: "0 4px 12px rgba(6,182,212,0.35)",
              }}
            />
            <div
              style={{
                fontSize: 18,
                letterSpacing: 1.2,
                fontWeight: 600,
                color: "#666",
              }}
            >
              VEENIS
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
