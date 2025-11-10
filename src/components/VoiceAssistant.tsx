import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, X, Volume2, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { SpeechRecognitionService, extractItemDataFromVoice, VoiceItemData } from "@/services/speech-to-text";
import { openRouterChat } from "@/services/openrouter";

interface VoiceAssistantProps {
  onDataExtracted: (data: VoiceItemData) => void;
  onClose: () => void;
}

/**
 * Voice Assistant Component
 * Interactive voice assistant that asks questions and collects item information
 * Uses speech-to-text to transcribe user responses
 */
export const VoiceAssistant = ({ onDataExtracted, onClose }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [collectedData, setCollectedData] = useState<Partial<VoiceItemData>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  
  const speechServiceRef = useRef<SpeechRecognitionService | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const spokenQuestionsRef = useRef<Set<number>>(new Set());
  const currentQuestionIndexRef = useRef<number>(0);
  const isProcessingAnswerRef = useRef<boolean>(false);

  // Questions to ask the user
  const questions = [
    "Are you reporting a lost item or a found item?",
    "What is the name of the item?",
    "What category does it belong to? For example, phone, keys, wallet, clothing, or other.",
    "Can you describe the item in detail?",
    "Where was it lost or found?",
    "What is your contact information? Please provide your phone number or email.",
  ];

  useEffect(() => {
    // Initialize speech recognition service
    speechServiceRef.current = new SpeechRecognitionService();
    
    // Check if speech recognition is supported
    const supported = speechServiceRef.current.getIsSupported();
    setIsSpeechSupported(supported);
    
    if (!supported) {
      // Automatically switch to text input mode if speech is not supported
      setUseTextInput(true);
      toast.info("Speech recognition not supported. Using text input mode instead.");
    }

    // Start with first question
    askQuestion(0);

    // Focus text input if using text mode
    if (!supported && textInputRef.current) {
      setTimeout(() => textInputRef.current?.focus(), 100);
    }

    // Cleanup on unmount
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.stop();
      }
      // Cancel any ongoing speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Ask a question to the user using text-to-speech
   * Only speaks the question once per question index
   * @param index - Index of the question to ask
   */
  const askQuestion = (index: number) => {
    if (index >= questions.length) {
      // All questions answered, process the collected data
      processCollectedData();
      return;
    }

    // Update both state and ref to keep them in sync
    currentQuestionIndexRef.current = index;
    setQuestionIndex(index);
    setCurrentQuestion(questions[index]);
    setTranscript("");
    setAiResponse(""); // Clear previous AI response
    isProcessingAnswerRef.current = false; // Reset processing flag

    // Only speak the question if it hasn't been spoken before
    if (!spokenQuestionsRef.current.has(index)) {
      // Use browser's text-to-speech API
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(questions[index]);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Mark this question as spoken when speech ends
        utterance.onend = () => {
          spokenQuestionsRef.current.add(index);
        };
        
        speechSynthesis.speak(utterance);
      }
      // Mark as spoken even if speech synthesis is not available
      spokenQuestionsRef.current.add(index);
    }
  };

  /**
   * Start listening for user's voice input
   */
  const startListening = () => {
    if (!speechServiceRef.current) return;

    const success = speechServiceRef.current.start(
      (result) => {
        setTranscript(result.transcript);
        
        // If final result, process it (only if not already processing)
        if (result.isFinal && result.transcript.trim() && !isProcessingAnswerRef.current) {
          processAnswer(result.transcript);
        }
      },
      (error) => {
        toast.error(error.message);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (success) {
      setIsListening(true);
      toast.info("Listening... Speak now");
    }
  };

  /**
   * Stop listening for voice input
   */
  const stopListening = () => {
    if (speechServiceRef.current) {
      speechServiceRef.current.stop();
      setIsListening(false);
      
      // Process the transcript if there's any and not already processing
      if (transcript.trim() && !isProcessingAnswerRef.current) {
        processAnswer(transcript);
      }
    }
  };

  /**
   * Get AI response about the question and user's answer
   * @param question - The question that was asked
   * @param answer - User's answer
   * @returns AI response string
   */
  const getAIResponse = async (question: string, answer: string): Promise<string> => {
    try {
      const messages = [
        {
          role: "system" as const,
          content: `You are a helpful assistant for a lost and found platform. The user is answering questions about a lost or found item. 
Provide a brief, friendly confirmation or clarification about their answer. Keep your response concise (1-2 sentences). 
If the answer seems incomplete or unclear, gently ask for clarification. Otherwise, acknowledge their answer positively.`
        },
        {
          role: "user" as const,
          content: `Question: "${question}"\n\nUser's Answer: "${answer}"\n\nProvide a brief response about this answer.`
        }
      ];

      const response = await openRouterChat(messages);
      return response.trim();
    } catch (error) {
      console.error("Error getting AI response:", error);
      return ""; // Return empty string if AI fails
    }
  };

  /**
   * Process user's answer and extract relevant information
   * Also gets AI response about the question and answer
   * @param answer - User's voice transcript
   */
  const processAnswer = async (answer: string) => {
    if (!answer.trim() || isProcessingAnswerRef.current) return;

    // Set processing flag to prevent duplicate processing
    isProcessingAnswerRef.current = true;
    setIsProcessing(true);
    setAiResponse(""); // Clear previous AI response
    
    try {
      // Use ref to get current question index to avoid stale closure
      const currentIndex = currentQuestionIndexRef.current;
      const currentQ = questions[currentIndex];
      
      // Get AI response about the question and answer
      const aiResponseText = await getAIResponse(currentQ, answer);
      if (aiResponseText) {
        setAiResponse(aiResponseText);
        
        // Speak the AI response
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel(); // Cancel any ongoing speech
          const utterance = new SpeechSynthesisUtterance(aiResponseText);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 1;
          speechSynthesis.speak(utterance);
        }
      }

      // Extract structured data from the answer using AI
      const extractedData = await extractItemDataFromVoice(answer);
      
      if (extractedData) {
        // Merge extracted data with collected data
        setCollectedData((prev) => ({
          ...prev,
          ...extractedData,
        }));
      }

      // Map answer to current question
      let newData: Partial<VoiceItemData> = {};

      // Extract information based on current question
      if (currentQ.includes("lost or found")) {
        const lowerAnswer = answer.toLowerCase();
        if (lowerAnswer.includes("lost")) {
          newData.status = "lost";
        } else if (lowerAnswer.includes("found")) {
          newData.status = "found";
        }
      } else if (currentQ.includes("name")) {
        newData.title = answer.trim();
      } else if (currentQ.includes("category")) {
        const lowerAnswer = answer.toLowerCase();
        const categories = ["phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"];
        const foundCategory = categories.find((cat) => lowerAnswer.includes(cat));
        if (foundCategory) {
          newData.category = foundCategory as any;
        }
      } else if (currentQ.includes("describe")) {
        newData.description = answer.trim();
      } else if (currentQ.includes("Where")) {
        newData.location = answer.trim();
      } else if (currentQ.includes("contact")) {
        // Extract phone number or email
        const phoneMatch = answer.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}/);
        const emailMatch = answer.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (phoneMatch) {
          newData.contact_info = phoneMatch[0];
        } else if (emailMatch) {
          newData.contact_info = emailMatch[0];
        } else {
          newData.contact_info = answer.trim();
        }
      }

      // Update collected data
      setCollectedData((prev) => ({
        ...prev,
        ...newData,
        ...extractedData,
      }));

      // Move to next question after AI response is spoken (wait a bit longer)
      // Use ref to get the next index to avoid stale closure
      setTimeout(() => {
        const nextIndex = currentQuestionIndexRef.current + 1;
        askQuestion(nextIndex);
        setIsProcessing(false);
        isProcessingAnswerRef.current = false;
      }, 3000); // Increased delay to allow AI response to be spoken
    } catch (error) {
      console.error("Error processing answer:", error);
      toast.error("Error processing your answer. Please try again.");
      setIsProcessing(false);
      isProcessingAnswerRef.current = false;
    }
  };

  /**
   * Process all collected data and pass it to parent component
   */
  const processCollectedData = () => {
    if (Object.keys(collectedData).length > 0) {
      onDataExtracted(collectedData as VoiceItemData);
      toast.success("Voice data collected successfully!");
      onClose();
    } else {
      toast.error("No data collected. Please try again.");
    }
  };

  /**
   * Skip current question and move to next
   */
  const skipQuestion = () => {
    askQuestion(questionIndex + 1);
  };

  /**
   * Finish early with collected data
   */
  const finishEarly = () => {
    if (Object.keys(collectedData).length > 0) {
      processCollectedData();
    } else {
      toast.error("Please answer at least one question before finishing.");
    }
  };

  /**
   * Handle text input submission
   * Processes text input as if it were a voice transcript
   */
  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast.error("Please enter your answer");
      return;
    }

    processAnswer(textInput);
    setTextInput("");
    
    // Focus input again for next question
    setTimeout(() => textInputRef.current?.focus(), 100);
  };

  /**
   * Toggle between voice and text input modes
   */
  const toggleInputMode = () => {
    if (isListening) {
      stopListening();
    }
    setUseTextInput(!useTextInput);
    setTextInput("");
    setTranscript("");
  };

  return (
    <Card className="fixed inset-4 z-50 max-w-2xl mx-auto my-auto max-h-[90vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Voice Assistant</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Question */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <p className="font-semibold">Question {questionIndex + 1} of {questions.length}</p>
          </div>
          <p className="text-lg">{currentQuestion}</p>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-background border p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Your response:</p>
            <p className="text-base">{transcript}</p>
          </div>
        )}

        {/* AI Response Display */}
        {aiResponse && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-primary">AI Response:</p>
            </div>
            <p className="text-base text-foreground">{aiResponse}</p>
          </div>
        )}

        {/* Collected Data Preview */}
        {Object.keys(collectedData).length > 0 && (
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Collected Information:</p>
            <div className="space-y-1 text-sm">
              {collectedData.status && <p>• Status: {collectedData.status}</p>}
              {collectedData.title && <p>• Item: {collectedData.title}</p>}
              {collectedData.category && <p>• Category: {collectedData.category}</p>}
              {collectedData.location && <p>• Location: {collectedData.location}</p>}
              {collectedData.contact_info && <p>• Contact: {collectedData.contact_info}</p>}
            </div>
          </div>
        )}

        {/* Browser Support Warning */}
        {!isSpeechSupported && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
            <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
              Speech recognition not supported
            </p>
            <p className="text-xs text-muted-foreground">
              Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for voice input, or use text input mode below.
            </p>
          </div>
        )}

        {/* Text Input Mode */}
        {useTextInput && (
          <div className="space-y-2">
            <Label htmlFor="text-answer" className="text-sm font-semibold">
              Type your answer:
            </Label>
            <div className="flex gap-2">
              <Input
                ref={textInputRef}
                id="text-answer"
                type="text"
                placeholder="Type your answer here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  }
                }}
                className="flex-1"
                disabled={isProcessing}
              />
              <Button
                onClick={handleTextSubmit}
                disabled={isProcessing || !textInput.trim()}
              >
                {isProcessing ? "Processing..." : "Submit"}
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-2">
          {isSpeechSupported && (
            <div className="flex gap-2">
              {!isListening ? (
                <Button
                  onClick={startListening}
                  className="flex-1"
                  disabled={isProcessing || useTextInput}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Start Speaking"}
                </Button>
              ) : (
                <Button
                  onClick={stopListening}
                  variant="destructive"
                  className="flex-1"
                >
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </Button>
              )}
              {!isListening && (
                <Button
                  onClick={toggleInputMode}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  {useTextInput ? "Switch to Voice" : "Switch to Text"}
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={skipQuestion}
              className="flex-1"
              disabled={isListening || isProcessing}
            >
              Skip Question
            </Button>
            <Button
              variant="outline"
              onClick={finishEarly}
              className="flex-1"
              disabled={isListening || isProcessing || Object.keys(collectedData).length === 0}
            >
              Finish Early
            </Button>
          </div>
        </div>

        {/* Status Indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
            <Mic className="h-5 w-5" />
            <p className="font-semibold">Listening...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

