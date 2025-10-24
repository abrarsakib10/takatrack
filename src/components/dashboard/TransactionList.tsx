import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Pencil } from "lucide-react";
import { Transaction } from "@/pages/Dashboard";
import { EditTransactionDialog } from "./EditTransactionDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TransactionListProps {
  transactions: Transaction[];
  isRefreshing: boolean;
  onRefresh: () => void;
  userId: string;
}

export const TransactionList = ({ transactions, isRefreshing, onRefresh, userId }: TransactionListProps) => {
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleTransactionUpdated = () => {
    onRefresh();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all your income and expenses</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet. Add your first transaction above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.type === "inflow" ? "default" : "destructive"}
                        className={
                          transaction.type === "inflow"
                            ? "bg-success hover:bg-success/80"
                            : ""
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span
                        className={
                          transaction.type === "inflow"
                            ? "text-success"
                            : "text-destructive"
                        }
                      >
                        {transaction.type === "inflow" ? "+" : "-"}৳
                        {Number(transaction.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <EditTransactionDialog
        transaction={editTransaction}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTransactionUpdated={handleTransactionUpdated}
        userId={userId}
      />
    </Card>
  );
};
