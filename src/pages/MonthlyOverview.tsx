import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ExportTransactions } from "@/components/dashboard/ExportTransactions";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string | null;
  type: "inflow" | "outflow";
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const MonthlyOverview = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<"monthly" | "custom">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: firstDay, to: lastDay };
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      if (viewMode === "monthly") {
        fetchMonthlyTransactions();
      } else {
        fetchCustomRangeTransactions();
      }
    }
  }, [user, selectedMonth, dateRange, viewMode]);

  const fetchMonthlyTransactions = async () => {
    if (!user) return;

    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      return;
    }

    setTransactions(data || []);
  };

  const fetchCustomRangeTransactions = async () => {
    if (!user || !dateRange?.from || !dateRange?.to) return;

    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = format(dateRange.to, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      return;
    }

    setTransactions(data || []);
  };

  const calculateStats = () => {
    const inflows = transactions.filter(t => t.type === "inflow");
    const outflows = transactions.filter(t => t.type === "outflow");

    const totalInflow = inflows.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalOutflow = outflows.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalInflow - totalOutflow;

    return { totalInflow, totalOutflow, balance };
  };

  const getCategoryData = (type: string) => {
    const filtered = transactions.filter(t => t.type === type);
    const categoryMap = new Map<string, number>();

    filtered.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + Number(t.amount));
    });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { totalInflow, totalOutflow, balance } = calculateStats();
  const inflowData = getCategoryData("inflow");
  const outflowData = getCategoryData("outflow");
  const monthOptions = generateMonthOptions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Monthly Overview</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("monthly")}
            >
              Monthly View
            </Button>
            <Button
              variant={viewMode === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("custom")}
            >
              Custom Range
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <ExportTransactions 
              transactions={transactions} 
              dateRange={
                dateRange?.from && dateRange?.to
                  ? { start: format(dateRange.from, "yyyy-MM-dd"), end: format(dateRange.to, "yyyy-MM-dd") }
                  : undefined
              }
            />
            {viewMode === "monthly" ? (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Income</CardDescription>
              <CardTitle className="text-3xl text-success">৳{totalInflow.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
              <CardTitle className="text-3xl text-destructive">৳{totalOutflow.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net Balance</CardDescription>
              <CardTitle className={`text-3xl ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                ৳{balance.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Income by Category</CardTitle>
              <CardDescription>Breakdown of income sources</CardDescription>
            </CardHeader>
            <CardContent>
              {inflowData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={inflowData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {inflowData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `৳${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No income data for this month</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>Breakdown of spending</CardDescription>
            </CardHeader>
            <CardContent>
              {outflowData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={outflowData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {outflowData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `৳${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No expense data for this month</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses Comparison</CardTitle>
            <CardDescription>Side-by-side category comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {(inflowData.length > 0 || outflowData.length > 0) ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[
                    { name: 'Income', amount: totalInflow },
                    { name: 'Expenses', amount: totalOutflow }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `৳${value.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#8884d8">
                    {[totalInflow, totalOutflow].map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No transaction data for this month</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyOverview;
