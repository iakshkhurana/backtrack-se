import { Badge } from "@/components/ui/badge";

interface CategoryBadgeProps {
  category: string;
}

const categoryColors: Record<string, string> = {
  phone: "bg-category-phone text-white",
  keys: "bg-category-keys text-white",
  stationery: "bg-category-stationery text-white",
  electronics: "bg-category-electronics text-white",
  wallet: "bg-category-wallet text-white",
  clothing: "bg-category-clothing text-white",
  other: "bg-category-other text-white",
};

export const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  return (
    <Badge className={`${categoryColors[category] || categoryColors.other} capitalize`}>
      {category}
    </Badge>
  );
};
