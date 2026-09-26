import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app")({
  component: AppGate,
});

function AppGate() {
  const { user, loading, rolePending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", replace: true }); return; }
    if (rolePending) navigate({ to: "/choose-role", replace: true });
  }, [loading, user, rolePending, navigate]);

  if (loading || !user || rolePending) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Зареждане...</div>;
  }
  return <Outlet />;
}
