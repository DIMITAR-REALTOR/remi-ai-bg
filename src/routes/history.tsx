import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  listHistory,
  removeHistory,
  clearHistory,
  formatDate,
  type HistoryItem,
} from "@/lib/history-storage";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, ArrowLeft, Trash2, ShieldAlert, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "История — AI Estate Pro" },
      { name: "description", content: "Запазени анализи на риск и инвестиционни калкулации." },
    ],
  }),
  component: HistoryPage,
});

function scoreTone(score: number) {
  if (score <= 3) return "bg-success text-success-foreground";
  if (score <= 6) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(listHistory());
    setHydrated(true);
  }, []);

  const refresh = () => setItems(listHistory());

  const onDelete = (id: string) => {
    removeHistory(id);
    refresh();
  };

  const onClear = () => {
    if (confirm("Изчисти цялата история?")) {
      clearHistory();
      refresh();
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-8">
      <Link to="/tools" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Инструменти
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <HistoryIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">История</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Запазени анализи и калкулации в този браузър.
          </p>
        </div>
      </header>

      {!hydrated ? null : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Все още няма запазени резултати.</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/risk" className="text-sm font-semibold text-primary hover:underline">
              Стартирай анализ на сделка →
            </Link>
            <Link to="/calculator" className="text-sm font-semibold text-primary hover:underline">
              Изчисли инвестиция →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            {items.map((it) => {
              const isOpen = open === it.id;
              return (
                <article key={it.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : it.id)}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent/40"
                  >
                    <div className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                      it.kind === "risk" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                    )}>
                      {it.kind === "risk" ? <ShieldAlert className="h-5 w-5" /> : <Calculator className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {it.kind === "risk" ? "Анализ на сделка" : "Калкулация"}
                        </p>
                        {it.kind === "risk" ? (
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", scoreTone(it.result.score))}>
                            {it.result.score}/10
                          </span>
                        ) : (
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            it.results.roi >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                          )}>
                            ROI {it.results.roi.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {it.location} · {it.kind === "risk" ? `€${it.price_eur.toLocaleString("bg-BG")}` : `€${it.inputs.price.toLocaleString("bg-BG")}`}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(it.createdAt)}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-border bg-background/40 p-4">
                      {it.kind === "risk" ? <RiskDetails item={it} /> : <CalcDetails item={it} />}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full gap-2 text-destructive hover:text-destructive"
                        onClick={() => onDelete(it.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Изтрий запис
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <Button variant="outline" className="mt-6 w-full gap-2 text-destructive hover:text-destructive" onClick={onClear}>
            <Trash2 className="h-4 w-4" /> Изчисти цялата история
          </Button>
        </>
      )}
    </div>
  );
}

function RiskDetails({ item }: { item: Extract<HistoryItem, { kind: "risk" }> }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Meta label="Тип строителство" value={item.construction_type} />
        <Meta label="Документи" value={item.document_status} />
      </div>
      <div className="space-y-2">
        {item.result.risks.map((r, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm font-semibold text-foreground">{i + 1}. {r.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Препоръка</p>
        <p className="mt-1 text-xs text-foreground">{item.result.recommendation}</p>
      </div>
    </div>
  );
}

function CalcDetails({ item }: { item: Extract<HistoryItem, { kind: "calc" }> }) {
  const r = item.results;
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <Meta label="Месечна вноска" value={`€${Math.round(r.monthlyPayment).toLocaleString("bg-BG")}`} />
      <Meta label="Паричен поток" value={`${r.cashFlow >= 0 ? "+" : ""}€${Math.round(r.cashFlow).toLocaleString("bg-BG")}`} />
      <Meta label="Брутна доходност" value={`${r.grossYield.toFixed(2)}%`} />
      <Meta label="ROI" value={`${r.roi.toFixed(2)}%`} />
      <Meta label="Самоучастие" value={`€${item.inputs.down.toLocaleString("bg-BG")}`} />
      <Meta label="Срок" value={`${item.inputs.years} г.`} />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
