import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";
import tietLogo from "@/assets/tiet.png";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if we have a valid password reset session
    const checkSession = async () => {
      try {
        // Check hash fragment first (Supabase typically uses hash for password reset)
        const hashParams = window.location.hash.substring(1); // Remove #
        const hashSearchParams = new URLSearchParams(hashParams);
        const hashType = hashSearchParams.get("type");
        const hashAccessToken = hashSearchParams.get("access_token");
        
        // Check query params as fallback
        const queryType = searchParams.get("type");
        const queryAccessToken = searchParams.get("access_token");
        
        // Determine which params to use (hash takes priority)
        const type = hashType || queryType;
        const accessToken = hashAccessToken || queryAccessToken;
        
        // If we have recovery tokens, Supabase needs to process them
        if (type === "recovery" && accessToken) {
          try {
            // Supabase automatically processes hash fragments when we call getSession()
            // But we need to wait a bit for it to process
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error("Session error:", sessionError);
            }

            // If we have a session or the recovery tokens, we can proceed
            if (session || (type === "recovery" && accessToken)) {
              setIsValidSession(true);
              setCheckingSession(false);
              // Clear the hash fragment from URL for security
              if (hashParams) {
                window.history.replaceState(null, '', window.location.pathname);
              }
              return;
            }
          } catch (err) {
            console.error("Error getting session:", err);
          }
        }

        // Fallback: check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
        }

        if (session || (type === "recovery" && accessToken)) {
          setIsValidSession(true);
          // Clear hash fragment if present
          if (hashParams) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          toast.error("Invalid or expired reset link. Please request a new one.");
          setTimeout(() => navigate("/forgot-password"), 2000);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        toast.error("Error validating reset link. Please try again.");
        setTimeout(() => navigate("/forgot-password"), 2000);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate, searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse({ password, confirmPassword });
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password reset successfully! Redirecting to sign in...");
      
      // Sign out to ensure clean state (handle gracefully if no session exists)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
        }
      } catch (signOutError: any) {
        // Ignore "Auth session missing" errors - user is already signed out
        if (!signOutError?.message?.includes("Auth session missing") && 
            !signOutError?.message?.includes("session missing")) {
          console.warn("Error during sign out after password reset:", signOutError);
        }
      }
      
      // Redirect to auth page after a short delay
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error resetting password");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 bg-card flex items-center justify-center p-6 lg:p-12 relative">
        {/* Top-left TIET logo */}
        <img
          src={tietLogo}
          alt="TIET"
          className="absolute top-6 left-6 h-10 w-auto opacity-90 select-none rounded-md"
        />
        <div className="w-full max-w-md">
          {/* Logo */}
          <div 
            onClick={() => navigate("/")} 
            className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent dark:bg-none dark:text-foreground cursor-pointer mb-8"
          >
            BackTrack
          </div>

          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent dark:bg-none dark:text-foreground">
              Set New Password
            </span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Enter your new password below. Make sure it's at least 6 characters long.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>

          {/* Copyright */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            2024 BackTrack, All right Reserved
          </div>
        </div>
      </div>

      {/* Right Column - Promotional Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-accent to-primary/80 dark:from-secondary dark:via-muted dark:to-secondary text-white dark:text-foreground p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`
          }}></div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Secure Password Reset
          </h2>
          <p className="text-lg opacity-90 mb-12">
            Choose a strong password that you haven't used before. Make sure it's unique and memorable.
          </p>

          {/* Security Tips */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h3 className="font-semibold mb-4 text-lg">Password Tips</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">✓</span>
                <p className="text-sm opacity-90">
                  Use at least 6 characters (more is better)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">✓</span>
                <p className="text-sm opacity-90">
                  Mix letters, numbers, and special characters
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">✓</span>
                <p className="text-sm opacity-90">
                  Avoid using personal information
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">✓</span>
                <p className="text-sm opacity-90">
                  Don't reuse passwords from other accounts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Logos */}
        <div className="relative z-10">
          <p className="text-sm opacity-70 mb-4">Trusted by students at</p>
          <div className="flex items-center gap-6 opacity-60">
            <div className="text-2xl font-bold">Thapar</div>
            <div className="text-2xl font-bold">University</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

