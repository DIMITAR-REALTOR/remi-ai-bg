import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface TaskFormData {
  id?: string;
  title: string;
  client_id: string;
  listing_id: string;
  due_at: string; // datetime-local
  notes: string;
}

const empty: TaskFormData = { title: "", client_id: "none", listing_id: "none", due_at: "", notes: "" };

export function TaskForm({ initial, onSaved }: { initial?: Partial<TaskFormData>; onSaved: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<TaskFormData>({ ...empty, ...initial } as TaskFormData);
  const [busy, setBusy] = useState(false);
  const isEdit = !!initial?.id;
  const set = <K extends keyof TaskFormData>(k: K, v: TaskFormData[K]) => setF((p) => ({ ...p, [k]: v }));

  const { data: clients = [] } = useQuery({
    queryKey: ["my-clients-select", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from("clients").select("id,name").eq("broker_id", user!.id).order("name");
      return data ?? [];
    },
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["my-listings-select", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("id,title").eq("broker_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!f.title || !f.due_at) { toast.error("Попълни заглавие и дата"); return; }
    setBusy(true);
    const payload: any = {
      broker_id: user.id,
      title: f.title,
      client_id: f.client_id === "none" ? null : f.client_id,
      listing_id: f.listing_id === "none" ? null : f.listing_id,
      due_at: new Date(f.due_at).toISOString(),
      notes: f.notes || null,
    };
    const q = isEdit
      ? (supabase as any).from("tasks").update(payload).eq("id", initial!.id!)
      : (supabase as any).from("tasks").insert(payload);
    const { error } = await q;
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Обновено" : "Запазено");
    qc.invalidateQueries({ queryKey: ["my-tasks", user.id] });
    qc.invalidateQueries({ queryKey: ["client-tasks"] });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div><Label htmlFor="t">Заглавие</Label><Input id="t" required value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
      <div><Label htmlFor="dt">Дата и час</Label><Input id="dt" type="datetime-local" required value={f.due_at} onChange={(e) => set("due_at", e.target.value)} /></div>

      <div>
        <Label>Свързан клиент</Label>
        <Select value={f.client_id} onValueChange={(v) => set("client_id", v)}>
          <SelectTrigger><SelectValue placeholder="Без клиент" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без клиент</SelectItem>
            {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Свързана обява</Label>
        <Select value={f.listing_id} onValueChange={(v) => set("listing_id", v)}>
          <SelectTrigger><SelectValue placeholder="Без обява" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без обява</SelectItem>
            {listings.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div><Label htmlFor="n">Бележки</Label><Textarea id="n" rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>

      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Запазване..." : "Запази"}</Button>
    </form>
  );
}
