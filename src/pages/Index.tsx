import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import heroImage from "@/assets/hero-bg.jpg";
import { Search, Upload, Bell, Shield, Users, Clock, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroSection } from "@/components/hero-section-dark";

const Index = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -40]);

  // Testimonials data
  const testimonials = [
    {
      quote: "With the new addition of AI features such as automated summaries and thematic suggestions, BackTrack has made it even faster to get to customer insights.",
      user: "TrustRadius Verified User",
      role: "Product Manager",
      rating: "1,000+"
    },
    {
      quote: "BackTrack's intuitive interface and powerful search capabilities have transformed how we handle lost and found items on campus. Highly recommended!",
      user: "Campus Administrator",
      role: "Student Services",
      rating: "500+"
    },
    {
      quote: "The real-time notifications and smart matching system saved me hours of work. BackTrack is a game-changer for campus operations.",
      user: "Verified User",
      role: "Operations Manager",
      rating: "2,000+"
    },
    {
      quote: "As a student, I love how easy it is to post and search for items. The AI assistant makes finding lost items so much faster!",
      user: "Student User",
      role: "Undergraduate",
      rating: "100+"
    }
  ];

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      // Default to dark mode
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

  // Auto-slide testimonials from right to left
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change testimonial every 5 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Navigate to previous testimonial
  const handlePrevious = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Navigate to next testimonial
  const handleNext = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !darkMode ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Full page gradient background */}
      <div className="fixed inset-0 z-0 bg-purple-950/10 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      
      {/* Scroll progress bar */}
      <motion.div 
        className="fixed left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 origin-left z-[60]"
        style={{ scaleX: scrollYProgress }}
      />
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} position="fixed" />

      {/* Hero Section - Full Page */}
      <div className="pt-20">
        <HeroSection
        title="Campus Lost & Found"
        subtitle={{
          regular: "Lost something? ",
          gradient: "Find it fast."
        }}
        description="BackTrack helps students report, discover, and recover belongings with a simple, trustworthy workflow."
        ctaText="Get Started"
        ctaHref="#"
        bottomImage={{
          light: heroImage,
          dark: heroImage
        }}
      />
      </div>

      {/* Stats */}
      <section className="container mx-auto px-4 pb-6 -mt-6 md:-mt-10 relative z-10">
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
      <section className="container mx-auto px-4 py-14 md:py-20 relative z-10">
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
            {/* Dark gray circular background with white icon */}
            <div className="w-12 h-12 mb-4 rounded-full bg-secondary text-foreground flex items-center justify-center">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Powerful search</h3>
            <p className="text-muted-foreground">Filter by category, date, and location to quickly find matches.</p>
          </motion.div>
          <motion.div 
            className="p-6 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          >
            {/* Dark gray circular background with white icon */}
            <div className="w-12 h-12 mb-4 rounded-full bg-secondary text-foreground flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Frictionless posting</h3>
            <p className="text-muted-foreground">Post a found or lost item with photos and details in minutes.</p>
          </motion.div>
          <motion.div 
            className="p-6 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
          >
            {/* Dark gray circular background with dark bell icon in dark mode */}
            <div className="w-12 h-12 mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Bell className="h-6 w-6 text-blue-500 dark:text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Smart notifications</h3>
            <p className="text-muted-foreground">Get updates when potential matches or replies appear.</p>
          </motion.div>
        </div>
      </section>

      {/* Trusted and Loved by Users */}
      <section className="container mx-auto px-4 py-14 md:py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12 text-foreground">
            Trusted and loved by users
          </h2>
          
          {/* Slidable Testimonials Carousel */}
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden">
              {/* Testimonials Container */}
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}>
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="min-w-full px-4">
                    <div className="space-y-6">
                      {/* Rating Stars - Centered */}
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      
                      {/* Testimonial Quote with Navigation Buttons */}
                      <div className="relative flex items-center gap-4">
                        {/* Left Navigation Button */}
                        <button 
                          onClick={handlePrevious}
                          className="flex-shrink-0 p-2 hover:opacity-70 transition-opacity"
                          aria-label="Previous testimonial"
                        >
                          <ChevronLeft className="h-5 w-5 text-blue-500 opacity-50" />
                        </button>
                        
                        {/* Testimonial Text */}
                        <p className="text-lg md:text-xl text-foreground leading-relaxed text-center flex-1">
                          "{testimonial.quote}"
                        </p>
                        
                        {/* Right Navigation Button */}
                        <button 
                          onClick={handleNext}
                          className="flex-shrink-0 p-2 hover:opacity-70 transition-opacity"
                          aria-label="Next testimonial"
                        >
                          <ChevronRight className="h-5 w-5 text-blue-500 opacity-50" />
                        </button>
                      </div>
                      
                      {/* User Attribution */}
                      <div className="space-y-1 text-center">
                        <p className="font-semibold text-foreground">{testimonial.user}</p>
                        <p className="text-muted-foreground">{testimonial.role}</p>
                        <p className="text-muted-foreground">{testimonial.rating}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Indicator Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentTestimonial
                      ? "w-8 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"
                      : "w-2 bg-gradient-to-r from-blue-400/30 via-blue-500/30 to-blue-600/30"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-14 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div 
            className="rounded-2xl border border-border bg-gradient-hero text-white p-10 md:p-12 text-center"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Ready to get started?</h3>
            <p className="opacity-90 mb-8 text-foreground/80">Join BackTrack and help reunite items with their owners today.</p>
            <Button size="lg" onClick={() => navigate(user ? "/post" : "/auth")} className="bg-white text-gray-600 hover:bg-white/90 dark:bg-white dark:text-gray-500">
              {user ? "Post an Item" : "Create an account"}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
