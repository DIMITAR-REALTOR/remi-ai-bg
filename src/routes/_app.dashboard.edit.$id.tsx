import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListingForm } from "@/components/ListingForm";

export const Route = createFileRoute("/_app/dashboard/edit/$id")({
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["listing-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;
  if (!data) return <div className="p-8 text-center text-sm text-muted-foreground">Обявата не е намерена.</div>;

  return (
    <div className="mx-auto max-w-xl px-5 pt-6">
      <h1 className="text-2xl font-black text-foreground">Редактирай обявата</h1>
      <ListingForm initial={data as any} onSaved={() => navigate({ to: "/dashboard" })} />
    </div>
  );
}
