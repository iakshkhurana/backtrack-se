import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User as UserIcon, Mail, Calendar, Package, MessageSquare, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoaderOne } from "@/components/ui/loader";

const Profile = () => {
  // Default to light mode
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      // Default to light mode
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchStats(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user.id);
        fetchStats(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
            })
            .select()
            .single();

          if (!createError && newProfile) {
            setProfile(newProfile);
            setFormData({
              full_name: newProfile.full_name || "",
              bio: newProfile.bio || "",
            });
          }
        } else {
          toast.error("Error fetching profile");
        }
      } else if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          bio: data.bio || "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Error fetching profile");
    } finally {
      // Ensure loader shows for at least 2 seconds
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 2000; // 2 seconds
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_dashboard_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      fetchProfile(user.id);
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setUpdating(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !darkMode ? "dark" : "light");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} position="fixed" />
        <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center min-h-[60vh]">
          <LoaderOne />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} position="fixed" />
      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Lost Items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.lost_items_count || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Found Items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.found_items_count || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Successful Claims</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.successful_claims_count || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Unread Messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.unread_messages_count || 0}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={updating}>
                {updating ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" onClick={() => navigate("/post")}>
                  <Package className="mr-2 h-4 w-4" />
                  Post Item
                </Button>
                <Button variant="outline" onClick={() => navigate("/lost")}>
                  <Package className="mr-2 h-4 w-4" />
                  Lost Items
                </Button>
                <Button variant="outline" onClick={() => navigate("/found")}>
                  <Package className="mr-2 h-4 w-4" />
                  Found Items
                </Button>
                <Button variant="outline" disabled>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;

