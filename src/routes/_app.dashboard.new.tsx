import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ListingForm } from "@/components/ListingForm";

export const Route = createFileRoute("/_app/dashboard/new")({
  component: NewListing,
});

function NewListing() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-xl px-5 pt-6">
      <h1 className="text-2xl font-black text-foreground">Добави обява</h1>
      <p className="mt-1 text-sm text-muted-foreground">Попълни данните на имота.</p>
      <ListingForm onSaved={() => navigate({ to: "/dashboard" })} />
    </div>
  );
}
