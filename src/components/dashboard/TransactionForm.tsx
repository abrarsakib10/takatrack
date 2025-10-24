import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";

interface TransactionFormProps {
  userId: string;
  onTransactionAdded: () => void;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export const TransactionForm = ({ userId, onTransactionAdded }: TransactionFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<"inflow" | "outflow">("outflow");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, [transactionType, userId]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .eq("type", transactionType)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate date range
      const transactionDate = new Date(date);
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
      const minDate = new Date('2000-01-01');

      if (transactionDate > maxFutureDate) {
        toast({
          variant: "destructive",
          title: "Invalid date",
          description: "Transaction date cannot be more than 1 year in the future",
        });
        setIsLoading(false);
        return;
      }

      if (transactionDate < minDate) {
        toast({
          variant: "destructive",
          title: "Invalid date",
          description: "Transaction date cannot be before year 2000",
        });
        setIsLoading(false);
        return;
      }

      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount >= 1000000000) {
        toast({
          variant: "destructive",
          title: "Invalid amount",
          description: "Please enter a valid amount between 0.01 and 999,999,999",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        date,
        amount: parsedAmount,
        category,
        description: description || null,
        type: transactionType,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Transaction added successfully.",
      });

      // Reset form
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      
      onTransactionAdded();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && amount && category) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
        <CardDescription>Record your income or expense</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          <Tabs
            value={transactionType}
            onValueChange={(value) => {
              setTransactionType(value as "inflow" | "outflow");
              setCategory(""); // Reset category when switching types
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="outflow" className="data-[state=active]:bg-destructive/10">
                Outflow
              </TabsTrigger>
              <TabsTrigger value="inflow" className="data-[state=active]:bg-success/10">
                Inflow
              </TabsTrigger>
            </TabsList>

            <TabsContent value={transactionType} className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (৳)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes about this transaction..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !category}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add {transactionType === "inflow" ? "Income" : "Expense"}
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  );
};
