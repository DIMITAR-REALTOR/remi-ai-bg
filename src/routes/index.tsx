import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
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
  Camera,
  FileText,
} from "lucide-react";

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
    to: "/dashboard/listings",
    Icon: Camera,
    title: "REMI Обяви",
    desc: "Качваш снимки на имота — REMI ги анализира и написва продаваща обява",
  },
  {
    to: "/market",
    Icon: TrendingUp,
    title: "REMI Пазарна интелигентност",
    desc: "Пазарен скор и ценови тенденции по квартали, в реално време",
  },
  {
    to: "/risk",
    Icon: ShieldAlert,
    title: "REMI Правен анализ",
    desc: "Анализ на документи по снимка или описание — тежести и правни рискове, преди да платиш капаро",
  },
  {
    to: "/dashboard/contracts",
    Icon: FileText,
    title: "REMI Договори",
    desc: "Анализира и изготвя договори по типа сделка — автоматично",
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
    <div className="home-theme">
      <section className="relative isolate overflow-hidden pt-8 pb-6">
        <div className="mx-auto max-w-xl px-5">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            REMI AI · Варна и региона
          </p>
          <h1 className="mt-3 text-center text-[28px] font-black leading-[1.1] tracking-tight text-foreground sm:text-4xl">
            Първата в България{" "}
            <span className="text-primary">операционна система</span> за недвижими имоти
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            REMI мисли с теб на всяка стъпка от сделката — от първия оглед до нотариалния акт. За
            брокери, които искат данни и правна яснота вместо усещане.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-md transition hover:bg-foreground/90"
            >
              Аз съм брокер
            </Link>
            <Link
              to="/market"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40"
            >
              Виж имотния радар
              <ArrowRight className="h-4 w-4 rotate-90" />
            </Link>
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-primary/5">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <p className="text-base font-bold text-foreground">Здравей, Димитър</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">Ето какво се случва днес</p>
                </div>
                <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  визия
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted p-3">
                  <p className="text-2xl font-black text-foreground">5</p>
                  <p className="text-[11px] text-muted-foreground">сделки в процес</p>
                </div>
                <div className="rounded-2xl bg-muted p-3">
                  <p className="text-2xl font-black text-foreground">24</p>
                  <p className="text-[11px] text-muted-foreground">активни клиенти</p>
                </div>
                <div className="rounded-2xl bg-muted p-3">
                  <p className="text-2xl font-black text-foreground">9</p>
                  <p className="text-[11px] text-muted-foreground">активни обяви</p>
                </div>
                <div className="rounded-2xl bg-muted p-3">
                  <p className="text-2xl font-black text-foreground">3</p>
                  <p className="text-[11px] text-muted-foreground">задачи днес</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-muted p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">Пазарен анализ · кв. Чайка</p>
                  <p className="text-sm font-black text-primary">8.2/10</p>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-background">
                  <div className="h-full w-[82%] rounded-full bg-primary" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Благоприятен момент за продажба — търсенето расте с 16%.
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-muted p-3">
                <div className="flex justify-between">
                  {[
                    ["Пон", "31", false, false],
                    ["Вт", "1", false, false],
                    ["Ср", "2", true, true],
                    ["Чт", "3", false, true],
                    ["Пт", "4", false, false],
                    ["Сб", "5", false, false],
                    ["Нед", "6", false, false],
                  ].map(([d, n, isToday, hasDot], i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center rounded-xl px-2 py-1.5 ${
                        isToday ? "bg-foreground text-background" : "text-foreground"
                      }`}
                    >
                      <span className="text-[9px] font-semibold uppercase">{d}</span>
                      <span className="mt-0.5 text-sm font-black">{n}</span>
                      {hasDot && <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />}
                    </div>
                  ))}
                </div>
                <ul className="mt-4 space-y-2.5">
                  <li className="flex items-center gap-3 text-xs">
                    <span className="w-9 text-muted-foreground">10:00</span>
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-medium text-foreground">Оглед — кв. Бриз</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs">
                    <span className="w-9 text-muted-foreground">13:30</span>
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="font-medium text-foreground">Обаждане — Ивайло К.</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs">
                    <span className="w-9 text-muted-foreground">15:30</span>
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-medium text-foreground">Среща — нотариус</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs">
                    <span className="w-9 text-muted-foreground">17:00</span>
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="font-medium text-foreground">Подготовка документи</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent text-xs font-black text-accent-foreground">
                  92 м²
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    REMI препоръчва — изгодна цена
                  </p>
                  <p className="truncate text-sm font-bold text-foreground">Тристаен, кв. Чайка</p>
                  <p className="text-xs text-muted-foreground">
                    92,000 € · 8% под средното за квартала
                  </p>
                </div>
                <Link
                  to="/search"
                  className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                >
                  Виж имота →
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border bg-muted px-4 py-3">
              <input
                type="text"
                placeholder="Добави задача или бележка..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
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
