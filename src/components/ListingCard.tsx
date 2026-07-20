import { Link } from "@tanstack/react-router";
import { MapPin, Maximize2, BedDouble, ArrowUpDown } from "lucide-react";
import { fmtPrice, propertyTypeLabel, statusLabel, statusTone } from "@/lib/listings-meta";
import { cn } from "@/lib/utils";

export interface ListingCardData {
  id: string;
  title: string;
  price_eur: number;
  property_type: string;
  area_sqm: number | null;
  rooms: number | null;
  city: string | null;
  neighborhood: string | null;
  status: string;
  photos: string[];
  broker_name?: string | null;
}

const toneClasses: Record<string, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function ListingCard({ l }: { l: ListingCardData }) {
  const photo = l.photos?.[0];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <Link to="/listing/$id" params={{ id: l.id }} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {photo ? (
            <img src={photo} alt={l.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground text-sm">Без снимка</div>
          )}
          <span className={cn("absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", toneClasses[statusTone(l.status)])}>
            {statusLabel(l.status)}
          </span>
        </div>
        <div className="space-y-1.5 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-lg font-bold text-foreground">{fmtPrice(l.price_eur)}</p>
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{propertyTypeLabel(l.property_type)}</span>
          </div>
          <p className="line-clamp-1 text-sm font-medium text-foreground">{l.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {(l.city || l.neighborhood) && (
              <span className="flex items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5" />{[l.neighborhood, l.city].filter(Boolean).join(", ")}</span>
            )}
          </div>
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            {l.rooms != null && <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{l.rooms} стаи</span>}
            {l.area_sqm != null && <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{l.area_sqm} кв.м</span>}
          </div>
          {l.broker_name && <p className="pt-1 text-[11px] text-muted-foreground">Брокер: {l.broker_name}</p>}
        </div>
      </Link>
      <Link
        to="/compare"
        search={{ listing: l.id }}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
        aria-label="Сравни имот"
      >
        <ArrowUpDown className="h-3 w-3" /> Сравни
      </Link>
    </div>
  );
}

