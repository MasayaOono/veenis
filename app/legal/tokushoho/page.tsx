// app/legal/tokushoho/page.tsx
import LegalContainer from "@/app/_components/LegalContainer";

export default function TokushohoPage() {
  return (
    <LegalContainer>
      <h1>特定商取引法に基づく表記</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 0" }}>販売事業者</th>
            <td style={{ padding: "8px 0" }}>【TODO】事業者名</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 0" }}>運営責任者</th>
            <td style={{ padding: "8px 0" }}>【TODO】氏名</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 0" }}>所在地</th>
            <td style={{ padding: "8px 0" }}>【TODO】住所</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 0" }}>電話番号</th>
            <td style={{ padding: "8px 0" }}>【TODO】電話番号</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 0" }}>
              メールアドレス
            </th>
            <td style={{ padding: "8px 0" }}>【TODO】サポート用メール</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 0" }}>
              サイトURL
            </th>
            <td style={{ padding: "8px 0" }}>https://【TODO】</td>
          </tr>
        </tbody>
      </table>

      <h2>販売価格</h2>
      <p>各商品・サービスの販売ページに表示（消費税・手数料の扱いを明記）。</p>

      <h2>商品代金以外の必要料金</h2>
      <ul>
        <li>決済手数料：決済事業者の規定に準拠</li>
        <li>通信費：インターネット接続に係る費用はユーザー負担</li>
      </ul>

      <h2>お支払い方法</h2>
      <p>クレジットカード、その他当社が認める方法。</p>

      <h2>役務の提供時期</h2>
      <p>決済完了後、即時または商品ページに記載の時期。</p>

      <h2>返品・キャンセル</h2>
      <ul>
        <li>デジタルサービスの性質上、提供開始後の返金は原則不可。</li>
        <li>二重課金等の誤課金は個別対応。</li>
      </ul>

      <h2>動作環境</h2>
      <p>最新の主要ブラウザ（Chrome/Edge/Safari/Firefox）の最新版を推奨。</p>
    </LegalContainer>
  );
}
