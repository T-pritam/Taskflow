import { Navigate } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { useAuth } from "@/store/authStore";
import { FullPageSpinner } from "@/routes/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NoAccessPage() {
  const { session, role, loading, user, signOut } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (role) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
            <TriangleAlert className="text-muted-foreground size-6" />
          </div>
          <CardTitle>You need an invitation</CardTitle>
          <CardDescription>
            {user?.email} isn't part of this workspace yet. Ask an admin or a project manager to
            invite you, then sign in again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
