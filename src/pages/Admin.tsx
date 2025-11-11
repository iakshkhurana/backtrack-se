import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Shield, 
  Package, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoaderOne } from "@/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Admin Panel Component
 * Provides comprehensive admin dashboard for managing the platform
 * Features:
 * - Dashboard with statistics
 * - Claims management (approve/reject)
 * - Items management (view/delete)
 * - Users management (view roles/update)
 */
const Admin = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Dashboard statistics
  const [stats, setStats] = useState({
    totalItems: 0,
    totalUsers: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
  });

  // Data for tables
  const [claims, setClaims] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Claim management
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [processingClaim, setProcessingClaim] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    checkAuthAndRole();
  }, []);

  /**
   * Check authentication and admin role
   * Redirects to auth page if not authenticated
   * Redirects to home if not admin
   */
  const checkAuthAndRole = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch user profile to check role
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        
        // If profile doesn't exist, try to create it
        if (profileError.code === "PGRST116") {
          console.log("Profile not found, creating one...");
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
              role: "user", // Default to user, admin needs to be set manually
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            toast.error(`Error creating profile: ${createError.message}`);
            navigate("/");
            return;
          }

          // Check if newly created profile has admin role
          if (newProfile.role !== "admin" && newProfile.role !== "moderator") {
            toast.error("Access denied. Admin privileges required. Please contact an administrator to grant you admin access.");
            console.log("User role:", newProfile.role);
            navigate("/");
            return;
          }

          setProfile(newProfile);
          setIsAdmin(true);
          await loadDashboardData();
          return;
        } else {
          toast.error(`Error loading profile: ${profileError.message}`);
          console.error("Profile error details:", profileError);
          navigate("/");
          return;
        }
      }

      if (!profileData) {
        toast.error("Profile not found. Please try signing out and back in.");
        navigate("/");
        return;
      }

      setProfile(profileData);

      // Check if user is admin or moderator
      if (profileData.role !== "admin" && profileData.role !== "moderator") {
        toast.error(`Access denied. Admin privileges required. Your current role: ${profileData.role || "user"}`);
        console.log("User role:", profileData.role);
        console.log("User ID:", session.user.id);
        console.log("User email:", session.user.email);
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error in checkAuthAndRole:", error);
      toast.error("Error loading admin panel");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all dashboard data
   * Fetches statistics, claims, items, and users
   */
  const loadDashboardData = async () => {
    await Promise.all([
      loadStats(),
      loadClaims(),
      loadItems(),
      loadUsers(),
    ]);
  };

  /**
   * Load dashboard statistics
   * Counts items, users, and claims by status
   */
  const loadStats = async () => {
    try {
      // Total items
      const { count: itemsCount } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true });

      // Total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Claims by status
      const { data: claimsData } = await supabase
        .from("claims")
        .select("status");

      const pendingCount = claimsData?.filter(c => c.status === "pending").length || 0;
      const approvedCount = claimsData?.filter(c => c.status === "approved").length || 0;
      const rejectedCount = claimsData?.filter(c => c.status === "rejected").length || 0;

      setStats({
        totalItems: itemsCount || 0,
        totalUsers: usersCount || 0,
        pendingClaims: pendingCount,
        approvedClaims: approvedCount,
        rejectedClaims: rejectedCount,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  /**
   * Load all claims with related data
   * Includes item and claimant information
   */
  const loadClaims = async () => {
    setLoadingClaims(true);
    try {
      // First, get all claims
      const { data: claimsData, error: claimsError } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (claimsError) {
        console.error("Error loading claims:", claimsError);
        throw claimsError;
      }

      if (!claimsData || claimsData.length === 0) {
        setClaims([]);
        setLoadingClaims(false);
        return;
      }

      // Get unique item IDs and claimant IDs
      const itemIds = [...new Set(claimsData.map(c => c.item_id))];
      const claimantIds = [...new Set(claimsData.map(c => c.claimant_id))];

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("id, title, description, category, status, location, user_id")
        .in("id", itemIds);

      if (itemsError) {
        console.warn("Error loading items for claims:", itemsError);
      }

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", claimantIds);

      if (profilesError) {
        console.warn("Error loading profiles for claims:", profilesError);
      }

      // Combine the data
      const claimsWithRelations = claimsData.map(claim => ({
        ...claim,
        items: itemsData?.find(item => item.id === claim.item_id) || null,
        profiles: profilesData?.find(profile => profile.id === claim.claimant_id) || null,
      }));

      setClaims(claimsWithRelations);
    } catch (error: any) {
      console.error("Error loading claims:", error);
      toast.error(`Error loading claims: ${error.message || "Unknown error"}`);
      setClaims([]);
    } finally {
      setLoadingClaims(false);
    }
  };

  /**
   * Load all items
   * Includes owner information
   */
  const loadItems = async () => {
    setLoadingItems(true);
    try {
      // First, get all items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (itemsError) {
        console.error("Error loading items:", itemsError);
        throw itemsError;
      }

      if (!itemsData || itemsData.length === 0) {
        setItems([]);
        setLoadingItems(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(itemsData.map(item => item.user_id))];

      // Fetch profiles for item owners
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) {
        console.warn("Error loading profiles for items:", profilesError);
      }

      // Combine the data
      const itemsWithProfiles = itemsData.map(item => ({
        ...item,
        profiles: profilesData?.find(profile => profile.id === item.user_id) || null,
      }));

      setItems(itemsWithProfiles);
    } catch (error: any) {
      console.error("Error loading items:", error);
      toast.error(`Error loading items: ${error.message || "Unknown error"}`);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  /**
   * Load all users with their profiles
   * Includes role information
   */
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Error loading users");
    } finally {
      setLoadingUsers(false);
    }
  };

  /**
   * Handle claim approval
   * Updates claim status to 'approved' and item claim_status to 'claimed'
   */
  const handleApproveClaim = async (claimId: string, itemId: string) => {
    setProcessingClaim(true);
    try {
      // Update claim status
      const { error: claimError } = await supabase
        .from("claims")
        .update({ status: "approved" })
        .eq("id", claimId);

      if (claimError) throw claimError;

      // Update item claim_status (trigger should handle this, but we'll do it explicitly)
      const { error: itemError } = await supabase
        .from("items")
        .update({ claim_status: "claimed" })
        .eq("id", itemId);

      if (itemError) {
        console.warn("Could not update item claim_status:", itemError);
      }

      toast.success("Claim approved successfully");
      setShowClaimDialog(false);
      setSelectedClaim(null);
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error approving claim:", error);
      toast.error(error.message || "Error approving claim");
    } finally {
      setProcessingClaim(false);
    }
  };

  /**
   * Handle claim rejection
   * Updates claim status to 'rejected' and item claim_status back to 'open'
   */
  const handleRejectClaim = async (claimId: string, itemId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessingClaim(true);
    try {
      // Update claim status with rejection reason
      const { error: claimError } = await supabase
        .from("claims")
        .update({ 
          status: "rejected",
          verification_details: `${selectedClaim?.verification_details || ""}\n\nRejection Reason: ${rejectionReason}`
        })
        .eq("id", claimId);

      if (claimError) throw claimError;

      // Update item claim_status back to 'open'
      const { error: itemError } = await supabase
        .from("items")
        .update({ claim_status: "open" })
        .eq("id", itemId);

      if (itemError) {
        console.warn("Could not update item claim_status:", itemError);
      }

      toast.success("Claim rejected");
      setShowClaimDialog(false);
      setSelectedClaim(null);
      setRejectionReason("");
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error rejecting claim:", error);
      toast.error(error.message || "Error rejecting claim");
    } finally {
      setProcessingClaim(false);
    }
  };

  /**
   * Handle item deletion
   * Deletes item and associated image from storage
   */
  const handleDeleteItem = async (itemId: string, imageUrl: string | null) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete image from storage if exists
      if (imageUrl && imageUrl.includes('item-images')) {
        const path = imageUrl.split('/item-images/')[1];
        await supabase.storage.from('item-images').remove([path]);
      }

      // Delete item from database
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item deleted successfully");
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error(error.message || "Error deleting item");
    }
  };

  /**
   * Handle user role update
   * Updates user role in profiles table
   */
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast.success("User role updated successfully");
      await loadUsers();
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast.error(error.message || "Error updating user role");
    }
  };

  /**
   * Get status badge variant
   * Returns appropriate badge style based on status
   */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      returned: "outline",
      open: "outline",
      claimed: "default",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} position="fixed" />
      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-end">
            <Button onClick={loadDashboardData} variant="outline">
              Refresh Data
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {stats.totalItems}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {stats.totalUsers}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Claims</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  {stats.pendingClaims}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Approved Claims</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {stats.approvedClaims}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rejected Claims</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  {stats.rejectedClaims}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different management sections */}
          <Tabs defaultValue="claims" className="space-y-4">
            <TabsList>
              <TabsTrigger value="claims">Claims Management</TabsTrigger>
              <TabsTrigger value="items">Items Management</TabsTrigger>
              <TabsTrigger value="users">Users Management</TabsTrigger>
            </TabsList>

            {/* Claims Management Tab */}
            <TabsContent value="claims" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Claims Management</CardTitle>
                  <CardDescription>
                    Review and manage item claim requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingClaims ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Claimant</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claims.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No claims found
                            </TableCell>
                          </TableRow>
                        ) : (
                          claims.map((claim) => (
                            <TableRow key={claim.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {claim.items?.title || "Unknown Item"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {claim.items?.category}
                                </div>
                              </TableCell>
                              <TableCell>
                                {claim.profiles?.full_name || "Unknown User"}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(claim.status)}
                              </TableCell>
                              <TableCell>
                                {format(new Date(claim.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                {claim.status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedClaim(claim);
                                        setShowClaimDialog(true);
                                      }}
                                    >
                                      Review
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Items Management Tab */}
            <TabsContent value="items" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Items Management</CardTitle>
                  <CardDescription>
                    View and manage all items in the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No items found
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.category}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={item.status === "found" ? "default" : "secondary"}>
                                    {item.status}
                                  </Badge>
                                  {getStatusBadge(item.claim_status || "open")}
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.profiles?.full_name || "Unknown"}
                              </TableCell>
                              <TableCell>
                                {format(new Date(item.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteItem(item.id, item.image_url)}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Management Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Users Management</CardTitle>
                  <CardDescription>
                    View and manage user roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((userProfile) => (
                            <TableRow key={userProfile.id}>
                              <TableCell className="font-medium">
                                {userProfile.full_name || "Unknown"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  userProfile.role === "admin" ? "default" :
                                  userProfile.role === "moderator" ? "secondary" : "outline"
                                }>
                                  {userProfile.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(userProfile.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={userProfile.role}
                                  onValueChange={(value) => handleUpdateUserRole(userProfile.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Claim Review Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Claim</DialogTitle>
            <DialogDescription>
              Review the claim details and approve or reject
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Item</Label>
                <div className="mt-1 p-2 bg-muted rounded">
                  <div className="font-medium">{selectedClaim.items?.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedClaim.items?.description}
                  </div>
                </div>
              </div>
              <div>
                <Label>Claimant</Label>
                <div className="mt-1 p-2 bg-muted rounded">
                  {selectedClaim.profiles?.full_name || "Unknown User"}
                </div>
              </div>
              <div>
                <Label>Verification Details</Label>
                <div className="mt-1 p-2 bg-muted rounded">
                  {selectedClaim.verification_details || "No details provided"}
                </div>
              </div>
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowClaimDialog(false);
                setSelectedClaim(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedClaim) {
                  handleRejectClaim(selectedClaim.id, selectedClaim.item_id);
                }
              }}
              disabled={processingClaim}
            >
              {processingClaim ? "Processing..." : "Reject"}
            </Button>
            <Button
              onClick={() => {
                if (selectedClaim) {
                  handleApproveClaim(selectedClaim.id, selectedClaim.item_id);
                }
              }}
              disabled={processingClaim}
            >
              {processingClaim ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;

