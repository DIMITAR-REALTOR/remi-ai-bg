import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FavoriteButton({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: isFav } = useQuery({
    queryKey: ["favorite", user?.id, listingId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("favorites").select("listing_id")
        .eq("user_id", user!.id).eq("listing_id", listingId).maybeSingle();
      return !!data;
    },
  });

  const toggle = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (isFav) {
      const { error } = await (supabase as any).from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Премахнато от любими");
    } else {
      const { error } = await (supabase as any).from("favorites").insert({ user_id: user.id, listing_id: listingId });
      if (error) { toast.error(error.message); return; }
      toast.success("Запазено в любими");
    }
    qc.invalidateQueries({ queryKey: ["favorite", user.id, listingId] });
    qc.invalidateQueries({ queryKey: ["favorites", user.id] });
  };

  return (
    <Button onClick={toggle} variant="outline" className="w-full gap-2">
      <Heart className={cn("h-4 w-4", isFav && "fill-destructive text-destructive")} />
      {isFav ? "Премахни от любими" : "Запази в любими"}
    </Button>
  );
}
