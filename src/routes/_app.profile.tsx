import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LogOut, Building2, ExternalLink } from "lucide-react";

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
}

function ProfilePage() {
  const { user, isBroker, role } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", email: "", agency_name: "", photo_url: "", bio: "" });
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
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...profile }).select().single();
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
    <div className="mx-auto max-w-xl px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Моят профил</h1>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground">
          <LogOut className="h-4 w-4" />Изход
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Тип: {isBroker ? "Брокер" : "Клиент"}</p>

      {isBroker && (
        <Link to="/_app/dashboard" className="mt-4 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
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
            <div><Label htmlFor="ag">Агенция</Label><Input id="ag" value={profile.agency_name ?? ""} onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })} /></div>
            <div><Label htmlFor="pu">URL на снимка</Label><Input id="pu" value={profile.photo_url ?? ""} onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label htmlFor="bi">Описание</Label><Textarea id="bi" rows={4} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
          </>
        )}
        <Button onClick={save} disabled={busy} className="w-full">{busy ? "Запазване..." : "Запази"}</Button>
      </div>
    </div>
  );
}
