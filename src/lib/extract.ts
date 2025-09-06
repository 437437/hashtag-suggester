const STOPWORDS_EN = new Set([
  "the","a","an","and","or","but","if","then","of","on","in","to","for","with",
  "is","are","was","were","be","been","am","i","me","my","we","our","you","your",
  "this","that","it","at","by","as","from","about","into","over","after","before",
  "just","so","very","really","up","down","out"
]);

const STOPWORDS_JA = new Set([
  "こと","もの","ところ","これ","それ","あれ","ため","ので","から","に","へ","で","を",
  "が","は","も","や","と","より","まで","だけ","しか","そして","また","または",
  "です","ます","でした","する","した","して","いる",
]);

export type DetectLang = "ja" | "en";

export function detectLang(text: string): DetectLang {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text) ? "ja" : "en";
}

function extractEnglishTokens(text: string): string[] {
  const words = (text.toLowerCase().match(/[a-z][a-z0-9\-]+/g) || [])
    .map(w => w.replace(/^-+|-+$/g, ""))
    .filter(w => w.length >= 2 && !STOPWORDS_EN.has(w));
  return Array.from(new Set(words)).slice(0, 20);
}

function extractJapaneseTokens(text: string): string[] {
  const chunks = (text
    .replace(/[！!？?\.,、。]/g, " ")
    .match(/[\u3400-\u9fff\u3040-\u30ffA-Za-z0-9]+/g) || []);
  const tokens = chunks
    .filter(t => t.length >= 2)
    .filter(t => !STOPWORDS_JA.has(t));
  return Array.from(new Set(tokens)).slice(0, 20);
}

function toHashtags(tokens: string[], lang: DetectLang): string[] {
  const tags: string[] = [];
  for (const t of tokens) {
    if (lang === "en") {
      const parts = t.split(/[-_]/g).map(p => p.replace(/[^a-z0-9]/g, ""));
      const camel = parts.map((p, i) => i === 0 ? p : (p.charAt(0).toUpperCase() + p.slice(1))).join("");
      if (camel) tags.push("#" + camel);
      tags.push("#" + t);
    } else {
      tags.push("#" + t);
    }
  }
  const commons = [
    "#個人開発","#アプリ開発","#Webアプリ","#iOSアプリ",
    "#indiedev","#appdev","#webapp","#mobileapp"
  ];
  return Array.from(new Set([...tags, ...commons])).slice(0, 30);
}

export function extractCandidateTags(text: string) {
  const lang = detectLang(text);
  const tokens = lang === "ja" ? extractJapaneseTokens(text) : extractEnglishTokens(text);
  const tags = toHashtags(tokens, lang);
  return { lang, tokens, tags };
}
