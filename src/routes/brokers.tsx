import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Phone, Mail, MapPin, ChevronRight, Pencil, UserPlus } from "lucide-react";
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

function BrokersPage() {
  const { user, isBroker } = useAuth();

  const { data: brokers = [], isLoading } = useQuery({
    queryKey: ["brokers-directory-verified"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,agency_name,photo_url,bio,phone,email,city,broker_status")
        .eq("broker_status", "verified")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BrokerRow[];
    },
  });

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
        <ul className="mt-4 space-y-2">
          {brokers.map((b) => {
            const isMe = user?.id === b.id;
            return (
              <li key={b.id} className="rounded-2xl border border-border bg-card p-3">
                <Link
                  to="/brokers/$id"
                  params={{ id: b.id }}
                  className="flex items-center gap-3"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                    {b.photo_url ? (
                      <img src={b.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
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
                  {b.city && (
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{b.city}</span>
                  )}
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
          })}
        </ul>
      )}
    </div>
  );
}
