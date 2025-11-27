import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Bot, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { analyzeSearchQuery, generateSearchResponse, openRouterChat, type OpenRouterMessage } from "@/services/openrouter";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  items?: Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    status: string;
    location: string | null;
    image_url: string | null;
    contact_info: string | null;
    created_at: string;
  }>;
  needsFollowUp?: boolean; // Indicates if AI is waiting for more information
}

interface ConversationState {
  pendingSearch?: {
    intent: string;
    keywords: string[];
    status?: "lost" | "found";
    category?: string;
    location?: string;
  };
  isConfirming?: boolean;
}

export const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant for BackTrack Campus Find. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Handle sending a message with intelligent AI-powered search and response
   * Uses AI to understand context, extract search terms, and generate helpful responses
   * Asks follow-up questions when needed (e.g., room number for keys)
   */
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory: OpenRouterMessage[] = messages
        .slice(-6) // Last 6 messages for context
        .map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        }));

      // Check if we have a pending search and this is a follow-up answer
      const isFollowUp = conversationState.pendingSearch !== undefined;
      const combinedQuery = isFollowUp 
        ? `${conversationState.pendingSearch?.intent} ${userQuery}` 
        : userQuery;

      // Use AI to analyze the query and extract search information
      const searchAnalysis = await analyzeSearchQuery(combinedQuery, conversationHistory);

      // If AI says we need follow-up information, ask the question
      if (searchAnalysis.needsFollowUp && !isFollowUp) {
        const followUpMessage: ChatMessage = {
          role: "assistant",
          content: searchAnalysis.followUpQuestion || "Could you provide more details?",
          timestamp: new Date(),
          needsFollowUp: true,
        };

        // Store pending search state
        setConversationState({
          pendingSearch: {
            intent: userQuery,
            keywords: searchAnalysis.keywords,
            status: searchAnalysis.status,
            category: searchAnalysis.category,
            location: searchAnalysis.location,
          },
        });

        setMessages((prev) => [...prev, followUpMessage]);
        setIsLoading(false);
        return;
      }

      // Clear pending search state
      setConversationState({});

      // Build intelligent database query based on AI analysis
      let query = supabase
        .from("items")
        .select("id,title,description,category,status,location,image_url,contact_info,created_at,claim_status")
        .order("created_at", { ascending: false })
        .limit(10);

      // Apply status filter if detected
      if (searchAnalysis.status) {
        query = query.eq("status", searchAnalysis.status);
      }

      // Apply category filter if detected (validate category first)
      const validCategories = ["phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"];
      if (searchAnalysis.category && validCategories.includes(searchAnalysis.category)) {
        query = query.eq("category", searchAnalysis.category as any);
      }

      // Apply location filter if detected (including room numbers from follow-up)
      // For keys, prioritize exact room number match
      const locationToSearch = searchAnalysis.location || (isFollowUp ? userQuery : undefined);
      if (locationToSearch) {
        // For room numbers (like A-801, B-302), search more precisely
        if (/^[A-Z]-\d{3}$/i.test(locationToSearch.trim())) {
          // Exact room number format - search in location field
          query = query.ilike("location", `%${locationToSearch.trim()}%`);
        } else {
          query = query.ilike("location", `%${locationToSearch}%`);
        }
      }

      // Apply keyword search with intelligent matching
      // For keys with room number, be more precise
      if (searchAnalysis.keywords.length > 0) {
        // If we have a room number and searching for keys, prioritize exact matches
        if (locationToSearch && searchAnalysis.category === "keys") {
          // First try exact location match with keys category
          const exactQuery = supabase
            .from("items")
            .select("id,title,description,category,status,location,image_url,contact_info,created_at,claim_status")
            .eq("category", "keys")
            .eq("status", searchAnalysis.status || "lost")
            .ilike("location", `%${locationToSearch.trim()}%`)
            .order("created_at", { ascending: false })
            .limit(5);
          
          const { data: exactMatches } = await exactQuery;
          if (exactMatches && exactMatches.length > 0) {
            // Found exact match, use only these
            const unclaimedExact = exactMatches.filter((item) => item.claim_status !== "claimed");
            if (unclaimedExact.length > 0) {
              const aiResponseText = await generateSearchResponse(
                combinedQuery,
                unclaimedExact,
                searchAnalysis,
                conversationHistory
              );
              const aiResponse: ChatMessage = {
                role: "assistant",
                content: aiResponseText,
                timestamp: new Date(),
                items: unclaimedExact.slice(0, 3), // Show only exact matches
              };
              setMessages((prev) => [...prev, aiResponse]);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback to keyword search if no exact match
        const ors: string[] = [];
        for (const kw of searchAnalysis.keywords) {
          const like = `%${kw}%`;
          // Search in title (highest priority)
          ors.push(`title.ilike.${like}`);
          // Search in description
          ors.push(`description.ilike.${like}`);
          // Search in location
          ors.push(`location.ilike.${like}`);
        }
        query = query.or(ors.join(","));
      }

      // Execute query
      const { data: items, error } = await query;
      if (error) throw error;

      // Filter out claimed items unless specifically searching for them
      let unclaimedItems = items?.filter((item) => item.claim_status !== "claimed") || [];

      // If searching for keys with a specific room number, filter to only exact matches
      if (locationToSearch && searchAnalysis.category === "keys" && /^[A-Z]-\d{3}$/i.test(locationToSearch.trim())) {
        // Extract room number (e.g., A-801 from "A-801" or "at A-801")
        const roomNumberMatch = locationToSearch.match(/([A-Z]-\d{3})/i);
        if (roomNumberMatch) {
          const roomNumber = roomNumberMatch[1].toUpperCase();
          // Filter to only items that contain this exact room number in title or location
          unclaimedItems = unclaimedItems.filter((item) => {
            const titleMatch = item.title?.toUpperCase().includes(roomNumber);
            const locationMatch = item.location?.toUpperCase().includes(roomNumber);
            return titleMatch || locationMatch;
          });
        }
      }

      // Filter out items that don't match the category if category was specified
      if (searchAnalysis.category && unclaimedItems.length > 0) {
        const validCategories = ["phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"];
        if (validCategories.includes(searchAnalysis.category)) {
          // Only filter if we have specific keywords that suggest a category match
          const categoryKeywords: { [key: string]: string[] } = {
            phone: ["phone", "iphone", "mobile", "smartphone"],
            keys: ["key", "keys"],
            wallet: ["wallet", "purse"],
            ring: ["ring", "jewelry"],
            clothing: ["shirt", "jacket", "clothes", "clothing"],
          };
          
          const relevantKeywords = categoryKeywords[searchAnalysis.category] || [];
          const userQueryLower = userQuery.toLowerCase();
          
          // If user is searching for something specific (like "ring"), filter out items that don't match
          if (searchAnalysis.category && relevantKeywords.some(kw => userQueryLower.includes(kw))) {
            unclaimedItems = unclaimedItems.filter((item) => {
              // Keep items that match the category OR have relevant keywords in title/description
              const itemText = `${item.title} ${item.description || ""}`.toLowerCase();
              return item.category === searchAnalysis.category || 
                     relevantKeywords.some(kw => itemText.includes(kw));
            });
          }
        }
      }

      // Generate confirmation message before showing results
      const categoryName = conversationState.pendingSearch?.category || "item";
      const confirmationText = isFollowUp 
        ? `Perfect! Searching for ${categoryName} at ${userQuery}...`
        : "";

      // Use AI to generate intelligent response based on results
      // Pass only the filtered items to ensure AI focuses on exact match
      const aiResponseText = await generateSearchResponse(
        combinedQuery,
        unclaimedItems,
        searchAnalysis,
        conversationHistory
      );

      // Filter items based on relevance - don't show items that don't match the search
      let itemsToShow = unclaimedItems;
      
      // Check if items are actually relevant to the search query
      const userQueryLower = userQuery.toLowerCase();
      const searchKeywords = searchAnalysis.keywords.map(k => k.toLowerCase());
      
      // Filter out items that don't match the search intent
      if (unclaimedItems.length > 0 && searchKeywords.length > 0) {
        itemsToShow = unclaimedItems.filter((item) => {
          const itemText = `${item.title} ${item.description || ""} ${item.location || ""}`.toLowerCase();
          
          // Check if item matches at least one keyword
          const hasKeywordMatch = searchKeywords.some(keyword => 
            itemText.includes(keyword) || 
            item.title.toLowerCase().includes(keyword)
          );
          
          // If category was specified, item must match category OR have strong keyword match
          if (searchAnalysis.category) {
            const categoryMatch = item.category === searchAnalysis.category;
            return categoryMatch || (hasKeywordMatch && searchKeywords.length <= 2); // Allow if strong keyword match
          }
          
          return hasKeywordMatch;
        });
      }
      
      // If category was specified and we have category matches, prioritize them
      if (searchAnalysis.category && itemsToShow.length > 0) {
        const categoryMatches = itemsToShow.filter(item => item.category === searchAnalysis.category);
        if (categoryMatches.length > 0) {
          itemsToShow = categoryMatches; // Only show category matches
        }
      }
      
      // For keys with room number, show only the exact match (max 1 item)
      if (locationToSearch && searchAnalysis.category === "keys") {
        itemsToShow = itemsToShow.slice(0, 1);
      } else if (itemsToShow.length > 3) {
        // Limit to top 3 most relevant items
        itemsToShow = itemsToShow.slice(0, 3);
      }
      
      // If no relevant items found after filtering, show empty (don't show irrelevant items)
      if (itemsToShow.length === 0 && unclaimedItems.length > 0) {
        // Items exist but don't match the search - don't show them
        itemsToShow = [];
      }

      // Create response message
      const aiResponse: ChatMessage = {
        role: "assistant",
        content: confirmationText ? `${confirmationText}\n\n${aiResponseText}` : aiResponseText,
        timestamp: new Date(),
        items: itemsToShow.length > 0 ? itemsToShow : undefined,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const aiResponse: ChatMessage = {
        role: "assistant",
        content: `I encountered an issue while searching. Please try again in a moment. If the problem persists, try rephrasing your query.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "flex items-center justify-center transition-all duration-300",
          "hover:shadow-xl hover:scale-110",
          isOpen && "rotate-90"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-5 z-40 w-[85vw] sm:w-[350px] h-[500px] sm:h-[500px] max-h-[70vh]"
          >
            <Card className="flex flex-col h-full bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                    <div className="relative bg-primary/10 p-1.5 rounded-full">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">BackTrack Campus Find</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-background to-muted/20">
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3 py-2",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-[10px] opacity-70 mt-1 block">
                          {format(msg.timestamp, "h:mm a")}
                        </span>
                        {msg.items && msg.items.length > 0 && (
                          <div className="mt-2 space-y-1.5 pt-2 border-t border-border/50">
                            {msg.items.map((item) => (
                              <div
                                key={item.id}
                                className="bg-background/50 rounded-md p-1.5 text-[10px]"
                              >
                                <p className="font-semibold text-xs">{item.title}</p>
                                {item.location && (
                                  <p className="text-muted-foreground text-[10px]">📍 {item.location}</p>
                                )}
                                {item.contact_info && (
                                  <p className="text-muted-foreground text-[10px]">📞 {item.contact_info}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 justify-start"
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1 h-9 text-sm bg-background border-border/50 focus:border-primary/50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading}
                    size="icon"
                    className="h-9 w-9 bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

