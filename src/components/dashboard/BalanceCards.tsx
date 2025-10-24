import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BalanceCardsProps {
  balance: number;
  totalInflows: number;
  totalOutflows: number;
  currentMonthInflows: number;
  currentMonthOutflows: number;
  previousMonthBalance?: number;
}

export const BalanceCards = ({ 
  balance, 
  totalInflows, 
  totalOutflows, 
  currentMonthInflows, 
  currentMonthOutflows,
  previousMonthBalance 
}: BalanceCardsProps) => {
  const currentMonthBalance = currentMonthInflows - currentMonthOutflows;
  const balanceChange = previousMonthBalance !== undefined 
    ? ((balance - previousMonthBalance) / Math.abs(previousMonthBalance || 1)) * 100 
    : 0;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="current">Current Month</TabsTrigger>
          <TabsTrigger value="alltime">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Month Balance</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">৳{currentMonthBalance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">This month's net flow</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-success">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Month Inflows</CardTitle>
                <TrendingUp className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">৳{currentMonthInflows.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Income this month</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-destructive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Month Outflows</CardTitle>
                <TrendingDown className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">৳{currentMonthOutflows.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Expenses this month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alltime" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <Wallet className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">৳{balance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All-time balance
                  {balanceChange !== 0 && previousMonthBalance !== undefined && (
                    <span className={`ml-2 ${balanceChange > 0 ? 'text-success' : 'text-destructive'}`}>
                      ({balanceChange > 0 ? '+' : ''}{balanceChange.toFixed(1)}%)
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-success">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Inflows</CardTitle>
                <TrendingUp className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">৳{totalInflows.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">All income received</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-destructive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Outflows</CardTitle>
                <TrendingDown className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">৳{totalOutflows.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">All expenses paid</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
