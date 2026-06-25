import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeMarketScore, type MarketScoreResult } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  TrendingUp, ArrowLeft, Sparkles, ChevronDown, Shield, GraduationCap, Cross,
  ShoppingCart, Bus, MapPin, Phone, Mail, Building2,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NEIGHBORHOOD_NAMES, getNeighborhood } from "@/lib/market-data";
import { PROPERTY_TYPES, fmtPrice, propertyTypeLabel } from "@/lib/listings-meta";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Пазарна анализа — REMI AI" },
      { name: "description", content: "AI пазарна оценка 1-100, ценови тренди и подобни имоти във Варна." },
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

function aiScoreTone(score: number) {
  if (score <= 3) return { label: "Добра оферта", cls: "bg-success text-success-foreground" };
  if (score <= 6) return { label: "Средна", cls: "bg-warning text-warning-foreground" };
  return { label: "Надценен", cls: "bg-destructive text-destructive-foreground" };
}

function marketScoreColor(score: number) {
  if (score >= 70) return "hsl(var(--success, 142 71% 45%))";
  if (score >= 40) return "hsl(var(--warning, 38 92% 50%))";
  return "hsl(var(--destructive))";
}

function CircularScore({ score }: { score: number }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = marketScoreColor(score);
  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r={radius} stroke={color} strokeWidth="10" fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="text-center">
        <div className="text-3xl font-black text-foreground leading-none">{score}</div>
        <div className="text-[10px] font-medium text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
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
  const price = Number(f.price_eur) || 0;

  // Market Score 1-100: blend AI inverse + neighborhood safety + price stability
  const marketScore = useMemo(() => {
    if (!result) return null;
    const priceStability = Math.max(20, Math.min(100, 100 - Math.abs(((price / area) - nb.avgPricePerSqm) / nb.avgPricePerSqm) * 100));
    const aiPositioning = (11 - result.score) * 10; // 10..100
    const demandIndex = nb.safety * 10; // proxy
    return Math.round((priceStability + aiPositioning + demandIndex) / 3);
  }, [result, price, area, nb]);

  // Real comparables from DB
  const { data: comparables = [], isLoading: compsLoading } = useQuery({
    queryKey: ["market-comparables", f.location, f.property_type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,price_eur,area_sqm,rooms,city,neighborhood,property_type,photos,broker_id,created_at")
        .eq("status", "active")
        .eq("property_type", f.property_type)
        .ilike("neighborhood", `%${f.location}%`)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      const listings = data ?? [];
      const ids = Array.from(new Set(listings.map((l: any) => l.broker_id).filter(Boolean)));
      if (ids.length === 0) return listings.map((l: any) => ({ ...l, broker: null }));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name,phone,email,agency_name,city")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return listings.map((l: any) => ({ ...l, broker: map.get(l.broker_id) ?? null }));
    },
  });

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
          property_type: propertyTypeLabel(f.property_type),
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

  const tone = result ? aiScoreTone(result.score) : null;

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
          <p className="mt-1 text-sm text-muted-foreground">Market Score, тренди и подобни имоти.</p>
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

      {result && tone && marketScore !== null && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <CircularScore score={marketScore} />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market Score</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Пазарната активност е <span className="font-bold">{marketScore}/100</span>
              </p>
              <span className={cn("mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold", tone.cls)}>
                AI: {tone.label} ({result.score}/10)
              </span>
            </div>
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
        <h2 className="mb-2 text-sm font-semibold text-foreground">🏠 Подобни имоти на пазара</h2>
        {compsLoading ? (
          <p className="text-center text-xs text-muted-foreground">Зареждане...</p>
        ) : comparables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Няма активни обяви в {nb.name} за {propertyTypeLabel(f.property_type).toLowerCase()}.
          </div>
        ) : (
          <div className="space-y-2">
            {comparables.map((c: any) => {
              const photo = Array.isArray(c.photos) && c.photos[0] ? c.photos[0] : null;
              return (
                <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex gap-3 p-3">
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                      {photo ? (
                        <img src={photo} alt={c.title} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to="/listing/$id" params={{ id: c.id }} className="block">
                        <p className="line-clamp-1 text-sm font-semibold text-foreground">{c.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[c.neighborhood, c.city].filter(Boolean).join(", ")}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {c.area_sqm} кв.м{c.rooms ? ` • ${c.rooms} стаи` : ""}
                        </p>
                      </Link>
                      <p className="mt-1 text-sm font-bold text-primary">{fmtPrice(c.price_eur)}</p>
                    </div>
                  </div>
                  {c.broker && (
                    <div className="border-t border-border bg-muted/30 px-3 py-2">
                      <p className="text-xs font-semibold text-foreground">{c.broker.full_name ?? "Брокер"}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {c.broker.phone && (
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-primary" />{c.broker.phone}</span>
                        )}
                        {c.broker.email && (
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3 text-primary" />{c.broker.email}</span>
                        )}
                      </div>
                      {c.broker.phone && (
                        <Button asChild size="sm" className="mt-2 h-8 w-full gap-1.5 text-xs">
                          <a href={`tel:${c.broker.phone}`}><Phone className="h-3 w-3" />Свържи се с брокер</a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">🏘️ Районна аналитика — {nb.name}</h2>
        <div className="space-y-3">
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
        </div>
      </section>
    </div>
  );
}
