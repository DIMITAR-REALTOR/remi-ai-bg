import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Plus } from "lucide-react";
import { contractTypeShortLabel, contractStatusLabel, contractStatusTone } from "@/lib/contracts-meta";
import { crmToneClasses, fmtDate } from "@/lib/crm-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard/contracts")({
  component: ContractsList,
});

function ContractsList() {
  const { user } = useAuth();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["my-contracts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id,contract_type,status,created_at,party_a,party_b")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Договори</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Генерирани договори по сделки.</p>
        </div>
        <Link
          to="/dashboard/contracts/new"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />Нов
        </Link>
      </div>

      {isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Зареждане...</p>
      ) : contracts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">Няма създадени договори</p>
          <Link to="/dashboard/contracts/new" className="mt-3 inline-block text-xs font-medium text-primary">
            Създай първия договор →
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {contracts.map((c: any) => (
            <li key={c.id}>
              <Link
                to="/dashboard/contracts/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {contractTypeShortLabel(c.contract_type)}
                    {c.party_a?.name ? ` · ${c.party_a.name}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{fmtDate(c.created_at)}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", crmToneClasses[contractStatusTone(c.status)])}>
                  {contractStatusLabel(c.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
