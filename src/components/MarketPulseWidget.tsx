import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ChevronRight } from "lucide-react";
import { getNeighborhood } from "@/lib/market-data";
import { fmtPrice } from "@/lib/listings-meta";

type MarketPulseWidgetProps = {
  /** Квартали, в които брокерът има активни имоти (listings.neighborhood). */
  neighborhoods: string[];
};

const LINE_COLORS = [
  "hsl(var(--primary))",
  "hsl(38 92% 50%)",
  "hsl(142 71% 45%)",
];

export function MarketPulseWidget({ neighborhoods }: MarketPulseWidgetProps) {
  const uniqueNeighborhoods = useMemo(
    () => Array.from(new Set(neighborhoods.filter(Boolean))).slice(0, 3),
    [neighborhoods]
  );

  const { chartData, series } = useMemo(() => {
    if (uniqueNeighborhoods.length === 0) return { chartData: [], series: [] as string[] };
    const dataByNb = uniqueNeighborhoods.map((name) => getNeighborhood(name));
    const months = dataByNb[0]?.trend.map((t) => t.month) ?? [];
    const rows = months.map((month, i) => {
      const row: Record<string, string | number> = { month };
      dataByNb.forEach((nb) => {
        row[nb.name] = nb.trend[i]?.price ?? 0;
      });
      return row;
    });
    return { chartData: rows, series: dataByNb.map((nb) => nb.name) };
  }, [uniqueNeighborhoods]);

  if (uniqueNeighborhoods.length === 0) {
    return (
      <div className="mt-5">
        <h2 className="text-sm font-semibold text-foreground">Пазарен пулс</h2>
        <Link
          to="/market"
          className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground transition hover:border-primary/40"
        >
          <TrendingUp className="h-5 w-5 shrink-0 opacity-50" />
          Добави имот с квартал, за да видиш ценови тренд тук.
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Пазарен пулс</h2>
        <Link to="/market" className="flex items-center text-xs font-medium text-primary">
          Пълен анализ <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-2 rounded-2xl border border-border bg-card p-3">
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => fmtPrice(value)}
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              {series.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {uniqueNeighborhoods.map((name, i) => {
            const nb = getNeighborhood(name);
            return (
              <div key={name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: LINE_COLORS[i % LINE_COLORS.length] }}
                />
                {name} · {fmtPrice(nb.avgPricePerSqm)}/кв.м
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
