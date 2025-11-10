import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const variantStyles = {
    default: {
      icon: Info,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      button: "bg-primary hover:bg-primary/90",
    },
    destructive: {
      icon: Trash2,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/10",
      button: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-yellow-600 dark:text-yellow-400",
      iconBg: "bg-yellow-500/10",
      button: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    info: {
      icon: Info,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      button: "bg-primary hover:bg-primary/90 text-white",
    },
    success: {
      icon: CheckCircle2,
      iconColor: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-500/10",
      button: "bg-green-500 hover:bg-green-600 text-white",
    },
  };

  const currentVariant = variantStyles[variant];
  const Icon = currentVariant.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px] border-border/50 bg-card shadow-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", currentVariant.iconBg)}>
              <Icon className={cn("h-6 w-6", currentVariant.iconColor)} />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl font-semibold text-foreground">
                {title}
              </AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel
            disabled={isLoading}
            className="mt-0 sm:mt-0"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "transition-all duration-200",
              currentVariant.button,
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

