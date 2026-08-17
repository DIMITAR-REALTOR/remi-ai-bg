import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, Copy } from "lucide-react";
import { toast } from "sonner";
import { contractTypeLabel, contractStatusLabel, contractStatusTone } from "@/lib/contracts-meta";
import { crmToneClasses, fmtDate } from "@/lib/crm-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard/contracts/$id")({
  component: ContractDetail,
});

function ContractDetail() {
  const { id } = Route.useParams();

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("contracts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 print:rounded-none print:border-0 print:p-0">
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{contract.generated_content}</pre>
      </div>
    </div>
  );
}
