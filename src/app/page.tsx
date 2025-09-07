"use client";
import { useState, useRef, useEffect } from "react";
import CustomModal from "@/components/CustomModal";
import type { ChangeEvent } from "react";

type Lang = "auto" | "ja" | "en";

// --- カウント系ユーティリティ ---
const URL_RE = /(https?:\/\/[^\s]+)|(?:www\.[^\s]+)/gi;
function countUnitsPlain(str: string): number {
  let units = 0;
  for (const ch of str) units += ch.charCodeAt(0) <= 0x7f ? 1 : 2;
  return units;
}
function countUnitsWithUrls(str: string): number {
  URL_RE.lastIndex = 0;
  let total = 0, lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(str)) !== null) {
    const urlStart = m.index;
    const urlEnd = urlStart + m[0].length;
    total += countUnitsPlain(str.slice(lastIndex, urlStart));
    total += 23; // URLは固定23
    lastIndex = urlEnd;
  }
  total += countUnitsPlain(str.slice(lastIndex));
  return total;
}
function trimToUnitsWithUrls(str: string, maxUnits: number): string {
  URL_RE.lastIndex = 0;
  let out = "", used = 0, lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(str)) !== null) {
    const urlStart = m.index;
    const url = m[0];
    const urlEnd = urlStart + url.length;
    const before = str.slice(lastIndex, urlStart);
    for (const ch of before) {
      const inc = ch.charCodeAt(0) <= 0x7f ? 1 : 2;
      if (used + inc > maxUnits) return out;
      out += ch; used += inc;
    }
    if (used + 23 > maxUnits) return out;
    out += url; used += 23;
    lastIndex = urlEnd;
  }
  const tail = str.slice(lastIndex);
  for (const ch of tail) {
    const inc = ch.charCodeAt(0) <= 0x7f ? 1 : 2;
    if (used + inc > maxUnits) break;
    out += ch; used += inc;
  }
  return out;
}

