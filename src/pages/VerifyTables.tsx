import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const VerifyTables = () => {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const tables = [
    { name: "profiles", description: "User profiles table" },
    { name: "claims", description: "Item claims table" },
    { name: "conversations", description: "Conversations table" },
    { name: "messages", description: "Messages table" },
    { name: "notifications", description: "Notifications table" },
    { name: "matches", description: "Item matches table" },
  ];

  const checkTable = async (tableName: string) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .select("count", { count: "exact", head: true });

      return !error;
    } catch (error) {
      return false;
    }
  };

  const verifyAllTables = async () => {
    setChecking(true);
    const newResults: Record<string, boolean> = {};

    for (const table of tables) {
      const exists = await checkTable(table.name);
      newResults[table.name] = exists;
    }

    setResults(newResults);
    setChecking(false);

    const allExist = Object.values(newResults).every((exists) => exists);
    if (allExist) {
      toast.success("All tables exist! ✅");
    } else {
      toast.error("Some tables are missing. Please run the SQL schema.");
    }
  };

  useEffect(() => {
    verifyAllTables();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Verify Database Tables</h1>
          <Button onClick={verifyAllTables} disabled={checking}>
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Table Status</CardTitle>
            <CardDescription>
              Check if all high-priority feature tables exist in your Supabase database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tables.map((table) => {
                const exists = results[table.name];
                const isLoading = checking && exists === undefined;

                return (
                  <div
                    key={table.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : exists ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-semibold">{table.name}</div>
                        <div className="text-sm text-muted-foreground">{table.description}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {isLoading ? "Checking..." : exists ? "✅ Exists" : "❌ Missing"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              If any tables are missing:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open Supabase Dashboard → SQL Editor</li>
              <li>Copy the contents of <code className="bg-muted px-1 rounded">DOCUMENTATION/High-Priority-Features-Schema.sql</code></li>
              <li>Paste into SQL Editor and click Run</li>
              <li>Refresh this page to verify</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyTables;

