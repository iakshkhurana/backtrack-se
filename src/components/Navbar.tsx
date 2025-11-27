import { Moon, Sun, LogOut, User, Github, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import noUserImage from "@/assets/no-user.png";

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  /**
   * Fetch user role and profile photo from profile
   * Checks if user is admin or moderator to show admin link
   * Gets profile photo URL or Google OAuth photo
   */
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("role, avatar_url")
            .eq("id", user.id)
            .single();
          
          if (data) {
            setUserRole(data.role);
            
            // Get profile photo: priority: avatar_url > Google photo > null
            if (data.avatar_url) {
              setProfilePhoto(data.avatar_url);
            } else if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
              // Google OAuth profile picture
              setProfilePhoto(user.user_metadata.avatar_url || user.user_metadata.picture);
            } else {
              setProfilePhoto(null);
            }
          }
        } catch (error) {
          // Silently fail if profile doesn't exist yet
          setUserRole(null);
          // Try to get Google photo from user metadata
          if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
            setProfilePhoto(user.user_metadata.avatar_url || user.user_metadata.picture);
          } else {
            setProfilePhoto(null);
          }
        }
      } else {
        setUserRole(null);
        setProfilePhoto(null);
      }
    };

    fetchUserProfile();
  }, [user]);

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
   * Gracefully handles cases where there's no active session
   */
  const handleSignOut = async () => {
    try {
      // Check if there's an active session before attempting to sign out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No active session, just clear local state and navigate
        setUserRole(null);
        setProfilePhoto(null);
        navigate("/auth");
        return;
      }

      // Attempt to sign out if session exists
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Check if error is due to missing session (already signed out)
        if (error.message?.includes("Auth session missing") || error.message?.includes("session missing")) {
          // User is already signed out, just clear state and navigate
          setUserRole(null);
          setProfilePhoto(null);
          navigate("/auth");
          return;
        }
        
        console.error("Sign out error:", error);
        toast.error(`Error signing out: ${error.message}`);
      } else {
        // Clear any local state
        setUserRole(null);
        setProfilePhoto(null);
        toast.success("Signed out successfully");
        // Navigate immediately without delay for signout
        navigate("/auth");
      }
    } catch (error: any) {
      // Handle "Auth session missing" error gracefully
      if (error?.message?.includes("Auth session missing") || error?.message?.includes("session missing")) {
        // User is already signed out, just clear state and navigate
        setUserRole(null);
        setProfilePhoto(null);
        navigate("/auth");
        return;
      }
      
      console.error("Sign out exception:", error);
      toast.error(`Error signing out: ${error.message || "Unknown error"}`);
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
              className="text-xl font-bold font-dancing-script bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent dark:bg-none dark:text-foreground cursor-pointer hover:opacity-80 transition-opacity"
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
            {/* GitHub link */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full hover:bg-muted hover:text-foreground transition-colors"
              aria-label="GitHub Repository"
            >
              <a 
                href="https://github.com/iakshkhurana/backtrack-se" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
            
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
              <>
                {/* Profile button with dropdown for admin users */}
                {(userRole === "admin" || userRole === "moderator") ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={`rounded-full hover:bg-muted hover:text-foreground transition-all duration-200 p-0 ${
                          (location.pathname === "/profile" || location.pathname === "/admin") 
                            ? "bg-primary/20 text-primary font-semibold" 
                            : ""
                        }`}
                        aria-label="Profile Menu"
                      >
                        {profilePhoto ? (
                          <img 
                            src={profilePhoto} 
                            alt="Profile" 
                            className="h-8 w-8 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <img 
                            src={noUserImage} 
                            alt="No User" 
                            className="h-8 w-8 rounded-full object-cover border-2 border-border"
                          />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          handleNavigate("/admin");
                        }}
                        className="cursor-pointer"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          handleNavigate("/profile");
                        }}
                        className="cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={async (e) => {
                          e.preventDefault();
                          await handleSignOut();
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleNavigate("/profile")}
                      className={`rounded-full hover:bg-muted hover:text-foreground transition-all duration-200 p-0 ${
                        location.pathname === "/profile" ? "bg-primary/20 text-primary font-semibold" : ""
                      }`}
                      aria-label="Profile"
                    >
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt="Profile" 
                          className="h-8 w-8 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted/80 flex items-center justify-center border border-primary/30">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleSignOut}
                      className="rounded-full hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </>
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
