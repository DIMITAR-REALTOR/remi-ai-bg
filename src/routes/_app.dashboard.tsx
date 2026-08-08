import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Home, Building2, Users, Calendar, Handshake, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardLayout,
});

const tabs = [
  { to: "/dashboard", label: "Начало", icon: Home, exact: true },
  { to: "/dashboard/database", label: "База", icon: LayoutGrid },
  { to: "/dashboard/listings", label: "Обяви", icon: Building2 },
  { to: "/dashboard/clients", label: "Клиенти", icon: Users },
  { to: "/dashboard/tasks", label: "Огледи", icon: Calendar },
  { to: "/dashboard/deals", label: "Сделки", icon: Handshake },
];

function DashboardLayout() {
  const { user, isBroker, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    else if (!loading && user && !isBroker) navigate({ to: "/profile" });
  }, [loading, user, isBroker, navigate]);

  if (loading || !user || !isBroker) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;
  }

  return (
    <div>
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium border-b-2 transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
