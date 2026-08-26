import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CLIENT_TYPES, CLIENT_STATUSES } from "@/lib/crm-meta";
import { MARITAL_STATUSES } from "@/lib/legal-meta";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ClientFormData {
  id?: string;
  name: string;
  phone: string;
  client_type: string;
  looking_for: string;
  status: string;
  notes: string;
  last_contact_at: string; // YYYY-MM-DD
  marital_status: string;
}

const empty: ClientFormData = {
  name: "", phone: "", client_type: "buyer", looking_for: "",
  status: "new", notes: "", last_contact_at: "", marital_status: "",
};

export function ClientForm({ initial, onSaved }: { initial?: Partial<ClientFormData>; onSaved: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<ClientFormData>({ ...empty, ...initial } as ClientFormData);
  const [busy, setBusy] = useState(false);
  const [addToPool, setAddToPool] = useState(false);
  const isEdit = !!initial?.id;
  const set = <K extends keyof ClientFormData>(k: K, v: ClientFormData[K]) => setF((p) => ({ ...p, [k]: v }));

  // Активна агенция на текущия потребител (собственик или потвърден член) - за пула с лийдове
  const { data: activeAgencyId } = useQuery({
    queryKey: ["my-active-agency", user?.id],
    enabled: !!user && !isEdit,
    queryFn: async () => {
      const { data: owned } = await (supabase as any)
        .from("agencies").select("id").eq("created_by", user!.id).maybeSingle();
      if (owned?.id) return owned.id as string;
      const { data: member } = await (supabase as any)
        .from("agency_members").select("agency_id").eq("profile_id", user!.id).eq("status", "confirmed").maybeSingle();
      return (member?.agency_id as string) ?? null;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!f.name) { toast.error("Попълни име"); return; }
    setBusy(true);
    const payload: any = {
      broker_id: addToPool && activeAgencyId ? null : user.id,
      agency_id: addToPool && activeAgencyId ? activeAgencyId : null,
      name: f.name,
      phone: f.phone || null,
      client_type: f.client_type,
      looking_for: f.looking_for || null,
      status: f.status,
      notes: f.notes || null,
      last_contact_at: f.last_contact_at ? new Date(f.last_contact_at).toISOString() : null,
      marital_status: f.marital_status || null,
    };
    const q = isEdit
      ? (supabase as any).from("clients").update(payload).eq("id", initial!.id!)
      : (supabase as any).from("clients").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Обновено" : addToPool ? "Добавено в пула на агенцията" : "Запазено");
    qc.invalidateQueries({ queryKey: ["my-clients", user.id] });
    qc.invalidateQueries({ queryKey: ["client", initial?.id] });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div><Label htmlFor="n">Име</Label><Input id="n" required value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div><Label htmlFor="ph">Телефон</Label><Input id="ph" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Тип</Label>
          <Select value={f.client_type} onValueChange={(v) => set("client_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CLIENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Статус</Label>
          <Select value={f.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CLIENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div><Label htmlFor="lf">Търси</Label><Textarea id="lf" rows={2} placeholder="Двустаен в Чайка до 100 000 €..." value={f.looking_for} onChange={(e) => set("looking_for", e.target.value)} /></div>
      <div><Label htmlFor="nt">Бележки</Label><Textarea id="nt" rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
      <div><Label htmlFor="lc">Последен контакт</Label><Input id="lc" type="date" value={f.last_contact_at} onChange={(e) => set("last_contact_at", e.target.value)} /></div>

      <div>
        <Label>Семейно положение</Label>
        <Select value={f.marital_status || undefined} onValueChange={(v) => set("marital_status", v)}>
          <SelectTrigger><SelectValue placeholder="Не е посочено" /></SelectTrigger>
          <SelectContent>{MARITAL_STATUSES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
        <p className="mt-1 text-[11px] text-muted-foreground">Използва се за проверка на СИО при сделки, придобити по време на брак.</p>
      </div>

      {!isEdit && activeAgencyId && (
        <div className="flex items-start gap-2 rounded-xl border border-dashed border-border p-3">
          <Checkbox id="pool" checked={addToPool} onCheckedChange={(v) => setAddToPool(!!v)} className="mt-0.5" />
          <Label htmlFor="pool" className="text-xs font-normal leading-snug text-muted-foreground">
            Добави в пула на агенцията — REMI автоматично ще го разпредели на най-свободния брокер в екипа, вместо да остане на теб
          </Label>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Запазване..." : "Запази"}</Button>
    </form>
  );
}