// --- Main Component ---
export default function Home() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState<Lang>("auto");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [finalText, setFinalText] = useState("");

  // ヘルプ（チュートリアル）
  const [helpOpen, setHelpOpen] = useState(false);

  // ▼ 追加：ポリシー/免責モーダル
  const [policyOpen, setPolicyOpen] = useState(false);

  // --- トースト（全通知を統一） ---
  const [toast, setToast] = useState<{ open: boolean; message: string; tone?: "info" | "error" | "success" }>({
    open: false,
    message: "",
    tone: "info",
  });
  const toastTimeoutRef = useRef<number | null>(null);
  const showToast = (
    message: string,
    tone: "info" | "error" | "success" = "info",
    ms = 2000
  ) => {
    setToast({ open: true, message, tone });
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    const id = window.setTimeout(() => {
      setToast((t) => ({ ...t, open: false }));
    }, ms);
    toastTimeoutRef.current = id;
  };
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // --- ボタン共通スタイル（黒 / 白） ---
  const BTN_BASE =
    "inline-flex items-center justify-center gap-2 rounded border font-mono " +
    "transition h-9 px-3 text-sm " + // ← ここに text-sm を追加（全ボタン統一）
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const BTN_BLACK = `${BTN_BASE} border-black bg-black text-white hover:bg-gray-900 active:bg-black/90 focus-visible:ring-black`;
  const BTN_WHITE = `${BTN_BASE} border-gray-300 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-300`;
  
  // 確認モーダル
  const [modal, setModal] = useState<{
    open: boolean;
    action: "suggest" | "regenerate" | null;
    title: string;
    message: string;
    confirmText?: string;
  }>({ open: false, action: null, title: "", message: "" });

  const LIMIT = 280;
  const usedUnits = countUnitsWithUrls(text);
  const remain = Math.max(0, LIMIT - usedUnits);
  const finalUsedUnits = countUnitsWithUrls(finalText);
  const finalRemain = Math.max(0, LIMIT - finalUsedUnits);

  const onChangeText = (v: string) => setText(trimToUnitsWithUrls(v, LIMIT));
  const onChangeFinalText = (v: string) => setFinalText(trimToUnitsWithUrls(v, LIMIT));

  // --- Footer (sticky) ---
  function Footer() {
    const year = new Date().getFullYear();
    return (
      <footer
        className="fixed bottom-0 left-0 w-full border-t text-sm text-gray-600 bg-white z-50 pt-3 pb-5"
        style={{ paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-medium">© {year} Yuri Saito. All rights reserved.</div>
            {/* ▼ 追加：規約リンク */}
            <div className="flex items-center gap-3 text-xs">
              <a href="/terms" className="underline hover:text-gray-900">利用規約</a>
              <span aria-hidden="true">/</span>
              <a href="/privacy" className="underline hover:text-gray-900">プライバシー</a>
              <span aria-hidden="true">/</span>
              <button
                onClick={() => (window.scrollTo({ top: 0, behavior: "smooth" }), setPolicyOpen(true))}
                className="underline hover:text-gray-900"
              >
                ポリシー / 免責
              </button>
            </div>
          </div>
          <a
            href="https://ko-fi.com/bluecopper_v"
            target="_blank"
            rel="noopener noreferrer"
            className={`${BTN_WHITE}`}
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </footer>
    );
  }

  /** API呼び出し（採用済み exclude 対応） */
  const fetchTags = async (exclude: string[] = []) => {
    if (!text.trim()) {
      showToast("投稿文を入力してください。", "error");
      return;
    }
    setLoading(true);
    try {
      const url = new URL(`/api/suggest`, window.location.origin);
      url.searchParams.set("text", text);
      url.searchParams.set("lang", lang);
      if (exclude.length > 0) url.searchParams.set("exclude", exclude.join(","));
      const r = await fetch(url.toString());
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.blocked) {
        showToast(
          j.warning || "上書き指示/危険行為の可能性を検出しました。別の言い回しでお試しください。",
          "error",
          4000
        );
        return; // 候補の更新は行わず、ここで終了
      }
      const filtered = (j.tags ?? []).filter((t: string) => !selected.includes(t));
      setTags(filtered);
      setSource(j.source ?? "");
      if (filtered.length === 0) {
        showToast("新しい候補は見つかりませんでした。条件を変えて試してください。", "info");
      } else {
        showToast("タグ候補を更新しました。", "success");
      }
    } catch {
      showToast("タグ生成に失敗しました。時間をおいて再度お試しください。", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- モーダル起動
  const onSuggest = () => {
    if (!text.trim()) {
      showToast("投稿文を入力してください。", "error");
      return;
    }
    setModal({
      open: true,
      action: "suggest",
      title: "新しいタグ候補を作成します",
      message: "現在の候補と採用済みタグはすべてリセットされます。\n\n続行しますか？",
      confirmText: "提案する",
    });
  };
  const onRegenerate = () => {
    if (!text.trim()) {
      showToast("投稿文を入力してください。", "error");
      return;
    }
    setModal({
      open: true,
      action: "regenerate",
      title: "タグ候補を再生成します",
      message: "採用済みタグはそのまま残し、新しい候補だけ生成し直します。\n\n続行しますか？",
      confirmText: "再生成する",
    });
  };

  // --- モーダル確定/キャンセル
  const handleModalConfirm = () => {
    const act = modal.action;
    setModal((m) => ({ ...m, open: false }));
    if (act === "suggest") {
      setSelected([]);
      fetchTags(); // excludeなし
    } else if (act === "regenerate") {
      fetchTags(selected); // 採用済みを除外して再生成
    }
  };
  const handleModalCancel = () => setModal((m) => ({ ...m, open: false }));

  // --- UI操作
  const toggleSelect = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // 本文＋採用タグ → 最終投稿
  const updateFinalFromCurrent = () => {
    const base = text.trim();
    const tagsLine = selected.join(" ").trim();
    const composed = [base, tagsLine].filter(Boolean).join("\n");
    setFinalText(trimToUnitsWithUrls(composed, LIMIT));
    showToast("本文と採用タグを反映しました。", "success");
  };

  // クリップボード（トースト統一）
  const copyAllCandidates = async () => {
    const line = tags.join(" ");
    try {
      await navigator.clipboard.writeText(line);
      showToast("候補タグをすべてコピーしました！", "success");
    } catch {
      showToast("コピーに失敗しました。手動で選択してコピーしてください。", "error");
    }
  };
  const copySelected = async () => {
    const line = selected.join(" ");
    try {
      await navigator.clipboard.writeText(line);
      showToast("採用タグだけコピーしました！", "success");
    } catch {
      showToast("コピーに失敗しました。手動で選択してコピーしてください。", "error");
    }
  };
  const copyFinal = async () => {
    try {
      await navigator.clipboard.writeText(finalText);
      showToast("最終投稿をコピーしました！", "success");
    } catch {
      showToast("コピーに失敗しました。手動で選択してコピーしてください。", "error");
    }
  };

  return (
    <>
      {/* 下部フッターと被らない余白（安全領域考慮） */}
      <main
        className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6"
        style={{ paddingBottom: "calc(128px + env(safe-area-inset-bottom,0px))" }}
      >
        {/* タイトル行 + ？（チュートリアル）＋ 1行説明 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">Hashtag Suggester</h1>
            <button
              type="button"
              aria-label="使い方を表示"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              title="使い方"
            >
              ？
            </button>
          </div>

          {/* 1行説明（モバイルで長い場合は省略表示） */}
          <p className="text-sm text-gray-500">
            投稿文からAIがハッシュタグを提案し、文字数管理までサポートします。
          </p>
        </div>

        {/* 入力欄 */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">投稿文</h2>
          <p id="post-help" className="text-xs text-gray-500">
            X想定：半角=1・全角=2・URL=23 として <b>280</b> カウントまで
          </p>
          <textarea
            id="post-text"
            aria-describedby="post-help"
            className="w-full border rounded p-3 min-h-[160px] sm:min-h-[120px] text-[16px]"
            placeholder="例）昨日作ったパスタが思った以上に美味しかった🍝レシピはここを参考にしてみた！https://example.com"
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">
              本文カウント: <b>{usedUnits}</b> / 上限 <b>{LIMIT}</b>（残り {remain}）
            </span>

            {/* 言語＋操作群（モバイルでも横並び） */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-500">言語:</span>
              <select
                className="border rounded p-2 text-[16px]"
                value={lang}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setLang(e.target.value as Lang)}
              >
                <option value="auto">Auto</option>
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>

              {/* ← 2ボタンを同じ行で等幅に */}
              <div className="flex gap-2 flex-1 min-w-[220px]">
                <button
                  onClick={onSuggest}
                  disabled={loading || text.trim().length === 0}
                  className={`${BTN_BLACK} flex-1 min-w-[110px]`}
                >
                  {loading ? "生成中..." : "タグ提案"}
                </button>

                <button
                  onClick={onRegenerate}
                  disabled={loading || tags.length === 0}
                  className={`${BTN_BLACK} flex-1 min-w-[110px]`}
                >
                  {loading ? "再生成中..." : "再生成"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 候補タグ（スマホで溢れたら縦スクロール） */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">候補タグ（クリックで採用）</h2>
          {tags.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 sm:max-h-none">
                {tags.map((t) => {
                  const active = selected.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleSelect(t)}
                      className={`border rounded px-3 py-2 font-mono transition text-[14px] ${
                        active
                          ? "bg-black text-white border-black"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      title={active ? "採用解除" : "採用"}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 items-start sm:items-center mt-3">
                <button onClick={copyAllCandidates} className={`${BTN_WHITE} w-full sm:w-auto`}>
                  すべてコピー
                </button>
                <span className="text-xs opacity-60">
                  生成元: {source === "openai" ? "OpenAI" : "Fallback"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm opacity-60">まだ候補がありません。上の「タグ提案」から生成してください。</p>
          )}
          <p className="text-[11px] text-gray-400">
            ※危険・違法行為の具体化やモデル上書き等が検出された場合、提案をブロック/制限することがあります。生成結果の利用はご自身の責任でご確認ください。
          </p>
        </section>

        {/* 採用タグ */}
        <section className="border rounded p-4">
          <h3 className="text-base font-semibold mb-2">採用タグ（クリックで解除 / 一括コピー可）</h3>
          {selected.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {selected.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleSelect(t)}
                    className="border rounded px-3 py-2 font-mono bg-blue-50 hover:bg-blue-100 text-[14px]"
                    title="採用解除"
                  >
                    {t} ✕
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <button onClick={copySelected} className={`${BTN_WHITE} w-full sm:w-auto`}>
                  採用だけコピー
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm opacity-60">まだ採用タグはありません。上の候補からクリックで追加できます。</p>
          )}
        </section>

        {/* 最終投稿 */}
        <section className="border rounded p-4 space-y-2">
          <h2 className="text-lg font-semibold">最終投稿（プレビュー＋編集可）</h2>
          <div className="flex gap-2">
            <button onClick={updateFinalFromCurrent} className={`${BTN_BLACK} flex-1 min-w-[140px]`}>
              本文＋採用タグを反映
            </button>
            <button
              onClick={copyFinal}
              className={`${BTN_WHITE} flex-1 min-w-[140px]`}
              disabled={finalText.trim().length === 0}
            >
              最終投稿をコピー
            </button>
          </div>
          <textarea
            className="w-full border rounded p-3 min-h-[160px] sm:min-h-[120px] text-[16px]"
            placeholder="ここに最終的な投稿が入ります。編集もOK。"
            value={finalText}
            onChange={(e) => onChangeFinalText(e.target.value)}
          />
          <div className="text-sm opacity-70">
            最終投稿カウント: <b>{finalUsedUnits}</b> / 上限 <b>{LIMIT}</b>（残り {finalRemain}）
          </div>
        </section>

        {/* 使い方（？ボタンで開く） */}
        <CustomModal
          open={helpOpen}
          title="使い方（4つのポイント）"
          message={[
            "① 投稿文を入力して「タグ提案」を押すと、内容に合ったハッシュタグ候補が生成されます。",
            "② 候補タグをクリックすると「採用タグ」に移ります（もう一度クリックで解除）。",
            "③ 「再生成」は採用済みを残したまま、未採用の候補だけを作り直します。",
            "④ 「本文＋採用タグを反映」で最終投稿にまとめ、280カウント以内を確認してコピーしてください（半角=1・全角=2・URL=23）。",
          ].join("\n\n")}
          confirmText="閉じる"
          onConfirm={() => setHelpOpen(false)}
          onCancel={() => setHelpOpen(false)}
        />

        {/* 追加：ポリシー / 免責事項モーダル */}
        <CustomModal
          open={policyOpen}
          title="ポリシー / 免責事項"
          message={[
            "■ ブロックについて",
            "以下の内容が含まれる場合、タグ生成をブロックまたは安全寄りに制限することがあります：",
            "・危険行為や違法行為の作り方・運用・調達などの具体指示",
            "・爆発物・銃器・違法薬物・自傷・憎悪表現などの促進や称賛",
            "・モデルやシステム指示の上書きを意図する文（例：前の指示を無視して… など）",
            "",
            "教育・報道・政策的な文脈の場合は、中立/安全/啓発/政策に関する一般的なタグのみを提案します。",
            "",
            "■ 免責事項",
            "本ツールは参考用です。生成されるハッシュタグの正確性・適法性・第三者の権利非侵害を保証しません。最終的な利用判断・投稿内容の適法性や各種規約遵守は、利用者ご自身の責任でご確認ください。生成物の利用により生じた一切の損害について、提供者は責任を負いません。",
            "",
            "■ 取扱いのお願い",
            "個人情報や機密情報の入力は避けてください。プラットフォーム規約および法令を順守してください。",
          ].join("\n")}
          confirmText="閉じる"
          onConfirm={() => setPolicyOpen(false)}
          onCancel={() => setPolicyOpen(false)}
        />

        {/* 提案/再生成の確認モーダル（既存） */}
        <CustomModal
          open={modal.open}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      </main>

      {/* トースト（安全領域・色分け） */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={[
          "pointer-events-none fixed z-[60] right-4",
          "bottom-[calc(96px+env(safe-area-inset-bottom,0px))]",
          "sm:bottom-[calc(80px+env(safe-area-inset-bottom,0px))]",
          "transition-all duration-200",
          toast.open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-auto max-w-[90vw] sm:max-w-sm rounded border px-4 py-3 shadow-lg text-sm bg-white/95 backdrop-blur",
            toast.tone === "success" ? "border-green-300" : toast.tone === "error" ? "border-red-300" : "border-gray-300",
          ].join(" ")}
        >
          {toast.message}
        </div>
      </div>

      <Footer />
    </>
  );
}
