import { ImageResponse } from "next/og";

export const runtime = "edge";

const W = 1200;
const H = 630;

function titleFontSize(len: number) {
  if (len <= 10) return 72;
  if (len <= 16) return 64;
  if (len <= 22) return 56;
  if (len <= 30) return 48;
  if (len <= 42) return 40;
  return 34;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "タイトル未設定").trim();
  const author = (searchParams.get("author") || "").trim();

  const pad = 48;
  const radius = 36;
  const brand = {
    border: "#CC66E8",
    panel: "#FFFFFF",
    title: "#555555",
    sub: "#666666",
    underline: "#45D0CF",
  };
  const tSize = titleFontSize([...title].length);
  const underlineW = Math.max(280, Math.min(560, Math.round(W * 0.46)));

  return new ImageResponse(
    (
      <div style={{
        width: W, height: H, display: "flex",
        background: brand.border, borderRadius: radius, padding: pad,
      }}>
        <div style={{
          flex: 1, background: brand.panel, borderRadius: radius,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column", padding: 56,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Helvetica Neue', Arial",
        }}>
          {/* タイトル */}
          <div style={{
            margin: "0 auto", maxWidth: 920, textAlign: "center",
            fontSize: tSize, fontWeight: 800, lineHeight: 1.2,
            color: brand.title, whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {title}
          </div>

          {/* アンダーライン */}
          <div style={{
            width: underlineW, height: 6, borderRadius: 3,
            background: brand.underline, margin: "22px auto 0",
          }} />

          {/* 著者 */}
          {author ? (
            <div style={{
              marginTop: 36, textAlign: "center",
              fontSize: 32, fontWeight: 700, color: brand.sub,
            }}>
              {author}
            </div>
          ) : null}

          {/* 右下ロゴ */}
          <div style={{
            marginTop: "auto", display: "flex", alignItems: "center",
            gap: 12, justifyContent: "center", opacity: 0.9,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
              boxShadow: "0 4px 12px rgba(6,182,212,0.35)",
            }} />
            <div style={{ fontSize: 18, letterSpacing: 1.2, fontWeight: 600, color: "#666" }}>
              VEENIS
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
