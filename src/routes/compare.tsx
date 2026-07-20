import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowUpDown, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { compareProperties, type CompareResult } from "@/lib/ai.functions";
import { fmtPrice, propertyTypeLabel } from "@/lib/listings-meta";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ listing: z.string().optional() });

export const Route = createFileRoute("/compare")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Сравнение на имоти — REMI AI" },
      { name: "description", content: "Сравни до 3 имота с AI — цена, локация, площ, €/кв.м." },
    ],
  }),
  component: ComparePage,
});

type Mode = "remi" | "manual";
type Slot = {
  id: string;
  mode: Mode;
  // remi
  query: string;
  results: SearchResult[];
  searching: boolean;
  selectedId: string | null;
  // shared fields
  label: string;
  property_type: string;
  location: string;
  price_eur: string;
  area_sqm: string;
  rooms: string;
  floor: string;
  source: string;
};

type SearchResult = {
  id: string;
  title: string;
  property_type: string;
  price_eur: number;
  area_sqm: number | null;
  rooms: number | null;
  floor: number | null;
  city: string | null;
  neighborhood: string | null;
};

function makeSlot(): Slot {
  return {
    id: crypto.randomUUID(),
    mode: "remi",
    query: "",
    results: [],
    searching: false,
    selectedId: null,
    label: "",
    property_type: "",
    location: "",
    price_eur: "",
    area_sqm: "",
    rooms: "",
    floor: "",
    source: "REMI AI",
  };
}

function applyListing(slot: Slot, r: SearchResult): Slot {
  return {
    ...slot,
    selectedId: r.id,
    label: r.title,
    property_type: r.property_type,
    location: [r.neighborhood, r.city].filter(Boolean).join(", "),
    price_eur: String(r.price_eur ?? ""),
    area_sqm: r.area_sqm != null ? String(r.area_sqm) : "",
    rooms: r.rooms != null ? String(r.rooms) : "",
    floor: r.floor != null ? String(r.floor) : "",
    source: "REMI AI",
  };
}

