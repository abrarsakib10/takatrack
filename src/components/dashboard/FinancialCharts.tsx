import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, PieChartIcon, BarChart3 } from "lucide-react";

interface Transaction {
  amount: number;
  category: string;
  type: "inflow" | "outflow";
  date: string;
}

interface FinancialChartsProps {
  transactions: Transaction[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const FinancialCharts = ({ transactions }: FinancialChartsProps) => {
  // Monthly income vs expenses
  const getMonthlyData = () => {
    const monthlyMap = new Map<string, { inflow: number; outflow: number; balance: number }>();
    
    transactions.forEach((t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      const current = monthlyMap.get(month) || { inflow: 0, outflow: 0, balance: 0 };
      
      if (t.type === "inflow") {
        current.inflow += Number(t.amount);
      } else {
        current.outflow += Number(t.amount);
      }
      current.balance = current.inflow - current.outflow;
      
      monthlyMap.set(month, current);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        inflow: data.inflow,
        outflow: data.outflow,
        balance: data.balance,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  // Category breakdown for outflows
  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter((t) => t.type === "outflow")
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Number(t.amount));
      });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();

  const chartConfig = {
    inflow: {
      label: "Inflow",
      color: "hsl(var(--chart-1))",
    },
    outflow: {
      label: "Outflow",
      color: "hsl(var(--chart-2))",
    },
    balance: {
      label: "Balance",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Trends */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Income vs Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="inflow"
                stroke="var(--color-inflow)"
                strokeWidth={2}
                name="Inflow"
              />
              <Line
                type="monotone"
                dataKey="outflow"
                stroke="var(--color-outflow)"
                strokeWidth={2}
                name="Outflow"
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                strokeWidth={2}
                name="Balance"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Top Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.category}: $${entry.amount.toFixed(0)}`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="inflow" fill="var(--color-inflow)" name="Inflow" />
              <Bar dataKey="outflow" fill="var(--color-outflow)" name="Outflow" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};