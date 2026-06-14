import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app")({
  component: AppGate,
});

function AppGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Зареждане...</div>;
  }
  return <Outlet />;
}
