import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { uploadBrokerPhoto, validateImageFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LogOut, Building2, ExternalLink, Users, UserPlus, Check, X, Search, Camera, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

interface Profile {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  agency_name: string | null;
  photo_url: string | null;
  bio: string | null;
  city: string | null;
  broker_status: string | null;
}

type Agency = { id: string; name: string; created_by: string };
type Membership = {
  id: string;
  agency_id: string;
  profile_id: string;
  status: "pending" | "confirmed";
  invited_by: string | null;
  agencies?: Agency | null;
};
type MemberProfile = { id: string; full_name: string | null; photo_url: string | null };

function ProfilePage() {
  const { user, isBroker } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", email: "", agency_name: "", photo_url: "", bio: "", city: "Варна", broker_status: "pending" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data as Profile);
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { broker_status: _bs, ...editable } = profile;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...editable }).select().single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Запазено");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;

  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Моят профил</h1>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground">
          <LogOut className="h-4 w-4" />Изход
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Тип: {isBroker ? "Брокер" : "Клиент"}</p>

      {isBroker && (
        <Link to="/dashboard" className="mt-4 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
          <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Към моите обяви</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div className="mt-6 space-y-3">
        <div><Label htmlFor="fn">Име</Label><Input id="fn" value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
        <div><Label htmlFor="ph">Телефон</Label><Input id="ph" value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
        <div><Label htmlFor="em">Имейл</Label><Input id="em" type="email" value={profile.email ?? user?.email ?? ""} disabled /></div>
        {isBroker && (
          <>
            <div><Label htmlFor="ci">Град</Label><Input id="ci" value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="Варна" /></div>
            <div><Label htmlFor="ag">Агенция (описание)</Label><Input id="ag" value={profile.agency_name ?? ""} onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })} /></div>
            <div><Label htmlFor="pu">URL на снимка</Label><Input id="pu" value={profile.photo_url ?? ""} onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label htmlFor="bi">Описание</Label><Textarea id="bi" rows={4} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
          </>
        )}
        <Button onClick={save} disabled={busy} className="w-full">{busy ? "Запазване..." : "Запази"}</Button>
      </div>

      {isBroker && user && <AgencySection userId={user.id} />}
    </div>
  );
}

function AgencySection({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState<Membership | null>(null);
  const [pending, setPending] = useState<Membership[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<MemberProfile[]>([]);
  const [showInvite, setShowInvite] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("agency_members" as never)
      .select("id, agency_id, profile_id, status, invited_by, agencies(id,name,created_by)")
      .eq("profile_id", userId);
    const rows = (data ?? []) as unknown as Membership[];
    const conf = rows.find((r) => r.status === "confirmed") ?? null;
    setConfirmed(conf);
    setPending(rows.filter((r) => r.status === "pending"));

    if (conf) {
      const { data: mem } = await supabase
        .from("agency_members" as never)
        .select("profile_id, profiles:profile_id(id,full_name,photo_url)")
        .eq("agency_id", conf.agency_id)
        .eq("status", "confirmed");
      const list = ((mem ?? []) as unknown as { profiles: MemberProfile }[])
        .map((r) => r.profiles)
        .filter(Boolean);
      setMembers(list);
    } else {
      setMembers([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const createAgency = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("agencies" as never).insert({ name: newName.trim(), created_by: userId } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setNewName("");
    toast.success("Агенцията е създадена");
    load();
  };

  const respondInvite = async (mId: string, accept: boolean) => {
    setBusy(true);
    if (accept) {
      const { error } = await supabase.from("agency_members" as never).update({ status: "confirmed" } as never).eq("id", mId);
      if (error) { toast.error(error.message); setBusy(false); return; }
      toast.success("Прие поканата");
    } else {
      const { error } = await supabase.from("agency_members" as never).delete().eq("id", mId);
      if (error) { toast.error(error.message); setBusy(false); return; }
      toast.success("Отказа поканата");
    }
    setBusy(false);
    load();
  };

  const searchBrokers = async () => {
    const q = searchQ.trim();
    if (!q) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, photo_url, email")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);
    setSearchResults((data ?? []) as MemberProfile[]);
  };

  const invite = async (profileId: string) => {
    if (!confirmed) return;
    setBusy(true);
    const { error } = await supabase.from("agency_members" as never).insert({
      agency_id: confirmed.agency_id,
      profile_id: profileId,
      status: "pending",
      invited_by: userId,
    } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Поканата е изпратена");
    setSearchQ(""); setSearchResults([]); setShowInvite(false);
  };

  if (loading) return <div className="mt-8 text-sm text-muted-foreground">Зареждане на агенция...</div>;

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-base font-black text-foreground">
        <Users className="h-4 w-4 text-primary" />Агенция
      </h2>

      {pending.length > 0 && (
        <div className="mt-3 space-y-2">
          {pending.map((p) => (
            <div key={p.id} className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-semibold text-foreground">Покана за агенция „{p.agencies?.name ?? "—"}"</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => respondInvite(p.id, true)} disabled={busy} className="gap-1"><Check className="h-3.5 w-3.5" />Приеми</Button>
                <Button size="sm" variant="outline" onClick={() => respondInvite(p.id, false)} disabled={busy} className="gap-1"><X className="h-3.5 w-3.5" />Откажи</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmed ? (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">Твоята агенция</p>
          <p className="text-lg font-bold text-foreground">{confirmed.agencies?.name}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Членове</p>
          <ul className="mt-2 space-y-1.5">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <div className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {m.photo_url ? <img src={m.photo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-3.5 w-3.5" />}
                </div>
                <span className="text-foreground">{m.full_name ?? "Брокер"}{m.id === userId && <span className="ml-2 text-xs text-muted-foreground">(ти)</span>}</span>
              </li>
            ))}
          </ul>

          {!showInvite ? (
            <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-4 w-4" />Покани брокер
            </Button>
          ) : (
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Търси по име или имейл" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchBrokers()} />
                <Button size="sm" onClick={searchBrokers} className="gap-1"><Search className="h-4 w-4" />Търси</Button>
              </div>
              {searchResults.length > 0 && (
                <ul className="rounded-lg border border-border divide-y divide-border">
                  {searchResults.map((r) => (
                    <li key={r.id} className="flex items-center justify-between p-2 text-sm">
                      <span className="text-foreground">{r.full_name ?? "Брокер"}</span>
                      <Button size="sm" variant="ghost" onClick={() => invite(r.id)} disabled={busy || r.id === userId}>Покани</Button>
                    </li>
                  ))}
                </ul>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setShowInvite(false); setSearchQ(""); setSearchResults([]); }}>Затвори</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">Все още не си част от агенция. Създай нова или изчакай покана.</p>
          <div className="mt-3 flex gap-2">
            <Input placeholder="Име на агенция" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button onClick={createAgency} disabled={busy || !newName.trim()}>Създай</Button>
          </div>
        </div>
      )}
    </div>
  );
}
