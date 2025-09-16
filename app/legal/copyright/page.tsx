// app/legal/copyright/page.tsx
import LegalContainer from "@/app/_components/LegalContainer";

export default function CopyrightPolicyPage() {
  return (
    <LegalContainer>
      <h1>著作権・コンテンツポリシー</h1>
      <p>
        Veenis上のコンテンツの権利関係と利用条件を定めます。ユーザーは投稿に必要な権利を自ら保有または適法に取得してください。
      </p>

      <h2>ユーザー投稿の権利</h2>
      <ul>
        <li>投稿の著作権は投稿者に帰属します。</li>
        <li>
          投稿者は当社に対し、サービス運営・広報・品質改善の目的に限り、無償・非独占的・地域無制限で利用（複製・表示・公衆送信・翻案等）を許諾します。
        </li>
      </ul>

      <h2>第三者の権利尊重</h2>
      <p>
        他者の著作物・肖像・商標等を含む場合は、必要な許諾を取得してください。出典を明示し、引用要件を満たす範囲を超えて利用しないでください。
      </p>

      <h2>削除要請（侵害申立）</h2>
      <p>
        権利侵害が疑われる場合は、該当URL、権利者情報、侵害の根拠を明記のうえ
        <a href="/contact">お問い合わせ</a>{" "}
        からご連絡ください。合理的に確認後、適切に対応します。
      </p>

      <h2>商標</h2>
      <p>本文中の会社名・製品名は各社の商標または登録商標です。</p>
    </LegalContainer>
  );
}
