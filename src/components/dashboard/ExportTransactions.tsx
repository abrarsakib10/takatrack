import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: "inflow" | "outflow";
  date: string;
  description: string | null;
}

interface ExportTransactionsProps {
  transactions: Transaction[];
  dateRange?: { start: string; end: string };
}

export const ExportTransactions = ({ transactions, dateRange }: ExportTransactionsProps) => {
  const { toast } = useToast();

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Calculate totals
    const totalInflow = transactions
      .filter((t) => t.type === "inflow")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalOutflow = transactions
      .filter((t) => t.type === "outflow")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const netBalance = totalInflow - totalOutflow;

    // Add title
    doc.setFontSize(20);
    doc.text("Transaction Summary", 14, 20);

    // Add date range if available
    if (dateRange) {
      doc.setFontSize(10);
      doc.text(
        `Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`,
        14,
        28
      );
    }

    // Add summary box
    doc.setFontSize(12);
    const summaryY = dateRange ? 38 : 30;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, summaryY, 180, 30, "F");
    
    doc.setTextColor(22, 163, 74); // Green for inflow
    doc.text(`Total Inflow: $${totalInflow.toFixed(2)}`, 20, summaryY + 8);
    
    doc.setTextColor(220, 38, 38); // Red for outflow
    doc.text(`Total Outflow: $${totalOutflow.toFixed(2)}`, 20, summaryY + 16);
    
    doc.setTextColor(0, 0, 0); // Black for net
    doc.text(`Net Balance: $${netBalance.toFixed(2)}`, 20, summaryY + 24);

    // Prepare table data
    const tableData = transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.category,
      `$${Number(t.amount).toFixed(2)}`,
      t.description || "-",
    ]);

    // Add table
    autoTable(doc, {
      startY: summaryY + 35,
      head: [["Date", "Type", "Category", "Amount", "Description"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 80 },
      },
    });

    // Save the PDF
    const filename = `transactions_${dateRange ? `${dateRange.start}_to_${dateRange.end}` : "all"}.pdf`;
    doc.save(filename);

    toast({
      title: "Success",
      description: "Transactions exported to PDF",
    });
  };

  return (
    <Button onClick={exportToPDF} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
};