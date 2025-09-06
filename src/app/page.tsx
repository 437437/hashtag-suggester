"use client";
import { useState } from "react";
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

// --- Footer (sticky) ---
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="fixed bottom-0 left-0 w-full border-t py-4 text-sm text-gray-600 bg-white z-50">
      <div className="max-w-2xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="font-medium">Yuri Saito（BLUE Copper）</div>
          <div>© {year} Yuri Saito. All rights reserved.</div>
        </div>
        <a
          href="https://ko-fi.com/bluecopper_v"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-gray-50"
        >
          ☕ Buy me a coffee
        </a>
      </div>
    </footer>
  );
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

  // ハッシュタグと同じ“チップ”見た目のボタン
  // --- ボタン共通スタイル（黒 / 白） ---
  const BTN_BLACK =
    "inline-flex items-center gap-2 rounded border border-black bg-black text-white " +
    "px-3 py-1 font-mono transition " +
    "hover:bg-gray-900 active:bg-black/90 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const BTN_WHITE =
    "inline-flex items-center gap-2 rounded border border-gray-300 bg-white text-gray-900 " +
    "px-3 py-1 font-mono transition " +
    "hover:bg-gray-50 active:bg-gray-100 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

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
  const onChangeFinalText = (v: string) =>
    setFinalText(trimToUnitsWithUrls(v, LIMIT));

  /** API呼び出し（採用済み exclude 対応） */
  const fetchTags = async (exclude: string[] = []) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const url = new URL(`/api/suggest`, window.location.origin);
      url.searchParams.set("text", text);
      url.searchParams.set("lang", lang);
      if (exclude.length > 0) url.searchParams.set("exclude", exclude.join(","));
      const r = await fetch(url.toString());
      const j = await r.json();
      const filtered = (j.tags ?? []).filter((t: string) => !selected.includes(t));
      setTags(filtered);
      setSource(j.source ?? "");
    } catch {
      alert("タグ生成に失敗しました。少し待って再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // --- モーダル起動
  const onSuggest = () => {
    if (!text.trim()) return;
    setModal({
      open: true,
      action: "suggest",
      title: "新しいタグ候補を作成します",
      message:
        "現在の候補と採用済みタグはすべてリセットされます。\n\n続行しますか？",
      confirmText: "提案する",
    });
  };

  const onRegenerate = () => {
    if (!text.trim()) return;
    setModal({
      open: true,
      action: "regenerate",
      title: "タグ候補を再生成します",
      message:
        "採用済みタグはそのまま残し、新しい候補だけ生成し直します。\n\n続行しますか？",
      confirmText: "再生成する",
    });
  };

  // --- モーダル確定/キャンセル
  const handleModalConfirm = () => {
    const act = modal.action;
    setModal((m) => ({ ...m, open: false }));
    if (act === "suggest") {
      setSelected([]);     // 提案はスロットをリセット
      fetchTags();         // excludeなし
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
    const composed = [base, tagsLine].filter(Boolean).join("\n"); // 改行で区切る
    setFinalText(trimToUnitsWithUrls(composed, LIMIT));
  };

  // クリップボード
  const copyAllCandidates = async () => {
    const line = tags.join(" ");
    await navigator.clipboard.writeText(line);
    alert("候補タグをすべてコピーしました！");
  };
  const copySelected = async () => {
    const line = selected.join(" ");
    await navigator.clipboard.writeText(line);
    alert("採用タグだけコピーしました！");
  };
  const copyFinal = async () => {
    await navigator.clipboard.writeText(finalText);
    alert("最終投稿をコピーしました！");
  };

  return (
    <>
      <main className="max-w-2xl mx-auto p-6 space-y-6 pb-32">
        <h1 className="text-2xl font-bold">Hashtag Suggester</h1>
        <p className="text-sm text-gray-600">
          投稿文を入力すると、AIが内容に合わせてハッシュタグを提案します。<br />
          気に入ったタグをクリックして「採用」すると、採用タグスロットに追加されます。<br />
          採用タグを保持したまま、「再生成」で候補を更新することも可能です。<br />
          最終的な投稿テキストで <b>280</b> カウント以内となることを確認してからコピーしてご利用ください。
        </p>

        {/* 入力欄 */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">投稿文</h2>
          <p id="post-help" className="text-xs text-gray-500">
            X想定：半角=1・全角=2・URL=23 として <b>280</b> カウントまで
          </p>
          <textarea
            id="post-text"
            aria-describedby="post-help"
            className="w-full border rounded p-3 min-h-[120px]"
            placeholder="例）昨日作ったパスタが思った以上に美味しかった🍝レシピはここを参考にしてみた！https://example.com"
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              本文カウント: <b>{usedUnits}</b> / 上限 <b>{LIMIT}</b>（残り {remain}）
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">言語:</span>
              <select
                className="border rounded p-1"
                value={lang}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setLang(e.target.value as Lang)
                }
              >
                <option value="auto">Auto</option>
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>

              <button
                onClick={onSuggest}
                disabled={loading || text.trim().length === 0}
                className={BTN_BLACK}
              >
                {loading ? "生成中..." : "タグ提案"}
              </button>

              <button
                onClick={onRegenerate}
                disabled={loading || tags.length === 0}
                className={BTN_BLACK}
              >
                {loading ? "再生成中..." : "再生成"}
              </button>
            </div>
          </div>
        </div>

        {/* 候補タグ */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">候補タグ（クリックで採用）</h2>
          {tags.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const active = selected.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleSelect(t)}
                      className={`border rounded px-3 py-1 font-mono transition ${
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
              <div className="flex gap-8 items-center mt-3">
                <button onClick={copyAllCandidates} className={BTN_WHITE}>
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
                    className="border rounded px-3 py-1 font-mono bg-blue-50 hover:bg-blue-100"
                    title="採用解除"
                  >
                    {t} ✕
                  </button>
                ))}
              </div>
              <button onClick={copySelected} className={BTN_WHITE}>
                採用だけコピー
              </button>
            </>
          ) : (
            <p className="text-sm opacity-60">まだ採用タグはありません。下の候補からクリックで追加できます。</p>
          )}
        </section>

        {/* 最終投稿 */}
        <section className="border rounded p-4 space-y-2">
          <h2 className="text-lg font-semibold">最終投稿（プレビュー＋編集可）</h2>
          <div className="flex gap-2">
            <button onClick={updateFinalFromCurrent} className={BTN_BLACK}>
              本文＋採用タグを反映
            </button>
            <button
              onClick={copyFinal}
              className={BTN_WHITE}
              disabled={finalText.trim().length === 0}
            >
              最終投稿をコピー
            </button>
          </div>
          <textarea
            className="w-full border rounded p-3 min-h-[120px]"
            placeholder="ここに最終的な投稿が入ります。編集もOK。"
            value={finalText}
            onChange={(e) => onChangeFinalText(e.target.value)}
          />
          <div className="text-sm opacity-70">
            最終投稿カウント: <b>{finalUsedUnits}</b> / 上限 <b>{LIMIT}</b>（残り {finalRemain}）
          </div>
        </section>

        {/* 確認モーダル */}
        <CustomModal
          open={modal.open}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      </main>

      <Footer />
    </>
  );
}
