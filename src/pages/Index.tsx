import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import heroImage from "@/assets/hero-bg.jpg";
import { Search, Upload, Bell, Shield, Users, Clock } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ShaderBackground } from "@/components/ShaderBackground";

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -40]);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !darkMode ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Scroll progress bar */}
      <motion.div 
        className="fixed left-0 right-0 top-0 h-1 bg-primary origin-left z-[60]"
        style={{ scaleX: scrollYProgress }}
      />
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />

      {/* SaaS Hero */}
      <section className="relative">
        <ShaderBackground />
        <div className="absolute -z-20 inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.18),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.18),transparent_45%)]" />
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-4">Campus Lost & Found, reimagined</span>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Lost something? <span className="text-primary">Find it fast.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
                BackTrack helps students report, discover, and recover belongings with a simple, trustworthy workflow.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate("/lost")} className="shadow-sm">
                  Browse Lost Items
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/found")}>
                  Browse Found Items
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> Verified posts</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Real-time updates</div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Student-first</div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <motion.div 
                className="rounded-3xl overflow-hidden shadow-2xl"
                style={{ y: heroParallax }}
              >
                <img src={heroImage} alt="BackTrack preview" className="w-full h-full object-cover aspect-[4/3]" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 pb-6 -mt-6 md:-mt-10">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="text-3xl font-bold">10k+</div>
            <div className="text-muted-foreground text-sm">Items browsed</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="text-3xl font-bold">1,200+</div>
            <div className="text-muted-foreground text-sm">Successful matches</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="text-3xl font-bold"><span className="align-middle">~</span>5m</div>
            <div className="text-muted-foreground text-sm">Avg. time to post</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <div className="text-3xl font-bold">24/7</div>
            <div className="text-muted-foreground text-sm">Always available</div>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards */}
      <section className="container mx-auto px-4 py-14 md:py-20">
        <motion.div 
          className="mx-auto max-w-2xl text-center mb-10 md:mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to get items back</h2>
          <p className="text-muted-foreground mt-3">Clear workflows, helpful automations, and privacy-first communication.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <motion.div 
            className="p-6 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="w-12 h-12 mb-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Powerful search</h3>
            <p className="text-muted-foreground">Filter by category, date, and location to quickly find matches.</p>
          </motion.div>
          <motion.div 
            className="p-6 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          >
            <div className="w-12 h-12 mb-4 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Frictionless posting</h3>
            <p className="text-muted-foreground">Post a found or lost item with photos and details in minutes.</p>
          </motion.div>
          <motion.div 
            className="p-6 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
          >
            <div className="w-12 h-12 mb-4 rounded-full bg-category-keys/10 text-category-keys flex items-center justify-center">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart notifications</h3>
            <p className="text-muted-foreground">Get updates when potential matches or replies appear.</p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <motion.div 
            className="rounded-2xl border border-border bg-gradient-hero text-white p-10 md:p-12 text-center"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Ready to get started?</h3>
            <p className="opacity-90 mb-8">Join BackTrack and help reunite items with their owners today.</p>
            <Button size="lg" onClick={() => navigate(user ? "/post" : "/auth")} className="bg-white text-primary hover:bg-white/90">
              {user ? "Post an Item" : "Create an account"}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
