import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Handshake, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { fmtDate, fmtMoney, DEAL_STAGES, dealStageLabel, dealStageTone, dealStageIndex, crmToneClasses } from "@/lib/crm-meta";
import { StarRow } from "@/components/RatingBadge";
import { cn } from "@/lib/utils";
import { analyzeDealContext } from "@/lib/ai.functions";

export const Route = createFileRoute("/_app/dashboard/deals")({
  component: DealsPage,
});

type DealRow = {
  id: string;
  client_id: string | null;
  crm_client_id: string | null;
  listing_id: string | null;
  status: string;
  stage: string;
  commission_percent: number | null;
  closed_at: string | null;
  created_at: string;
  last_activity_at: string;
  ai_context_summary: { reasoning: string; next_action: string } | null;
  ai_context_summary_updated_at: string | null;
  profiles?: { id: string; full_name: string | null; email: string | null } | null;
  clients?: { id: string; name: string } | null;
  listings?: { id: string; title: string; price_eur: number } | null;
};

function DealsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["my-deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("deals")
        .select("id, client_id, crm_client_id, listing_id, status, stage, commission_percent, closed_at, created_at, last_activity_at, ai_context_summary, ai_context_summary_updated_at, profiles:client_id(id,full_name,email), clients:crm_client_id(id,name), listings:listing_id(id,title,price_eur)")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DealRow[];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["my-deal-reviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("broker_reviews").select("deal_id, rating, comment").eq("broker_id", user!.id);
      if (error) throw error;
      return (data ?? []) as { deal_id: string; rating: number; comment: string | null }[];
    },
  });

  const analyzeContext = useServerFn(analyzeDealContext);
  const inFlight = useRef<Set<string>>(new Set());

  // Автоматичен Reasoning Layer (Blueprint 7.6) — без ръчен вход на брокера.
  // Изчислява ai_context_summary за активни сделки с липсващ или остарял анализ
  // (по-стар от last_activity_at, или по-стар от 24 часа).
  useEffect(() => {
    if (!user || deals.length === 0) return;

    const STALE_MS = 24 * 60 * 60 * 1000;
    const stale = deals.filter((d) => {
      if (d.stage === "closed") return false;
      if (inFlight.current.has(d.id)) return false;
      if (!d.ai_context_summary_updated_at) return true;
      const updated = new Date(d.ai_context_summary_updated_at).getTime();
      const lastActivity = new Date(d.last_activity_at).getTime();
      return updated < lastActivity || Date.now() - updated > STALE_MS;
    });

    if (stale.length === 0) return;

    (async () => {
      for (const d of stale) {
        inFlight.current.add(d.id);
        const daysSince = Math.floor((Date.now() - new Date(d.last_activity_at).getTime()) / (24 * 60 * 60 * 1000));
        try {
          const r = await analyzeContext({
            data: {
              deal_id: d.id,
              stage: d.stage,
              days_since_activity: daysSince,
              client_name: d.clients?.name ?? d.profiles?.full_name ?? "",
              listing_title: d.listings?.title ?? "",
              commission_percent: d.commission_percent ?? undefined,
            },
          });
          await (supabase as any)
            .from("deals")
            .update({ ai_context_summary: r, ai_context_summary_updated_at: new Date().toISOString() })
            .eq("id", d.id);
          qc.invalidateQueries({ queryKey: ["my-deals", user.id] });
        } catch {
          // Тих провал — известието/следващата стъпка просто не се обновява този път.
        }
      }
    })();
  }, [deals, user, analyzeContext, qc]);

  const moveStage = async (deal: DealRow, direction: 1 | -1) => {
    const idx = dealStageIndex(deal.stage);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= DEAL_STAGES.length) return;
    setBusy(true);
    const { error } = await (supabase as any)
      .from("deals").update({ stage: DEAL_STAGES[nextIdx].value }).eq("id", deal.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (DEAL_STAGES[nextIdx].value === "closed") toast.success("Сделката е затворена 🎉");
    qc.invalidateQueries({ queryKey: ["my-deals", user?.id] });
  };

  const totalCommission = deals.reduce((sum, d) => {
    if (!d.commission_percent || !d.listings?.price_eur) return sum;
    return sum + (d.commission_percent / 100) * d.listings.price_eur;
  }, 0);
  const activeCount = deals.filter((d) => d.stage !== "closed").length;

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black text-foreground">Сделки</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Нова сделка</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Нова сделка</DialogTitle></DialogHeader>
            <NewDealForm
              brokerId={user!.id}
              onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["my-deals", user?.id] }); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {deals.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[11px] text-muted-foreground">Активни сделки</p>
            <p className="text-lg font-bold text-foreground">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[11px] text-muted-foreground">Очаквана комисиона</p>
            <p className="text-lg font-bold text-foreground">{fmtMoney(totalCommission)}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Зареждане...</p>
      ) : deals.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
          <Handshake className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">Няма сделки</p>
          <p className="mt-1 text-xs text-muted-foreground">Добави клиент от CRM-а или регистриран профил, за да проследяваш сделката.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {deals.map((d) => {
            const rev = reviews.find((r) => r.deal_id === d.id);
            const commission = d.commission_percent && d.listings?.price_eur
              ? (d.commission_percent / 100) * d.listings.price_eur
              : null;
            const idx = dealStageIndex(d.stage);
            return (
              <li key={d.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {d.clients?.name ?? d.profiles?.full_name ?? d.profiles?.email ?? "Клиент"}
                    </p>
                    {d.listings?.title && <p className="truncate text-xs text-muted-foreground">{d.listings.title}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">Създадена: {fmtDate(d.created_at)}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", crmToneClasses[dealStageTone(d.stage)])}>
                    {dealStageLabel(d.stage)}
                  </span>
                </div>

                {commission != null && (
                  <p className="mt-2 text-xs font-medium text-foreground">
                    Комисиона: {d.commission_percent}% ≈ {fmtMoney(commission)}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-1">
                  {DEAL_STAGES.map((s, i) => (
                    <div key={s.value} className={cn("h-1.5 flex-1 rounded-full", i <= idx ? "bg-primary" : "bg-muted")} title={s.label} />
                  ))}
                </div>

                {d.stage !== "closed" && (
                  <div className="mt-3 flex items-center gap-2">
                    {idx > 0 && (
                      <Button size="sm" variant="outline" className="gap-1" disabled={busy} onClick={() => moveStage(d, -1)}>
                        <ChevronLeft className="h-3.5 w-3.5" />Назад
                      </Button>
                    )}
                    <Button size="sm" className="gap-1" disabled={busy} onClick={() => moveStage(d, 1)}>
                      {DEAL_STAGES[idx + 1]?.label ?? "Затвори"}<ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {d.stage !== "closed" && d.ai_context_summary?.next_action && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-primary/5 p-2.5">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">Следваща стъпка: </span>
                      {d.ai_context_summary.next_action}
                    </p>
                  </div>
                )}

                {rev && (
                  <div className="mt-3 rounded-xl bg-muted/50 p-2.5">
                    <StarRow value={rev.rating} />
                    {rev.comment && <p className="mt-1 text-xs text-muted-foreground">{rev.comment}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type ClientProfile = { id: string; full_name: string | null; email: string | null };
type CrmClient = { id: string; name: string };

function NewDealForm({ brokerId, onCreated }: { brokerId: string; onCreated: () => void }) {
  const [mode, setMode] = useState<"crm" | "platform">("crm");

  const { data: crmClients = [] } = useQuery({
    queryKey: ["my-crm-clients-for-deal", brokerId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("clients").select("id,name").eq("broker_id", brokerId).order("name");
      if (error) throw error;
      return (data ?? []) as CrmClient[];
    },
  });
  const [crmClientId, setCrmClientId] = useState<string>("");

  const [q, setQ] = useState("");
  const [results, setResults] = useState<ClientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ClientProfile | null>(null);

  const [listingId, setListingId] = useState<string>("none");
  const [commissionPercent, setCommissionPercent] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const { data: listings = [] } = useQuery({
    queryKey: ["my-listings-for-deal", brokerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings").select("id,title").eq("broker_id", brokerId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const search = async () => {
    const term = q.trim();
    if (!term) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(10);
    setResults(((data ?? []) as ClientProfile[]).filter((p) => p.id !== brokerId));
  };

  const canCreate = mode === "crm" ? !!crmClientId : !!selectedProfile;

  const create = async () => {
    if (!canCreate) return;
    setBusy(true);
    const { error } = await (supabase as any).from("deals").insert({
      broker_id: brokerId,
      client_id: mode === "platform" ? selectedProfile!.id : null,
      crm_client_id: mode === "crm" ? crmClientId : null,
      listing_id: listingId === "none" ? null : listingId,
      status: "active",
      stage: "contact",
      commission_percent: commissionPercent ? Number(commissionPercent) : null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Сделката е създадена");
    onCreated();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 rounded-lg bg-muted p-1">
        <button type="button" onClick={() => setMode("crm")}
          className={cn("flex-1 rounded-md py-1.5 text-xs font-semibold transition", mode === "crm" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
          CRM клиент
        </button>
        <button type="button" onClick={() => setMode("platform")}
          className={cn("flex-1 rounded-md py-1.5 text-xs font-semibold transition", mode === "platform" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
          Регистриран профил
        </button>
      </div>

      {mode === "crm" ? (
        <div>
          <Label>Клиент от CRM-а</Label>
          {crmClients.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">Нямаш добавени клиенти в CRM-а. Добави от таб „Клиенти".</p>
          ) : (
            <Select value={crmClientId} onValueChange={setCrmClientId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Избери клиент" /></SelectTrigger>
              <SelectContent>
                {crmClients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      ) : (
        <div>
          <Label>Клиент (регистриран профил)</Label>
          <div className="mt-1 flex gap-2">
            <Input placeholder="Търси по име или имейл" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
            <Button size="sm" onClick={search} className="gap-1"><Search className="h-4 w-4" />Търси</Button>
          </div>
          {selectedProfile ? (
            <p className="mt-2 text-sm text-foreground">
              Избран: <span className="font-semibold">{selectedProfile.full_name ?? selectedProfile.email}</span>{" "}
              <button type="button" className="text-xs text-primary underline" onClick={() => setSelectedProfile(null)}>смени</button>
            </p>
          ) : results.length > 0 ? (
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {results.map((r) => (
                <li key={r.id} className="flex items-center justify-between p-2 text-sm">
                  <span className="truncate text-foreground">{r.full_name ?? r.email ?? "Клиент"}</span>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedProfile(r); setResults([]); }}>Избери</Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div>
        <Label>Обява (по желание)</Label>
        <Select value={listingId} onValueChange={setListingId}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без обява</SelectItem>
            {listings.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Комисиона (% от цената на имота)</Label>
        <Input
          type="number" step="0.1" min="0" max="100" placeholder="напр. 3"
          value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)}
          className="mt-1"
        />
      </div>

      <Button className="w-full" disabled={!canCreate || busy} onClick={create}>
        {busy ? "Създаване..." : "Създай сделка"}
      </Button>
    </div>
  );
}
