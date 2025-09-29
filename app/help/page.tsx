// app/help/page.tsx
import LegalContainer from "../_components/LegalContainer";
import Link from "next/link";

export default function HelpPage() {
  return (
    <LegalContainer>
      <h1>ヘルプ / よくある質問</h1>

      <h2>アカウント</h2>
      <p>
        <b>Q.</b> ログインできません。
        <br />
        <b>A.</b> パスワードリセットをしたい場合は
        <Link href="/contact">こちら</Link> からご連絡ください。
        今後のアップデートでパスワードリセット機能を追加する予定です。
      </p>

      <h2>投稿</h2>
      <p>
        <b>Q.</b> 画像がアップロードできません。
        <br />
        <b>A.</b>{" "}
        画像形式（JPG/PNG/WebP）・サイズを確認し、通信環境をお試し直しください。
      </p>

      <h2>権利・ガイドライン</h2>
      <p>
        <b>Q.</b> ビフォー/アフター写真の注意点は？
        <br />
        <b>A.</b>{" "}
        本人同意の取得、加工有無の明示、個人情報の写り込み防止を徹底してください。
      </p>

      <h2>有料機能・請求</h2>
      <p>
        <b>Q.</b> 請求書/領収書は発行できますか？
        <br />
        <b>A.</b>{" "}
        決済メールまたは決済事業者の画面からダウンロード可能です。個別発行は{" "}
        <Link href="/contact">お問い合わせ</Link> ください。
      </p>
    </LegalContainer>
  );
}
