import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { MessageCircle, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Lost from "./pages/Lost";
import Found from "./pages/Found";
import PostItem from "./pages/PostItem";
import { extractSearchKeywords } from "@/services/openrouter";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// AI Chat Component - handles the chat interface and AI interactions
interface ChatMessage {
  role: string;
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

const AIChatInterface = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant for BackTrack Campus Find. How can I help you today?",
      timestamp: new Date(),
    },
  ]);

  // Handles sending messages and getting AI responses
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      // 0) Cheap local token fallback
      const baseTokens = userMessage.content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !["the","and","with","this","that","have","from","near","around","about","there","please","help","lost","found","item","items"].includes(w))
        .slice(0, 6);

      // 1) Extract keywords from the user's query via OpenRouter
      const extracted = await extractSearchKeywords(userMessage.content);
      const keywordsSet = new Set<string>([...baseTokens, ...extracted].map((k) => k.toLowerCase()));
      const keywords = Array.from(keywordsSet).slice(0, 8);

      // 1.5) Basic intent/status filter
      const wantsLost = /\blost\b/i.test(userMessage.content);
      const wantsFound = /\bfound\b/i.test(userMessage.content);

      // 2) Query Supabase items table with a simple OR ILIKE across title/description/location
      // Build OR filter string like: title.ilike.%kw1%,description.ilike.%kw1%,...
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

      if (items && items.length > 0) {
        const aiResponse: ChatMessage = {
          role: "assistant",
          content: `I found ${items.length} matching item${items.length > 1 ? "s" : ""} for: ${keywords.length ? keywords.join(", ") : "your description"}${
            wantsLost ? " · filtered to lost" : wantsFound ? " · filtered to found" : ""
          }.`,
          timestamp: new Date(),
          items: items,
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        const aiResponse = {
          role: "assistant",
          content: `I searched for: ${keywords.length ? keywords.join(", ") : "your description"}, but couldn't find a close match. Try adding details like item type, color, location, or date.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (err: any) {
      const aiResponse = {
        role: "assistant",
        content: `I ran into an issue searching. Please try again in a moment. (${err?.message ?? "unknown error"})`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }
  };

  // Handles Enter key press in input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ExpandableChat position="bottom-right" size="md" icon={<MessageCircle />}>
      {/* Chat Header - shows AI assistant title */}
      <ExpandableChatHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">BackTrack Campus Find</p>
          </div>
        </div>
      </ExpandableChatHeader>

      {/* Chat Body - displays message history */}
      <ExpandableChatBody>
        <div className="space-y-4 p-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                {/* Display items with images and full details */}
                {msg.items && msg.items.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {msg.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-background/50 rounded-lg p-3 border border-border/50"
                      >
                        <div className="flex gap-3">
                          {/* Item Image */}
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                            />
                          )}
                          
                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{item.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                item.status === "lost" 
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            
                            {item.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {item.category && (
                                <span className="capitalize">📁 {item.category}</span>
                              )}
                              {item.location && (
                                <span>📍 {item.location}</span>
                              )}
                              {item.contact_info && (
                                <span>📞 {item.contact_info}</span>
                              )}
                              <span>
                                🕒 {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <span className="text-xs opacity-70 mt-2 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ExpandableChatBody>

      {/* Chat Footer - input field and send button */}
      <ExpandableChatFooter>
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/lost" element={<Lost />} />
          <Route path="/found" element={<Found />} />
          <Route path="/post" element={<PostItem />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* AI Chat - available on all pages */}
        <AIChatInterface />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
