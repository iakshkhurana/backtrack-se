import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { ItemCard } from "@/components/ItemCard";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Lost = () => {
  // Default to light mode
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchLostItems();

    return () => subscription.unsubscribe();
  }, []);


  /**
   * Fetch lost items from the database
   * Includes claim_status field to show claimed status
   * Optimized query with only necessary fields
   */
  const fetchLostItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("id, title, description, category, location, date_reported, image_url, user_id, claim_status, status, contact_info")
        .eq("status", "lost")
        .order("date_reported", { ascending: false });

      if (!error && data) {
        setItems(data);
      } else if (error) {
        console.error("Error fetching lost items:", error);
      }
    } catch (error) {
      console.error("Error fetching lost items:", error);
    }
  };

  /**
   * Filter and sort items
   * Filters by category and search query, then sorts so claimed items appear at the end
   * Optimized for performance - uses efficient single-pass filtering and sorting
   */
  const filterItems = useMemo(() => {
    // Early return if no items
    if (items.length === 0) {
      return [];
    }

    let filtered = items;

    // Apply category filter first (most selective)
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply search query filter
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower)
      );
    }

    // Optimized single-pass sort: unclaimed first, then claimed, both by date
    // Pre-compute date timestamps for faster comparison
    const itemsWithTimestamps = filtered.map(item => ({
      item,
      timestamp: new Date(item.date_reported).getTime(),
      isClaimed: item.claim_status === "claimed"
    }));

    // Single sort pass: unclaimed items first (isClaimed=false), then by date
    itemsWithTimestamps.sort((a, b) => {
      // If one is claimed and the other isn't, unclaimed comes first
      if (a.isClaimed !== b.isClaimed) {
        return a.isClaimed ? 1 : -1;
      }
      // Both have same claim status, sort by date (newest first)
      return b.timestamp - a.timestamp;
    });

    // Extract items from sorted array
    return itemsWithTimestamps.map(entry => entry.item);
  }, [items, categoryFilter, searchQuery]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !darkMode ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Full page gradient background */}
      <div className="fixed inset-0 z-0 bg-purple-950/10 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />
      
      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-9 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
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

        {filterItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No lost items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterItems.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                currentUserId={user?.id}
                currentUserEmail={user?.email}
                onDelete={fetchLostItems}
                onUpdate={fetchLostItems}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lost;
