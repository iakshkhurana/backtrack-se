import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import tietLogo from "@/assets/tiet.png";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = authSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms & Privacy");
      return;
    }

    try {
      signUpSchema.parse({ name, email, password });
      setLoading(true);

      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created! Please check your email to verify your account.");
      setName("");
      setEmail("");
      setPassword("");
      setAgreedToTerms(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error creating account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email, password });
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Signed in successfully!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error signing in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(`Error signing in with ${provider}`);
    }
  };

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
            className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent cursor-pointer mb-8"
          >
            BackTrack
          </div>

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              {isSignUp ? "Get Started Now" : "Welcome Back"}
            </span>
          </h1>
          <p className="text-muted-foreground mb-8">
            {isSignUp 
              ? "Enter your credentials to create your account." 
              : "Enter your credentials to access your account."}
          </p>

          {/* Social Login Buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border border-border hover:bg-muted"
              onClick={() => handleSocialLogin("google")}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Log in with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border border-border hover:bg-muted"
              onClick={() => handleSocialLogin("apple")}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Log in with Apple
            </Button>
          </div>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Rafiqur Rahman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="rafiqur51@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "min 8 chars" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
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

            {isSignUp && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms & Privacy
                  </a>
                </label>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign Up" : "Login")}
            </Button>
          </form>

          {/* Toggle Sign In/Sign Up */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                Have an account?{" "}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setName("");
                    setAgreedToTerms(false);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            )}
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            2024 BackTrack, All right Reserved
          </div>
        </div>
      </div>

      {/* Right Column - Promotional Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-purple-600 to-purple-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`
          }}></div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The simplest way to manage lost & found
          </h2>
          <p className="text-lg opacity-90 mb-12">
            {isSignUp 
              ? "Enter your credentials to create your account." 
              : "Enter your credentials to access your account."}
          </p>

          {/* Dashboard Preview Mockup */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="bg-white rounded-xl p-6 text-gray-900 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Dashboard</h3>
                <Button size="sm" className="bg-primary text-white">Add Item</Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Items Posted</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">24</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Successful Matches</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">18</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Recent Activity</p>
                  <div className="space-y-2">
                    {["Lost Items", "Found Items", "Matches", "Posts"].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item}</span>
                        <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${75 - idx * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900 font-medium">{75 - idx * 10}%</span>
                      </div>
                    ))}
                  </div>
                </div>
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

export default Auth;
