import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.tokenfactory.us-central1.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

const SYSTEM_PROMPT = `You are AURA, an expert AI supply chain intelligence assistant for ResilientAI — a platform helping Indian MSMEs (small businesses like kirana stores, manufacturers, pharmacies) make smarter business decisions during global supply chain disruptions.

You specialize in:
- Analyzing global risk events (oil disruptions, semiconductor shortages, freight rate surges, geopolitical conflicts)
- Translating macro events into local business impact in rupees (₹)
- Recommending pricing, inventory, and supplier strategies
- Explaining quantum-inspired optimization decisions in plain language
- Comparing business conditions across Indian cities (Mumbai, Delhi, Bangalore, etc.)

Tone: Concise, data-driven, confident. Respond in 2-4 sentences maximum unless asked for detail. 
Always quantify impact in ₹ when possible. Never use the word "seamless".
If asked in Hindi, respond in Hindi.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.NEBIUS_API_KEY) {
      return NextResponse.json(
        { error: "NEBIUS_API_KEY not configured" },
        { status: 500 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "moonshotai/Kimi-K2.5-fast",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("[AURA Chat Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to reach Kimi model" },
      { status: 500 }
    );
  }
}
