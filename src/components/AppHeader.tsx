import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { User as UserIcon, LogOut, HelpCircle, UserCircle2, Cpu } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { user, isBroker } = useAuth();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - lastY.current;
        if (y < 40) setHidden(false);
        else if (diff > 6) setHidden(true);
        else if (diff < -4) setHidden(false);
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setPhotoUrl(null); setDisplayName(null); return; }
    supabase.from("profiles").select("full_name,photo_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setPhotoUrl(data?.photo_url ?? null);
        setDisplayName(data?.full_name ?? user.email ?? null);
      });
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const firstName = displayName?.split(" ")[0] ?? "";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-transform duration-300 will-change-transform",
        hidden && "-translate-y-full"
      )}
    >
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-2 px-4">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src={logoIcon} alt="REMI AI" className="h-8 w-8 shrink-0 rounded-lg" />
          <span className="min-w-0">
            <span className="block text-sm font-black leading-tight text-foreground">REMI AI</span>
            <span className="hidden sm:block text-[10px] leading-tight text-muted-foreground">Real Estate Market Intelligence</span>
          </span>
        </Link>

        {!user ? (
          <div className="flex items-center gap-1.5">
            <Link
              to="/auth"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
            >
              Вход
            </Link>
            <Link
              to="/auth"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Регистрация
            </Link>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 py-1 text-xs font-semibold text-foreground transition hover:border-primary/40 max-w-[55%]">
              <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                {photoUrl ? (
                  <img src={photoUrl} alt={displayName ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-5 w-5" />
                )}
              </span>
              <span className="truncate">{firstName || "Профил"}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link to={isBroker ? "/dashboard" : "/profile"} className="cursor-pointer gap-2">
                  <UserIcon className="h-4 w-4" />Моят профил
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/architecture" className="cursor-pointer gap-2">
                  <Cpu className="h-4 w-4" />Архитектура
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/help" className="cursor-pointer gap-2">
                  <HelpCircle className="h-4 w-4" />Помощ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />Изход
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
