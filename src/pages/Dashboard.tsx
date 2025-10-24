import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BalanceCards } from "@/components/dashboard/BalanceCards";
import { TransactionForm } from "@/components/dashboard/TransactionForm";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { BudgetManager } from "@/components/dashboard/BudgetManager";
import { FeedbackDialog } from "@/components/dashboard/FeedbackDialog";
import { RecurringTransactions } from "@/components/dashboard/RecurringTransactions";
import { BudgetAlerts } from "@/components/dashboard/BudgetAlerts";
import { ExportTransactions } from "@/components/dashboard/ExportTransactions";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { Loader2 } from "lucide-react";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string | null;
  type: "inflow" | "outflow";
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [budgets, setBudgets] = useState<any[]>([]);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchTransactions = async () => {
    if (!session?.user) return;
    
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchBudgets = async () => {
    if (!session?.user) return;
    
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", session.user.id);

    if (!error && data) {
      setBudgets(data);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTransactions();
      fetchBudgets();
    }
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleTransactionAdded = () => {
    fetchTransactions();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate totals
  const totalInflows = transactions
    .filter(t => t.type === "inflow")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOutflows = transactions
    .filter(t => t.type === "outflow")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalInflows - totalOutflows;

  // Calculate current month totals
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const currentMonthTransactions = transactions.filter(
    t => t.date >= currentMonthStart && t.date <= currentMonthEnd
  );

  const currentMonthInflows = currentMonthTransactions
    .filter(t => t.type === "inflow")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const currentMonthOutflows = currentMonthTransactions
    .filter(t => t.type === "outflow")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate previous month balance for comparison
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const prevMonthTransactions = transactions.filter(
    t => t.date >= prevMonthStart && t.date <= prevMonthEnd
  );

  const prevMonthBalance = prevMonthTransactions
    .filter(t => t.type === "inflow")
    .reduce((sum, t) => sum + Number(t.amount), 0) -
    prevMonthTransactions
    .filter(t => t.type === "outflow")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5">
      <DashboardHeader onSignOut={handleSignOut} userEmail={session?.user?.email} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <FeedbackDialog userId={session?.user?.id || ""} userEmail={session?.user?.email} />
          <div className="flex gap-2">
            <ExportTransactions transactions={transactions} />
            <Button onClick={() => navigate("/monthly-overview")} variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Monthly Overview
            </Button>
          </div>
        </div>

        <BudgetAlerts budgets={budgets} transactions={transactions} />

        <BalanceCards
          balance={balance}
          totalInflows={totalInflows}
          totalOutflows={totalOutflows}
          currentMonthInflows={currentMonthInflows}
          currentMonthOutflows={currentMonthOutflows}
          previousMonthBalance={prevMonthBalance}
        />
        
        <TransactionForm
          userId={session?.user?.id || ""}
          onTransactionAdded={handleTransactionAdded}
        />

        <RecurringTransactions userId={session?.user?.id || ""} />

        <CategoryManager userId={session?.user?.id || ""} />

        <BudgetManager userId={session?.user?.id || ""} transactions={transactions} />
        
        <TransactionList
          transactions={transactions}
          isRefreshing={isRefreshing}
          onRefresh={fetchTransactions}
          userId={session?.user?.id || ""}
        />
      </main>
    </div>
  );
};

export default Dashboard;
