import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "./CategoryBadge";
import { MapPin, Calendar, User, Trash2, CheckCircle } from "lucide-react";
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
      const { error } = await supabase
        .from("claims")
        .insert({
          item_id: item.id,
          claimant_id: currentUserId,
          verification_details: verificationDetails,
          status: "pending",
        });

      if (error) throw error;

      toast.success("Claim request submitted successfully!");
      setShowClaimDialog(false);
      setVerificationDetails("");
    } catch (error: any) {
      toast.error(error.message || "Error submitting claim");
    } finally {
      setClaiming(false);
    }
  };

  const isOwner = currentUserId && currentUserId === item.user_id;
  const canClaim = currentUserId && !isOwner && item.status === "found";
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-card border-border/50">
      {item.image_url && (
        <div className="h-48 overflow-hidden">
          <img 
            src={item.image_url} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
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
            <User className="h-4 w-4" />
            <span>{item.contact_info}</span>
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
    </Card>
  );
};
