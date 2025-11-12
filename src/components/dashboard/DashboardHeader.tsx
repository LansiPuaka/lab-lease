import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, FlaskConical } from "lucide-react";
import { toast } from "sonner";

interface DashboardHeaderProps {
  userName: string;
  role: string;
}

const DashboardHeader = ({ userName, role }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
      return;
    }
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-2xl">
          <FlaskConical className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Lab Monitor</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">{userName}</p>
            <Badge variant="outline">{role}</Badge>
          </div>
        </div>
      </div>
      <Button variant="outline" onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};

export default DashboardHeader;
