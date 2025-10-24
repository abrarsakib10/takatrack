import { Button } from "@/components/ui/button";
import { LogOut, TrendingUp } from "lucide-react";

interface DashboardHeaderProps {
  onSignOut: () => void;
  userEmail?: string;
}

export const DashboardHeader = ({ onSignOut, userEmail }: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">CashFlow Tracker</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};
