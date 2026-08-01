import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Handshake, CheckCircle2 } from "lucide-react";
import { fmtDate } from "@/lib/crm-meta";
import { StarRow } from "@/components/RatingBadge";

export const Route = createFileRoute("/_app/dashboard/deals")({
  component: DealsPage,
});

type DealRow = {
  id: string;
  client_id: string;
  listing_id: string | null;
  status: string;
  closed_at: string | null;
  created_at: string;
  profiles?: { id: string; full_name: string | null; email: string | null } | null;
  listings?: { id: string; title: string } | null;
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
        .select("id, client_id, listing_id, status, closed_at, created_at, profiles:client_id(id,full_name,email), listings:listing_id(id,title)")
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

  const complete = async (id: string) => {
    setBusy(true);
    const { error } = await (supabase as any)
      .from("deals").update({ status: "completed", closed_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Сделката е приключена");
    qc.invalidateQueries({ queryKey: ["my-deals", user?.id] });
  };

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

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Зареждане...</p>
      ) : deals.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
          <Handshake className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">Няма сделки</p>
          <p className="mt-1 text-xs text-muted-foreground">Свържи регистриран клиент със сделка, за да получиш ревю след приключване.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {deals.map((d) => {
            const rev = reviews.find((r) => r.deal_id === d.id);
            return (
              <li key={d.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{d.profiles?.full_name ?? d.profiles?.email ?? "Клиент"}</p>
                    {d.listings?.title && <p className="truncate text-xs text-muted-foreground">{d.listings.title}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">Създадена: {fmtDate(d.created_at)}</p>
                  </div>
                  <span className={
                    d.status === "completed"
                      ? "shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success"
                      : "shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary"
                  }>
                    {d.status === "completed" ? "Приключена" : "Активна"}
                  </span>
                </div>

                {d.status === "active" && (
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" disabled={busy} onClick={() => complete(d.id)}>
                    <CheckCircle2 className="h-4 w-4" />Приключи сделката
                  </Button>
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

function NewDealForm({ brokerId, onCreated }: { brokerId: string; onCreated: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ClientProfile[]>([]);
  const [selected, setSelected] = useState<ClientProfile | null>(null);
  const [listingId, setListingId] = useState<string>("none");
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

  const create = async () => {
    if (!selected) return;
    setBusy(true);
    const { error } = await (supabase as any).from("deals").insert({
      broker_id: brokerId,
      client_id: selected.id,
      listing_id: listingId === "none" ? null : listingId,
      status: "active",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Сделката е създадена");
    onCreated();
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Клиент (регистриран профил)</Label>
        <div className="mt-1 flex gap-2">
          <Input placeholder="Търси по име или имейл" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
          <Button size="sm" onClick={search} className="gap-1"><Search className="h-4 w-4" />Търси</Button>
        </div>
        {selected ? (
          <p className="mt-2 text-sm text-foreground">
            Избран: <span className="font-semibold">{selected.full_name ?? selected.email}</span>{" "}
            <button type="button" className="text-xs text-primary underline" onClick={() => setSelected(null)}>смени</button>
          </p>
        ) : results.length > 0 ? (
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {results.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-2 text-sm">
                <span className="truncate text-foreground">{r.full_name ?? r.email ?? "Клиент"}</span>
                <Button size="sm" variant="ghost" onClick={() => { setSelected(r); setResults([]); }}>Избери</Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

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

      <Button className="w-full" disabled={!selected || busy} onClick={create}>
        {busy ? "Създаване..." : "Създай сделка"}
      </Button>
    </div>
  );
}
