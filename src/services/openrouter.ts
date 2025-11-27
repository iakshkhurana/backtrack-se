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

/**
 * Intelligent AI-powered search and response generation for lost/found items
 * Uses AI to understand context, extract search terms, and generate helpful responses
 */
export interface SearchAnalysis {
  keywords: string[];
  status?: "lost" | "found";
  category?: string;
  location?: string;
  searchQuery: string;
  intent: string;
  needsFollowUp?: boolean;
  followUpQuestion?: string;
}

export async function analyzeSearchQuery(
  query: string,
  conversationHistory: OpenRouterMessage[] = []
): Promise<SearchAnalysis> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!apiKey) {
    // Fallback to basic extraction
    const basicKeywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 2 && !["the", "and", "with", "this", "that", "have", "from", "near", "around"].includes(s))
      .slice(0, 5);
    return {
      keywords: basicKeywords,
      searchQuery: query,
      intent: "search",
    };
  }

  const systemPrompt = `You are an intelligent assistant for a campus lost & found system. Analyze the user's query and determine if you need more information before searching.

Available item categories: phone, keys, stationery, electronics, wallet, clothing, other

CRITICAL RULES:
1. If user mentions "keys", "room keys", or anything related to keys WITHOUT a room number (like A-801, B-302), you MUST set needsFollowUp: true
2. If user mentions keys WITH a room number already, needsFollowUp: false
3. For keys, the room number is ESSENTIAL - don't search without it
4. For other items, only ask follow-up if the query is extremely vague (like just "I lost something")

Return a JSON object with:
- keywords: array of 3-8 important search terms (item name, brand, color, distinctive features)
- status: "lost" or "found" if clearly mentioned, otherwise undefined
- category: one of the available categories if identifiable, otherwise undefined
- location: location mentioned if any (including room numbers like A-801, B-302), otherwise undefined
- intent: brief description of what user wants
- needsFollowUp: true ONLY if you need more information (e.g., room number for keys when not provided)
- followUpQuestion: a natural, friendly question to ask (e.g., "What's your room number? Like A-801 or B-302?")

Examples:
- User: "I lost my room keys" → needsFollowUp: true, followUpQuestion: "What's your room number? For example, A-801 or B-302?"
- User: "I lost my keys" → needsFollowUp: true, followUpQuestion: "What's your room number? Like A-801 or B-302?"
- User: "I lost my blue iPhone" → needsFollowUp: false (has enough info)
- User: "I lost my keys at A-803" → needsFollowUp: false, location: "A-803" (has room number)
- User: "keys A-801" → needsFollowUp: false, location: "A-801" (has room number)

Return ONLY valid JSON, no other text.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-4), // Include recent conversation context
    { role: "user", content: query },
  ];

  try {
    const content = await openRouterChat(messages, DEFAULT_MODEL);
    // Try to parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        keywords: parsed.keywords || [],
        status: parsed.status,
        category: parsed.category,
        location: parsed.location,
        searchQuery: query,
        intent: parsed.intent || "search",
        needsFollowUp: parsed.needsFollowUp === true,
        followUpQuestion: parsed.followUpQuestion,
      };
    }
  } catch (e) {
    console.warn("AI search analysis failed, using fallback:", e);
  }

  // Fallback extraction
  const basicKeywords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((s) => s.length > 2 && !["the", "and", "with", "this", "that", "have", "from", "near", "around", "about", "there", "please", "help", "item", "items"].includes(s))
    .slice(0, 6);

  const wantsLost = /\blost\b/i.test(query);
  const wantsFound = /\bfound\b/i.test(query);

  return {
    keywords: basicKeywords,
    status: wantsLost ? "lost" : wantsFound ? "found" : undefined,
    searchQuery: query,
    intent: wantsLost ? "searching for lost item" : wantsFound ? "searching for found item" : "search",
  };
}

/**
 * Generate intelligent AI response based on search results and user query
 */
export async function generateSearchResponse(
  userQuery: string,
  items: any[],
  searchAnalysis: SearchAnalysis,
  conversationHistory: OpenRouterMessage[] = []
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!apiKey) {
    // Fallback response
    if (items.length > 0) {
      return `I found ${items.length} matching item${items.length > 1 ? "s" : ""} for your search.`;
    }
    return "I couldn't find any matching items. Try adding more details like item type, color, or location.";
  }

  // Prepare items summary for AI
  const itemsSummary = items.slice(0, 5).map((item, idx) => ({
    number: idx + 1,
    title: item.title,
    description: item.description || "No description",
    category: item.category,
    location: item.location || "Location not specified",
    status: item.status,
  }));

  const systemPrompt = `You are an intelligent, helpful AI assistant for BackTrack Campus Find, a campus lost & found system. 

