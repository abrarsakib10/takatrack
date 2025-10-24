import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface CategoryManagerProps {
  userId: string;
}

export const CategoryManager = ({ userId }: CategoryManagerProps) => {
  const { toast } = useToast();
  const [inflowCategories, setInflowCategories] = useState<Category[]>([]);
  const [outflowCategories, setOutflowCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [activeTab, setActiveTab] = useState<"inflow" | "outflow">("outflow");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    const inflows = data?.filter(cat => cat.type === "inflow") || [];
    const outflows = data?.filter(cat => cat.type === "outflow") || [];
    
    setInflowCategories(inflows);
    setOutflowCategories(outflows);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: newCategoryName.trim(),
        type: activeTab,
      });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Category added successfully!",
    });

    setNewCategoryName("");
    fetchCategories();
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete category. It may be in use by existing transactions.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `"${categoryName}" deleted successfully!`,
    });

    fetchCategories();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>Add or remove categories for your transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inflow" | "outflow")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="outflow">Expenses</TabsTrigger>
            <TabsTrigger value="inflow">Income</TabsTrigger>
          </TabsList>

          <TabsContent value="outflow" className="space-y-4">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="New expense category..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {outflowCategories.map((category) => (
                <Badge key={category.id} variant="destructive" className="text-sm px-3 py-1 flex items-center gap-2">
                  {category.name}
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="hover:text-destructive-foreground/80"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inflow" className="space-y-4">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="New income category..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {inflowCategories.map((category) => (
                <Badge key={category.id} className="bg-success hover:bg-success/80 text-sm px-3 py-1 flex items-center gap-2">
                  {category.name}
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="hover:opacity-80"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
