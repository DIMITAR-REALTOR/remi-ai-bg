import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Building2, Users, Calendar, Handshake, LayoutGrid, FileText } from "lucide-react";
import { contractTypeShortLabel, contractStatusLabel, contractStatusTone } from "@/lib/contracts-meta";
import { fmtDate, clientStatusLabel, clientStatusTone, dealStageLabel, dealStageTone, crmToneClasses } from "@/lib/crm-meta";
import { statusLabel, statusTone } from "@/lib/listings-meta";
import { cn } from "@/lib/utils";
import { MarketPulseWidget } from "@/components/MarketPulseWidget";

export const Route = createFileRoute("/_app/dashboard/database")({
  component: DatabasePage,
});

type Row = {
  id: string;
  type: "listing" | "client" | "task" | "deal" | "contract";
  title: string;
  statusLabel: string;
  statusTone: string;
  date: string | null;
  to: string;
  params?: Record<string, string>;
};

const TYPE_META: Record<Row["type"], { label: string; icon: typeof Building2; color: string }> = {
  listing: { label: "Имот", icon: Building2, color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  client: { label: "Клиент", icon: Users, color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  task: { label: "Задача", icon: Calendar, color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  deal: { label: "Сделка", icon: Handshake, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  contract: { label: "Договор", icon: FileText, color: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
};

const FILTERS: { value: "all" | Row["type"]; label: string }[] = [
  { value: "all", label: "Всички" },
  { value: "listing", label: "Имоти" },
  { value: "client", label: "Клиенти" },
  { value: "task", label: "Задачи" },
  { value: "deal", label: "Сделки" },
  { value: "contract", label: "Договори" },
];

function DatabasePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | Row["type"]>("all");
  const [q, setQ] = useState("");

  const { data: listings = [] } = useQuery({
    queryKey: ["db-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings").select("id,title,status,created_at,neighborhood").eq("broker_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["db-clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("clients").select("id,name,status,updated_at").eq("broker_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["db-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tasks").select("id,title,completed,due_at").eq("broker_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["db-deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("deals")
        .select("id,stage,created_at,clients:crm_client_id(name),profiles:client_id(full_name,email),listings:listing_id(title)")
        .eq("broker_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["db-contracts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id,contract_type,status,created_at,party_a")
        .eq("broker_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows: Row[] = useMemo(() => {
    const r: Row[] = [];
    for (const l of listings) {
      r.push({ id: l.id, type: "listing", title: l.title, statusLabel: statusLabel(l.status), statusTone: statusTone(l.status), date: l.created_at, to: "/dashboard/edit/$id", params: { id: l.id } });
    }
    for (const c of clients) {
      r.push({ id: c.id, type: "client", title: c.name, statusLabel: clientStatusLabel(c.status), statusTone: clientStatusTone(c.status), date: c.updated_at, to: "/dashboard/clients/$id", params: { id: c.id } });
    }
    for (const t of tasks) {
      r.push({ id: t.id, type: "task", title: t.title, statusLabel: t.completed ? "Изпълнена" : "Отворена", statusTone: t.completed ? "success" : "warning", date: t.due_at, to: "/dashboard/tasks" });
    }
    for (const d of deals) {
      const name = d.clients?.name ?? d.profiles?.full_name ?? d.profiles?.email ?? d.listings?.title ?? "Сделка";
      r.push({ id: d.id, type: "deal", title: name, statusLabel: dealStageLabel(d.stage), statusTone: dealStageTone(d.stage), date: d.created_at, to: "/dashboard/deals" });
    }
    for (const c of contracts) {
      const name = `${contractTypeShortLabel(c.contract_type)}${c.party_a?.name ? " · " + c.party_a.name : ""}`;
      r.push({ id: c.id, type: "contract", title: name, statusLabel: contractStatusLabel(c.status), statusTone: contractStatusTone(c.status), date: c.created_at, to: "/dashboard/contracts/$id", params: { id: c.id } });
    }
    return r.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
  }, [listings, clients, tasks, deals, contracts]);

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.type !== filter) return false;
    if (q.trim() && !r.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  const activeNeighborhoods = useMemo(
    () => listings.map((l: any) => l.neighborhood).filter(Boolean) as string[],
    [listings]
  );

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-8">
      <h1 className="text-2xl font-black text-foreground">База</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">Всички имоти, клиенти, задачи и сделки на едно място.</p>

      <MarketPulseWidget neighborhoods={activeNeighborhoods} />

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Търси по име..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
          <LayoutGrid className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">Няма записи</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {filtered.map((r) => {
            const meta = TYPE_META[r.type];
            const Icon = meta.icon;
            return (
              <li key={`${r.type}-${r.id}`}>
                <Link
                  to={r.to}
                  params={r.params as any}
                  className="flex items-center gap-3 p-3 transition hover:bg-secondary/50"
                >
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", meta.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">{meta.label} · {fmtDate(r.date)}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", crmToneClasses[r.statusTone])}>
                    {r.statusLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
