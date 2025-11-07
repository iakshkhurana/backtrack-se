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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <nav className="sticky top-0 z-50 pt-4 pb-2">
      <div className="container mx-auto px-4">
        <div className="rounded-full border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <h1 
              className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            >
              BackTrack
            </h1>
            <div className="hidden md:flex gap-1">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Home
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/lost")}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Lost Items
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/found")}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Found Items
              </Button>
              {user && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/post")}
                  className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
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
                onClick={() => navigate("/auth")}
                className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all"
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
