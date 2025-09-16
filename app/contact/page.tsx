// app/contact/page.tsx
import LegalContainer from "../_components/LegalContainer";

export default function ContactPage() {
  return (
    <LegalContainer>
      <h1>お問い合わせ</h1>
      <p>ご意見・ご要望・不具合報告などは下記よりお知らせください。</p>

      <h2>お問い合わせ方法</h2>
      <ul>
        <li>
          メール：
          <a href="mailto:【TODO】support@veenis.example">
            【TODO】support@veenis.example
          </a>
        </li>
        <li>
          フォーム：
          <a href="https://forms.gle/【TODO】" target="_blank" rel="noreferrer">
            Googleフォーム
          </a>
        </li>
      </ul>

      <h2>回答目安</h2>
      <p>
        通常2〜5営業日以内に返信します。内容によりお時間を頂く場合があります。
      </p>
    </LegalContainer>
  );
}
