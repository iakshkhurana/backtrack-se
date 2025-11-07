import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  user: any;
}

export const Navbar = ({ darkMode, toggleDarkMode, user }: NavbarProps) => {
  const navigate = useNavigate();

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
    <nav className="sticky top-0 z-50 pt-4 pb-2">
      <div className="container mx-auto px-4">
        <div className="rounded-full border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <h1 
              className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleNavigate("/")}
            >
              BackTrack
            </h1>
            <div className="hidden md:flex gap-1">
              <Button 
                variant="ghost" 
                onClick={() => handleNavigate("/")}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                Home
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigate("/lost")}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                Lost Items
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigate("/found")}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                Found Items
              </Button>
              {user && (
                <Button 
                  variant="ghost" 
                  onClick={() => handleNavigate("/post")}
                  className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                >
                  Post Item
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            {user ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                onClick={() => handleNavigate("/auth")}
                className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all duration-200"
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
