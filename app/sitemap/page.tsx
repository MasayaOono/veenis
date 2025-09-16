// app/sitemap/page.tsx
import LegalContainer from "../_components/LegalContainer";
import Link from "next/link";

export default function SitemapPage() {
  const links = [
    { href: "/", label: "ホーム" },
    { href: "/posts", label: "記事一覧" },
    { href: "/posts/new", label: "記事作成（要ログイン）" },
    { href: "/groups", label: "グループ一覧" },
    { href: "/help", label: "ヘルプ" },
    { href: "/contact", label: "お問い合わせ" },
    { href: "/legal/terms", label: "利用規約" },
    { href: "/legal/privacy", label: "プライバシーポリシー" },
    { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
    { href: "/legal/guidelines", label: "コミュニティガイドライン" },
    { href: "/legal/copyright", label: "著作権・コンテンツポリシー" },
  ];

  return (
    <LegalContainer>
      <h1>サイトマップ</h1>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </LegalContainer>
  );
}
