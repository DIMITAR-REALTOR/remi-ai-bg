import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeMarketScore, type MarketScoreResult } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, ArrowLeft, Sparkles, ChevronDown, ExternalLink, Shield, GraduationCap, Cross, ShoppingCart, Bus, MapPin } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NEIGHBORHOOD_NAMES, getNeighborhood, getComparables } from "@/lib/market-data";
import { PROPERTY_TYPES, fmtPrice } from "@/lib/listings-meta";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Пазарна анализа — REMI AI" },
      { name: "description", content: "AI пазарна оценка, ценови тренди и аналитика на квартали във Варна." },
    ],
  }),
  component: MarketPage,
});

type FormState = {
  location: string;
  property_type: string;
  price_eur: string;
  area_sqm: string;
};

const empty: FormState = {
  location: NEIGHBORHOOD_NAMES[0],
  property_type: PROPERTY_TYPES[0].value,
  price_eur: "",
  area_sqm: "",
};

function scoreTone(score: number) {
  if (score <= 3) return { label: "Добра оферта", cls: "bg-success text-success-foreground" };
  if (score <= 6) return { label: "Средна", cls: "bg-warning text-warning-foreground" };
  return { label: "Надценен", cls: "bg-destructive text-destructive-foreground" };
}

function MarketPage() {
  const [f, setF] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MarketScoreResult | null>(null);
  const [trendOpen, setTrendOpen] = useState(true);
  const analyze = useServerFn(analyzeMarketScore);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const nb = useMemo(() => getNeighborhood(f.location), [f.location]);
  const area = Number(f.area_sqm) || 75;
  const comparables = useMemo(
    () => getComparables(f.location, PROPERTY_TYPES.find(t => t.value === f.property_type)?.label ?? "Имот", area),
    [f.location, f.property_type, area]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.location.trim() || !f.price_eur || !f.area_sqm) {
      toast.error("Попълни локация, цена и площ");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const r = await analyze({
        data: {
          location: f.location.trim(),
          property_type: PROPERTY_TYPES.find(t => t.value === f.property_type)?.label ?? f.property_type,
          price_eur: Number(f.price_eur),
          area_sqm: Number(f.area_sqm),
        },
      });
      setResult(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Грешка при анализ");
    } finally {
      setBusy(false);
    }
  };

  const tone = result ? scoreTone(result.score) : null;

  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-10">
      <Link to="/tools" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />Към инструменти
      </Link>

      <header className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Пазарна анализа</h1>
          <p className="mt-1 text-sm text-muted-foreground">AI оценка, тренди и аналитика на район.</p>
        </div>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Локация / квартал</Label>
          <Select value={f.location} onValueChange={(v) => set("location", v)}>
            <SelectTrigger id="location"><SelectValue /></SelectTrigger>
            <SelectContent>
              {NEIGHBORHOOD_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ptype">Тип имот</Label>
          <Select value={f.property_type} onValueChange={(v) => set("property_type", v)}>
            <SelectTrigger id="ptype"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Цена (EUR)</Label>
            <Input id="price" inputMode="numeric" value={f.price_eur} onChange={(e) => set("price_eur", e.target.value.replace(/\D/g, ""))} placeholder="120000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area">Площ (кв.м)</Label>
            <Input id="area" inputMode="numeric" value={f.area_sqm} onChange={(e) => set("area_sqm", e.target.value.replace(/\D/g, ""))} placeholder="75" />
          </div>
        </div>

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Анализирам..." : (<><Sparkles className="h-4 w-4" />Изчисли пазарна оценка</>)}
        </Button>
      </form>

      {result && tone && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Пазарна оценка</p>
              <p className="mt-0.5 text-2xl font-black text-foreground">{result.score}/10</p>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-xs font-bold", tone.cls)}>{tone.label}</span>
          </div>
          <p className="mt-3 text-sm text-foreground">{result.summary}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="mb-1 font-semibold text-success">Предимства</p>
              <ul className="space-y-1 text-muted-foreground">
                {result.pros.map((p, i) => <li key={i}>• {p}</li>)}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-semibold text-destructive">Недостатъци</p>
              <ul className="space-y-1 text-muted-foreground">
                {result.cons.map((c, i) => <li key={i}>• {c}</li>)}
              </ul>
            </div>
          </div>
        </section>
      )}

      <Collapsible open={trendOpen} onOpenChange={setTrendOpen} className="mt-5 rounded-2xl border border-border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
          <span className="text-sm font-semibold text-foreground">📈 Ценови тренди — {nb.name}</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", trendOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-2 pb-4">
          <p className="px-2 pb-2 text-xs text-muted-foreground">Средна цена €/кв.м за последните 6 месеца</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={nb.trend} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`€${v}/кв.м`, "Цена"]}
                />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Подобни имоти</h2>
        <div className="space-y-2">
          {comparables.map((c, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-3">
              <p className="text-sm font-semibold text-foreground">{c.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.location} • {c.rooms} стаи • {c.area_sqm} кв.м</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-primary">{fmtPrice(c.price_eur)}</span>
                <a href={c.imot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  Виж на imot.bg <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <Tabs defaultValue="area" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="area">🏘️ Район — {nb.name}</TabsTrigger>
          </TabsList>
          <TabsContent value="area" className="mt-3 space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Безопасност</span>
                </div>
                <span className="text-sm font-bold text-foreground">{nb.safety}/10</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${nb.safety * 10}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Инфраструктура</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-primary/5 p-3">
                  <GraduationCap className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-lg font-bold text-foreground">{nb.infrastructure.schools}</p>
                  <p className="text-[10px] text-muted-foreground">Училища</p>
                </div>
                <div className="rounded-xl bg-primary/5 p-3">
                  <Cross className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-lg font-bold text-foreground">{nb.infrastructure.hospitals}</p>
                  <p className="text-[10px] text-muted-foreground">Болници</p>
                </div>
                <div className="rounded-xl bg-primary/5 p-3">
                  <ShoppingCart className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-lg font-bold text-foreground">{nb.infrastructure.supermarkets}</p>
                  <p className="text-[10px] text-muted-foreground">Магазини</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Транспорт</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground"><Bus className="h-4 w-4 text-primary" />До спирка</span>
                  <span className="font-semibold text-foreground">{nb.transport.busDistanceM} м</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />До центъра</span>
                  <span className="font-semibold text-foreground">{nb.transport.cityCenterKm} км</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
