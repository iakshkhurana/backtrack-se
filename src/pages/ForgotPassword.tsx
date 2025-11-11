import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, ArrowLeft } from "lucide-react";
import tietLogo from "@/assets/tiet.png";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse({ email });
      setLoading(true);

      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error sending reset email");
      }
    } finally {
      setLoading(false);
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
              Reset Password
            </span>
          </h1>
          <p className="text-muted-foreground mb-8">
            {emailSent
              ? "We've sent you a password reset link. Please check your email."
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>

          {!emailSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  An email has been sent to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the link in the email to reset your password.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="w-full"
              >
                Send Another Email
              </Button>
            </div>
          )}

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
            Secure Password Recovery
          </h2>
          <p className="text-lg opacity-90 mb-12">
            We'll send you a secure link to reset your password. Make sure to check your spam folder if you don't see the email.
          </p>

          {/* Security Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Check Your Email</h3>
                  <p className="text-sm opacity-90">
                    We'll send a password reset link to your registered email address.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🔒</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure Process</h3>
                  <p className="text-sm opacity-90">
                    The reset link will expire after a short period for security.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Quick Recovery</h3>
                  <p className="text-sm opacity-90">
                    Follow the link in the email to set a new password and regain access.
                  </p>
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

export default ForgotPassword;

