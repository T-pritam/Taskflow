import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/store/authStore";

export function FullPageSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  console.log("ProtectedRoute session:", session);

  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/no-access" replace />;
  return children;
}
