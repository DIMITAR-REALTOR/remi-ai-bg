import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadContractIdPhoto, validateImageFile } from "@/lib/storage";
import { type PartyData } from "@/lib/contracts-meta";
import { Camera, X, Loader2, UserSearch } from "lucide-react";
import { toast } from "sonner";

type PartyFormProps = {
  title: string;
  value: PartyData;
  onChange: (v: PartyData) => void;
  idPhotoUrl: string | null;
  onIdPhotoChange: (url: string | null) => void;
};

export function PartyForm({ title, value, onChange, idPhotoUrl, onIdPhotoChange }: PartyFormProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["party-form-clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("clients").select("id,name,phone").eq("broker_id", user!.id).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const set = <K extends keyof PartyData>(k: K, v: PartyData[K]) => onChange({ ...value, [k]: v });

  const applyClient = (clientId: string) => {
    const c = clients.find((cl: any) => cl.id === clientId);
    if (!c) return;
    onChange({ ...value, name: c.name ?? "", phone: c.phone ?? "" });
  };

  const handleFile = async (file: File | null) => {
    if (!file || !user) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }
    setUploading(true);
    try {
      const url = await uploadContractIdPhoto(user.id, file);
      onIdPhotoChange(url);
      toast.success("Снимката е качена");
    } catch (e: any) {
      toast.error(e.message ?? "Грешка при качване");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      {clients.length > 0 && (
        <div className="mt-3">
          <Label className="flex items-center gap-1.5 text-xs"><UserSearch className="h-3.5 w-3.5" />Автопопълни от съществуващ клиент</Label>
          <Select onValueChange={applyClient}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Избери клиент (по избор)" /></SelectTrigger>
            <SelectContent>
              {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mt-3 space-y-3">
        <div><Label>Три имена</Label><Input value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="Иван Иванов Петров" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>ЕГН</Label><Input value={value.egn} onChange={(e) => set("egn", e.target.value)} placeholder="__________" /></div>
          <div><Label>Телефон</Label><Input value={value.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        </div>
        <div><Label>Адрес</Label><Input value={value.address} onChange={(e) => set("address", e.target.value)} placeholder="гр. Варна, ул. ..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>№ лична карта</Label><Input value={value.id_number} onChange={(e) => set("id_number", e.target.value)} /></div>
          <div><Label>Дата на издаване</Label><Input type="date" value={value.id_issued_on} onChange={(e) => set("id_issued_on", e.target.value)} /></div>
        </div>
        <div><Label>Издадена от (МВР ...)</Label><Input value={value.id_issued_by} onChange={(e) => set("id_issued_by", e.target.value)} /></div>

        <div>
          <Label className="text-xs">Снимка на лична карта (по избор, само за съхранение)</Label>
          {idPhotoUrl ? (
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2">
              <img src={idPhotoUrl} alt="ЛК" className="h-10 w-10 rounded object-cover" />
              <span className="flex-1 truncate text-xs text-muted-foreground">Качена снимка</span>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => onIdPhotoChange(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              type="button" variant="outline" size="sm" className="mt-1.5 gap-1.5"
              disabled={uploading} onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              {uploading ? "Качване..." : "Качи снимка"}
            </Button>
          )}
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </div>
  );
}
