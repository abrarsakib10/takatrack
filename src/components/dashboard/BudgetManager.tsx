import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BudgetManagerProps {
  userId: string;
  transactions: any[];
}

interface Budget {
  id: string;
  category: string;
  type: "inflow" | "outflow";
  planned_amount: number;
  period_start: string;
  period_end: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export const BudgetManager = ({ userId, transactions }: BudgetManagerProps) => {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [budgetType, setBudgetType] = useState<"inflow" | "outflow">("outflow");
  const [category, setCategory] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split("T")[0]);
  const [periodEnd, setPeriodEnd] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [userId]);

  const fetchBudgets = async () => {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching budgets:", error);
      return;
    }

    setBudgets((data || []) as Budget[]);
  };

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

    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate date range
      if (new Date(periodStart) >= new Date(periodEnd)) {
        toast({
          variant: "destructive",
          title: "Invalid date range",
          description: "Period start must be before period end",
        });
        setIsLoading(false);
        return;
      }

      // Validate amount
      const amount = parseFloat(plannedAmount);
      if (isNaN(amount) || amount <= 0 || amount >= 1000000000) {
        toast({
          variant: "destructive",
          title: "Invalid amount",
          description: "Please enter a valid amount between 0.01 and 999,999,999",
        });
        setIsLoading(false);
        return;
      }

      // Check for overlapping budgets
      const { data: existing } = await supabase
        .from("budgets")
        .select("*")
        .eq("category", category)
        .eq("type", budgetType)
        .eq("user_id", userId)
        .or(`and(period_start.lte.${periodEnd},period_end.gte.${periodStart})`);

      if (existing && existing.length > 0) {
        toast({
          variant: "destructive",
          title: "Overlapping budget",
          description: "A budget already exists for this category in this period",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("budgets").insert({
        user_id: userId,
        category,
        type: budgetType,
        planned_amount: amount,
        period_start: periodStart,
        period_end: periodEnd,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Budget created successfully.",
      });

      setCategory("");
      setPlannedAmount("");
      setIsDialogOpen(false);
      fetchBudgets();
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

  const handleDelete = async (budgetId: string) => {
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", budgetId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Budget deleted successfully.",
      });

      fetchBudgets();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const calculateActual = (budget: Budget) => {
    return transactions
      .filter(
        (t) =>
          t.type === budget.type &&
          t.category === budget.category &&
          t.date >= budget.period_start &&
          t.date <= budget.period_end
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getProgressColor = (actual: number, planned: number) => {
    const percentage = (actual / planned) * 100;
    if (percentage > 100) return "bg-destructive";
    if (percentage > 80) return "bg-yellow-500";
    return "bg-success";
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budget Tracking</CardTitle>
            <CardDescription>Monitor your planned vs actual spending</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Budget</DialogTitle>
                <DialogDescription>Set a budget for a specific category and period</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={budgetType} onValueChange={(value: any) => setBudgetType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outflow">Expense</SelectItem>
                      <SelectItem value="inflow">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.type === budgetType)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Planned Amount (৳)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={plannedAmount}
                    onChange={(e) => setPlannedAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Budget"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No budgets created yet. Click "Add Budget" to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const actual = calculateActual(budget);
              const percentage = Math.min((actual / budget.planned_amount) * 100, 100);
              const difference = actual - budget.planned_amount;
              const differencePercentage = ((difference / budget.planned_amount) * 100).toFixed(1);

              return (
                <div key={budget.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {budget.type === "inflow" ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-semibold">{budget.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(budget.period_start).toLocaleDateString()} -{" "}
                          {new Date(budget.period_end).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        ৳{actual.toFixed(2)} of ৳{budget.planned_amount.toFixed(2)}
                      </span>
                      <span className="font-medium">{percentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={percentage} className={getProgressColor(actual, budget.planned_amount)} />
                    <p className={`text-sm ${difference > 0 ? "text-destructive" : "text-success"}`}>
                      {difference > 0 ? "Over" : "Under"} budget by ৳{Math.abs(difference).toFixed(2)} (
                      {differencePercentage}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};