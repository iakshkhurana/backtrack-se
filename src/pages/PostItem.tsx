import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Upload, X } from "lucide-react";

const itemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  category: z.enum(["phone", "keys", "stationery", "electronics", "wallet", "clothing", "other"]),
  status: z.enum(["lost", "found"]),
  location: z.string().max(200).optional(),
  contact_info: z.string().max(200),
});

const PostItem = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "",
    location: "",
    contact_info: "",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !darkMode ? "dark" : "light");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!uploadedImage || !user) return null;

    const fileExt = uploadedImage.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('item-images')
      .upload(fileName, uploadedImage);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be signed in to post items");
      return;
    }

    try {
      const validatedData = itemSchema.parse(formData);
      setLoading(true);

      // Upload image if one was selected
      let imageUrl: string | null = null;
      if (uploadedImage) {
        imageUrl = await uploadImage();
      }

      const { error } = await supabase.from("items").insert([
        {
          title: validatedData.title,
          description: validatedData.description || null,
          category: validatedData.category,
          status: validatedData.status,
          location: validatedData.location || null,
          contact_info: validatedData.contact_info,
          image_url: imageUrl,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Item posted successfully!");
      navigate(formData.status === "lost" ? "/lost" : "/found");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error posting item");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Post an Item</CardTitle>
            <CardDescription>
              Report a lost item or list something you've found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status">Item Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="found">Found</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Item Name *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Blue iPhone 13"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="keys">Keys</SelectItem>
                    <SelectItem value="stationery">Stationery</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the item..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Where was it lost/found?"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_info">Contact Information *</Label>
                <Input
                  id="contact_info"
                  placeholder="Email or phone number"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Item Image (optional)</Label>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <Label
                        htmlFor="image"
                        className="cursor-pointer text-sm text-muted-foreground hover:text-primary"
                      >
                        Click to upload image (max 5MB)
                      </Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Posting..." : "Post Item"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostItem;