Your personality:
- Friendly, empathetic, and encouraging
- Use common sense and real-world understanding
- Be conversational and natural, not robotic
- Show genuine interest in helping users find their items
- Ask follow-up questions when needed (like room numbers for keys)

Your capabilities:
- Understand natural language queries about lost/found items
- Extract relevant details (item type, color, brand, location, room numbers, etc.)
- Search the database intelligently
- Provide helpful suggestions when no matches are found
- Guide users on how to improve their search or post items
- Confirm details before showing results

Response guidelines:
- Keep responses concise (2-4 sentences) but informative
- If items found: Briefly summarize the matches, highlight key details (especially room numbers if searching for keys)
- If no items found: Suggest alternative search terms, check other categories, or recommend posting the item
- Always be encouraging and helpful
- Use natural language, avoid technical jargon
- When confirming: Show what you're searching for (e.g., "Searching for room keys at A-801...")

Remember: You're helping real people find their lost belongings. Be empathetic and thorough.`;

  const userPrompt = `User asked: "${userQuery}"

Context:
- What they're looking for: ${searchAnalysis.intent}
- Search terms used: ${searchAnalysis.keywords.join(", ") || "general search"}
- Filtered by status: ${searchAnalysis.status || "all items"}
- Filtered by category: ${searchAnalysis.category || "all categories"}
- Location mentioned: ${searchAnalysis.location || "none"}

${items.length > 0 
  ? `✅ Found ${items.length} potential match(es) in the database:\n\n${itemsSummary.map(item => 
    `Item ${item.number}: "${item.title}"\n- Category: ${item.category}\n- Location: ${item.location}\n- Status: ${item.status}\n- Description: ${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}`
  ).join('\n\n')}\n\nCRITICAL RULES:\n1. ONLY show items that are RELEVANT to what the user is searching for\n2. If user searches for "gold ring" and you find "Black iPhone", DO NOT mention the iPhone - it's completely unrelated\n3. If user searches for keys with room number A-801, ONLY show items matching A-801\n4. If items don't match the search query well, say you didn't find matches rather than showing irrelevant items\n5. Be smart - if the category doesn't match (ring vs phone), don't show it\n6. Only mention items that could actually be what the user is looking for\n\nGenerate a natural, helpful response that:\n1. If exact/relevant match exists: Focus ONLY on that match, ignore unrelated items\n2. If items are not relevant: Say you didn't find matches, don't show unrelated items\n3. Be concise - don't list everything, just relevant matches\n4. Encourage them to check the details only if items are actually relevant\n5. Be friendly and conversational\n6. Keep it short (1-2 sentences if exact match, 2-3 if multiple relevant)`
  : `❌ No matching items found in the database.\n\nGenerate a helpful, encouraging response that:\n1. Acknowledges the search was performed\n2. Suggests trying different search terms (e.g., broader terms, different keywords)\n3. Suggests checking the opposite status (if searching "lost", try "found" and vice versa)\n4. Recommends posting the item if they haven't already\n5. Be empathetic - losing something is frustrating, offer hope\n6. Keep it brief (2-3 sentences) but warm and helpful\n7. DO NOT mention or show any items - you found nothing relevant`
}`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-3), // Include context
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await openRouterChat(messages, DEFAULT_MODEL);
    return response.trim() || (items.length > 0 
      ? `I found ${items.length} matching item${items.length > 1 ? "s" : ""} for your search.`
      : "I couldn't find any matching items. Try adding more details or check if you're looking in the right category.");
  } catch (e) {
    console.warn("AI response generation failed:", e);
    // Fallback
    if (items.length > 0) {
      return `I found ${items.length} matching item${items.length > 1 ? "s" : ""} for: ${searchAnalysis.keywords.join(", ") || "your search"}.`;
    }
    return `I searched for: ${searchAnalysis.keywords.join(", ") || "your description"}, but couldn't find a close match. Try adding details like item type, color, location, or date.`;
  }
}

// Legacy function for backward compatibility
export async function extractSearchKeywords(query: string): Promise<string[]> {
  const analysis = await analyzeSearchQuery(query);
  return analysis.keywords;
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