# AI Features Documentation - BackTrack Campus Find

This document provides comprehensive documentation for all AI-powered features in the BackTrack Campus Find application that use the OpenRouter API.

## Table of Contents

1. [Overview](#overview)
2. [Setup and Configuration](#setup-and-configuration)
3. [AI Features](#ai-features)
   - [AI Chat & Search](#ai-chat--search)
   - [Voice Assistant](#voice-assistant)
   - [Image Analysis](#image-analysis)
4. [Technical Implementation](#technical-implementation)
5. [API Usage and Costs](#api-usage-and-costs)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Overview

The BackTrack Campus Find application uses **OpenRouter API** to power three main AI features:

1. **AI Chat & Search** - Intelligent keyword extraction for searching lost/found items
2. **Voice Assistant** - Interactive voice-based item posting with speech-to-text and AI parsing
3. **Image Analysis** - Automatic extraction of item details from uploaded images

All features use the **OpenAI GPT-4o-mini** model via OpenRouter, which provides:
- Fast response times
- Vision capabilities (for image analysis)
- Cost-effective pricing
- Reliable API access

---

## Setup and Configuration

### Prerequisites

1. **OpenRouter Account**: Sign up at [https://openrouter.ai](https://openrouter.ai)
2. **API Key**: Get your API key from OpenRouter dashboard
3. **Environment Variable**: Add the key to your `.env` file

### Configuration Steps

1. **Get Your OpenRouter API Key**:
   - Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Create a new API key
   - Copy the key (starts with `sk-or-v1-...`)

2. **Add to Environment Variables**:
   Create or update your `.env` file in the project root:
   ```env
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

### Optional: Model Configuration

By default, the app uses `openai/gpt-4o-mini`. You can change this in the code:

- **Location**: `src/services/openrouter.ts`
- **Default Model**: `openai/gpt-4o-mini`
- **Alternative Models**: 
  - `openai/gpt-4o` (more powerful, more expensive)
  - `openai/gpt-3.5-turbo` (cheaper, less capable)
  - `anthropic/claude-3-haiku` (alternative provider)

---

## AI Features

### 1. AI Chat & Search

**Location**: `src/components/AIChat.tsx` and `src/services/openrouter.ts`

**Purpose**: Provides an intelligent search assistant that extracts keywords from natural language queries to find lost/found items.

#### How It Works

1. **User Query**: User types a natural language query (e.g., "I lost my blue iPhone near the library")
2. **Keyword Extraction**: AI extracts relevant keywords using `extractSearchKeywords()`
3. **Database Search**: Keywords are used to search the Supabase items table
4. **Results Display**: Matching items are displayed in the chat interface

#### Implementation Details

**Function**: `extractSearchKeywords(query: string)`

```typescript
// Location: src/services/openrouter.ts
export async function extractSearchKeywords(query: string): Promise<string[]>
```

**Process**:
1. Sends user query to OpenRouter API with a system prompt
2. AI extracts 3-7 short search keywords
3. Returns comma-separated keywords
4. Falls back to simple token extraction if API fails

**System Prompt**:
```
Extract 3-7 short search keywords from the user's lost/found query. 
Return only comma-separated keywords, no extra text.
```

**Example Usage**:
```typescript
// User query: "I lost my blue iPhone near the library yesterday"
// Extracted keywords: ["blue", "iPhone", "library", "yesterday"]
```

**Features**:
- Natural language understanding
- Intent detection (lost vs found)
- Status filtering (lost/found)
- Category-aware search
- Fallback to local keyword extraction

#### User Interface

- **Location**: Bottom-right corner of all pages
- **Trigger**: Click the chat button (MessageCircle icon)
- **Input**: Text input field
- **Output**: 
  - AI responses with search results
  - Item cards with images and details
  - Timestamps for each message

---

### 2. Voice Assistant

**Location**: `src/components/VoiceAssistant.tsx` and `src/services/speech-to-text.ts`

**Purpose**: Interactive voice-based assistant that asks questions and collects item information through speech.

#### How It Works

1. **Question Flow**: Assistant asks a series of questions using text-to-speech
2. **Speech Recognition**: User responds via microphone (Web Speech API)
3. **AI Parsing**: Voice transcript is parsed using `extractItemDataFromVoice()`
4. **Data Collection**: Extracted data is collected and used to fill the form
5. **Form Submission**: All collected data is passed to the Post Item form

#### Implementation Details

**Component**: `VoiceAssistant`

**Questions Asked**:
1. "Are you reporting a lost item or a found item?"
2. "What is the name of the item?"
3. "What category does it belong to?"
4. "Can you describe the item in detail?"
5. "Where was it lost or found?"
6. "What is your contact information?"

**Speech Recognition**:
- Uses Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`)
- Real-time transcription
- Continuous listening mode
- Browser compatibility check
- Text input fallback for unsupported browsers

**AI Parsing Function**: `extractItemDataFromVoice(transcript: string)`

```typescript
// Location: src/services/speech-to-text.ts
export async function extractItemDataFromVoice(transcript: string): Promise<VoiceItemData | null>
```

**Process**:
1. Voice transcript is sent to OpenRouter API
2. AI extracts structured data (status, title, category, description, location, contact_info)
3. Returns JSON object with extracted fields
4. Validates and sanitizes the data

**System Prompt**:
```
You are an assistant that extracts structured data from voice transcripts about lost or found items.
Return ONLY a valid JSON object with these keys (only include keys that are mentioned):
- status: "lost" or "found" (if mentioned)
- title: Item name/title (if mentioned)
- category: One of "phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"
- description: Detailed description (if mentioned)
- location: Where item was lost/found (if mentioned)
- contact_info: Phone number or email (if mentioned)
```

**Features**:
- Interactive Q&A flow
- Text-to-speech for questions
- Speech-to-text for answers
- AI-powered data extraction
- Text input fallback
- Browser compatibility detection
- Skip question option
- Finish early option

#### User Interface

- **Trigger**: "Use Voice Assistant" button on Post Item page
- **Modal**: Full-screen modal with chat interface
- **Input Modes**: 
  - Voice (microphone icon)
  - Text (keyboard icon)
- **Status Indicators**: 
  - Listening indicator
  - Processing indicator
  - Collected data preview

---

### 3. Image Analysis

**Location**: `src/services/openrouter.ts` and `src/pages/PostItem.tsx`

**Purpose**: Automatically extracts item details from uploaded images using vision AI.

#### How It Works

1. **Image Upload**: User uploads an image of the lost/found item
2. **Base64 Conversion**: Image is converted to base64 data URL
3. **AI Analysis**: Vision model analyzes the image
4. **Data Extraction**: AI extracts title, description, category, and location
5. **Form Auto-fill**: Extracted data automatically fills the form fields

#### Implementation Details

**Function**: `analyzeItemImage(imageBase64: string)`

```typescript
// Location: src/services/openrouter.ts
export async function analyzeItemImage(imageBase64: string): Promise<ImageAnalysisResult | null>
```

**Process**:
1. Image is sent to OpenRouter API as base64 data URL
2. Vision model (`gpt-4o-mini`) analyzes the image
3. AI extracts structured data
4. Returns JSON object with item details

**System Prompt**:
```
You are an assistant that analyzes images of lost or found items.
Extract the following information and return ONLY a valid JSON object:
- title: A short, descriptive name for the item (max 100 chars)
- description: Detailed description including color, brand, model, condition, distinctive features (max 500 chars, optional)
- category: One of: "phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"
- location: If visible in the image, where the item might be located (optional)
```

**Return Type**:
```typescript
interface ImageAnalysisResult {
  title: string;
  description?: string;
  category: "phone" | "keys" | "stationery" | "electronics" | "wallet" | "clothing" | "other";
  location?: string;
}
```

**Features**:
- Vision-capable AI model
- Automatic form filling
- Category detection
- Description generation
- Location extraction (if visible)
- Error handling and validation

#### User Interface

- **Location**: Post Item page, image upload section
- **Trigger**: Sparkles icon button on uploaded image
- **Loading State**: Spinning icon while analyzing
- **Auto-fill**: Automatically fills form fields after analysis

---

## Technical Implementation

### API Client

**File**: `src/services/openrouter.ts`

**Base Configuration**:
```typescript
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
```

**Headers**:
```typescript
{
  "Content-Type": "application/json",
  "Authorization": `Bearer ${apiKey}`,
  "HTTP-Referer": window.location.origin,
  "X-Title": "BackTrack Campus Find"
}
```

**Request Body**:
```typescript
{
  model: "openai/gpt-4o-mini",
  messages: OpenRouterMessage[],
  temperature: 0.2  // Low temperature for consistent results
}
```

### Error Handling

All AI functions include:
- API key validation
- Network error handling
- JSON parsing error handling
- Fallback mechanisms
- User-friendly error messages

### Fallback Mechanisms

1. **Keyword Extraction**: Falls back to simple token extraction if API fails
2. **Voice Assistant**: Falls back to text input if speech recognition unavailable
3. **Image Analysis**: Returns null if API fails (user can manually fill form)

---

## API Usage and Costs

### Model Used

- **Model**: `openai/gpt-4o-mini`
- **Provider**: OpenAI via OpenRouter
- **Capabilities**: Text generation, vision (image analysis)

### Pricing (as of 2024)

OpenRouter pricing varies by model. For `gpt-4o-mini`:
- **Input**: ~$0.15 per 1M tokens
- **Output**: ~$0.60 per 1M tokens

**Estimated Costs per Feature**:

1. **AI Chat Search**:
   - Input: ~50-100 tokens per query
   - Output: ~20-50 tokens per response
   - **Cost**: ~$0.00001-0.00002 per search

2. **Voice Assistant**:
   - Input: ~100-200 tokens per transcript
   - Output: ~50-100 tokens per extraction
   - **Cost**: ~$0.00002-0.00004 per question

3. **Image Analysis**:
   - Input: ~1000-2000 tokens (image + prompt)
   - Output: ~100-200 tokens
   - **Cost**: ~$0.0002-0.0004 per image

**Monthly Estimate** (1000 users, 10 interactions each):
- AI Chat: ~$0.10-0.20
- Voice Assistant: ~$0.20-0.40
- Image Analysis: ~$2.00-4.00
- **Total**: ~$2.30-4.60/month

### Cost Optimization Tips

1. **Cache Results**: Cache common queries to reduce API calls
2. **Batch Requests**: Combine multiple operations when possible
3. **Use Smaller Models**: Consider `gpt-3.5-turbo` for simple tasks
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Monitor Usage**: Track API usage in OpenRouter dashboard

---

## Troubleshooting

### Common Issues

#### 1. "Missing VITE_OPENROUTER_API_KEY" Warning

**Problem**: API key not found in environment variables

**Solution**:
1. Check `.env` file exists in project root
2. Verify key name is `VITE_OPENROUTER_API_KEY`
3. Restart development server after adding key
4. Check key is not commented out or has extra spaces

#### 2. "OpenRouter error: 401" (Unauthorized)

**Problem**: Invalid or expired API key

**Solution**:
1. Verify API key is correct in OpenRouter dashboard
2. Check key hasn't been revoked
3. Ensure key has sufficient credits
4. Regenerate key if necessary

#### 3. "OpenRouter error: 429" (Rate Limit)

**Problem**: Too many requests in short time

**Solution**:
1. Wait a few seconds before retrying
2. Implement rate limiting in your code
3. Upgrade OpenRouter plan if needed
4. Reduce frequency of API calls

#### 4. Speech Recognition Not Supported

**Problem**: Browser doesn't support Web Speech API

**Solution**:
1. Use Chrome, Edge, or Safari (best support)
2. Voice Assistant automatically falls back to text input
3. Check microphone permissions in browser settings
4. Use HTTPS (required for microphone access)

#### 5. Image Analysis Returns Null

**Problem**: API call failed or image format unsupported

**Solution**:
1. Check image format (JPEG, PNG, WebP supported)
2. Verify image size (max 20MB recommended)
3. Check network connection
4. Verify API key is valid
5. Check browser console for error details

#### 6. AI Responses Not Parsing Correctly

**Problem**: JSON parsing errors

**Solution**:
1. Check system prompts are correct
2. Verify model supports JSON output
3. Add error handling for malformed responses
4. Use temperature 0.2 for more consistent outputs

### Debug Mode

Enable debug logging by checking browser console:
- All API calls are logged
- Errors include full error messages
- Network requests visible in Network tab

---

## Best Practices

### 1. API Key Security

- ✅ **DO**: Store API key in `.env` file (not committed to git)
- ✅ **DO**: Use environment variables in production
- ❌ **DON'T**: Hardcode API keys in source code
- ❌ **DON'T**: Commit `.env` file to version control

### 2. Error Handling

- Always check for API key before making requests
- Implement fallback mechanisms
- Show user-friendly error messages
- Log errors for debugging

### 3. User Experience

- Show loading states during API calls
- Provide clear feedback on actions
- Allow users to cancel long operations
- Offer manual alternatives when AI fails

### 4. Performance

- Cache common queries when possible
- Debounce search inputs
- Limit image file sizes
- Use appropriate model for task complexity

### 5. Cost Management

- Monitor API usage regularly
- Set usage limits if needed
- Optimize prompts to reduce token usage
- Consider caching for repeated queries

---

## File Structure

```
src/
├── services/
│   ├── openrouter.ts          # OpenRouter API client
│   └── speech-to-text.ts      # Speech recognition & voice parsing
├── components/
│   ├── AIChat.tsx              # AI chat interface
│   └── VoiceAssistant.tsx      # Voice assistant component
└── pages/
    └── PostItem.tsx            # Image analysis integration
```

---

## Additional Resources

- **OpenRouter Documentation**: [https://openrouter.ai/docs](https://openrouter.ai/docs)
- **OpenRouter Models**: [https://openrouter.ai/models](https://openrouter.ai/models)
- **OpenRouter Pricing**: [https://openrouter.ai/docs/pricing](https://openrouter.ai/docs/pricing)
- **Web Speech API**: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

## Support

For issues or questions:
1. Check this documentation first
2. Review browser console for errors
3. Check OpenRouter dashboard for API status
4. Verify environment variables are set correctly

---

**Last Updated**: 2024
**Version**: 1.0.0

