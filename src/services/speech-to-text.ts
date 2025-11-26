/**
 * Speech-to-Text Service
 * Uses Web Speech API for real-time audio transcription
 * Falls back to alternative methods if Web Speech API is not available
 */

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionError {
  error: string;
  message: string;
}

/**
 * Speech Recognition class wrapper for Web Speech API
 * Handles browser compatibility and provides a consistent interface
 */
export class SpeechRecognitionService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: SpeechRecognitionError) => void;
  private onEndCallback?: () => void;

  constructor() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.isSupported = true;
      this.setupRecognition();
    } else {
      console.warn("Speech Recognition API not supported in this browser");
      this.isSupported = false;
    }
  }

  /**
   * Configure speech recognition settings
   * Sets up continuous listening, language, and other options
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    // Continuous listening for real-time transcription
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Handle results
    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;
        
        if (isFinal) {
          finalTranscript += transcript + ' ';
          confidence = event.results[i][0].confidence || 0.8;
        } else {
          interimTranscript += transcript;
        }
      }

      const result: SpeechRecognitionResult = {
        transcript: finalTranscript || interimTranscript,
        confidence: confidence,
        isFinal: !!finalTranscript,
      };

      if (this.onResultCallback) {
        this.onResultCallback(result);
      }
    };

    // Handle errors
    this.recognition.onerror = (event: any) => {
      const error: SpeechRecognitionError = {
        error: event.error,
        message: this.getErrorMessage(event.error),
      };

      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    };

    // Handle end of recognition
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  /**
   * Get user-friendly error messages
   * @param error - Error code from Speech Recognition API
   */
  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found. Please check your microphone settings.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error. Please check your connection.',
      'aborted': 'Speech recognition aborted.',
      'bad-grammar': 'Grammar error in speech recognition.',
      'language-not-supported': 'Language not supported.',
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  /**
   * Start listening for speech input
   * @param onResult - Callback for transcription results
   * @param onError - Callback for errors
   * @param onEnd - Callback when recognition ends
   */
  start(
    onResult?: (result: SpeechRecognitionResult) => void,
    onError?: (error: SpeechRecognitionError) => void,
    onEnd?: () => void
  ): boolean {
    if (!this.isSupported) {
      if (onError) {
        onError({
          error: 'not-supported',
          message: 'Speech Recognition API is not supported in this browser.',
        });
      }
      return false;
    }

    if (this.isListening) {
      console.warn('Speech recognition is already listening');
      return false;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      if (onError) {
        onError({
          error: 'start-failed',
          message: 'Failed to start speech recognition. Please try again.',
        });
      }
      return false;
    }
  }

  /**
   * Stop listening for speech input
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort current recognition session
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Check if speech recognition is currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if speech recognition is supported
   */
  getIsSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Set the language for speech recognition
   * @param lang - Language code (e.g., 'en-US', 'en-GB')
   */
  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
}

/**
 * Extract structured item data from voice transcript using AI
 * Uses OpenRouter to parse natural language into structured form data
 * 
 * @param transcript - Voice transcript text
 * @returns Structured item data or null if parsing fails
 */
export interface VoiceItemData {
  status?: "lost" | "found";
  title?: string;
  category?: "phone" | "keys" | "stationery" | "electronics" | "wallet" | "clothing" | "other";
  description?: string;
  location?: string;
  contact_info?: string;
}

export async function extractItemDataFromVoice(transcript: string): Promise<VoiceItemData | null> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!apiKey) {
    console.warn("Missing VITE_OPENROUTER_API_KEY; cannot extract structured data from voice.");
    return null;
  }

  const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
  const MODEL = "openai/gpt-4o-mini";

  const prompt = {
    role: "system",
    content: `You are an assistant that extracts structured data from voice transcripts about lost or found items. 
The user will describe their item in natural language. Extract all available information.

Return ONLY a valid JSON object with these keys (include all keys that are mentioned or can be inferred):
- status: "lost" or "found" (REQUIRED - determine from context like "I lost", "I found", "reporting lost", etc.)
- title: Item name/title (REQUIRED - extract the main item name, e.g., "iPhone 13", "blue wallet", "car keys")
- category: One of "phone", "keys", "stationery", "electronics", "wallet", "clothing", "other" (REQUIRED - map to closest category)
  * "phone" for phones, smartphones, mobile phones
  * "keys" for keys, keychains
  * "stationery" for pens, notebooks, books, stationery items
  * "electronics" for laptops, tablets, headphones, chargers, electronic devices (except phones)
  * "wallet" for wallets, purses
  * "clothing" for clothes, jackets, bags, accessories
  * "other" for anything else
- description: Detailed description of the item including color, brand, model, condition, distinctive features (if mentioned)
- location: Where item was lost/found (if mentioned)
- contact_info: Phone number or email (only if explicitly mentioned in this transcript)

Be smart about extracting information. If user says "I lost my blue iPhone 13 at the library", extract:
- status: "lost"
- title: "Blue iPhone 13"
- category: "phone"
- location: "library"
- description: "Blue iPhone 13"

Return ONLY the JSON object, no other text. Example:
{"status": "lost", "title": "Blue iPhone 13", "category": "phone", "description": "Blue iPhone 13 with black case", "location": "library"}`,
  };

  const userMessage = {
    role: "user",
    content: `Extract item information from this voice transcript: "${transcript}"`,
  };

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
        model: MODEL,
        messages: [prompt, userMessage],
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenRouter error: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    try {
      const result = JSON.parse(content) as VoiceItemData;
      // Validate category if present
      if (result.category) {
        const validCategories = ["phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"];
        if (!validCategories.includes(result.category)) {
          result.category = "other";
        }
      }
      // Validate status if present
      if (result.status && result.status !== "lost" && result.status !== "found") {
        delete result.status;
      }
      return result;
    } catch (parseError) {
      console.warn("Failed to parse AI response as JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error extracting item data from voice:", error);
    return null;
  }
}

