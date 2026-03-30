import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ── Kimi client ───────────────────────────────────────────────────────────────
const kimi = new OpenAI({
  baseURL: "https://api.tokenfactory.us-central1.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY ?? "",
});

// ── NewsAPI config (mirrors agents/news_fetcher.py) ────────────────────────────
const NEWS_API_KEY = process.env.NEWS_API_KEY ?? "";
const NEWS_QUERY   =
  "(supply chain OR commodity OR shipping OR LPG OR crude oil OR wheat OR " +
  "inflation OR port OR Hormuz OR Suez OR sanctions) AND " +
  "(disruption OR shortage OR crisis OR blockade OR strike OR delay OR surge)";

// In-process cache (30 min TTL) — avoids burning API quota on every voice call
let _newsCache: { articles: string[]; at: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

// ── Keyword classifiers (mirrors Python version) ──────────────────────────────
function classifyRisk(text: string): string {
  const t = text.toLowerCase();
  if (/(closure|blockade|war|crisis|ban|sanctions|shutdown|attack)/.test(t)) return "HIGH";
  if (/(delay|shortage|strike|disruption|tension|risk|surge|spike)/.test(t))  return "MEDIUM";
  return "LOW";
}

function detectCommodities(text: string): string[] {
  const t   = text.toLowerCase();
  const map: [string, string[]][] = [
    ["LPG",        ["lpg", "gas", "petroleum gas"]],
    ["crude_oil",  ["crude", "oil", "petroleum"]],
    ["wheat",      ["wheat", "flour", "grain"]],
    ["diesel",     ["diesel", "fuel"]],
    ["edible_oil", ["edible oil", "palm oil", "sunflower"]],
    ["transport",  ["shipping", "freight", "transport", "port", "vessel"]],
  ];
  const found = map.filter(([, kw]) => kw.some(k => t.includes(k))).map(([c]) => c);
  return found.length ? found : ["general"];
}

// ── Live NewsAPI fetch ─────────────────────────────────────────────────────────
async function fetchLiveNews(): Promise<string[]> {
  // Return cache if still fresh
  if (_newsCache && Date.now() - _newsCache.at < CACHE_TTL_MS) {
    return _newsCache.articles;
  }

  if (!NEWS_API_KEY) {
    console.warn("[Voice] No NEWS_API_KEY, using fallback seed.");
    return SEED_NEWS;
  }

  const from = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q",        NEWS_QUERY);
    url.searchParams.set("sortBy",   "publishedAt");
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", "10");
    url.searchParams.set("from",     from);

    const res = await fetch(url.toString(), {
      headers: { "X-Api-Key": NEWS_API_KEY },
      // Next.js fetch will ISR-cache — we add revalidate manually
      next: { revalidate: 1800 },   // 30 min server-side cache
    });

    if (!res.ok) throw new Error(`NewsAPI ${res.status}`);

    const data  = await res.json();
    const lines = (data.articles as any[]).slice(0, 10).map((art: any) => {
      const title      = (art.title       || "").slice(0, 120);
      const desc       = (art.description || "").slice(0, 200);
      const risk       = classifyRisk(`${title} ${desc}`);
      const commodities = detectCommodities(`${title} ${desc}`).join(", ");
      const source     = art.source?.name ?? "NewsAPI";
      const date       = (art.publishedAt || "").slice(0, 10);
      return `[${risk}] ${title} — ${desc} (source: ${source}, date: ${date}, commodities: ${commodities})`;
    });

    _newsCache = { articles: lines, at: Date.now() };
    console.log(`[Voice] Fetched ${lines.length} live news articles from NewsAPI.`);
    return lines;
  } catch (err) {
    console.warn("[Voice] NewsAPI fetch failed:", (err as Error).message, "— using seed fallback.");
    return SEED_NEWS;
  }
}