function ComparePage() {
  const { listing } = Route.useSearch();
  const [slots, setSlots] = useState<Slot[]>(() => [makeSlot(), makeSlot()]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const compare = useServerFn(compareProperties);

  // Preload listing from ?listing=<id> into slot 1
  useEffect(() => {
    if (!listing) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,property_type,price_eur,area_sqm,rooms,floor,city,neighborhood")
        .eq("id", listing)
        .maybeSingle();
      if (cancelled || !data) return;
      setSlots((prev) => {
        const next = [...prev];
        next[0] = applyListing({ ...next[0], mode: "remi", query: data.title }, data as SearchResult);
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [listing]);

  const updateSlot = (id: string, patch: Partial<Slot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const setMode = (id: string, mode: Mode) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id !== id
          ? s
          : mode === s.mode
            ? s
            : { ...makeSlot(), id: s.id, mode, source: mode === "remi" ? "REMI AI" : "" },
      ),
    );
  };

  const removeSlot = (id: string) => {
    setSlots((prev) => (prev.length <= 2 ? prev : prev.filter((s) => s.id !== id)));
  };

  const addSlot = () => {
    setSlots((prev) => (prev.length >= 3 ? prev : [...prev, makeSlot()]));
  };

  const runSearch = async (slot: Slot) => {
    const q = slot.query.trim();
    if (q.length < 2) {
      toast.error("Въведи поне 2 символа");
      return;
    }
    updateSlot(slot.id, { searching: true });
    const like = `%${q}%`;
    const { data, error } = await supabase
      .from("listings")
      .select("id,title,property_type,price_eur,area_sqm,rooms,floor,city,neighborhood")
      .eq("status", "active")
      .or(`title.ilike.${like},city.ilike.${like},neighborhood.ilike.${like}`)
      .limit(10);
    updateSlot(slot.id, { searching: false, results: (data ?? []) as SearchResult[] });
    if (error) toast.error("Грешка при търсене");
    else if (!data || data.length === 0) toast.info("Няма намерени имоти");
  };

  const onCompare = async () => {
    const items = slots.map((s, i) => {
      const price = Number(s.price_eur);
      const area = Number(s.area_sqm);
      const rooms = s.rooms ? Number(s.rooms) : undefined;
      const floor = s.floor ? Number(s.floor) : undefined;
      return {
        label: (s.label || `Имот ${i + 1}`).trim(),
        property_type: s.property_type.trim(),
        location: s.location.trim(),
        price_eur: price,
        area_sqm: area,
        rooms,
        floor,
        source: (s.source || (s.mode === "remi" ? "REMI AI" : "външен")).trim(),
      };
    });

    for (const [i, it] of items.entries()) {
      if (!it.property_type || !it.location || !Number.isFinite(it.price_eur) || it.price_eur <= 0 || !Number.isFinite(it.area_sqm) || it.area_sqm <= 0) {
        toast.error(`Попълни всички задължителни полета за имот ${i + 1}`);
        return;
      }
    }

    // Ensure unique labels
    const seen = new Set<string>();
    items.forEach((it, i) => {
      let l = it.label;
      let n = 2;
      while (seen.has(l)) l = `${it.label} (${n++})`;
      seen.add(l);
      items[i].label = l;
    });

    setBusy(true);
    setResult(null);
    try {
      const r = await compare({ data: { items } });
      setResult(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Грешка при сравнение");
    } finally {
      setBusy(false);
    }
  };

  const pricePerSqm = (s: Slot) => {
    const p = Number(s.price_eur);
    const a = Number(s.area_sqm);
    if (!Number.isFinite(p) || !Number.isFinite(a) || a <= 0) return "—";
    return `€${Math.round(p / a).toLocaleString("bg-BG")}`;
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pt-6 pb-8">
      <Link to="/tools" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Инструменти
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ArrowUpDown className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Сравнение на имоти</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Сравни 2–3 имота — от REMI AI или ръчно въведени.
          </p>
        </div>
      </header>

      <div className="mt-6 space-y-4">
        {slots.map((s, i) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">Имот {i + 1}</p>
              {slots.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeSlot(s.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Премахни"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1">
              {(["remi", "manual"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(s.id, m)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    s.mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "remi" ? "От REMI AI" : "Ръчно въвеждане"}
                </button>
              ))}
            </div>

            {s.mode === "remi" ? (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={s.query}
                    onChange={(e) => updateSlot(s.id, { query: e.target.value })}
                    placeholder="Търси по заглавие, град, квартал..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runSearch(s))}
                  />
                  <Button type="button" variant="outline" onClick={() => runSearch(s)} disabled={s.searching} className="gap-1">
                    {s.searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {s.results.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                    {s.results.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => updateSlot(s.id, applyListing(s, r))}
                        className={cn(
                          "block w-full border-b border-border px-3 py-2 text-left text-xs last:border-b-0 hover:bg-muted",
                          s.selectedId === r.id && "bg-primary/10",
                        )}
                      >
                        <p className="truncate font-semibold text-foreground">{r.title}</p>
                        <p className="text-muted-foreground">
                          {fmtPrice(r.price_eur)} · {propertyTypeLabel(r.property_type)} · {[r.neighborhood, r.city].filter(Boolean).join(", ")}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {s.selectedId && (
                  <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">{s.label}</p>
                    <p>{propertyTypeLabel(s.property_type)} · {s.location}</p>
                    <p>{fmtPrice(Number(s.price_eur))} · {s.area_sqm} кв.м</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Заглавие / етикет</Label>
                  <Input value={s.label} onChange={(e) => updateSlot(s.id, { label: e.target.value })} placeholder="напр. Имот от imot.bg" />
                </div>
                <div className="col-span-2">
                  <Label>Тип имот</Label>
                  <Input value={s.property_type} onChange={(e) => updateSlot(s.id, { property_type: e.target.value })} placeholder="напр. 2-стаен" />
                </div>
                <div className="col-span-2">
                  <Label>Локация</Label>
                  <Input value={s.location} onChange={(e) => updateSlot(s.id, { location: e.target.value })} placeholder="напр. Варна, Чайка" />
                </div>
                <div>
                  <Label>Цена (€)</Label>
                  <Input inputMode="numeric" value={s.price_eur} onChange={(e) => updateSlot(s.id, { price_eur: e.target.value })} />
                </div>
                <div>
                  <Label>Площ (кв.м)</Label>
                  <Input inputMode="numeric" value={s.area_sqm} onChange={(e) => updateSlot(s.id, { area_sqm: e.target.value })} />
                </div>
                <div>
                  <Label>Стаи</Label>
                  <Input inputMode="numeric" value={s.rooms} onChange={(e) => updateSlot(s.id, { rooms: e.target.value })} />
                </div>
                <div>
                  <Label>Етаж</Label>
                  <Input inputMode="numeric" value={s.floor} onChange={(e) => updateSlot(s.id, { floor: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Източник</Label>
                  <Input value={s.source} onChange={(e) => updateSlot(s.id, { source: e.target.value })} placeholder="напр. imot.bg" />
                </div>
              </div>
            )}
          </div>
        ))}

        {slots.length < 3 && (
          <Button type="button" variant="outline" onClick={addSlot} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Добави имот
          </Button>
        )}

        <Button type="button" onClick={onCompare} disabled={busy} className="w-full gap-2">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Сравнявам...</> : <><Sparkles className="h-4 w-4" /> Сравни с AI</>}
        </Button>
      </div>

      {/* Comparison table */}
      <section className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Показател</th>
              {slots.map((s, i) => (
                <th key={s.id} className="px-3 py-2 text-left font-semibold text-foreground">
                  {s.label || `Имот ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { k: "Цена", v: (s: Slot) => (s.price_eur ? fmtPrice(Number(s.price_eur)) : "—") },
              { k: "€/кв.м", v: pricePerSqm },
              { k: "Площ", v: (s: Slot) => (s.area_sqm ? `${s.area_sqm} кв.м` : "—") },
              { k: "Стаи", v: (s: Slot) => s.rooms || "—" },
              { k: "Етаж", v: (s: Slot) => s.floor || "—" },
              { k: "Локация", v: (s: Slot) => s.location || "—" },
              { k: "Източник", v: (s: Slot) => s.source || "—" },
            ].map((row) => (
              <tr key={row.k}>
                <td className="px-3 py-2 text-xs font-semibold text-muted-foreground">{row.k}</td>
                {slots.map((s) => (
                  <td key={s.id} className="px-3 py-2 text-foreground">{row.v(s)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {result && (
        <section className="mt-6 space-y-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">AI обобщение</p>
            <p className="mt-2 text-sm text-foreground">{result.summary}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {result.properties.map((p) => (
              <div key={p.label} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-bold text-foreground">{p.label}</p>
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-success">Предимства</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-foreground">
                    {p.pros.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-warning-foreground">Недостатъци</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-foreground">
                    {p.cons.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
