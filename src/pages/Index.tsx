import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, BarChart3, Shield, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <FlaskConical className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Lab Monitor</span>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <section className="text-center space-y-6 mb-20">
          <Badge variant="outline" className="mb-4">
            Smart Laboratory Management
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Manage Your Lab Resources
            <span className="block text-primary mt-2">Efficiently & Effectively</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform for monitoring lab availability, managing requests,
            and reporting issues in real-time.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              View Labs
            </Button>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-3 mb-20">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6 space-y-4">
              <div className="p-3 bg-primary/10 rounded-xl w-fit">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Check lab availability and occupancy status in real-time. Stay updated with live data.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardContent className="pt-6 space-y-4">
              <div className="p-3 bg-accent/10 rounded-xl w-fit">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold">Role-Based Access</h3>
              <p className="text-muted-foreground">
                Secure dashboards for Admin, Lecturer, and Student roles with specific permissions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardContent className="pt-6 space-y-4">
              <div className="p-3 bg-warning/10 rounded-xl w-fit">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-xl font-bold">Request & Report</h3>
              <p className="text-muted-foreground">
                Lecturers can request labs and report issues. Admins review and manage all requests.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="bg-card rounded-3xl p-12 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to optimize your lab management?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join now and experience seamless laboratory monitoring and management
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="mt-4">
            Sign Up Now
          </Button>
        </section>
      </main>

      <footer className="border-t mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-muted-foreground">
          <p>© 2024 Lab Monitor. Built with modern technology for educational institutions.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
