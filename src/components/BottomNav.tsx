import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, User, LayoutDashboard, Heart, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { user, isBroker } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", label: "Начало", icon: Home, exact: true },
    { to: "/search", label: "Търси", icon: Search },
    ...(isBroker
      ? [{ to: "/dashboard", label: "Кабинет", icon: LayoutDashboard }]
      : user
        ? [{ to: "/favorites", label: "Любими", icon: Heart }]
        : [{ to: "/brokers", label: "Брокери", icon: Users }]),
    { to: user ? "/profile" : "/auth", label: user ? "Профил" : "Вход", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
