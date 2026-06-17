import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Phone, Building2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ListingCard";

export const Route = createFileRoute("/brokers/$id")({
  component: BrokerProfilePage,
});

function BrokerProfilePage() {
  const { id } = Route.useParams();

  const { data: broker, isLoading } = useQuery({
    queryKey: ["broker", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,agency_name,photo_url,bio,phone,email")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["broker-listings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,price_eur,property_type,area_sqm,rooms,city,neighborhood,status,photos")
        .eq("broker_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;
  if (!broker) return (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Брокерът не е намерен.</p>
      <Button asChild className="mt-4"><Link to="/brokers">Назад</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-6">
      <Link to="/brokers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />Брокери
      </Link>

      <div className="mt-3 rounded-2xl border border-border bg-card p-5 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
          {broker.photo_url ? <img src={broker.photo_url} alt={broker.full_name ?? ""} className="h-full w-full object-cover" /> : <Building2 className="h-9 w-9" />}
        </div>
        <h1 className="mt-3 text-xl font-bold text-foreground">{broker.full_name ?? "Брокер"}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{broker.agency_name ?? "Compass Real Estate"}</p>
        <a
          href="https://compassrealestate.bg"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Globe className="h-3 w-3" />compassrealestate.bg
        </a>
        {broker.bio && <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{broker.bio}</p>}

        <div className="mt-4 flex flex-col gap-2">
          {broker.phone && (
            <Button asChild className="gap-2">
              <a href={`tel:${broker.phone}`}><Phone className="h-4 w-4" />Свържи се с мен</a>
            </Button>
          )}
          {broker.email && (
            <Button asChild variant="outline" className="gap-2">
              <a href={`mailto:${broker.email}`}><Mail className="h-4 w-4" />{broker.email}</a>
            </Button>
          )}
        </div>
      </div>

      <h2 className="mt-6 text-base font-bold text-foreground">Активни обяви ({listings.length})</h2>
      {listings.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Няма активни обяви.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {listings.map((l: any) => <ListingCard key={l.id} l={l} />)}
        </div>
      )}
    </div>
  );
}
