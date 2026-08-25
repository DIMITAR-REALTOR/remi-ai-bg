import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, UserPlus, Check, X, Clock, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard/agency")({
  component: AgencyPage,
});

function AgencyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newAgencyName, setNewAgencyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: ownedAgency, isLoading: loadingOwned } = useQuery({
    queryKey: ["my-owned-agency", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agencies")
        .select("id, name, created_by, created_at")
        .eq("created_by", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: myMembership, isLoading: loadingMembership } = useQuery({
    queryKey: ["my-agency-membership", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agency_members")
        .select("id, agency_id, status, agencies:agency_id(id, name)")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const activeAgencyId = ownedAgency?.id ?? (myMembership?.status === "confirmed" ? myMembership.agency_id : null);
  const isOwner = !!ownedAgency;

  const { data: team = [] } = useQuery({
    queryKey: ["agency-team", activeAgencyId],
    enabled: !!activeAgencyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agency_members")
        .select("id, status, profiles:profile_id(id, full_name, email)")
        .eq("agency_id", activeAgencyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAgencyName.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any)
      .from("agencies")
      .insert({ name: newAgencyName.trim(), created_by: user.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Агенцията е създадена");
    qc.invalidateQueries({ queryKey: ["my-owned-agency", user.id] });
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeAgencyId || !inviteEmail.trim()) return;
    setBusy(true);
    const { data: profile, error: findError } = await (supabase as any)
      .from("profiles")
      .select("id, full_name")
      .eq("email", inviteEmail.trim())
      .maybeSingle();
    if (findError || !profile) {
      setBusy(false);
      toast.error("Няма регистриран брокер с този имейл");
      return;
    }
    const { error } = await (supabase as any)
      .from("agency_members")
      .insert({ agency_id: activeAgencyId, profile_id: profile.id, invited_by: user.id, status: "pending" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Поканата към ${profile.full_name ?? inviteEmail} е изпратена`);
    setInviteEmail("");
    qc.invalidateQueries({ queryKey: ["agency-team", activeAgencyId] });
  };

  const respondInvite = async (status: "confirmed" | "declined") => {
    if (!myMembership) return;
    setBusy(true);
    const { error } = await (supabase as any)
      .from("agency_members")
      .update({ status })
      .eq("id", myMembership.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "confirmed" ? "Присъедини се към агенцията" : "Поканата е отказана");
    qc.invalidateQueries({ queryKey: ["my-agency-membership", user?.id] });
  };

  if (loadingOwned || loadingMembership) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;
  }

  // Покана в очакване, която потребителят все още не е приел/отказал
  if (myMembership && myMembership.status === "pending" && !ownedAgency) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
        <h1 className="text-2xl font-black text-foreground">Агенция</h1>
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Clock className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Покана от {myMembership.agencies?.name}</p>
              <p className="text-xs text-muted-foreground">Изчаква твоя отговор</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => respondInvite("confirmed")}>
              <Check className="mr-1 h-4 w-4" />Приеми
            </Button>
            <Button className="flex-1" variant="outline" disabled={busy} onClick={() => respondInvite("declined")}>
              <X className="mr-1 h-4 w-4" />Откажи
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Няма агенция и не е поканен - форма за създаване
  if (!activeAgencyId) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
        <h1 className="text-2xl font-black text-foreground">Агенция</h1>
        <p className="mt-1 text-sm text-muted-foreground">Създай агенция, за да поканиш екип и да управлявате сделки заедно.</p>
        <form onSubmit={createAgency} className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <Label htmlFor="an">Име на агенцията</Label>
            <Input id="an" required value={newAgencyName} onChange={(e) => setNewAgencyName(e.target.value)} placeholder="напр. Ценов Имоти" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Създаване..." : "Създай агенция"}</Button>
        </form>
      </div>
    );
  }

  // Има активна агенция (собственик или потвърден член) - екипен изглед
  const agencyName = ownedAgency?.name ?? myMembership?.agencies?.name;
  const pending = team.filter((m: any) => m.status === "pending");
  const confirmed = team.filter((m: any) => m.status === "confirmed");

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-black text-foreground">{agencyName}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isOwner ? "Ти си собственик на агенцията" : "Ти си потвърден член на екипа"}
      </p>

      <form onSubmit={inviteMember} className="mt-5 rounded-2xl border border-border bg-card p-4">
        <Label htmlFor="ie">Покани брокер по имейл</Label>
        <div className="mt-2 flex gap-2">
          <Input id="ie" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ivan@example.com" />
          <Button type="submit" disabled={busy}><UserPlus className="h-4 w-4" /></Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">Работи само за вече регистрирани в REMI AI брокери.</p>
      </form>

      <div className="mt-5">
        <h2 className="text-sm font-semibold text-foreground">Екип ({confirmed.length})</h2>
        {confirmed.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Все още няма потвърдени членове.
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {confirmed.map((m: any) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                  {(m.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <span className="truncate text-sm font-medium text-foreground">{m.profiles?.full_name ?? m.profiles?.email}</span>
                {ownedAgency && ownedAgency.created_by === m.profiles?.id && (
                  <Crown className="ml-auto h-3.5 w-3.5 text-primary" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-foreground">Чакащи покани ({pending.length})</h2>
          <ul className="mt-2 space-y-2">
            {pending.map((m: any) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm text-muted-foreground">{m.profiles?.full_name ?? m.profiles?.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
