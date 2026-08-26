import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, Copy, PenTool } from "lucide-react";
import { toast } from "sonner";
import { contractTypeLabel, contractStatusLabel, contractStatusTone } from "@/lib/contracts-meta";
import { crmToneClasses, fmtDate } from "@/lib/crm-meta";
import { cn } from "@/lib/utils";
import { requestContractSignature } from "@/lib/esignature.functions";

export const Route = createFileRoute("/_app/dashboard/contracts/$id")({
  component: ContractDetail,
});

function ContractDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const requestSign = useServerFn(requestContractSignature);
  const [busySign, setBusySign] = useState<"seller" | "buyer" | null>(null);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("contracts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ["contract-signatures", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("contract_signatures").select("*").eq("contract_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sendForSignature = async (role: "seller" | "buyer") => {
    if (!contract || !user) return;
    const party = role === "seller" ? contract.party_a : contract.party_b;
    if (!party?.name) { toast.error("Липсват данни за страната"); return; }
    setBusySign(role);
    try {
      const res = await requestSign({
        data: {
          contractId: contract.id,
          partyRole: role,
          partyName: party.name,
          partyEmail: "",
          partyPhone: party.phone || "",
          documentText: contract.generated_content,
        },
      });
      await (supabase as any).from("contract_signatures").insert({
        contract_id: contract.id,
        broker_id: user.id,
        party_role: role,
        party_name: party.name,
        party_phone: party.phone || null,
        provider: res.provider,
        provider_request_id: res.providerRequestId,
        status: res.status === "sent" ? "sent" : "not_configured",
      });
      qc.invalidateQueries({ queryKey: ["contract-signatures", id] });
      if (res.status === "not_configured") {
        toast.info(res.message);
      } else {
        toast.success("Изпратено за подпис");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Грешка");
    } finally {
      setBusySign(null);
    }
  };

  const copyText = async () => {
    if (!contract?.generated_content) return;
    await navigator.clipboard.writeText(contract.generated_content);
    toast.success("Копирано");
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;
  if (!contract) return (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Договорът не е намерен.</p>
      <Button asChild className="mt-4"><Link to="/dashboard/contracts">Назад</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-10 print:px-0 print:pt-0">
      <div className="print:hidden">
        <Link to="/dashboard/contracts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />Назад
        </Link>

        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">{contractTypeLabel(contract.contract_type)}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(contract.created_at)}</p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", crmToneClasses[contractStatusTone(contract.status)])}>
            {contractStatusLabel(contract.status)}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={copyText}>
            <Copy className="h-3.5 w-3.5" />Копирай текста
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />Печат
          </Button>
        </div>

        {contract.status === "finalized" && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><PenTool className="h-4 w-4" />Електронен подпис (КЕП)</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Модулът е готов, но чака свързване с лицензиран доставчик — заявките се записват, но не се изпращат реално.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" disabled={busySign === "seller"} onClick={() => sendForSignature("seller")}>
                {busySign === "seller" ? "..." : "Продавач"}
              </Button>
              <Button size="sm" variant="outline" className="flex-1" disabled={busySign === "buyer"} onClick={() => sendForSignature("buyer")}>
                {busySign === "buyer" ? "..." : "Купувач"}
              </Button>
            </div>
            {signatures.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {signatures.map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.party_name} ({s.party_role === "seller" ? "продавач" : "купувач"})</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      s.status === "signed" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {s.status === "not_configured" ? "Чака доставчик" : s.status === "sent" ? "Изпратено" : s.status === "signed" ? "Подписано" : s.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 print:rounded-none print:border-0 print:p-0">
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{contract.generated_content}</pre>
      </div>
    </div>
  );
}
