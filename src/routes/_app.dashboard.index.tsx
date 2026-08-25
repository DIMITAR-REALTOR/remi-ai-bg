import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Calendar, Handshake, ChevronRight, ShieldAlert, CheckCircle2, FileText, Building } from "lucide-react";
import { fmtDateTime, clientStatusLabel, clientStatusTone, crmToneClasses } from "@/lib/crm-meta";
import { cn } from "@/lib/utils";
import { MarketPulseWidget } from "@/components/MarketPulseWidget";

export const Route = createFileRoute("/_app/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user, isBroker, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !isBroker) navigate({ to: "/profile" });
  }, [loading, user, isBroker, navigate]);

  const { data: deals = [] } = useQuery({
    queryKey: ["overview-deals", user?.id],
    enabled: !!user && isBroker,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("deals")
        .select("id, status, created_at, profiles:client_id(full_name), listings:listing_id(title)")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["overview-tasks", user?.id],
    enabled: !!user && isBroker,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tasks")
        .select("id, title, due_at, completed, clients:client_id(name)")
        .eq("broker_id", user!.id)
        .eq("completed", false)
        .order("due_at", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["overview-clients", user?.id],
    enabled: !!user && isBroker,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("clients")
        .select("id, name, status, updated_at")
        .eq("broker_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: listingNeighborhoods = [] } = useQuery({
    queryKey: ["overview-listing-neighborhoods", user?.id],
    enabled: !!user && isBroker,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("neighborhood")
        .eq("broker_id", user!.id)
        .not("neighborhood", "is", null);
      if (error) throw error;
      return (data ?? []).map((l: any) => l.neighborhood as string);
    },
  });

  if (loading || !isBroker) return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;

  const activeDeals = deals.filter((d: any) => d.status !== "completed");
  const now = new Date();
  const overdueTasks = tasks.filter((t: any) => new Date(t.due_at) < now);
  const upcomingTasks = tasks.filter((t: any) => new Date(t.due_at) >= now);

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
      <h1 className="text-2xl font-black text-foreground">Начало</h1>

      <MarketPulseWidget neighborhoods={listingNeighborhoods} />

      <Link to="/risk" className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldAlert className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Анализ на сделка</p>
          <p className="text-xs text-muted-foreground">AI оценка на риска при сделка с имот</p>
        </div>
      </Link>

      <Link to="/dashboard/agency" className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Building className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Агенция</p>
          <p className="text-xs text-muted-foreground">Управлявай екип, покани брокери, следи агенцията</p>
        </div>
      </Link>

      {/* Активни сделки */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Активни сделки</h2>
          <Link to="/dashboard/deals" className="flex items-center text-xs font-medium text-primary">
            Виж всички <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {activeDeals.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            <Handshake className="mx-auto mb-1.5 h-5 w-5 opacity-50" />
            Няма активни сделки.
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {activeDeals.slice(0, 4).map((d: any) => (
              <li key={d.id} className="rounded-xl border border-border bg-card p-3">
                <p className="truncate text-sm font-medium text-foreground">{d.listings?.title ?? "Сделка без обява"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {d.profiles?.full_name ? `👤 ${d.profiles.full_name}` : "Клиент неизвестен"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Задачи за днес / просрочени */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Предстоящи задачи</h2>
          <Link to="/dashboard/tasks" className="flex items-center text-xs font-medium text-primary">
            Виж всички <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {tasks.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            <Calendar className="mx-auto mb-1.5 h-5 w-5 opacity-50" />
            Няма предстоящи задачи.
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {overdueTasks.map((t: any) => (
              <li key={t.id} className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                  <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">Просрочена</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {fmtDateTime(t.due_at)}{t.clients?.name ? ` · 👤 ${t.clients.name}` : ""}
                </p>
              </li>
            ))}
            {upcomingTasks.slice(0, 5 - overdueTasks.length).map((t: any) => (
              <li key={t.id} className="rounded-xl border border-border bg-card p-3">
                <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {fmtDateTime(t.due_at)}{t.clients?.name ? ` · 👤 ${t.clients.name}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Последно активни клиенти */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Последно активни клиенти</h2>
          <Link to="/dashboard/clients" className="flex items-center text-xs font-medium text-primary">
            Виж всички <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {clients.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            <Users className="mx-auto mb-1.5 h-5 w-5 opacity-50" />
            Няма добавени клиенти.
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {clients.map((c: any) => (
              <li key={c.id}>
                <Link to="/dashboard/clients/$id" params={{ id: c.id }} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 transition hover:border-primary/40">
                  <span className="truncate text-sm font-medium text-foreground">{c.name}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", crmToneClasses[clientStatusTone(c.status)])}>
                    {clientStatusLabel(c.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Бързи бутони */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Link to="/dashboard/new" className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-2.5 text-xs font-medium text-foreground hover:bg-secondary">
          <Building2 className="h-3.5 w-3.5" />Нова обява
        </Link>
        <Link to="/dashboard/clients" className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-2.5 text-xs font-medium text-foreground hover:bg-secondary">
          <Users className="h-3.5 w-3.5" />Нов клиент
        </Link>
        <Link to="/dashboard/contracts/new" className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-2.5 text-xs font-medium text-foreground hover:bg-secondary">
          <FileText className="h-3.5 w-3.5" />Нов договор
        </Link>
      </div>
    </div>
  );
}
