// app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー | Hashtag Suggester",
  robots: { index: false, follow: true }, // 任意：検索結果に出したくない場合
};

export default function PrivacyPage() {
  const updated = "2025-09-01"; // ← 最終更新日
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm leading-7">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p className="text-gray-500">最終更新日: {updated}</p>

      <div className="text-xs">
        <Link className="underline" href="/">サービスに戻る</Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. 収集する情報</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>ユーザーが入力する投稿文・選択タグ等のコンテンツ</li>
          <li>利用状況（ボタン操作・エラー情報等）のイベント（※個人を特定しない範囲）</li>
          <li>技術情報（IPアドレス、ブラウザ情報、Cookie/ストレージ等）</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. 利用目的</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>ハッシュタグ候補の生成・再生成等の機能提供</li>
          <li>品質向上、不正防止（プロンプト上書き・危険行為検出等）、障害対応</li>
          <li>法令遵守・権利保護・コンプライアンス対応</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. 外部送信・第三者提供</h2>
        <p>
          本サービスはハッシュタグ生成や安全判定のため、入力テキスト等をAIベンダー（例：OpenAI API）へ送信する場合があります。
          ベンダー各社のデータ取り扱いは、各社のポリシーに従います。
        </p>
        <p className="text-xs text-gray-500">
          ※ベンダーの設定によっては、送信データが学習に利用されない構成を選択しています（可能な範囲での配慮）。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Cookie・解析</h2>
        <p>
          サイトの安定運用や利用状況の把握のため、Cookieや同等技術を使用することがあります。ブラウザ設定で無効化できますが、機能に影響する場合があります。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. 保管期間</h2>
        <p>
          収集情報は利用目的の達成に必要な期間のみ保管し、不要になり次第、適切に削除・匿名化します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. 安全管理措置</h2>
        <p>
          送信時の暗号化、アクセス制御、ログ監査等、合理的な安全管理措置を講じます。ただし、完全な安全を保証するものではありません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. ユーザーの権利</h2>
        <p>
          ご自身の個人情報に関する開示・訂正・削除・利用停止等の請求は、合理的な範囲で対応します。
          お問い合わせは下記連絡先までご連絡ください。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">8. 未成年の利用</h2>
        <p>未成年の方は、保護者の同意のもとご利用ください。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">9. 改定</h2>
        <p>
          本ポリシーは適宜改定されます。改定後は本ページの掲載をもって効力を生じます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">10. 連絡先</h2>
        <p>
          <a className="underline" href="mailto:bluecopper.contact@gmail.com">bluecopper.contact@gmail.com</a>
        </p>
      </section>

      <div className="pt-4 flex gap-4">
        <Link className="underline" href="/terms">利用規約へ</Link>
        <Link className="underline" href="/">サービスに戻る</Link>
      </div>
    </main>
  );
}
