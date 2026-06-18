// ════════════════════════════════════════════════════════════════════
// supabase/functions/ai-proxy/index.ts
// Прокси к OpenRouter: ключ живёт в секретах функции, не в клиенте.
// Тело: { purpose: 'chat'|'vision'|'ocr', messages, temperature?, max_tokens? }
// ════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Цепочки моделей с фолбэком (порядок важен).
const MODEL_CHAINS: Record<string, string[]> = {
  ocr:    ["nvidia/nemotron-nano-12b-v2-vl:free", "openrouter/free"],
  vision: ["nvidia/nemotron-nano-12b-v2-vl:free", "openrouter/free"],
  // Портировано из openAIService без google/gemma-* (геоблок), порядок сохранён.
  chat:   ["nvidia/nemotron-3-ultra-550b-a55b:free", "openrouter/free"],
};

// Дефолты, если параметры не переданы клиентом.
const DEFAULTS: Record<string, { temperature: number; max_tokens: number }> = {
  ocr:    { temperature: 0.1, max_tokens: 3000 },
  vision: { temperature: 0.2, max_tokens: 1500 },
  chat:   { temperature: 0.7, max_tokens: 1000 },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return json(
      { success: false, error: "OPENROUTER_API_KEY is not configured" },
      500,
    );
  }

  let payload: {
    purpose?: string;
    messages?: unknown;
    temperature?: number;
    max_tokens?: number;
  };
  try {
    payload = await req.json();
  } catch (_e) {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { purpose, messages, temperature, max_tokens } = payload;

  if (!purpose || !MODEL_CHAINS[purpose]) {
    return json(
      { success: false, error: `Invalid purpose: ${String(purpose)}` },
      400,
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return json(
      { success: false, error: "messages must be a non-empty array" },
      400,
    );
  }

  const chain = MODEL_CHAINS[purpose];
  const def = DEFAULTS[purpose];
  const temp = temperature ?? def.temperature;
  const maxTok = max_tokens ?? def.max_tokens;

  let lastError = "unknown error";

  for (const model of chain) {
    console.log(`[ai-proxy] purpose=${purpose} trying model=${model}`);
    try {
      const resp = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pethealthai.app",
          "X-Title": "PetHealth AI",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: temp,
          max_tokens: maxTok,
        }),
      });

      if (!resp.ok) {
        lastError = `HTTP ${resp.status}: ${await resp.text()}`;
        console.warn(`[ai-proxy] model=${model} failed: ${lastError}`);
        continue;
      }

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        lastError = "empty content from model";
        console.warn(`[ai-proxy] model=${model} returned empty content`);
        continue;
      }

      console.log(`[ai-proxy] success model=${model}`);
      return json({ success: true, model, content }, 200);
    } catch (e) {
      lastError = (e as Error)?.message || String(e);
      console.warn(`[ai-proxy] model=${model} threw: ${lastError}`);
      continue;
    }
  }

  console.error(`[ai-proxy] all models failed: ${lastError}`);
  return json({ success: false, error: lastError }, 502);
});
