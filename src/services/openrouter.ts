// Lightweight OpenRouter client for chat/keyword extraction
// Requires env var VITE_OPENROUTER_API_KEY

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
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

/**
 * Analyze an image and extract item details for lost/found posting
 * Uses vision-capable model to identify item properties
 * 
 * @param imageBase64 - Base64 encoded image string (with data URL prefix)
 * @returns Object containing extracted item details (title, description, category, etc.)
 */
export interface ImageAnalysisResult {
  title: string;
  description?: string;
  category: "phone" | "keys" | "stationery" | "electronics" | "wallet" | "clothing" | "other";
  location?: string;
}

export async function analyzeItemImage(imageBase64: string): Promise<ImageAnalysisResult | null> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!apiKey) {
    console.warn("Missing VITE_OPENROUTER_API_KEY; cannot analyze image.");
    return null;
  }

  // Use vision-capable model
  const VISION_MODEL = "openai/gpt-4o-mini"; // Supports vision

  const prompt: OpenRouterMessage[] = [
    {
      role: "system",
      content: `You are an assistant that analyzes images of lost or found items. Extract the following information and return ONLY a valid JSON object with these exact keys:
- title: A short, descriptive name for the item (max 100 chars)
- description: Detailed description of the item including color, brand, model, condition, distinctive features (max 500 chars, optional)
- category: One of: "phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"
- location: If visible in the image, where the item might be located (optional)

Return ONLY the JSON object, no other text. Example format:
{"title": "Blue iPhone 13", "description": "Blue iPhone 13 with a black case, screen protector visible, minor scratches on back", "category": "phone", "location": "Library desk"}`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this image and extract item details for a lost/found posting. Return a JSON object with title, description (optional), category, and location (optional if visible).",
        },
        {
          type: "image_url",
          image_url: {
            url: imageBase64, // Base64 data URL
          },
        },
      ],
    },
  ];

  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "BackTrack Campus Find",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: prompt,
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenRouter error: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    // Parse JSON response
    try {
      const result = JSON.parse(content) as ImageAnalysisResult;
      // Validate category
      const validCategories = ["phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"];
      if (!validCategories.includes(result.category)) {
        result.category = "other";
      }
      return result;
    } catch (parseError) {
      console.warn("Failed to parse AI response as JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    return null;
  }
}


