import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "./CategoryBadge";
import { MapPin, Calendar, User, Trash2, CheckCircle, Maximize2, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    status: string;
    location: string | null;
    date_reported: string;
    image_url: string | null;
    contact_info: string | null;
    user_id: string;
  };
  currentUserId?: string;
  onDelete?: () => void;
}

export const ItemCard = ({ item, currentUserId, onDelete }: ItemCardProps) => {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState("");
  // State for full-screen image viewer
  const [showImageFullscreen, setShowImageFullscreen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete image from storage if exists
      if (item.image_url && item.image_url.includes('item-images')) {
        const path = item.image_url.split('/item-images/')[1];
        await supabase.storage.from('item-images').remove([path]);
      }

      // Delete item from database
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Item deleted successfully");
      onDelete?.();
    } catch (error: any) {
      toast.error(error.message || "Error deleting item");
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Handle claim submission
   * Creates a claim record in the claims table with verification details
   * Also updates the item's claim_status to 'pending' if not already set
   */
  const handleClaim = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to claim items");
      return;
    }

    if (!verificationDetails.trim()) {
      toast.error("Please provide verification details");
      return;
    }

    setClaiming(true);
    try {
      // Check if claim already exists
      const { data: existingClaim } = await supabase
        .from("claims")
        .select("id, status")
        .eq("item_id", item.id)
        .eq("claimant_id", currentUserId)
        .single();

      if (existingClaim) {
        toast.error("You have already submitted a claim for this item");
        setShowClaimDialog(false);
        setVerificationDetails("");
        setClaiming(false);
        return;
      }

      // Insert new claim
      const { data: claimData, error: claimError } = await supabase
        .from("claims")
        .insert({
          item_id: item.id,
          claimant_id: currentUserId,
          verification_details: verificationDetails.trim(),
          status: "pending",
        })
        .select()
        .single();

      if (claimError) {
        console.error("Claim error:", claimError);
        // Check for specific error types
        if (claimError.code === "23505") {
          toast.error("You have already submitted a claim for this item");
        } else if (claimError.code === "42501") {
          toast.error("Permission denied. Please check your account permissions.");
        } else {
          toast.error(claimError.message || "Error submitting claim. Please try again.");
        }
        return;
      }

      // Update item claim_status to 'pending' if it's currently 'open'
      if (claimData) {
        const { error: updateError } = await supabase
          .from("items")
          .update({ claim_status: "pending" })
          .eq("id", item.id)
          .eq("claim_status", "open"); // Only update if currently 'open'

        if (updateError) {
          console.warn("Could not update item claim_status:", updateError);
          // Don't fail the claim if this update fails
        }
      }

      toast.success("Claim request submitted successfully!");
      setShowClaimDialog(false);
      setVerificationDetails("");
    } catch (error: any) {
      console.error("Unexpected error in handleClaim:", error);
      toast.error(error.message || "Error submitting claim. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  const isOwner = currentUserId && currentUserId === item.user_id;
  const canClaim = currentUserId && !isOwner && item.status === "found";
  
  /**
   * Parse contact info to extract name and phone number
   * Format: "NAME-PHONENUMBER" or just phone/email
   */
  const parseContactInfo = (contactInfo: string | null) => {
    if (!contactInfo) return { name: null, contact: null };
    
    // Check if format is "NAME-PHONENUMBER"
    if (contactInfo.includes('-')) {
      const parts = contactInfo.split('-');
      if (parts.length >= 2) {
        const name = parts.slice(0, -1).join('-').trim();
        const phone = parts[parts.length - 1].trim();
        return { name, contact: phone };
      }
    }
    
    // If no dash, treat as single contact (phone or email)
    return { name: null, contact: contactInfo };
  };

  const contactInfo = parseContactInfo(item.contact_info);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-card border-border/50">
      {item.image_url && (
        <div className="h-48 overflow-hidden relative group cursor-pointer" onClick={() => setShowImageFullscreen(true)}>
          <img 
            src={item.image_url} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Overlay with expand icon on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="text-xl">{item.title}</CardTitle>
              <CategoryBadge category={item.category} />
            </div>
            {item.description && (
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            )}
          </div>
          {isOwner && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                title="Delete Item"
                description="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                isLoading={deleting}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {item.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(item.date_reported), 'PPP')}</span>
        </div>
        {item.contact_info && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              {contactInfo.name && (
                <span className="font-medium">{contactInfo.name}</span>
              )}
              {contactInfo.contact && (
                <span className={contactInfo.name ? "text-xs" : ""}>{contactInfo.contact}</span>
              )}
            </div>
          </div>
        )}
        {canClaim && (
          <Button
            onClick={() => setShowClaimDialog(true)}
            className="w-full mt-4"
            variant="default"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Claim This Item
          </Button>
        )}
      </CardContent>

      {/* Claim Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Item</DialogTitle>
            <DialogDescription>
              Provide details to verify that this item belongs to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verification">Verification Details</Label>
              <Textarea
                id="verification"
                placeholder="Describe the item and provide any identifying details..."
                value={verificationDetails}
                onChange={(e) => setVerificationDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleClaim} disabled={claiming || !verificationDetails.trim()}>
              {claiming ? "Submitting..." : "Submit Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Image Viewer Dialog */}
      <Dialog open={showImageFullscreen} onOpenChange={setShowImageFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowImageFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white border border-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Full-screen image */}
            {item.image_url && (
              <img 
                src={item.image_url} 
                alt={item.title}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
