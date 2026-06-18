import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtPrice, propertyTypeLabel, statusLabel, statusTone } from "@/lib/listings-meta";
import { ChevronLeft, MapPin, Maximize2, BedDouble, Building2, Phone, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButtons } from "@/components/ShareButtons";

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("listings")
      .select("title,price_eur,city,neighborhood,photos,description")
      .eq("id", params.id)
      .maybeSingle();
    return { meta: data };
  },
  head: ({ params, loaderData }) => {
    const m = loaderData?.meta;
    const url = `https://remi-ai-bg.lovable.app/listing/${params.id}`;
    const title = m
      ? `${m.title} — ${new Intl.NumberFormat("bg-BG").format(m.price_eur)} € — REMI AI`
      : "Имот — REMI AI";
    const desc = m
      ? `${[m.neighborhood, m.city].filter(Boolean).join(", ")} · ${m.description?.slice(0, 140) ?? ""}`
      : "Имот в платформата REMI AI.";
    const img = m?.photos?.[0];
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ListingDetail,
});

const toneClasses: Record<string, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

function ListingDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [activePhoto, setActivePhoto] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, profiles:broker_id(id,full_name,phone,agency_name,photo_url,bio)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;
  if (!data) return (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Обявата не е намерена.</p>
      <Button asChild className="mt-4"><Link to="/search">Към търсене</Link></Button>
    </div>
  );

  const broker = data.profiles as any;
  const photos: string[] = data.photos ?? [];

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {photos[activePhoto] ? (
          <img src={photos[activePhoto]} alt={data.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">Без снимка</div>
        )}
        <button
          onClick={() => navigate({ to: "/search" })}
          className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur"
          aria-label="Назад"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className={cn("absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur", toneClasses[statusTone(data.status)])}>
          {statusLabel(data.status)}
        </span>
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {photos.map((p, i) => (
            <button key={i} onClick={() => setActivePhoto(i)} className={cn("h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2", i === activePhoto ? "border-primary" : "border-transparent")}>
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 px-5 pb-6 pt-4">
        <div>
          <p className="text-3xl font-black text-foreground">{fmtPrice(data.price_eur)}</p>
          <h1 className="mt-1 text-lg font-bold text-foreground">{data.title}</h1>
          {(data.city || data.neighborhood) && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />{[data.neighborhood, data.city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary p-3 text-center">
          <Stat icon={Building2} label="Тип" value={propertyTypeLabel(data.property_type)} />
          <Stat icon={BedDouble} label="Стаи" value={data.rooms ?? "—"} />
          <Stat icon={Maximize2} label="Площ" value={data.area_sqm ? `${data.area_sqm} м²` : "—"} />
        </div>
        {data.floor != null && (
          <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Етаж:</span>
            <span className="font-semibold text-foreground">{data.floor}</span>
          </div>
        )}

        {data.description && (
          <div>
            <h2 className="mb-1.5 text-sm font-semibold text-foreground">Описание</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{data.description}</p>
          </div>
        )}

        {broker && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Брокер</h2>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                {broker.photo_url ? <img src={broker.photo_url} className="h-full w-full object-cover" alt={broker.full_name} /> : <Building2 className="h-6 w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{broker.full_name ?? "Брокер"}</p>
                {broker.agency_name && <p className="truncate text-xs text-muted-foreground">{broker.agency_name}</p>}
              </div>
            </div>
            {broker.phone && (
              <Button asChild className="mt-3 w-full gap-2">
                <a href={`tel:${broker.phone}`}><Phone className="h-4 w-4" />Свържи се с брокера</a>
              </Button>
            )}
          </div>
        )}

        <FavoriteButton listingId={data.id} />

        <ShareButtons
          title={data.title}
          text={`${data.title} — ${fmtPrice(data.price_eur)}${data.neighborhood ? `, ${data.neighborhood}` : ""}`}
          url={typeof window !== "undefined" ? window.location.href : `https://remi-ai-bg.lovable.app/listing/${data.id}`}
        />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
