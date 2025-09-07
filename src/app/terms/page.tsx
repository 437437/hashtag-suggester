// app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "利用規約 | Hashtag Suggester",
  robots: { index: false, follow: true }, // 規約は index: false 推奨（任意）
};

export default function TermsPage() {
  const updated = "2025-09-01"; // ← 最終更新日を都度更新
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm leading-7">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <p className="text-gray-500">最終更新日: {updated}</p>
      
      <div className="text-xs">
        <Link className="underline" href="/">サービスに戻る</Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. 本サービス</h2>
        <p>
          本サービス「Hashtag Suggester」（以下「本サービス」）は、ユーザーの投稿文に基づき
          AIがハッシュタグ候補を提示するツールです。生成結果は参考情報であり、完全性・正確性・有用性・適法性を保証しません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. 禁止事項</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>法令・公序良俗に反する行為、またはその助長</li>
          <li>危険行為・違法行為（例：兵器・爆発物・違法薬物等）の作り方や運用の具体化</li>
          <li>差別・ヘイト・嫌がらせ・自傷の助長、性的搾取等</li>
          <li>他者の知的財産権・プライバシー・名誉の侵害</li>
          <li>システムの不正利用、プロンプトインジェクション等</li>
        </ul>
        <p className="text-xs text-gray-500">
          これらに該当する場合、生成をブロックまたは安全寄りの結果に制限することがあります。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. 免責</h2>
        <p>
          本サービスは「現状有姿」で提供されます。生成されたハッシュタグの利用により生じたいかなる損害についても、
          提供者は一切の責任を負いません。最終的な投稿内容の適法性・各プラットフォーム規約の遵守は、
          ユーザー自身の責任でご確認ください。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. 知的財産</h2>
        <p>
          本サービスに関する一切の権利は提供者または正当な権利者に帰属します。UI・テキスト・コード等の無断複製は禁止です。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. サービスの変更・停止</h2>
        <p>
          提供者は事前通知なく本サービスの内容変更・中断・終了を行うことがあります。これにより生じた損害について責任を負いません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. 規約の変更</h2>
        <p>
          本規約は適宜改定されます。改定後の規約は本ページに掲載された時点で効力を生じます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. 準拠法・裁判管轄</h2>
        <p>本規約は日本法に準拠し、紛争は提供者の所在地を管轄する裁判所を第一審の専属的合意管轄とします。</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">8. お問い合わせ</h2>
        <p>
          ご意見・お問い合わせは
          <a className="underline ml-1" href="mailto:bluecopper.contact@gmail.com">bluecopper.contact@gmail.com</a>
          までご連絡ください。
        </p>
      </section>

      <div className="pt-4 flex gap-4">
        <Link className="underline" href="/privacy">プライバシーへ</Link>
        <Link className="underline" href="/">サービスに戻る</Link>
      </div>
    </main>
  );
}
