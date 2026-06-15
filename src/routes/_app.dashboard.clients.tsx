import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClientForm } from "@/components/ClientForm";
import { CLIENT_STATUSES, clientStatusLabel, clientStatusTone, clientTypeLabel, crmToneClasses, fmtDate } from "@/lib/crm-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["my-clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("clients").select("*").eq("broker_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = clients.filter((c: any) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-xl px-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black text-foreground">Клиенти</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Добави клиент</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Нов клиент</DialogTitle></DialogHeader>
            <ClientForm onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["my-clients", user?.id] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Търси по име" className="pl-8" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всички статуси</SelectItem>
            {CLIENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Зареждане...</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Няма клиенти.
        </div>
      ) : (
        <ul className="mt-4 space-y-2 pb-6">
          {filtered.map((c: any) => (
            <li key={c.id}>
              <Link to="/dashboard/clients/$id" params={{ id: c.id }} className="block rounded-2xl border border-border bg-card p-3 transition hover:border-primary/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{clientTypeLabel(c.client_type)}{c.looking_for ? ` · ${c.looking_for}` : ""}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", crmToneClasses[clientStatusTone(c.status)])}>
                    {clientStatusLabel(c.status)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  {c.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span> : <span />}
                  <span>Последен контакт: {fmtDate(c.last_contact_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