// ── Seed fallback (used only when NewsAPI fails) ───────────────────────────────
const SEED_NEWS = [
  "[HIGH] Strait of Hormuz partially blocked — oil tanker traffic halted, LPG prices up 20%, transport costs rising (source: Reuters, date: 2025-03-28, commodities: LPG, transport)",
  "[MEDIUM] Black Sea grain corridor disrupted — wheat futures +15%, edible oil +10% (source: Bloomberg, date: 2025-03-27, commodities: wheat, edible_oil)",
  "[HIGH] Red Sea shipping detours continue — freight rates +35%, delivery times +7-14 days (source: Lloyd's List, date: 2025-03-28, commodities: transport)",
  "[MEDIUM] India diesel prices under pressure — fuel subsidy cuts expected Q2 2025 (source: Economic Times, date: 2025-03-26, commodities: diesel)",
  "[LOW] India monsoon forecast normal — agricultural commodities stable for next 3 months (source: IMD, date: 2025-03-25, commodities: wheat, edible_oil)",
];

// ── Language detection (Devanagari script) ────────────────────────────────────
function detectLang(text: string, fallback: string): "hi" | "en" {
  return /[\u0900-\u097F]/.test(text) ? "hi" : (fallback as "hi" | "en");
}

// ── System prompt builder ─────────────────────────────────────────────────────
function buildSystemPrompt(lang: "hi" | "en", newsCtx: string): string {
  const langInstr = lang === "hi"
    ? "The user is speaking in Hindi. You MUST respond ONLY in simple Hindi or Hinglish. Max 3 sentences. Use ₹ for rupees."
    : "Respond in simple English. Max 3 sentences. Always mention specific ₹ impact when possible.";

  return `You are ResilientAI, an AI supply chain advisor for Indian MSME businesses (kirana stores, restaurants, pharmacies, logistics).

${langInstr}

Your job: translate the LIVE supply chain news below into actionable advice for a small Indian business owner.
- Mention specific commodities, percentage price changes, and cities when they appear in the news.
- Give a concrete action recommendation with ₹ impact estimate.
- Do NOT mention anything not in the news context below — say "no data available" if the topic is not covered.

=== LIVE SUPPLY CHAIN NEWS (today) ===
${newsCtx}
=== END OF NEWS ===`;
}

// ── API Route ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { query, lang = "en" } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    const detectedLang = detectLang(query, lang);

    // 1. Fetch live news (cached 30 min)
    const newsLines = await fetchLiveNews();
    const newsCtx   = newsLines.join("\n");

    // 2. Ask Kimi grounded on live news
    let reply = "";

    if (process.env.NEBIUS_API_KEY) {
      try {
        const completion = await kimi.chat.completions.create({
          model: "moonshotai/Kimi-K2.5-fast",
          messages: [
            { role: "system", content: buildSystemPrompt(detectedLang, newsCtx) },
            { role: "user",   content: query },
          ],
          max_tokens: 300,
          temperature: 0.65,
        });
        reply = completion.choices[0]?.message?.content?.trim() ?? "";
        console.log("[Voice] Kimi responded:", reply.slice(0, 80));
      } catch (kimiErr) {
        console.warn("[Voice] Kimi failed:", (kimiErr as Error).message);
      }
    }

    // 3. Rule-based fallback using the actual live news context
    if (!reply) {
      const q = query.toLowerCase();
      const relevantNews = newsLines.filter(n =>
        q.split(/\s+/).some((word: string) => n.toLowerCase().includes(word))
      );
      const context = relevantNews.length ? relevantNews[0] : newsLines[0];

      reply = detectedLang === "hi"
        ? `ताज़ा खबरों के अनुसार: ${context}. अपने सप्लायर से बात करें और स्टॉक की समीक्षा करें।`
        : `Based on today's news: ${context}. Review your stock levels and discuss pricing with suppliers.`;
    }

    // 4. Return text + the exact news lines used (for debugging / transparency)
    return NextResponse.json({
      text_response:  reply,
      detected_lang:  detectedLang,
      news_used:      newsLines.length,
      news_source:    newsLines === SEED_NEWS ? "seed_fallback" : "live_newsapi",
    });

  } catch (err) {
    console.error("[Voice Route Error]", err);
    return NextResponse.json(
      { error: (err as Error).message, text_response: "Sorry, I couldn't process your request right now." },
      { status: 500 }
    );
  }
}
