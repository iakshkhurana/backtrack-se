import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import heroImage from "@/assets/hero-bg.jpg";
import img2 from "@/assets/img-2.png";
import { Search, Upload, Bell, Shield, Users, Clock, ChevronLeft, ChevronRight, Star, AlertCircle, Heart, Sparkles, Zap, Car, IndianRupee, MapPin, Venus } from "lucide-react";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/hero-section-dark";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Index = () => {
  // Default to light mode
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showGetStartedDialog, setShowGetStartedDialog] = useState(false);
  const navigate = useNavigate();

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
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      // Default to light mode
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
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

  const handleGetStarted = () => {
    if (user) {
      // Show dialog if signed in
      setShowGetStartedDialog(true);
    } else {
      // Navigate to signup if not signed in
      navigate("/auth");
    }
  };

  const handleDialogOption = (option: "lost" | "found" | "post") => {
    setShowGetStartedDialog(false);
    if (option === "lost") {
      navigate("/lost");
    } else if (option === "found") {
      navigate("/found");
    } else {
      navigate("/post");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Full page gradient background */}
      <div className="fixed inset-0 z-0 bg-purple-950/10 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} position="fixed" />

      {/* Hero Section - Full Page - Starts from top */}
      <div className="pt-0">
        <HeroSection
        title="Campus Lost & Found"
        subtitle={{
          regular: "Lost something? ",
          gradient: "Find it fast."
        }}
        description="BackTrack helps students report, discover, and recover belongings with a simple, trustworthy workflow."
        ctaText="Get Started"
        ctaOnClick={handleGetStarted}
        bottomImage={{
          light: heroImage,
          dark: heroImage
        }}
        className="pt-32"
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

      {/* Why Choose BackTrack Section */}
      <section className="py-14 md:py-20 relative z-10 bg-background">
        <div className="container mx-auto px-4">
          <motion.div 
            className="mx-auto max-w-4xl text-center mb-10 md:mb-14"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              <span className="text-foreground">Why Choose </span>
              <span className="text-primary">BackTrack?</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Our platform makes it easy for campus students to report lost items, find belongings, and reunite with their possessions quickly and securely.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Smart Search Card */}
            <motion.div 
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all select-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Search className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Smart Search</h3>
              <p className="text-muted-foreground">
                Find items quickly with AI-powered search and advanced filtering by category, location, and date.
              </p>
            </motion.div>

            {/* Quick Posting Card */}
            <motion.div 
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all select-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Upload className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Quick Posting</h3>
              <p className="text-muted-foreground">
                Post lost or found items effortlessly with voice commands, image analysis, and automated form filling.
              </p>
            </motion.div>

            {/* AI Matching Card */}
            <motion.div 
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all select-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">AI Matching</h3>
              <p className="text-muted-foreground">
                Intelligent matching system connects lost items with their owners using advanced AI algorithms.
              </p>
            </motion.div>

            {/* Secure & Safe Card */}
            <motion.div 
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all select-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Shield className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Secure & Safe</h3>
              <p className="text-muted-foreground">
                Your data is protected with secure authentication, privacy-first design, and verified user profiles.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 md:py-20 relative z-10 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto max-w-4xl text-center mb-10 md:mb-14"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              <span className="text-foreground">Key </span>
              <span className="text-primary">Features</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Make campus lost-and-found effortless with fast search, quick posting, and secure interactions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Create Pools / Quick Posting */}
            <motion.div
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all select-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Car className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Create Posts</h3>
              <p className="text-muted-foreground">Easily create lost/found posts with images and details.</p>
            </motion.div>

            {/* Find Companions / Community */}
            <motion.div
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all select-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Users className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Find Matches</h3>
              <p className="text-muted-foreground">Connect with students who reported similar items.</p>
            </motion.div>

            {/* Save Money / Time saved */}
            <motion.div
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all select-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Clock className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Save Time</h3>
              <p className="text-muted-foreground">AI-powered search reduces time to find what you need.</p>
            </motion.div>

            {/* Female-only / Safety */}
            <motion.div
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all select-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Venus className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Safe by Design</h3>
              <p className="text-muted-foreground">Privacy-first communication and report verification.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-14 md:py-20 relative z-10 bg-background">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 select-none">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="text-foreground">About </span>
              <span className="text-primary">BackTrack</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              BackTrack is a student-led initiative to solve campus lost-and-found. We connect
              people who are searching with people who have found items, helping everyone reunite
              with their belongings quickly.
            </p>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span>Locate items faster with category, date and location filters.</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span>Community-first approach with simple, privacy-safe messaging.</span>
              </li>
              <li className="flex items-start gap-3">
                <IndianRupee className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span>Transparent process with zero platform fees.</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            <img src={img2} alt="BackTrack students" className="w-full h-full object-cover" draggable={false} />
          </div>
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
                          <ChevronLeft className="h-5 w-5 text-primary opacity-50" />
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
                          <ChevronRight className="h-5 w-5 text-primary opacity-50" />
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
                      ? "w-8 bg-primary"
                      : "w-2 bg-primary/30"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-20 relative z-10 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
              <span className="text-foreground">Frequently Asked </span>
              <span className="text-primary">Questions</span>
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Get answers to common questions about using the BackTrack platform.
            </p>
            <div className="space-y-4">
              <details className="group rounded-xl border border-border bg-card px-5 py-4 open:bg-card/80 hover:shadow-md transition-all select-none">
                <summary className="cursor-pointer list-none text-foreground font-medium flex items-center justify-between">
                  How do I post a lost or found item?
                  <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="mt-3 text-muted-foreground">Go to Post Item, add the details and image. You can also use voice or image analysis to auto-fill fields.</p>
              </details>

              <details className="group rounded-xl border border-border bg-card px-5 py-4 open:bg-card/80 hover:shadow-md transition-all select-none">
                <summary className="cursor-pointer list-none text-foreground font-medium flex items-center justify-between">
                  Is BackTrack free to use?
                  <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="mt-3 text-muted-foreground">Yes. BackTrack is free for students. There are no platform fees.</p>
              </details>

              <details className="group rounded-xl border border-border bg-card px-5 py-4 open:bg-card/80 hover:shadow-md transition-all select-none">
                <summary className="cursor-pointer list-none text-foreground font-medium flex items-center justify-between">
                  How does verification work?
                  <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="mt-3 text-muted-foreground">Claimants provide verification details. Owners review and approve. Admin tools help in case of disputes.</p>
              </details>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div 
            className="rounded-2xl border p-10 md:p-12 text-center text-white"
            style={{
              background: darkMode 
                ? '#0A0A1A' 
                : 'linear-gradient(to right, #0892d0 0%, #4b0082 100%)',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : undefined,
              borderWidth: darkMode ? '1px' : undefined
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-3">Ready to get started?</h3>
            <p className="opacity-90 mb-8">Join BackTrack and help reunite items with their owners today.</p>
            <Button size="lg" onClick={handleGetStarted} className="bg-white text-black hover:bg-white/90 dark:text-black">
              {user ? "Get Started" : "Create an account"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Get Started Dialog */}
      <Dialog open={showGetStartedDialog} onOpenChange={setShowGetStartedDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">What would you like to do?</DialogTitle>
            <DialogDescription className="text-center">
              Choose an option to get started
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={() => handleDialogOption("lost")}
              variant="outline"
              className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg">You have lost?</div>
                  <div className="text-sm text-muted-foreground">Search for your lost items</div>
                </div>
              </div>
            </Button>
            <Button
              onClick={() => handleDialogOption("found")}
              variant="outline"
              className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg">You have found something?</div>
                  <div className="text-sm text-muted-foreground">Report a found item</div>
                </div>
              </div>
            </Button>
            <Button
              onClick={() => handleDialogOption("post")}
              variant="outline"
              className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg">Want to help by posting?</div>
                  <div className="text-sm text-muted-foreground">Post a lost or found item</div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
