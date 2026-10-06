import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Users, Calendar, Handshake, ChevronRight, ShieldAlert,
  CheckCircle2, FileText, Building, Sparkles, Mic, Loader2,
  AlertTriangle, TrendingUp, ArrowRight, Clock, Zap, Search, BarChart3
} from "lucide-react";
import { fmtDateTime, clientStatusLabel, clientStatusTone, crmToneClasses } from "@/lib/crm-meta";
import { cn } from "@/lib/utils";
import { MarketPulseWidget } from "@/components/MarketPulseWidget";
import { ActionCenterWidget } from "@/components/ActionCenterWidget";
import { VoiceInputButton } from "@/components/VoiceInputButton";

export const Route = createFileRoute("/_app/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user, isBroker, loading } = useAuth();
  const navigate = useNavigate();
  const [remiInput, setRemiInput] = useState("");
  const [isListening, setIsListening] = useState(false);

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
        .limit(10);
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
        .limit(8);
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

  const now = new Date();
  const activeDeals = deals.filter((d: any) => d.status !== "completed");
  const overdueTasks = tasks.filter((t: any) => new Date(t.due_at) < now);
  const upcomingTasks = tasks.filter((t: any) => new Date(t.due_at) >= now);
  const today = new Date();
  const todayStr = today.toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" });

  const brokerName = useMemo(() => {
    if (!user) return "";
    const meta = user.user_metadata as any;
    return meta?.full_name || meta?.name || user.email?.split("@")[0] || "";
  }, [user]);

  const viewingsToday = tasks.filter((t: any) => {
    const d = new Date(t.due_at);
    return d.toDateString() === today.toDateString() && /оглед|оглеждане|преглед/i.test(t.title);
  });

  const topPriority = useMemo(() => {
    if (overdueTasks.length > 0) return { type: "overdue" as const, count: overdueTasks.length, label: "Просрочени задачи", desc: "Някои от тях може да блокират сделки." };
    if (viewingsToday.length > 0) return { type: "viewing" as const, count: viewingsToday.length, label: "Огледа днес", desc: "Подготви се за успешни преговори." };
    if (upcomingTasks.length > 0) return { type: "tasks" as const, count: upcomingTasks.length, label: "Предстоящи задачи", desc: "Имаш задача за днес." };
    return { type: "idle" as const, count: 0, label: "Няма спешни приоритети", desc: "Добра работа!" };
  }, [overdueTasks, viewingsToday, upcomingTasks]);

  const priorityCards = useMemo(() => {
    const cards: Array<{ key: string; tone: "destructive" | "warning" | "success" | "info"; icon: any; title: string; body: string; action?: string; to?: string }> = [];

    if (overdueTasks.length > 0) {
      cards.push({
        key: "overdue",
        tone: "destructive",
        icon: AlertTriangle,
        title: "Изисква внимание",
        body: `Имаш ${overdueTasks.length} просрочени задачи. Някои може да са блокирали сделки.`,
        action: "Виж задачите",
        to: "/dashboard/tasks",
      });
    }

    const staleDeals = activeDeals.filter((d: any) => {
      const updatedAt = d.updated_at || d.created_at;
      if (!updatedAt) return true;
      return now.getTime() - new Date(updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000;
    });

    if (staleDeals.length > 0) {
      cards.push({
        key: "stale",
        tone: "warning",
        icon: ShieldAlert,
        title: "Риск",
        body: `${staleDeals.length} сделки нямат промяна от над седмица. Може да загубиш клиента.`,
        action: "Прегледай сделките",
        to: "/dashboard/deals",
      });
    }

    if (viewingsToday.length > 0) {
      cards.push({
        key: "viewing",
        tone: "success",
        icon: TrendingUp,
        title: "Възможност",
        body: `Днес имаш ${viewingsToday.length} огледа. Подготви се за успешни преговори.`,
        action: "Виж задачите",
        to: "/dashboard/tasks",
      });
    }

    if (upcomingTasks.length > 0) {
      cards.push({
        key: "next",
        tone: "info",
        icon: CheckCircle2,
        title: "Следващо действие",
        body: `Следваща задача: ${upcomingTasks[0].title}${upcomingTasks[0].clients?.name ? ` · ${upcomingTasks[0].clients.name}` : ""}`,
        action: "Изпълни",
        to: "/dashboard/tasks",
      });
    }

    return cards;
  }, [overdueTasks, activeDeals, viewingsToday, upcomingTasks, now]);

  const recentActivity = useMemo(() => {
    const items: Array<{ id: string; title: string; at: string; kind: "deal" | "task" | "client" | "listing" }> = [];
    deals.slice(0, 3).forEach((d: any) => items.push({ id: d.id, title: `Сделка: ${d.listings?.title ?? "без обява"}`, at: d.created_at, kind: "deal" }));
    tasks.slice(0, 3).forEach((t: any) => items.push({ id: t.id, title: `Задача: ${t.title}`, at: t.due_at, kind: "task" }));
    clients.slice(0, 2).forEach((c: any) => items.push({ id: c.id, title: `Клиент: ${c.name}`, at: c.updated_at, kind: "client" }));
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);
  }, [deals, tasks, clients]);

  const quickActions = [
    { label: "Какво е спешно днес?", q: "Какво е спешно днес?" },
    { label: "Анализирай този имот", q: "Анализирай този имот" },
    { label: "Подготви обаждане", q: "Подготви обаждане" },
    { label: "Сравни с клиентите ми", q: "Сравни с клиентите ми" },
    { label: "Провери липсващи документи", q: "Провери липсващи документи" },
  ];

  const handleRemiSubmit = () => {
    if (!remiInput.trim()) return;
    navigate({ to: "/tools", search: { q: remiInput.trim() } });
    setRemiInput("");
  };

  const handleQuickAction = (q: string) => {
    setRemiInput(q);
    navigate({ to: "/tools", search: { q } });
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">
            {brokerName ? `Добро утро, ${brokerName.split(" ")[0]}.` : "Начало"}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{todayStr} · Прегледах активните ти сделки и клиентите ти.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          REMI активен
        </div>
      </div>

      {/* REMI Day Brief */}
      <section className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">REMI Day Brief</h2>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{activeDeals.length}</p>
            <p className="text-[10px] text-muted-foreground">Активни сделки</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{overdueTasks.length}</p>
            <p className="text-[10px] text-muted-foreground">Просрочени</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{viewingsToday.length}</p>
            <p className="text-[10px] text-muted-foreground">Огледа днес</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Най-важен приоритет</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {topPriority.type === "overdue" && `Имаш ${topPriority.count} просрочени задачи — нуждае се от внимание.`}
            {topPriority.type === "viewing" && `Днес имаш ${topPriority.count} огледа — подготви се.`}
            {topPriority.type === "tasks" && `Имаш ${topPriority.count} предстоящи задачи за днес.`}
            {topPriority.type === "idle" && "Няма спешни приоритети — добра работа!"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{topPriority.desc}</p>
          {topPriority.type !== "idle" && (
            <Link to={topPriority.type === "overdue" ? "/dashboard/tasks" : topPriority.type === "stale" ? "/dashboard/deals" : "/dashboard/tasks"} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Виж детайли <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </section>

      {/* REMI Command Center */}
      <section className="mt-3">
        <label className="text-xs font-semibold text-foreground">Какво искаш REMI да направи?</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-card p-1.5">
          <input
            type="text"
            value={remiInput}
            onChange={(e) => setRemiInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRemiSubmit()}
            placeholder="напр. създай задача за оглед утре, анализирай риск на сделка..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <VoiceInputButton
            onTranscript={(text) => setRemiInput((prev) => prev ? `${prev} ${text}` : text)}
            label="Диктувай"
            className="shrink-0"
          />
          <Button size="sm" className="shrink-0 gap-1.5" onClick={handleRemiSubmit} disabled={!remiInput.trim()}>
            <Sparkles className="h-3.5 w-3.5" />
            Изпълни
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickActions.map((qa) => (
            <button key={qa.q} onClick={() => handleQuickAction(qa.q)} className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
              {qa.label}
            </button>
          ))}
        </div>
      </section>

      {/* REMI Recommends */}
      <section className="mt-5">
        <h2 className="text-sm font-semibold text-foreground">REMI препоръчва</h2>
        {priorityCards.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            <BarChart3 className="mx-auto mb-1.5 h-5 w-5 opacity-50" />
            Няма текущи препоръки.
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {priorityCards.map((card) => {
              const Icon = card.icon;
              const toneClass = crmToneClasses[card.tone];
              return (
                <Link key={card.key} to={card.to || "#"} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40">
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", toneClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{card.body}</p>
                  </div>
                  {card.action && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {card.action} <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Action Center */}
      <div className="mt-5">
        <ActionCenterWidget />
      </div>

      {/* REMI Activity Timeline */}
      {recentActivity.length > 0 && (
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">REMI през последните 24 часа</h2>
            <span className="text-[10px] text-muted-foreground">Последна активност</span>
          </div>
          <div className="mt-2 space-y-2">
            <ul className="space-y-2">
              {recentActivity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    {item.kind === "deal" && <Handshake className="h-3.5 w-3.5" />}
                    {item.kind === "task" && <Calendar className="h-3.5 w-3.5" />}
                    {item.kind === "client" && <Users className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{fmtDateTime(item.at)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.kind === "deal" && "Сделка"}
                    {item.kind === "task" && "Задача"}
                    {item.kind === "client" && "Клиент"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Active Deals */}
      <section className="mt-5">
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
              <li key={d.id}>
                <Link to="/dashboard/deals" className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-3 transition hover:border-primary/40">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{d.listings?.title ?? "Сделка без обява"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.profiles?.full_name ? `👤 ${d.profiles.full_name}` : "Клиент неизвестен"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tasks */}
      <section className="mt-5">
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
      </section>

      {/* Clients */}
      <section className="mt-5">
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
      </section>

      {/* Market Pulse */}
      <section className="mt-5">
        <MarketPulseWidget neighborhoods={listingNeighborhoods} />
      </section>

      {/* Quick Actions */}
      <section className="mt-5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Link to="/dashboard/new" className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-3 text-xs font-medium text-foreground hover:bg-secondary">
            <Building2 className="h-4 w-4" />Нова обява
          </Link>
          <Link to="/dashboard/clients" className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-3 text-xs font-medium text-foreground hover:bg-secondary">
            <Users className="h-4 w-4" />Нов клиент
          </Link>
          <Link to="/dashboard/contracts/new" className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-3 text-xs font-medium text-foreground hover:bg-secondary">
            <FileText className="h-4 w-4" />Нов договор
          </Link>
          <Link to="/dashboard/tasks" className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-3 text-xs font-medium text-foreground hover:bg-secondary">
            <Calendar className="h-4 w-4" />Задачи и огледи
          </Link>
        </div>
        <Link to="/risk" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldAlert className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Правен анализ</p>
            <p className="text-xs text-muted-foreground">Документи, тежести и правни рискове</p>
          </div>
        </Link>
        <Link to="/dashboard/agency" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Building className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Агенция</p>
            <p className="text-xs text-muted-foreground">Управлявай екип и покани брокери</p>
          </div>
        </Link>
      </section>
    </div>
  );
}

// Inline minimal Button to avoid importing a non-existent local component
function Button({ className, children, ...props }: any) {
  return (
    <button className={cn("inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", className)} {...props}>
      {children}
    </button>
  );
}
