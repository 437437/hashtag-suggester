import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/ai";
import { extractCandidateTags, detectLang as detectByHeuristics } from "@/lib/extract";

const SYS_PROMPT = `
You are a hashtag strategist for X (Twitter).
Your job: given a short post text and a language policy, return up to 15
widely-used, high-visibility hashtags that are clearly relevant to the text.
Avoid spam/NSFW/irrelevant items and near-duplicate variants.
Output STRICT JSON ONLY in the form: {"tags":["#tag1","#tag2", ...]} (max 15).
`;

function fallbackTags(text: string, policy: "ja" | "en", exclude: string[] = []): string[] {
  const { tags } = extractCandidateTags(text);
  const filtered =
    policy === "en"
      ? tags.filter((t) => /^[#\w]+$/.test(t))
      : tags;
  const uniq = Array.from(new Set(filtered));
  // 採用済み除外
  return uniq.filter((t) => !exclude.includes(t)).slice(0, 15);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text") ?? "").trim();
  const langParam = (searchParams.get("lang") ?? "auto").toLowerCase();
  const excludeRaw = searchParams.get("exclude") ?? "";
  const exclude: string[] = excludeRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const detected =
    langParam === "auto" ? detectByHeuristics(text) : (langParam as "ja" | "en");

  const policyInstruction =
    detected === "en"
      ? "Language policy: The post is in English. Return ONLY English hashtags."
      : "Language policy: The post is in Japanese. Return mainly Japanese hashtags, and it is acceptable to include some English hashtags when natural.";

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      detectedLang: detected,
      tags: fallbackTags(text, detected, exclude),
      source: "fallback-no-openai",
    });
  }

  try {
    const userPrompt = [
      policyInstruction,
      "Post text:",
      `"""${text}"""`,
      "",
      "Constraints:",
      "- Up to 15 items.",
      "- Prefer widely adopted forms to improve reach.",
      "- Must be clearly relevant to the text.",
      "- Avoid spammy patterns, NSFW, or meaningless tokens.",
      "- Infer what kind of person the poster might be and who they are targeting based on the post text.",
      "- Choose hashtags that are appealing to that imagined target audience.",
      exclude.length > 0
        ? `- Do NOT include these hashtags in your output: ${exclude.join(" ")}`
        : "",
      "- Return STRICT JSON only: {\"tags\":[\"#...\"]}",
    ].join("\n");

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYS_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    let parsed: { tags?: string[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({
        detectedLang: detected,
        tags: fallbackTags(text, detected, exclude),
        source: "fallback-json-parse",
      });
    }

    const seen = new Set<string>();
    const cleaned: string[] = [];
    for (const t of parsed.tags ?? []) {
      const tag = (t || "").trim();
      if (!tag.startsWith("#")) continue;
      if (tag.length < 2) continue;
      if (detected === "en" && !/^#[\w]+$/.test(tag)) continue;
      if (exclude.includes(tag)) continue; // サーバー側でも念のため除外
      if (!seen.has(tag)) {
        seen.add(tag);
        cleaned.push(tag);
      }
      if (cleaned.length >= 15) break;
    }

    if (cleaned.length === 0) {
      return NextResponse.json({
        detectedLang: detected,
        tags: fallbackTags(text, detected, exclude),
        source: "fallback-empty",
      });
    }

    return NextResponse.json({
      detectedLang: detected,
      tags: cleaned,
      source: "openai",
    });
  } catch {
    return NextResponse.json({
      detectedLang: detected,
      tags: fallbackTags(text, detected, exclude),
      source: "fallback-error",
    });
  }
}
