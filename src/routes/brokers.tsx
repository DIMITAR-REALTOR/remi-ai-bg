import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Phone, Mail, MapPin, ChevronRight, Pencil, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/brokers")({
  component: BrokersPage,
});

type BrokerRow = {
  id: string;
  full_name: string | null;
  agency_name: string | null;
  photo_url: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  broker_status: string | null;
};

type AgencyGroup = { id: string; name: string; brokers: BrokerRow[] };

function BrokersPage() {
  const { user, isBroker } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["brokers-directory-grouped"],
    queryFn: async () => {
      const { data: brokers, error } = await supabase
        .from("profiles")
        .select("id,full_name,agency_name,photo_url,bio,phone,email,city,broker_status")
        .eq("broker_status", "verified")
        .order("full_name", { ascending: true });
      if (error) throw error;
      const list = (brokers ?? []) as BrokerRow[];

      const { data: memberships } = await supabase
        .from("agency_members" as never)
        .select("profile_id, agency_id, agencies(id,name)")
        .eq("status", "confirmed");
      const mems = (memberships ?? []) as unknown as {
        profile_id: string; agency_id: string; agencies: { id: string; name: string } | null;
      }[];

      const byProfile = new Map<string, { id: string; name: string }>();
      for (const m of mems) if (m.agencies) byProfile.set(m.profile_id, m.agencies);

      const groups = new Map<string, AgencyGroup>();
      const independents: BrokerRow[] = [];
      for (const b of list) {
        const ag = byProfile.get(b.id);
        if (ag) {
          if (!groups.has(ag.id)) groups.set(ag.id, { id: ag.id, name: ag.name, brokers: [] });
          groups.get(ag.id)!.brokers.push(b);
        } else {
          independents.push(b);
        }
      }
      const agencyGroups = Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
      return { agencyGroups, independents, all: list };
    },
  });

  const brokers = data?.all ?? [];
  const myProfileInList = user ? brokers.find((b) => b.id === user.id) : null;
  const showCompleteCTA = !!user && isBroker && !myProfileInList;

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
      <h1 className="text-2xl font-black text-foreground">Брокери</h1>
      <p className="mt-1 text-sm text-muted-foreground">Свържи се директно с брокер от платформата.</p>

      {showCompleteCTA && (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">Завърши своя профил</p>
          <p className="mt-1 text-xs text-muted-foreground">
            За да се появиш в директорията, попълни име, телефон и град.
          </p>
          <Button asChild size="sm" className="mt-3 gap-1.5">
            <Link to="/profile"><UserPlus className="h-4 w-4" />Попълни профил</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Зареждане...</p>
      ) : brokers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Няма потвърдени брокери.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {data?.agencyGroups.map((g) => (
            <section key={g.id}>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-primary">
                <Users className="h-4 w-4" />{g.name}
              </h2>
              <ul className="mt-2 space-y-2">
                {g.brokers.map((b) => <BrokerCard key={b.id} b={b} userId={user?.id} />)}
              </ul>
            </section>
          ))}

          {data && data.independents.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
                <Building2 className="h-4 w-4" />Независими брокери
              </h2>
              <ul className="mt-2 space-y-2">
                {data.independents.map((b) => <BrokerCard key={b.id} b={b} userId={user?.id} />)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BrokerCard({ b, userId }: { b: BrokerRow; userId?: string }) {
  const isMe = userId === b.id;
  return (
    <li className="rounded-2xl border border-border bg-card p-3">
      <Link to="/brokers/$id" params={{ id: b.id }} className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
          {b.photo_url ? <img src={b.photo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {b.full_name ?? "Брокер"}
            {isMe && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">Ти</span>}
          </p>
          {b.agency_name && <p className="truncate text-xs text-muted-foreground">{b.agency_name}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
        {b.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{b.city}</span>}
        {b.phone && (
          <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Phone className="h-3.5 w-3.5 text-primary" />{b.phone}
          </a>
        )}
        {b.email && (
          <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground sm:col-span-2">
            <Mail className="h-3.5 w-3.5 text-primary" />{b.email}
          </a>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {b.phone && (
          <Button asChild size="sm" className="flex-1 gap-1.5">
            <a href={`tel:${b.phone}`}><Phone className="h-3.5 w-3.5" />Свържи се</a>
          </Button>
        )}
        {isMe && (
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/profile"><Pencil className="h-3.5 w-3.5" />Редактирай</Link>
          </Button>
        )}
      </div>
    </li>
  );
}
