import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeDealRisk, type DealRiskResult } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { addHistory } from "@/lib/history-storage";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "REMI Правен анализ" },
      { name: "description", content: "Идентификуване на рискове, анализ на собственост и правни проблеми." },
    ],
  }),
  component: RiskPage,
});

const CONSTRUCTION = ["Тухла (старо)", "Тухла (ново)", "ЕПК", "Панел", "Гредоред"];
const DOCS = ["Пълни и в ред", "Липсващи документи", "Тежести (ипотека/запор)", "Неузаконени промени"];

type FormState = {
  price_eur: string;
  location: string;
  construction_type: string;
  document_status: string;
  notes: string;
};

const empty: FormState = {
  price_eur: "",
  location: "",
  construction_type: CONSTRUCTION[0],
  document_status: DOCS[0],
  notes: "",
};

function scoreTone(score: number) {
  if (score <= 3) return { label: "Нисък риск", cls: "bg-success text-success-foreground" };
  if (score <= 6) return { label: "Среден риск", cls: "bg-warning text-warning-foreground" };
  return { label: "Висок риск", cls: "bg-destructive text-destructive-foreground" };
}

function RiskPage() {
  const [f, setF] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DealRiskResult | null>(null);
  const analyze = useServerFn(analyzeDealRisk);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.price_eur || !f.location.trim()) {
      toast.error("Попълни цена и локация");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const r = await analyze({
        data: {
          price_eur: Number(f.price_eur),
          location: f.location.trim(),
          construction_type: f.construction_type,
          document_status: f.document_status,
          notes: f.notes.trim(),
        },
      });
      setResult(r);
      try {
        addHistory({
          kind: "risk",
          location: f.location.trim(),
          price_eur: Number(f.price_eur),
          construction_type: f.construction_type,
          document_status: f.document_status,
          notes: f.notes.trim(),
          result: r,
        });
      } catch {}
    } catch (err: any) {
      toast.error(err?.message ?? "Грешка при анализ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 pt-6">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Начало
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">REMI Правен анализ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Идентификуване на рискове, анализ на собственост и правни проблеми.
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <Label htmlFor="price">Цена (EUR)</Label>
          <Input id="price" inputMode="numeric" required value={f.price_eur}
            onChange={(e) => set("price_eur", e.target.value.replace(/[^\d]/g, ""))} placeholder="напр. 95000" />
        </div>
        <div>
          <Label htmlFor="loc">Локация / квартал</Label>
          <Input id="loc" required value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="напр. Варна, Чайка" />
        </div>
        <div>
          <Label>Тип строителство</Label>
          <Select value={f.construction_type} onValueChange={(v) => set("construction_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CONSTRUCTION.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Състояние на документите</Label>
          <Select value={f.document_status} onValueChange={(v) => set("document_status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DOCS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="n">Допълнителни бележки</Label>
          <Textarea id="n" rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)}
            placeholder="Например: нужда от ремонт, спорни съседи, наличие на наемател..." />
        </div>
        <Button type="submit" className="w-full gap-2" disabled={busy}>
          <Sparkles className="h-4 w-4" />
          {busy ? "Анализиране..." : "Анализирай сделката"}
        </Button>
      </form>

      {result && (
        <section className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Оценка на риска</p>
            <div className="mt-2 flex items-center gap-3">
              <div className={cn("grid h-16 w-16 place-items-center rounded-2xl text-2xl font-black shadow", scoreTone(result.score).cls)}>
                {result.score}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{scoreTone(result.score).label}</p>
                <p className="text-xs text-muted-foreground">Скала от 1 (нисък) до 10 (висок)</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ключови рискове</p>
            {result.risks.map((r, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Препоръка</p>
            <p className="mt-1 text-sm text-foreground">{result.recommendation}</p>
          </div>
        </section>
      )}
    </div>
  );
}
