// Lightweight OpenRouter client for chat/keyword extraction
// Requires env var VITE_OPENROUTER_API_KEY

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini"; // fast, vision-capable

export async function openRouterChat(messages: OpenRouterMessage[], model: string = DEFAULT_MODEL): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!apiKey) {
    console.warn("Missing VITE_OPENROUTER_API_KEY; returning mock response.");
    return "";
  }

  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "BackTrack Campus Find",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenRouter error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// Extract compact keywords (comma-separated) for searching items
export async function extractSearchKeywords(query: string): Promise<string[]> {
  const prompt: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "Extract 3-7 short search keywords from the user's lost/found query. Return only comma-separated keywords, no extra text.",
    },
    { role: "user", content: query },
  ];

  try {
    const content = await openRouterChat(prompt);
    return content
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
  } catch (e) {
    console.warn("extractSearchKeywords fallback:", e);
    return query
      .split(/\s+/)
      .map((s) => s.toLowerCase())
      .filter((s) => s.length > 2)
      .slice(0, 5);
  }
}


