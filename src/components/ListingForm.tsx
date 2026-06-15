import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PROPERTY_TYPES, STATUSES } from "@/lib/listings-meta";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadListingPhoto } from "@/lib/storage";
import { Upload, X, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateListingDescription } from "@/lib/ai.functions";

export interface ListingFormData {
  id?: string;
  title: string;
  description: string;
  price_eur: number | "";
  property_type: string;
  area_sqm: number | "";
  rooms: number | "";
  floor: number | "";
  city: string;
  neighborhood: string;
  status: string;
  photos: string[];
}

const empty: ListingFormData = {
  title: "", description: "", price_eur: "", property_type: "apartment",
  area_sqm: "", rooms: "", floor: "", city: "Варна", neighborhood: "",
  status: "active", photos: [],
};

export function ListingForm({ initial, onSaved }: { initial?: Partial<ListingFormData>; onSaved: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<ListingFormData>({ ...empty, ...initial } as ListingFormData);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const generateDesc = useServerFn(generateListingDescription);
  const isEdit = !!initial?.id;

  const aiGenerate = async () => {
    setAiBusy(true);
    try {
      const { description } = await generateDesc({
        data: {
          title: f.title,
          property_type: f.property_type,
          price_eur: f.price_eur === "" ? undefined : Number(f.price_eur),
          area_sqm: f.area_sqm === "" ? undefined : Number(f.area_sqm),
          rooms: f.rooms === "" ? undefined : Number(f.rooms),
          floor: f.floor === "" ? undefined : Number(f.floor),
          city: f.city,
          neighborhood: f.neighborhood,
        },
      });
      set("description", description);
      toast.success("Описанието е генерирано");
    } catch (err: any) {
      toast.error(err?.message ?? "Грешка при генериране");
    } finally {
      setAiBusy(false);
    }
  };

  const set = <K extends keyof ListingFormData>(k: K, v: ListingFormData[K]) => setF((p) => ({ ...p, [k]: v }));

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    const files = Array.from(e.target.files).slice(0, 5 - f.photos.length);
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((file) => uploadListingPhoto(user.id, file)));
      set("photos", [...f.photos, ...urls]);
    } catch (err: any) {
      toast.error(err?.message ?? "Грешка при качване");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removePhoto = (url: string) => set("photos", f.photos.filter((p) => p !== url));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!f.title || !f.price_eur) { toast.error("Попълни заглавие и цена"); return; }
    setBusy(true);
    const payload = {
      broker_id: user.id,
      title: f.title,
      description: f.description || null,
      price_eur: Number(f.price_eur),
      property_type: f.property_type,
      area_sqm: f.area_sqm === "" ? null : Number(f.area_sqm),
      rooms: f.rooms === "" ? null : Number(f.rooms),
      floor: f.floor === "" ? null : Number(f.floor),
      city: f.city || null,
      neighborhood: f.neighborhood || null,
      status: f.status,
      photos: f.photos,
    };
    const q = isEdit
      ? supabase.from("listings").update(payload).eq("id", initial!.id!)
      : supabase.from("listings").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Обновено" : "Запазено");
    qc.invalidateQueries({ queryKey: ["my-listings", user.id] });
    qc.invalidateQueries({ queryKey: ["public-listings"] });
    qc.invalidateQueries({ queryKey: ["listing", initial?.id] });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div><Label htmlFor="t">Заглавие</Label><Input id="t" required value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="d">Описание</Label>
          <Button type="button" variant="ghost" size="sm" onClick={aiGenerate} disabled={aiBusy || !f.title} className="h-7 gap-1.5 px-2 text-xs text-primary hover:text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {aiBusy ? "Генериране..." : "Генерирай с AI"}
          </Button>
        </div>
        <Textarea id="d" rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Тип имот</Label>
          <Select value={f.property_type} onValueChange={(v) => set("property_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROPERTY_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Статус</Label>
          <Select value={f.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="p">Цена (€)</Label><Input id="p" required inputMode="numeric" value={f.price_eur} onChange={(e) => set("price_eur", e.target.value === "" ? "" : Number(e.target.value))} /></div>
        <div><Label htmlFor="a">Площ (кв.м)</Label><Input id="a" inputMode="numeric" value={f.area_sqm} onChange={(e) => set("area_sqm", e.target.value === "" ? "" : Number(e.target.value))} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="r">Стаи</Label><Input id="r" inputMode="numeric" value={f.rooms} onChange={(e) => set("rooms", e.target.value === "" ? "" : Number(e.target.value))} /></div>
        <div><Label htmlFor="fl">Етаж</Label><Input id="fl" inputMode="numeric" value={f.floor} onChange={(e) => set("floor", e.target.value === "" ? "" : Number(e.target.value))} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="c">Град</Label><Input id="c" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div><Label htmlFor="n">Квартал</Label><Input id="n" value={f.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} /></div>
      </div>

      <div>
        <Label>Снимки (до 5)</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {f.photos.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removePhoto(url)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {f.photos.length < 5 && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary">
              <div className="flex flex-col items-center gap-1 text-[11px]">
                <Upload className="h-5 w-5" />
                {uploading ? "Качване..." : "Качи снимки"}
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={busy || uploading}>{busy ? "Запазване..." : "Запази обявата"}</Button>
    </form>
  );
}
