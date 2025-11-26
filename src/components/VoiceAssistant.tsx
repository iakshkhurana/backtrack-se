import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { SpeechRecognitionService, extractItemDataFromVoice, VoiceItemData } from "@/services/speech-to-text";

interface VoiceAssistantProps {
  onDataExtracted: (data: VoiceItemData) => void;
}

/**
 * Voice Assistant Component
 * Voice-only assistant that collects item information through voice input
 * Uses AI to extract structured data from voice transcript
 */
export const VoiceAssistant = ({ onDataExtracted }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const speechServiceRef = useRef<SpeechRecognitionService | null>(null);
  const isProcessingAnswerRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize speech recognition service
    speechServiceRef.current = new SpeechRecognitionService();
    
    // Check if speech recognition is supported
    const supported = speechServiceRef.current.getIsSupported();
    setIsSpeechSupported(supported);
    
    if (!supported) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
    }

    // Cleanup on unmount
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.stop();
      }
    };
  }, []);

  /**
   * Start listening for user's voice input
   */
  const startListening = () => {
    if (!speechServiceRef.current) return;

    setTranscript(""); // Clear previous transcript
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
   * Process user's answer and extract relevant information using AI
   * @param answer - User's voice transcript
   */
  const processAnswer = async (answer: string) => {
    if (!answer.trim() || isProcessingAnswerRef.current) return;

    // Set processing flag to prevent duplicate processing
    isProcessingAnswerRef.current = true;
    setIsProcessing(true);
    
    try {
      // Extract all item data from the voice transcript using AI
      const extractedData = await extractItemDataFromVoice(answer);
      
      if (extractedData) {
        // Always include the full spoken text in the description
        extractedData.description = answer.trim();
        
        // Check if we have all required fields
        const hasStatus = extractedData.status && (extractedData.status === "lost" || extractedData.status === "found");
        const hasTitle = extractedData.title && extractedData.title.trim().length > 0;
        const hasCategory = extractedData.category;
        
        if (hasStatus && hasTitle && hasCategory) {
          // All item data collected, pass to parent
          onDataExtracted(extractedData);
          toast.success("Voice data collected successfully!");
          setTranscript("");
        } else {
          // Missing some fields
          toast.warning("Please make sure to mention: lost or found status, item name, and category.");
        }
      } else {
        toast.error("Could not extract item information. Please try speaking again.");
      }
    } catch (error) {
      console.error("Error processing answer:", error);
      toast.error("Error processing your answer. Please try again.");
    } finally {
      setIsProcessing(false);
      isProcessingAnswerRef.current = false;
    }
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      {isSpeechSupported ? (
        <div className="flex flex-col gap-2">
          {!isListening ? (
            <Button
              onClick={startListening}
              className="w-full"
              disabled={isProcessing}
              type="button"
            >
              <Mic className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Start Speaking"}
            </Button>
          ) : (
            <Button
              onClick={stopListening}
              variant="destructive"
              className="w-full"
              type="button"
            >
              <MicOff className="h-4 w-4 mr-2" />
              Stop Listening
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Speech recognition not supported. Please use Chrome, Edge, or Safari.
          </p>
        </div>
      )}

      {/* Example Text */}
      <p className="text-sm text-muted-foreground italic">
        Example: "I Lost my id card at Jaggi today"
      </p>

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Your response:</p>
          <p className="text-base">{transcript}</p>
        </div>
      )}

      {/* Status Indicator */}
      {isListening && (
        <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
          <Mic className="h-4 w-4" />
          <p className="text-sm font-semibold">Listening... Speak now</p>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-primary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <p className="text-sm font-semibold">Processing your response...</p>
        </div>
      )}
    </div>
  );
};

