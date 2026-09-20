import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "@/components/TaskForm";
import { dealStageLabel } from "@/lib/crm-meta";
import { toast } from "sonner";

type ActionDeal = {
  id: string;
  client_id: string | null;
  crm_client_id: string | null;
  listing_id: string | null;
  stage: string;
  ai_context_summary: {
    reasoning: string;
    next_action: string;
    actionable?: boolean;
    action_status?: string;
  } | null;
  clients?: { id: string; name: string } | null;
  listings?: { id: string; title: string } | null;
};

export function ActionCenterWidget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedDeal, setSelectedDeal] = useState<ActionDeal | null>(null);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["action-center-deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("deals")
        .select("id,client_id,crm_client_id,listing_id,stage,ai_context_summary,clients:crm_client_id(id,name),listings:listing_id(id,title)")
        .eq("broker_id", user!.id)
        .neq("stage", "closed")
        .not("ai_context_summary", "is", null)
        .order("last_activity_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActionDeal[];
    },
  });

  const actions = deals.filter((deal) => {
    const summary = deal.ai_context_summary;
    return summary?.next_action && summary.actionable !== false && !["confirmed", "dismissed"].includes(summary.action_status ?? "");
  });

  const updateStatus = async (deal: ActionDeal, action_status: "confirmed" | "dismissed") => {
    if (!deal.ai_context_summary) return;
    const { error } = await (supabase as any)
      .from("deals")
      .update({ ai_context_summary: { ...deal.ai_context_summary, action_status } })
      .eq("id", deal.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["action-center-deals", user?.id] });
    qc.invalidateQueries({ queryKey: ["my-deals", user?.id] });
    setSelectedDeal(null);
    toast.success(action_status === "confirmed" ? "Действието е записано" : "Препоръката е отказана");
  };

  if (isLoading || actions.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">REMI Action Center</h2>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">{actions.length}</span>
      </div>
      <ul className="mt-3 space-y-3">
        {actions.map((deal) => {
          const summary = deal.ai_context_summary!;
          return (
            <li key={deal.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Сделка · {dealStageLabel(deal.stage)}</p>
                  <p className="mt-1 text-sm text-foreground">{summary.next_action}</p>
                </div>
                <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Откажи препоръката" onClick={() => updateStatus(deal, "dismissed")}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{summary.reasoning}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {deal.clients && <Link className="hover:text-primary hover:underline" to="/dashboard/clients/$id" params={{ id: deal.clients.id }}>Клиент: {deal.clients.name}</Link>}
                {deal.listings && <Link className="hover:text-primary hover:underline" to="/dashboard/edit/$id" params={{ id: deal.listings.id }}>Имот: {deal.listings.title}</Link>}
                <Link className="hover:text-primary hover:underline" to="/dashboard/deals">Сделка</Link>
              </div>
              <Button size="sm" className="mt-3" onClick={() => setSelectedDeal(deal)}>Потвърди / редактирай</Button>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Изпълни REMI препоръката</DialogTitle></DialogHeader>
          {selectedDeal && (
            <TaskForm
              initial={{
                title: selectedDeal.ai_context_summary?.next_action ?? "Следваща стъпка по сделката",
                client_id: selectedDeal.crm_client_id ?? "none",
                listing_id: selectedDeal.listing_id ?? "none",
                notes: `Създадено от REMI Action Center за сделка ${selectedDeal.id}.`,
              }}
              onSaved={() => updateStatus(selectedDeal, "confirmed")}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}