import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/brokers")({
  component: BrokersPage,
});

function BrokersPage() {
  const { data: brokers = [], isLoading } = useQuery({
    queryKey: ["brokers-directory"],
    queryFn: async () => {
      const { data: roles, error: rErr } = await supabase.from("user_roles").select("user_id").eq("role", "broker");
      if (rErr) throw rErr;
      const ids = (roles ?? []).map((r: any) => r.user_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,agency_name,photo_url,bio")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
      <h1 className="text-2xl font-black text-foreground">Брокери</h1>
      <p className="mt-1 text-sm text-muted-foreground">Свържи се директно с брокер от платформата.</p>

      {isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Зареждане...</p>
      ) : brokers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Няма регистрирани брокери.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {brokers.map((b: any) => (
            <li key={b.id}>
              <Link to="/brokers/$id" params={{ id: b.id }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/50">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {b.photo_url ? <img src={b.photo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{b.full_name ?? "Брокер"}</p>
                  {b.agency_name && <p className="truncate text-xs text-muted-foreground">{b.agency_name}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
