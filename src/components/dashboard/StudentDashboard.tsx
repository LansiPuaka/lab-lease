import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DashboardHeader from "./DashboardHeader";
import { Activity } from "lucide-react";

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const [labs, setLabs] = useState<any[]>([]);

  useEffect(() => {
    fetchLabs();

    const labsChannel = supabase
      .channel("labs_status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "labs" },
        () => fetchLabs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(labsChannel);
    };
  }, []);

  const fetchLabs = async () => {
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to fetch labs");
      return;
    }

    setLabs(data || []);
  };

  const getStatusColor = (status: string, locked: boolean) => {
    if (locked) return "destructive";
    switch (status) {
      case "available":
        return "default";
      case "occupied":
        return "secondary";
      case "maintenance":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string, locked: boolean) => {
    if (locked) return "Maintenance";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const availableLabs = labs.filter((l) => l.status === "available" && !l.locked).length;
  const occupiedLabs = labs.filter((l) => l.status === "occupied").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader userName={user.email || "Student"} role="Student" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Available Labs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{availableLabs}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Occupied Labs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{occupiedLabs}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Lab Status</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => (
            <Card key={lab.id} className="relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 w-full h-1.5 ${
                  lab.locked || lab.status === "maintenance"
                    ? "bg-destructive"
                    : lab.status === "available"
                    ? "bg-success"
                    : "bg-warning"
                }`}
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{lab.name}</CardTitle>
                    <CardDescription>{lab.location}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(lab.status, lab.locked)}>
                    {getStatusText(lab.status, lab.locked)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Capacity: {lab.capacity} people
                </div>
                {lab.equipment && lab.equipment.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Equipment:</div>
                    <div className="flex flex-wrap gap-2">
                      {lab.equipment.map((eq: string) => (
                        <Badge key={eq} variant="outline" className="text-xs">
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
