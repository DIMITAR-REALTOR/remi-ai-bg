import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ListingCard } from "@/components/ListingCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("favorites")
        .select("listing_id, listings:listing_id(id,title,price_eur,property_type,area_sqm,rooms,city,neighborhood,status,photos,profiles:broker_id(full_name))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => r.listings).filter(Boolean);
    },
  });

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
      <h1 className="text-2xl font-black text-foreground">Любими имоти</h1>

      {isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Зареждане...</p>
      ) : data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="mx-auto mb-3 text-4xl">❤️</div>
          <p className="text-sm font-medium text-foreground">Още нямаш любими имоти.</p>
          <p className="mt-1 text-xs text-muted-foreground">Запазвай обяви, които харесваш, за да ги намериш бързо.</p>
          <Button asChild className="mt-4"><Link to="/search">Започни търсенето →</Link></Button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.map((l: any) => (
            <ListingCard key={l.id} l={{ ...l, broker_name: l.profiles?.full_name }} />
          ))}
        </div>
      )}
    </div>
  );
}
