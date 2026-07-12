import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarClock, LinkIcon } from "lucide-react";
import { formatDate } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FullPageSpinner } from "@/routes/ProtectedRoute";

export default function SharePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSharedTask() {
      const { data, error } = await supabase.rpc("get_shared_task", {
        share_token: token,
      });
      if (cancelled) return;
      if (error) console.error("Failed to resolve share link", error);
      setTask(data ?? null);
      setLoading(false);
    }

    loadSharedTask();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (authLoading || loading) return;
    if (session && task?.id) {
      navigate(`/?task=${task.id}`, { replace: true });
    }
  }, [authLoading, loading, session, task, navigate]);

  if (loading || authLoading) return <FullPageSpinner />;

  if (session && task?.id) return <FullPageSpinner />;

  if (!task) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <LinkIcon className="text-muted-foreground size-6" />
            </div>
            <CardTitle>Link not found</CardTitle>
            <CardDescription>
              This share link is invalid or the task has been deleted.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[92svh] gap-0 overflow-y-auto sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="pr-1">
          <DialogTitle>Task details</DialogTitle>
          <DialogDescription>You're viewing a shared task.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <span className="text-muted-foreground text-sm font-medium">Title</span>
              <p className="text-lg font-semibold">{task.title}</p>
            </div>

            <div className="grid gap-1.5">
              <span className="text-muted-foreground text-sm font-medium">Description</span>
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-muted-foreground text-sm">No description.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{STATUS_LABELS[task.status] ?? task.status}</Badge>
              {task.priority && (
                <Badge variant="secondary">{PRIORITY_LABELS[task.priority]}</Badge>
              )}
              {task.due_date && (
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <CalendarClock className="size-3.5" />
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>

            {task.created_by_name && (
              <p className="text-muted-foreground text-sm">Created by {task.created_by_name}</p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button asChild size="sm">
            <Link to="/signup">Sign up to collaborate</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
