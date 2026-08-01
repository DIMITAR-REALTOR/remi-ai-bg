import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Handshake, Star } from "lucide-react";
import { fmtDate } from "@/lib/crm-meta";
import { StarRow } from "@/components/RatingBadge";

export const Route = createFileRoute("/_app/deals")({
  component: MyDealsPage,
  head: () => ({
    meta: [
      { title: "Моите сделки | REMI AI" },
      { name: "description", content: "Преглед на твоите сделки с брокери и оставяне на ревю след приключване." },
      { property: "og:title", content: "Моите сделки | REMI AI" },
      { property: "og:description", content: "Преглед на твоите сделки с брокери и оставяне на ревю след приключване." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type DealRow = {
  id: string;
  broker_id: string;
  status: string;
  closed_at: string | null;
  created_at: string;
  profiles?: { id: string; full_name: string | null } | null;
  listings?: { id: string; title: string } | null;
};

type ReviewRow = { deal_id: string; rating: number; comment: string | null };

function MyDealsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["client-deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("deals")
        .select("id, broker_id, status, closed_at, created_at, profiles:broker_id(id,full_name), listings:listing_id(id,title)")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DealRow[];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["client-reviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("broker_reviews").select("deal_id, rating, comment").eq("client_id", user!.id);
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["client-reviews", user?.id] });
    qc.invalidateQueries({ queryKey: ["broker-ratings"] });
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-8">
      <h1 className="text-2xl font-black text-foreground">Моите сделки</h1>
      <p className="mt-1 text-sm text-muted-foreground">Приключените сделки може да оцениш с ревю за брокера.</p>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Зареждане...</p>
      ) : deals.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
          <Handshake className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">Все още нямаш сделки</p>
          <p className="mt-1 text-xs text-muted-foreground">Брокер може да те свърже със сделка от своя профил.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {deals.map((d) => {
            const rev = reviews.find((r) => r.deal_id === d.id);
            return (
              <li key={d.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{d.profiles?.full_name ?? "Брокер"}</p>
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

                {rev ? (
                  <div className="mt-3 rounded-xl bg-muted/50 p-2.5">
                    <StarRow value={rev.rating} />
                    {rev.comment && <p className="mt-1 text-xs text-muted-foreground">{rev.comment}</p>}
                  </div>
                ) : d.status === "completed" ? (
                  <ReviewForm dealId={d.id} brokerId={d.broker_id} clientId={user!.id} onSaved={refresh} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReviewForm({ dealId, brokerId, clientId, onSaved }: { dealId: string; brokerId: string; clientId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (rating < 1) { toast.error("Моля, избери оценка от 1 до 5 звезди."); return; }
    setBusy(true);
    const { error } = await (supabase as any).from("broker_reviews").insert({
      deal_id: dealId,
      broker_id: brokerId,
      client_id: clientId,
      rating,
      comment: comment.trim() ? comment.trim().slice(0, 1000) : null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Благодарим за ревюто!");
    setOpen(false);
    onSaved();
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setOpen(true)}>
        <Star className="h-4 w-4" />Остави ревю
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-border p-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} звезди`} onClick={() => setRating(n)}>
            <Star className={n <= rating ? "h-6 w-6 fill-primary text-primary" : "h-6 w-6 text-muted-foreground"} />
          </button>
        ))}
      </div>
      <Textarea rows={3} placeholder="Коментар (по желание)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={submit}>{busy ? "Изпращане..." : "Изпрати"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Отказ</Button>
      </div>
    </div>
  );
}
