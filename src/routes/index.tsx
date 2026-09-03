import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Building2,
  Heart,
  LayoutDashboard,
  Users,
  ShieldAlert,
  ArrowRight,
  ListChecks,
  Handshake,
  Calculator,
  TrendingUp,
  Scale,
  Sparkles,
  Gift,
} from "lucide-react";
import heroCoast from "@/assets/hero-coast.jpg";
import { supabase } from "@/integrations/supabase/client";
import { RatingBadge, useBrokerRatings } from "@/components/RatingBadge";
import { getHomeStats } from "@/lib/home-stats.functions";
import { getBrokerCount } from "@/lib/broker-count.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REMI AI — Операционна система за недвижими имоти" },
      {
        name: "description",
        content:
          "REMI AI мисли с теб на всяка стъпка от сделката — правен анализ, пазарна интелигентност и имоти от проверени български брокери.",
      },
      { property: "og:title", content: "REMI AI — Операционна система за недвижими имоти" },
      {
        property: "og:description",
        content: "AI анализ на имоти, пазарна интелигентност и директен контакт с проверени брокери.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const TOOLS = [
  {
    to: "/risk",
    Icon: ShieldAlert,
    title: "REMI Правен анализ",
    desc: "Анализ на документи по снимка или описание — тежести и правни рискове, преди да платиш капаро",
  },
  {
    to: "/checklist",
    Icon: ListChecks,
    title: "REMI Чеклист за сделка",
    desc: "Проверени стъпки при оглед и покупка",
  },
  {
    to: "/negotiation",
    Icon: Handshake,
    title: "REMI Преговори и продажби",
    desc: "Готови тактики по ситуация — за по-добра цена на масата",
  },
  {
    to: "/invest",
    Icon: Calculator,
    title: "REMI Инвеститорски анализ",
    desc: "Доходност, вноска и възвръщаемост на имота, изчислени наведнъж",
  },
  {
    to: "/market",
    Icon: TrendingUp,
    title: "REMI Пазарна интелигентност",
    desc: "Пазарен скор и ценови тенденции по квартали, в реално време",
  },
  { to: "/compare", Icon: Scale, title: "Сравнение на имоти", desc: "AI сравнение на 2–3 оферти" },
] as const;

const STEPS = [
  { n: "01", text: "Въведи данни за имота (30 секунди)" },
  { n: "02", text: "AI анализира спрямо пазара" },
  { n: "03", text: "Получаваш оценка и препоръки" },
  { n: "04", text: "Действаш с увереност" },
];

// Homepage-only light + teal theme, scoped via CSS custom-property
// overrides on this wrapper. Does NOT touch global tokens in styles.css,
// so the dashboard and every other authenticated route keep the existing
// navy/yellow theme untouched.
const HOME_THEME: React.CSSProperties = {
  ["--background" as any]: "#F2F5F4",
  ["--foreground" as any]: "#12181A",
  ["--card" as any]: "#FFFFFF",
  ["--card-foreground" as any]: "#12181A",
  ["--popover" as any]: "#FFFFFF",
  ["--popover-foreground" as any]: "#12181A",
  ["--primary" as any]: "#0E8A82",
  ["--primary-foreground" as any]: "#FFFFFF",
  ["--secondary" as any]: "#E7EDEB",
  ["--secondary-foreground" as any]: "#12181A",
  ["--muted" as any]: "#E7EDEB",
  ["--muted-foreground" as any]: "#54625E",
  ["--accent" as any]: "#DFF0EC",
  ["--accent-foreground" as any]: "#0B6B66",
  ["--border" as any]: "rgba(15,25,23,0.14)",
  ["--input" as any]: "rgba(15,25,23,0.18)",
  ["--ring" as any]: "#0E8A82",
};

function Landing() {
  const homeStatsFn = useServerFn(getHomeStats);
  const brokerCountFn = useServerFn(getBrokerCount);

  const { data: stats } = useQuery({ queryKey: ["home-stats"], queryFn: () => homeStatsFn() });
  const { data: brokerCount } = useQuery({ queryKey: ["broker-count"], queryFn: () => brokerCountFn() });

  const { data: brokers } = useQuery({
    queryKey: ["home-brokers-teaser"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,agency_name,photo_url")
        .eq("broker_status", "verified")
        .order("full_name", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: brokerRatings } = useBrokerRatings((brokers ?? []).map((b) => b.id));

  const remaining = Math.max(0, 50 - (brokerCount?.count ?? 0));

  return (
    <div style={HOME_THEME}>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroCoast}
          alt="Морската градина във Варна"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/70 via-[#0B1120]/80 to-[#F2F5F4]" />
        <div className="relative mx-auto max-w-xl px-5 pt-16 pb-12 text-white">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30 backdrop-blur">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-center text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            Първата в България <span className="text-primary">операционна система</span> за недвижими имоти
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-white/80">
            REMI AI мисли с теб на всяка стъпка от сделката — за брокери и купувачи.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
              Разгледай имоти
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-primary hover:bg-white/15"
            >
              Брокерски портал
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-4 max-w-xl px-5">
        {/* LIVE STATS */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-black text-primary">{stats?.activeListings ?? "—"}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">активни обяви</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-black text-primary">{stats?.verifiedBrokers ?? "—"}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">брокери в платформата</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">AI оценка за секунди</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to="/auth" className="rounded-2xl border border-border bg-card p-4 text-card-foreground transition hover:border-primary/40">
            <LayoutDashboard className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Аз съм брокер</p>
            <p className="text-xs text-muted-foreground">Управлявай обяви</p>
          </Link>
          <Link to="/auth" className="rounded-2xl border border-border bg-card p-4 text-card-foreground transition hover:border-primary/40">
            <Heart className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Аз съм клиент</p>
            <p className="text-xs text-muted-foreground">Купувай или продавай</p>
          </Link>
        </div>

        {/* TOOLS */}
        <section className="mt-10">
          <h2 className="text-center text-xl font-black tracking-tight text-foreground">
            Всичко за по-умни имотни решения
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOOLS.map(({ to, Icon, title, desc }) => (
              <Link
                key={to}
                to={to}
                className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-10">
          <h2 className="text-center text-xl font-black tracking-tight text-foreground">Как работи</h2>
          <ol className="mt-4 space-y-2">
            {STEPS.map((s) => (
              <li key={s.n} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                  {s.n}
                </span>
                <span className="text-sm font-medium text-foreground">{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* BROKERS TEASER */}
        {brokers && brokers.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-foreground">Брокери в платформата</h2>
              <Link to="/brokers" className="text-xs font-semibold text-primary hover:underline">
                Виж всички
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {brokers.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/brokers/$id"
                    params={{ id: b.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                      {b.photo_url ? (
                        <img src={b.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{b.full_name ?? "Брокер"}</p>
                      {b.agency_name && <p className="truncate text-xs text-muted-foreground">{b.agency_name}</p>}
                      <RatingBadge rating={brokerRatings?.[b.id]} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FINAL CTA */}
        <section className="mt-10 mb-8 overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Gift className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-black text-foreground">
            🎁 Първите 50 регистрирани брокери ще ползват REMI AI 3 месеца безплатно
          </p>
          {remaining > 0 ? (
            <p className="mt-3 text-xl font-black text-primary">Останаха {remaining} от 50 места</p>
          ) : (
            <p className="mt-3 text-sm font-bold text-muted-foreground">Промоцията приключи</p>
          )}
          <div className="mt-5 flex flex-col gap-2.5">
            <Link
              to="/for-brokers"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              За брокери
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/40"
            >
              <Search className="h-4 w-4" />
              Разгледай имоти
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
