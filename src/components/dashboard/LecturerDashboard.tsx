import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Plus, AlertCircle } from "lucide-react";
import DashboardHeader from "./DashboardHeader";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LecturerDashboardProps {
  user: User;
}

const LecturerDashboard = ({ user }: LecturerDashboardProps) => {
  const [labs, setLabs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);

  // Request form
  const [selectedLab, setSelectedLab] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  // Issue form
  const [issueLab, setIssueLab] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  useEffect(() => {
    fetchDashboardData();

    const requestsChannel = supabase
      .channel("lecturer_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lab_requests" },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchLabs(), fetchRequests(), fetchIssues()]);
  };

  const fetchLabs = async () => {
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .eq("locked", false)
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
        lab:labs(name)
      `)
      .eq("lecturer_id", user.id)
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
        lab:labs(name)
      `)
      .eq("reported_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch issues");
      return;
    }

    setIssues(data || []);
  };

  const handleLabRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("lab_requests").insert({
      lab_id: selectedLab,
      lecturer_id: user.id,
      request_date: requestDate,
      start_time: startTime,
      end_time: endTime,
      purpose,
    });

    if (error) {
      toast.error("Failed to submit request");
      return;
    }

    toast.success("Lab request submitted successfully");
    setRequestDialogOpen(false);
    resetRequestForm();
    fetchRequests();
  };

  const handleIssueReport = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("issues").insert({
      lab_id: issueLab,
      reported_by: user.id,
      issue_type: issueType,
      description: issueDescription,
    });

    if (error) {
      toast.error("Failed to report issue");
      return;
    }

    toast.success("Issue reported successfully");
    setIssueDialogOpen(false);
    resetIssueForm();
    fetchIssues();
  };

  const resetRequestForm = () => {
    setSelectedLab("");
    setRequestDate("");
    setStartTime("");
    setEndTime("");
    setPurpose("");
  };

  const resetIssueForm = () => {
    setIssueLab("");
    setIssueType("");
    setIssueDescription("");
  };

  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const approvedRequests = requests.filter((r) => r.status === "approved").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader userName={user.email || "Lecturer"} role="Lecturer" />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Available Labs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{labs.filter(l => l.status === "available").length}</div>
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
            <div className="text-3xl font-bold">{pendingRequests}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{approvedRequests}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Request Lab
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Lab</DialogTitle>
              <DialogDescription>
                Submit a request to use a laboratory
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLabRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lab">Laboratory</Label>
                <Select value={selectedLab} onValueChange={setSelectedLab} required>
                  <SelectTrigger id="lab">
                    <SelectValue placeholder="Select a lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name} - {lab.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Time</Label>
                  <Input
                    id="start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Time</Label>
                  <Input
                    id="end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe the purpose of this lab session"
                />
              </div>
              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                Report a problem with a laboratory
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleIssueReport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issue-lab">Laboratory</Label>
                <Select value={issueLab} onValueChange={setIssueLab} required>
                  <SelectTrigger id="issue-lab">
                    <SelectValue placeholder="Select a lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-type">Issue Type</Label>
                <Select value={issueType} onValueChange={setIssueType} required>
                  <SelectTrigger id="issue-type">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Microphone">Microphone</SelectItem>
                    <SelectItem value="Projector">Projector</SelectItem>
                    <SelectItem value="PC/Computer">PC/Computer</SelectItem>
                    <SelectItem value="Air Conditioning">Air Conditioning</SelectItem>
                    <SelectItem value="Network">Network</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-description">Description</Label>
                <Textarea
                  id="issue-description"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue in detail"
                  required
                  className="min-h-24"
                />
              </div>
              <Button type="submit" className="w-full">Submit Report</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="labs">Available Labs</TabsTrigger>
          <TabsTrigger value="issues">My Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No requests yet
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.lab?.name}</CardTitle>
                      <CardDescription>
                        {new Date(request.request_date).toLocaleDateString()} • {request.start_time} - {request.end_time}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        request.status === "approved"
                          ? "default"
                          : request.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                {(request.purpose || request.admin_notes) && (
                  <CardContent className="space-y-2 text-sm">
                    {request.purpose && (
                      <div>
                        <span className="font-medium">Purpose:</span> {request.purpose}
                      </div>
                    )}
                    {request.admin_notes && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Admin notes:</span> {request.admin_notes}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="labs" className="grid gap-4 md:grid-cols-2">
          {labs.map((lab) => (
            <Card key={lab.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{lab.name}</CardTitle>
                    <CardDescription>{lab.location}</CardDescription>
                  </div>
                  <Badge variant={lab.status === "available" ? "default" : "secondary"}>
                    {lab.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Capacity: {lab.capacity} people
                </div>
                {lab.equipment && lab.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lab.equipment.map((eq: string) => (
                      <Badge key={eq} variant="outline" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {issues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No reported issues
              </CardContent>
            </Card>
          ) : (
            issues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{issue.lab?.name}</CardTitle>
                      <CardDescription>{issue.issue_type}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        issue.status === "resolved"
                          ? "default"
                          : issue.status === "in_progress"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {issue.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{issue.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LecturerDashboard;
