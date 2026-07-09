import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowLeft, Save } from "lucide-react";
import { addHistory, type CalcInputs, type CalcResults } from "@/lib/history-storage";
import { toast } from "sonner";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Инвестиционен калкулатор — AI Estate Pro" },
      { name: "description", content: "Изчисли месечна вноска, паричен поток и доходност на инвестиционен имот." },
    ],
  }),
  component: CalculatorPage,
});

type FormState = {
  price: string;
  down: string;
  rate: string;
  years: string;
  rent: string;
  expenses: string;
  location: string;
};

const empty: FormState = {
  price: "",
  down: "",
  rate: "3.5",
  years: "25",
  rent: "",
  expenses: "",
  location: "",
};

function calc(i: CalcInputs): CalcResults {
  const loan = Math.max(0, i.price - i.down);
  const r = i.rate / 100 / 12;
  const n = i.years * 12;
  const monthlyPayment =
    n > 0 && r > 0
      ? (loan * r) / (1 - Math.pow(1 + r, -n))
      : n > 0
        ? loan / n
        : 0;
  const cashFlow = i.rent - monthlyPayment - i.expenses;
  const grossYield = i.price > 0 ? ((i.rent * 12) / i.price) * 100 : 0;
  const roi = i.down > 0 ? ((cashFlow * 12) / i.down) * 100 : 0;
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    cashFlow: Math.round(cashFlow * 100) / 100,
    grossYield: Math.round(grossYield * 100) / 100,
    roi: Math.round(roi * 100) / 100,
  };
}

function fmt(n: number) {
  return new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 0 }).format(Math.round(n));
}

function num(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function CalculatorPage() {
  const [f, setF] = useState<FormState>(empty);
  const [results, setResults] = useState<CalcResults | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputs: CalcInputs = {
      price: num(f.price),
      down: num(f.down),
      rate: num(f.rate),
      years: num(f.years),
      rent: num(f.rent),
      expenses: num(f.expenses),
    };
    if (inputs.price <= 0) {
      toast.error("Въведи цена на имота");
      return;
    }
    setResults(calc(inputs));
  };

  const saveToHistory = () => {
    if (!results) return;
    const inputs: CalcInputs = {
      price: num(f.price),
      down: num(f.down),
      rate: num(f.rate),
      years: num(f.years),
      rent: num(f.rent),
      expenses: num(f.expenses),
    };
    addHistory({
      kind: "calc",
      location: f.location.trim() || "—",
      inputs,
      results,
    });
    toast.success("Записано в История");
  };

  const tone = (v: number) =>
    v > 0 ? "text-success" : v < 0 ? "text-destructive" : "text-foreground";

  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-8">
      <Link to="/tools" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Инструменти
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Инвестиционен калкулатор</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Оцени дали имотът е добра инвестиция за отдаване под наем.
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <Label htmlFor="loc">Локация (по избор)</Label>
          <Input id="loc" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="напр. Варна, Чайка" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="price">Цена на имота (€)</Label>
            <Input id="price" inputMode="numeric" required value={f.price}
              onChange={(e) => set("price", e.target.value.replace(/[^\d.,]/g, ""))} placeholder="120000" />
          </div>
          <div>
            <Label htmlFor="down">Самоучастие (€)</Label>
            <Input id="down" inputMode="numeric" value={f.down}
              onChange={(e) => set("down", e.target.value.replace(/[^\d.,]/g, ""))} placeholder="30000" />
          </div>
          <div>
            <Label htmlFor="rate">Лихва по кредит (%)</Label>
            <Input id="rate" inputMode="decimal" value={f.rate}
              onChange={(e) => set("rate", e.target.value.replace(/[^\d.,]/g, ""))} />
          </div>
          <div>
            <Label htmlFor="years">Срок (години)</Label>
            <Input id="years" inputMode="numeric" value={f.years}
              onChange={(e) => set("years", e.target.value.replace(/[^\d]/g, ""))} />
          </div>
          <div>
            <Label htmlFor="rent">Очакван месечен наем (€)</Label>
            <Input id="rent" inputMode="numeric" value={f.rent}
              onChange={(e) => set("rent", e.target.value.replace(/[^\d.,]/g, ""))} placeholder="600" />
          </div>
          <div>
            <Label htmlFor="exp">Месечни разходи (€)</Label>
            <Input id="exp" inputMode="numeric" value={f.expenses}
              onChange={(e) => set("expenses", e.target.value.replace(/[^\d.,]/g, ""))} placeholder="80" />
          </div>
        </div>
        <Button type="submit" className="w-full">Изчисли</Button>
      </form>

      {results && (
        <section className="mt-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Резултати</p>

          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Месечна вноска по кредит" value={`€${fmt(results.monthlyPayment)}`} />
            <ResultCard
              label="Месечен паричен поток"
              value={`${results.cashFlow >= 0 ? "+" : ""}€${fmt(results.cashFlow)}`}
              valueClass={tone(results.cashFlow)}
            />
            <ResultCard label="Брутна доходност" value={`${results.grossYield.toFixed(2)}%`} />
            <ResultCard
              label="Очаквана годишна възвръщаемост"
              value={`${results.roi.toFixed(2)}%`}
              valueClass={tone(results.roi)}
            />
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={saveToHistory}>
            <Save className="h-4 w-4" /> Запази в История
          </Button>

          <p className="text-xs text-muted-foreground">
            Изчисленията са ориентировъчни и не включват данъци при покупка, нотариални такси и периоди без наемател.
          </p>
        </section>
      )}
    </div>
  );
}

function ResultCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-black tracking-tight ${valueClass ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}
