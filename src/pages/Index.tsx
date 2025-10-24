import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, BarChart3, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <TrendingUp className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          CashFlow Tracker
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Take control of your finances. Track income, manage expenses, and watch your wealth grow.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
            Sign In
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose CashFlow Tracker?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-t-primary">
            <CardHeader>
              <Wallet className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Easy Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Record your income and expenses with just a few clicks. Organize transactions by
                categories for better insights.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-t-success">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-success mb-4" />
              <CardTitle>Real-time Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                See your current balance, total income, and expenses at a glance. Stay informed
                about your financial health.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-t-accent">
            <CardHeader>
              <Clock className="h-10 w-10 text-accent mb-4" />
              <CardTitle>Historical Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Access your complete transaction history. Review past expenses and income to make
                better financial decisions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Ready to take control?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of users who are already managing their finances better.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-12">
              Start Tracking Now
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>© 2025 CashFlow Tracker. Built with care for your financial wellness.</p>
      </footer>
    </div>
  );
};

export default Index;
