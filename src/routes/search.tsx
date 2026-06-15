import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPES } from "@/lib/listings-meta";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Търси имоти — AI Estate Pro" },
      { name: "description", content: "Прегледай активни обяви от брокери в България." },
    ],
  }),
  component: SearchPage,
});

interface Filters {
  propertyType: string;
  priceMin: string;
  priceMax: string;
  neighborhood: string;
  roomsMin: string;
  areaMin: string;
  areaMax: string;
}

const initial: Filters = { propertyType: "all", priceMin: "", priceMax: "", neighborhood: "", roomsMin: "", areaMin: "", areaMax: "" };

function SearchPage() {
  const [filters, setFilters] = useState<Filters>(initial);
  const [open, setOpen] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["public-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,price_eur,property_type,area_sqm,rooms,city,neighborhood,status,photos,broker_id,profiles:broker_id(full_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((l: any) => ({
        ...l,
        broker_name: l.profiles?.full_name ?? null,
      })) as (ListingCardData & { broker_id: string })[];
    },
  });

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filters.propertyType !== "all" && l.property_type !== filters.propertyType) return false;
      if (filters.priceMin && l.price_eur < Number(filters.priceMin)) return false;
      if (filters.priceMax && l.price_eur > Number(filters.priceMax)) return false;
      if (filters.neighborhood && !(l.neighborhood ?? "").toLowerCase().includes(filters.neighborhood.toLowerCase())) return false;
      if (filters.roomsMin && (l.rooms ?? 0) < Number(filters.roomsMin)) return false;
      if (filters.areaMin && (l.area_sqm ?? 0) < Number(filters.areaMin)) return false;
      if (filters.areaMax && (l.area_sqm ?? Infinity) > Number(filters.areaMax)) return false;
      return true;
    });
  }, [listings, filters]);

  const activeCount = Object.entries(filters).filter(([k, v]) => (k === "propertyType" ? v !== "all" : v !== "")).length;

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-foreground">Търси имоти</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Филтри
              {activeCount > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{activeCount}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader><SheetTitle>Филтри</SheetTitle></SheetHeader>
            <div className="grid gap-4 px-4 py-4">
              <div>
                <Label className="mb-1.5 block text-xs">Тип имот</Label>
                <Select value={filters.propertyType} onValueChange={(v) => setFilters({ ...filters, propertyType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички</SelectItem>
                    {PROPERTY_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-1.5 block text-xs">Цена от (€)</Label><Input inputMode="numeric" value={filters.priceMin} onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })} /></div>
                <div><Label className="mb-1.5 block text-xs">Цена до (€)</Label><Input inputMode="numeric" value={filters.priceMax} onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })} /></div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Квартал</Label>
                <Input value={filters.neighborhood} onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })} placeholder="напр. Чайка" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="mb-1.5 block text-xs">Стаи мин.</Label><Input inputMode="numeric" value={filters.roomsMin} onChange={(e) => setFilters({ ...filters, roomsMin: e.target.value })} /></div>
                <div><Label className="mb-1.5 block text-xs">Площ от</Label><Input inputMode="numeric" value={filters.areaMin} onChange={(e) => setFilters({ ...filters, areaMin: e.target.value })} /></div>
                <div><Label className="mb-1.5 block text-xs">Площ до</Label><Input inputMode="numeric" value={filters.areaMax} onChange={(e) => setFilters({ ...filters, areaMax: e.target.value })} /></div>
              </div>
            </div>
            <SheetFooter className="flex-row gap-2 px-4 pb-4">
              <Button variant="outline" className="flex-1" onClick={() => setFilters(initial)}><X className="mr-1 h-4 w-4" />Изчисти</Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>Покажи {filtered.length}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{isLoading ? "Зареждане..." : `Намерени: ${filtered.length}`}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((l) => <ListingCard key={l.id} l={l} />)}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="mt-12 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium text-foreground">Няма намерени обяви</p>
          <p className="mt-1 text-xs text-muted-foreground">Опитай с други филтри.</p>
        </div>
      )}
    </div>
  );
}
