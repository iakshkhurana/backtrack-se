import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Lost from "./pages/Lost";
import Found from "./pages/Found";
import PostItem from "./pages/PostItem";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import VerifyTables from "./pages/VerifyTables";
import NotFound from "./pages/NotFound";
import { motion, AnimatePresence } from "framer-motion";
import { AIChat } from "@/components/AIChat";

const queryClient = new QueryClient();

/**
 * AnimatedRoutes component - handles smooth page transitions
 * Wraps Routes with AnimatePresence for fade/slide animations
 */
const AnimatedRoutes = () => {
  const location = useLocation();

  /**
   * Animation variants for page transitions
   * - Fade in/out for smooth opacity changes
   * - Slide effect for directional movement
   * - Scale for subtle zoom effect
   */
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as const, // Custom easing for smooth feel
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/lost" element={<Lost />} />
          <Route path="/found" element={<Found />} />
          <Route path="/post" element={<PostItem />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/verify-tables" element={<VerifyTables />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  // State to track if preloader should be shown (only on initial load)
  const [showPreloader, setShowPreloader] = useState(false);

  /**
   * Check if preloader has been shown in this session
   * Only show preloader on initial page load, not on subsequent navigations
   */
  useEffect(() => {
    // Check if preloader has already been shown in this session
    const preloaderShown = sessionStorage.getItem("preloaderShown");
    
    // If not shown, display the preloader
    if (!preloaderShown) {
      setShowPreloader(true);
    }
  }, []);

  /**
   * Handle preloader completion
   * Mark preloader as shown in sessionStorage so it won't show again in this session
   */
  const handlePreloaderComplete = () => {
    // Mark preloader as shown in sessionStorage
    sessionStorage.setItem("preloaderShown", "true");
    setShowPreloader(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* AnimatedRoutes handles smooth page transitions */}
          <AnimatedRoutes />
          {/* AI Chat - available on all pages */}
          <AIChat />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
