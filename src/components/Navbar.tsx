import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  user: any;
  position?: "fixed" | "absolute";
  customBackgroundColor?: string;
}

export const Navbar = ({ darkMode, toggleDarkMode, user, position = "fixed", customBackgroundColor }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Handle navigation with smooth transition
   * Adds a small delay to allow for smooth page transition animation
   * 
   * @param path - The route path to navigate to
   */
  const handleNavigate = (path: string) => {
    // Small delay for smooth transition effect
    setTimeout(() => {
      navigate(path);
    }, 100);
  };

  /**
   * Handle sign out and navigate to auth page
   */
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      handleNavigate("/auth");
    }
  };

  return (
    <nav className={`${position} top-0 left-0 right-0 z-50 pt-4 pb-2`}>
      <div className="container mx-auto px-4">
        {/* Navbar container - custom background colors */}
        <div className="rounded-full border border-border/50 backdrop-blur-xl shadow-lg shadow-black/20 px-6 py-3 flex items-center justify-between max-w-7xl mx-auto" style={{ backgroundColor: customBackgroundColor || (darkMode ? '#170D26' : '#DBD1E1') }}>
          <div className="flex items-center gap-8">
            {/* Logo - white text in dark mode, blue gradient in light mode */}
            <h1 
              className="text-xl font-bold font-dancing-script bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent dark:bg-none dark:text-foreground cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleNavigate("/")}
            >
              BackTrack
            </h1>
            {/* Navigation links - white text with hover effect */}
            <div className="hidden md:flex gap-1">
              <Button 
                variant="ghost" 
                onClick={() => handleNavigate("/")}
                className={`rounded-full hover:bg-muted hover:text-foreground transition-all duration-200 ${
                  location.pathname === "/" ? "bg-primary/20 text-primary font-semibold" : ""
                }`}
              >
                Home
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigate("/lost")}
                className={`rounded-full hover:bg-muted hover:text-foreground transition-all duration-200 ${
                  location.pathname === "/lost" ? "bg-primary/20 text-primary font-semibold" : ""
                }`}
              >
                Lost Items
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigate("/found")}
                className={`rounded-full hover:bg-muted hover:text-foreground transition-all duration-200 ${
                  location.pathname === "/found" ? "bg-primary/20 text-primary font-semibold" : ""
                }`}
              >
                Found Items
              </Button>
              {user && (
                <Button 
                  variant="ghost" 
                  onClick={() => handleNavigate("/post")}
                  className={`rounded-full hover:bg-muted hover:text-foreground transition-all duration-200 ${
                    location.pathname === "/post" ? "bg-primary/20 text-primary font-semibold" : ""
                  }`}
                >
                  Post Item
                </Button>
              )}
            </div>
          </div>
          
          {/* Right side - icons and sign in button */}
          <div className="flex items-center gap-2">
            {/* Theme toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="rounded-full hover:bg-muted hover:text-foreground transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            {/* Sign out or Sign in button */}
            {user ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="rounded-full hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                onClick={() => handleNavigate("/auth")}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
