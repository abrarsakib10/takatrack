import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp } from "lucide-react";

interface Budget {
  id: string;
  category: string;
  type: string;
  planned_amount: number;
  period_start: string;
  period_end: string;
}

interface Transaction {
  amount: number;
  category: string;
  type: "inflow" | "outflow";
  date: string;
}

interface BudgetAlertsProps {
  budgets: Budget[];
  transactions: Transaction[];
}

export const BudgetAlerts = ({ budgets, transactions }: BudgetAlertsProps) => {
  const [alerts, setAlerts] = useState<{ category: string; percentage: number; type: string; planned: number; actual: number }[]>([]);

  useEffect(() => {
    const newAlerts: { category: string; percentage: number; type: string; planned: number; actual: number }[] = [];

    budgets.forEach((budget) => {
      const relevantTransactions = transactions.filter(
        (t) =>
          t.category === budget.category &&
          t.type === budget.type &&
          t.date >= budget.period_start &&
          t.date <= budget.period_end
      );

      const actualAmount = relevantTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      const percentage = (actualAmount / budget.planned_amount) * 100;

      // Alert if spending is at 80% or more, or exceeded
      if (percentage >= 80) {
        newAlerts.push({
          category: budget.category,
          percentage,
          type: budget.type,
          planned: budget.planned_amount,
          actual: actualAmount,
        });
      }
    });

    setAlerts(newAlerts);
  }, [budgets, transactions]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          variant={alert.percentage >= 100 ? "destructive" : "default"}
          className="border-l-4"
        >
          {alert.percentage >= 100 ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
          <AlertTitle>
            {alert.percentage >= 100 ? "Budget Exceeded" : "Budget Alert"}
          </AlertTitle>
          <AlertDescription>
            Your <strong>{alert.category}</strong> {alert.type} is at{" "}
            <strong>{alert.percentage.toFixed(0)}%</strong> of budget (
            ${alert.actual.toFixed(2)} of ${alert.planned.toFixed(2)})
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};