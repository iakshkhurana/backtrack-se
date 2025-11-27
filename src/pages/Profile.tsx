import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User as UserIcon, Mail, Calendar, Package, MessageSquare, Bell, Camera, X, CheckCircle2, Clock } from "lucide-react";
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
  const [claimRequests, setClaimRequests] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
  });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        fetchClaimRequests(session.user.id);
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
        fetchClaimRequests(session.user.id);
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
        
        // Set profile photo: priority: avatar_url > Google photo > null
        if (data.avatar_url) {
          setProfilePhoto(data.avatar_url);
        } else if (user?.user_metadata?.avatar_url || user?.user_metadata?.picture) {
          setProfilePhoto(user.user_metadata.avatar_url || user.user_metadata.picture);
        } else {
          setProfilePhoto(null);
        }
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

  /**
   * Fetch claim requests for user's items
   * Shows all pending claims for items owned by the user
   */
  const fetchClaimRequests = async (userId: string) => {
    setLoadingClaims(true);
    try {
      // Get all items owned by this user
      const { data: userItems, error: itemsError } = await supabase
        .from("items")
        .select("id")
        .eq("user_id", userId);

      if (itemsError || !userItems || userItems.length === 0) {
        setClaimRequests([]);
        return;
      }

      const userItemIds = userItems.map(item => item.id);

      // Get all pending claims for these items
      const { data: claimsData, error } = await supabase
        .from("claims")
        .select(`
          id,
          item_id,
          claimant_id,
          verification_details,
          status,
          created_at,
          items:item_id (
            id,
            title,
            status,
            category
          )
        `)
        .in("item_id", userItemIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching claims:", error);
        setClaimRequests([]);
        return;
      }

      if (claimsData && claimsData.length > 0) {
        // Get claimant profiles for all unique claimant IDs
        const claimantIds = [...new Set(claimsData.map((claim: any) => claim.claimant_id))];
        
        const { data: claimantProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", claimantIds);

        // Create a map for quick lookup
        const profileMap = new Map();
        if (claimantProfiles) {
          claimantProfiles.forEach((profile: any) => {
            profileMap.set(profile.id, profile);
          });
        }

        // Combine claims with profile data
        const claimsWithProfiles = claimsData.map((claim: any) => {
          const profile = profileMap.get(claim.claimant_id);
          return {
            ...claim,
            profiles: profile || { full_name: "Unknown User" }
          };
        });

        setClaimRequests(claimsWithProfiles);
      } else {
        setClaimRequests([]);
      }
    } catch (error) {
      console.error("Error fetching claim requests:", error);
      setClaimRequests([]);
    } finally {
      setLoadingClaims(false);
    }
  };

  /**
   * Handle profile photo upload
   * Uploads photo to Supabase storage and updates profile
   */
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2097152) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Delete old photo if exists
      if (profilePhoto && profilePhoto.includes('profile-photos')) {
        const oldPath = profilePhoto.split('/profile-photos/')[1];
        await supabase.storage.from('profile-photos').remove([oldPath]);
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update profile with new photo URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfilePhoto(publicUrl);
      toast.success("Profile photo updated successfully");
      
      // Refresh profile data
      await fetchProfile(user.id);
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error(error.message || "Error uploading profile photo");
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Handle profile photo removal
   * Removes photo from storage and profile
   */
  const handleRemovePhoto = async () => {
    if (!user || !profilePhoto) return;

    setUploadingPhoto(true);
    try {
      // Delete from storage if it's in our storage
      if (profilePhoto.includes('profile-photos')) {
        const path = profilePhoto.split('/profile-photos/')[1];
        await supabase.storage.from('profile-photos').remove([path]);
      }

      // Update profile to remove avatar_url
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) throw error;

      setProfilePhoto(null);
      toast.success("Profile photo removed");
      
      // Refresh profile data
      await fetchProfile(user.id);
    } catch (error: any) {
      console.error("Error removing photo:", error);
      toast.error(error.message || "Error removing profile photo");
    } finally {
      setUploadingPhoto(false);
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
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center gap-4 pb-4 border-b">
                <div className="relative">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Profile" 
                      className="h-24 w-24 rounded-full object-cover border-4 border-primary/20"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
                      <UserIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {profilePhoto && user?.app_metadata?.provider !== 'google' && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2">
                  {user?.app_metadata?.provider !== 'google' && (
                    <>
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={uploadingPhoto}
                        >
                          <span>
                            <Camera className="mr-2 h-4 w-4" />
                            {uploadingPhoto ? "Uploading..." : profilePhoto ? "Change Photo" : "Upload Photo"}
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    {user?.app_metadata?.provider === 'google' 
                      ? "Using Google profile picture. Upload disabled for Google accounts." 
                      : "JPG, PNG or WEBP (max 2MB)"}
                  </p>
                  {user?.app_metadata?.provider === 'google' && (
                    <p className="text-xs text-muted-foreground text-center">
                      To change your photo, update it in your Google account.
                    </p>
                  )}
                </div>
              </div>

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

          {/* Claim Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Claim Requests
              </CardTitle>
              <CardDescription>View who has requested to claim your items</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClaims ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading claim requests...
                </div>
              ) : claimRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending claim requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claimRequests.map((claim: any) => (
                    <Card key={claim.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">
                                {claim.items?.title || "Item"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Category: {claim.items?.category || "N/A"} • Status: {claim.items?.status || "N/A"}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                              Pending
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                <span className="font-medium">
                                  {claim.profiles?.full_name || "Unknown User"}
                                </span>
                                {" "}requested to claim this item
                              </span>
                            </div>
                            
                            {claim.verification_details && (
                              <div className="mt-2 p-3 bg-muted rounded-md">
                                <p className="text-xs font-medium mb-1">Verification Details:</p>
                                <p className="text-sm">{claim.verification_details}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Requested on {new Date(claim.created_at).toLocaleDateString()} at {new Date(claim.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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

