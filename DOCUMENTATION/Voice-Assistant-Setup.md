# Voice Assistant Setup

This project includes a voice assistant feature that allows users to report lost or found items using voice input. The assistant asks questions interactively and extracts structured data from voice responses.

## Features

- **Real-time Speech-to-Text**: Uses Web Speech API for live audio transcription
- **Interactive Q&A**: Voice assistant asks questions one by one:
  1. Are you reporting a lost item or a found item?
  2. What is the name of the item?
  3. What category does it belong to?
  4. Can you describe the item in detail?
  5. Where was it lost or found?
  6. What is your contact information?
- **AI-Powered Data Extraction**: Uses OpenRouter AI to extract structured data from natural language
- **Auto-fill Form**: Automatically fills the Post Item form with extracted data
- **Text-to-Speech**: Assistant speaks questions aloud using browser's speech synthesis

## Browser Compatibility

The voice assistant uses the **Web Speech API**, which is supported in:
- ✅ Chrome/Edge (Chromium-based browsers)
- ✅ Safari (with `webkitSpeechRecognition`)
- ❌ Firefox (not supported)
- ❌ Opera (limited support)

**Note**: The feature requires microphone permissions and works best in Chrome/Edge browsers.

## How It Works

### 1. Speech Recognition Service (`src/services/speech-to-text.ts`)

- Wraps the Web Speech API for browser compatibility
- Handles real-time audio transcription
- Provides error handling and fallbacks
- Extracts structured data from voice transcripts using AI

### 2. Voice Assistant Component (`src/components/VoiceAssistant.tsx`)

- Interactive modal interface
- Asks questions sequentially
- Uses text-to-speech to speak questions
- Displays real-time transcript
- Shows collected data preview
- Allows skipping questions or finishing early

### 3. Integration with PostItem Page

- "Use Voice Assistant" button on the Post Item page
- Opens voice assistant modal
- Auto-fills form fields when data is collected
- Seamless integration with existing form

## Usage

1. Navigate to the **Post Item** page (`/post`)
2. Click the **"Use Voice Assistant"** button (top right)
3. Grant microphone permissions when prompted
4. The assistant will ask questions one by one
5. Click **"Start Speaking"** and answer each question
6. Click **"Stop Listening"** when done speaking
7. The assistant processes your answer and moves to the next question
8. After all questions (or when you click "Finish Early"), the form is auto-filled
9. Review and submit the form as usual

## Configuration

### Environment Variables

The voice assistant requires the OpenRouter API key for AI-powered data extraction:

```env
VITE_OPENROUTER_API_KEY=<your-openrouter-key>
```

If the API key is not provided, the assistant will still work but with limited data extraction capabilities.

### Microphone Permissions

The browser will prompt for microphone access when you first use the voice assistant. You must:
- Click **"Allow"** when prompted
- Ensure your microphone is connected and working
- Check browser settings if permissions are denied

## Troubleshooting

### "Speech recognition is not supported in your browser"
- **Solution**: Use Chrome, Edge, or Safari. Firefox does not support Web Speech API.

### "Microphone permission denied"
- **Solution**: 
  1. Check browser settings → Privacy → Microphone
  2. Ensure the site has microphone permissions
  3. Try refreshing the page and granting permissions again

### "No speech detected"
- **Solution**:
  1. Check that your microphone is working
  2. Speak clearly and wait a moment before speaking
  3. Ensure you're in a quiet environment
  4. Check microphone volume settings

### Assistant not extracting data correctly
- **Solution**:
  1. Ensure `VITE_OPENROUTER_API_KEY` is set in `.env`
  2. Speak clearly and provide complete answers
  3. Try rephrasing your answer if data isn't extracted correctly
  4. You can manually edit the form after voice input

### Questions not being spoken aloud
- **Solution**: 
  1. Check browser settings for text-to-speech
  2. Ensure system volume is not muted
  3. The transcript is always visible on screen even if audio doesn't play

## Technical Details

### Speech Recognition API

The implementation uses:
- `SpeechRecognition` (Chrome/Edge)
- `webkitSpeechRecognition` (Safari)
- Continuous listening mode for real-time transcription
- Interim results for live feedback

### AI Data Extraction

The `extractItemDataFromVoice` function:
- Sends voice transcript to OpenRouter AI
- Uses GPT-4o-mini model for structured data extraction
- Returns JSON with: status, title, category, description, location, contact_info
- Validates and normalizes extracted data

### Text-to-Speech

Uses browser's `speechSynthesis` API:
- Speaks questions aloud automatically
- Configurable rate, pitch, and volume
- Falls back to visual display if audio is unavailable

## Code Structure

```
src/
├── services/
│   └── speech-to-text.ts          # Speech recognition service & AI extraction
├── components/
│   └── VoiceAssistant.tsx         # Voice assistant UI component
└── pages/
    └── PostItem.tsx                # Integration with post item form
```

## Future Enhancements

Potential improvements:
- Support for multiple languages
- Voice commands for navigation
- Offline speech recognition fallback
- Custom wake word detection
- Voice confirmation before submission

