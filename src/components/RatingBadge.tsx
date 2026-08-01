import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BrokerRating = { avg: number; count: number };

export async function fetchBrokerRatings(brokerIds: string[]): Promise<Record<string, BrokerRating>> {
  if (brokerIds.length === 0) return {};
  const { data, error } = await (supabase as any)
    .from("broker_reviews")
    .select("broker_id, rating")
    .in("broker_id", brokerIds);
  if (error) throw error;
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of (data ?? []) as { broker_id: string; rating: number }[]) {
    const cur = acc[r.broker_id] ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    acc[r.broker_id] = cur;
  }
  const out: Record<string, BrokerRating> = {};
  for (const [id, v] of Object.entries(acc)) {
    out[id] = { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count };
  }
  return out;
}

export function useBrokerRatings(brokerIds: string[]) {
  const key = [...brokerIds].sort().join(",");
  return useQuery({
    queryKey: ["broker-ratings", key],
    enabled: brokerIds.length > 0,
    queryFn: () => fetchBrokerRatings(brokerIds),
  });
}

export function RatingBadge({ rating }: { rating?: BrokerRating }) {
  if (!rating || rating.count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
      <Star className="h-3 w-3 fill-current" />
      {rating.avg.toFixed(1)}
      <span className="font-medium text-muted-foreground">({rating.count})</span>
    </span>
  );
}

export function StarRow({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= value ? "h-3.5 w-3.5 fill-primary text-primary" : "h-3.5 w-3.5 text-muted-foreground"}
        />
      ))}
    </span>
  );
}
