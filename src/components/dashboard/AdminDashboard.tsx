import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Lock, Unlock, Activity, AlertCircle, Calendar } from "lucide-react";
import DashboardHeader from "./DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [labs, setLabs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to real-time updates
    const requestsChannel = supabase
      .channel("lab_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lab_requests" },
        () => fetchRequests()
      )
      .subscribe();

    const issuesChannel = supabase
      .channel("issues_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => fetchIssues()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(issuesChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchLabs(), fetchRequests(), fetchIssues()]);
  };

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

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("lab_requests")
      .select(`
        *,
        lab:labs(name),
        lecturer:profiles!lab_requests_lecturer_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch requests");
      return;
    }

    setRequests(data || []);
  };

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from("issues")
      .select(`
        *,
        lab:labs(name),
        reporter:profiles!issues_reported_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch issues");
      return;
    }

    setIssues(data || []);
  };

  const toggleLabLock = async (labId: string, currentLocked: boolean) => {
    const { error } = await supabase
      .from("labs")
      .update({ locked: !currentLocked, status: !currentLocked ? "maintenance" : "available" })
      .eq("id", labId);

    if (error) {
      toast.error("Failed to update lab status");
      return;
    }

    toast.success(!currentLocked ? "Lab locked for maintenance" : "Lab unlocked");
    fetchLabs();
  };

  const handleRequest = async (requestId: string, status: "approved" | "rejected") => {
    const notes = adminNotes[requestId] || "";
    
    const { error } = await supabase
      .from("lab_requests")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes,
      })
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to update request");
      return;
    }

    toast.success(`Request ${status}`);
    setAdminNotes((prev) => {
      const updated = { ...prev };
      delete updated[requestId];
      return updated;
    });
    fetchRequests();
  };

  const resolveIssue = async (issueId: string) => {
    const { error } = await supabase
      .from("issues")
      .update({
        status: "resolved",
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    if (error) {
      toast.error("Failed to resolve issue");
      return;
    }

    toast.success("Issue marked as resolved");
    fetchIssues();
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const openIssues = issues.filter((i) => i.status !== "resolved");
  const availableLabs = labs.filter((l) => l.status === "available" && !l.locked).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader userName={user.email || "Admin"} role="Admin" />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Available Labs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableLabs}/{labs.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Open Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openIssues.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Lab Requests</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="labs">Labs</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending requests
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.lab?.name}</CardTitle>
                      <CardDescription>
                        Requested by {request.lecturer?.full_name || request.lecturer?.email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>{" "}
                      <span className="font-medium">
                        {new Date(request.request_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>{" "}
                      <span className="font-medium">
                        {request.start_time} - {request.end_time}
                      </span>
                    </div>
                  </div>
                  {request.purpose && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Purpose:</span>{" "}
                      <span>{request.purpose}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add admin notes (optional)"
                      value={adminNotes[request.id] || ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({ ...prev, [request.id]: e.target.value }))
                      }
                      className="min-h-20"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleRequest(request.id, "approved")}
                      className="flex-1"
                      variant="default"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRequest(request.id, "rejected")}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {openIssues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No open issues
              </CardContent>
            </Card>
          ) : (
            openIssues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{issue.lab?.name}</CardTitle>
                      <CardDescription>
                        {issue.issue_type} - Reported by {issue.reporter?.full_name}
                      </CardDescription>
                    </div>
                    <Badge variant={issue.status === "in_progress" ? "secondary" : "destructive"}>
                      {issue.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{issue.description}</p>
                  <Button onClick={() => resolveIssue(issue.id)} size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="labs" className="grid gap-4 md:grid-cols-2">
          {labs.map((lab) => (
            <Card key={lab.id} className={lab.locked ? "opacity-75" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{lab.name}</CardTitle>
                    <CardDescription>{lab.location}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      lab.status === "available"
                        ? "default"
                        : lab.status === "occupied"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {lab.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Capacity: {lab.capacity} people
                </div>
                {lab.equipment && lab.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lab.equipment.map((eq: string) => (
                      <Badge key={eq} variant="outline">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => toggleLabLock(lab.id, lab.locked)}
                  variant={lab.locked ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  {lab.locked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock Lab
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock for Maintenance
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
