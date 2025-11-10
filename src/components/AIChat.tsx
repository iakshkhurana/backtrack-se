import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Bot, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { extractSearchKeywords } from "@/services/openrouter";
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

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // Extract keywords from the user's query
      const baseTokens = userMessage.content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 2 &&
            !["the", "and", "with", "this", "that", "have", "from", "near", "around", "about", "there", "please", "help", "lost", "found", "item", "items"].includes(w)
        )
        .slice(0, 6);

      const extracted = await extractSearchKeywords(userMessage.content);
      const keywordsSet = new Set<string>([...baseTokens, ...extracted].map((k) => k.toLowerCase()));
      const keywords = Array.from(keywordsSet).slice(0, 8);

      // Basic intent/status filter
      const wantsLost = /\blost\b/i.test(userMessage.content);
      const wantsFound = /\bfound\b/i.test(userMessage.content);

      // Query Supabase items table
      let query = supabase
        .from("items")
        .select("id,title,description,category,status,location,image_url,contact_info,created_at")
        .order("created_at", { ascending: false })
        .limit(7);

      if (wantsLost && !wantsFound) query = query.eq("status", "lost");
      if (wantsFound && !wantsLost) query = query.eq("status", "found");

      if (keywords.length) {
        const ors: string[] = [];
        for (const kw of keywords) {
          const like = `%${kw}%`;
          ors.push(`title.ilike.${like}`);
          ors.push(`description.ilike.${like}`);
          ors.push(`location.ilike.${like}`);
        }
        query = query.or(ors.join(","));
      }

      const { data: items, error } = await query;
      if (error) throw error;

      let aiResponse: ChatMessage;
      if (items && items.length > 0) {
        aiResponse = {
          role: "assistant",
          content: `I found ${items.length} matching item${items.length > 1 ? "s" : ""} for: ${keywords.length ? keywords.join(", ") : "your description"}${
            wantsLost ? " · filtered to lost" : wantsFound ? " · filtered to found" : ""
          }.`,
          timestamp: new Date(),
          items: items,
        };
      } else {
        aiResponse = {
          role: "assistant",
          content: `I searched for: ${keywords.length ? keywords.join(", ") : "your description"}, but couldn't find a close match. Try adding details like item type, color, location, or date.`,
          timestamp: new Date(),
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err: any) {
      const aiResponse: ChatMessage = {
        role: "assistant",
        content: `I ran into an issue searching. Please try again in a moment. (${err?.message ?? "unknown error"})`,
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

