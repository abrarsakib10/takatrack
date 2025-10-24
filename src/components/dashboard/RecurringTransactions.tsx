import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RecurringTransaction {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  type: "inflow" | "outflow";
  frequency: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  last_generated: string | null;
}

interface RecurringTransactionsProps {
  userId: string;
}

export const RecurringTransactions = ({ userId }: RecurringTransactionsProps) => {
  const { toast } = useToast();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string; type: string }[]>([]);
  
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    type: "outflow" as "inflow" | "outflow",
    frequency: "monthly",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
  });

  useEffect(() => {
    fetchRecurring();
    fetchCategories();
  }, [userId]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId);
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchRecurring = async () => {
    const { data, error } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      setRecurring(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date range if end_date is provided
    if (formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast({
        variant: "destructive",
        title: "Invalid date range",
        description: "Start date must be before end date",
      });
      return;
    }

    // Validate amount
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount >= 1000000000) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount between 0.01 and 999,999,999",
      });
      return;
    }

    const { error } = await supabase
      .from("recurring_transactions")
      .insert({
        user_id: userId,
        amount: parsedAmount,
        category: formData.category,
        description: formData.description || null,
        type: formData.type,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        is_active: true,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Recurring transaction created",
      });
      setIsOpen(false);
      setFormData({
        amount: "",
        category: "",
        description: "",
        type: "outflow",
        frequency: "monthly",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
      });
      fetchRecurring();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      fetchRecurring();
    }
  };

  const deleteRecurring = async (id: string) => {
    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Recurring transaction deleted",
      });
      fetchRecurring();
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recurring Transactions
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Recurring Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "inflow" | "outflow") => 
                    setFormData({ ...formData, type: value, category: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inflow">Inflow</SelectItem>
                    <SelectItem value="outflow">Outflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recurring.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No recurring transactions yet
            </p>
          ) : (
            recurring.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.category}</span>
                    <span className={`text-sm ${item.type === "inflow" ? "text-green-600" : "text-red-600"}`}>
                      ${item.amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.frequency} • Starts {new Date(item.start_date).toLocaleDateString()}
                    {item.description && ` • ${item.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => toggleActive(item.id, item.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRecurring(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};