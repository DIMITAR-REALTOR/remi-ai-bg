// Hardcoded Varna market data for MVP

export type NeighborhoodData = {
  name: string;
  avgPricePerSqm: number;
  trend: { month: string; price: number }[];
  safety: number; // 1-10
  infrastructure: { schools: number; hospitals: number; supermarkets: number };
  transport: { busDistanceM: number; cityCenterKm: number };
};

export const VARNA_NEIGHBORHOODS: Record<string, NeighborhoodData> = {
  "Левски": {
    name: "Левски",
    avgPricePerSqm: 1450,
    trend: [
      { month: "Юли", price: 1380 },
      { month: "Авг", price: 1395 },
      { month: "Сеп", price: 1410 },
      { month: "Окт", price: 1425 },
      { month: "Ное", price: 1440 },
      { month: "Дек", price: 1450 },
    ],
    safety: 8,
    infrastructure: { schools: 4, hospitals: 1, supermarkets: 9 },
    transport: { busDistanceM: 200, cityCenterKm: 3.5 },
  },
  "Чайка": {
    name: "Чайка",
    avgPricePerSqm: 1650,
    trend: [
      { month: "Юли", price: 1560 },
      { month: "Авг", price: 1585 },
      { month: "Сеп", price: 1600 },
      { month: "Окт", price: 1620 },
      { month: "Ное", price: 1635 },
      { month: "Дек", price: 1650 },
    ],
    safety: 9,
    infrastructure: { schools: 3, hospitals: 2, supermarkets: 7 },
    transport: { busDistanceM: 150, cityCenterKm: 4.2 },
  },
  "Гръцка махала": {
    name: "Гръцка махала",
    avgPricePerSqm: 2100,
    trend: [
      { month: "Юли", price: 1980 },
      { month: "Авг", price: 2010 },
      { month: "Сеп", price: 2040 },
      { month: "Окт", price: 2060 },
      { month: "Ное", price: 2080 },
      { month: "Дек", price: 2100 },
    ],
    safety: 9,
    infrastructure: { schools: 5, hospitals: 3, supermarkets: 12 },
    transport: { busDistanceM: 100, cityCenterKm: 0.8 },
  },
  "Младост": {
    name: "Младост",
    avgPricePerSqm: 1380,
    trend: [
      { month: "Юли", price: 1310 },
      { month: "Авг", price: 1325 },
      { month: "Сеп", price: 1340 },
      { month: "Окт", price: 1355 },
      { month: "Ное", price: 1370 },
      { month: "Дек", price: 1380 },
    ],
    safety: 7,
    infrastructure: { schools: 6, hospitals: 1, supermarkets: 11 },
    transport: { busDistanceM: 250, cityCenterKm: 5.1 },
  },
  "Аспарухово": {
    name: "Аспарухово",
    avgPricePerSqm: 1150,
    trend: [
      { month: "Юли", price: 1090 },
      { month: "Авг", price: 1100 },
      { month: "Сеп", price: 1115 },
      { month: "Окт", price: 1125 },
      { month: "Ное", price: 1140 },
      { month: "Дек", price: 1150 },
    ],
    safety: 7,
    infrastructure: { schools: 3, hospitals: 1, supermarkets: 6 },
    transport: { busDistanceM: 300, cityCenterKm: 6.8 },
  },
  "Център": {
    name: "Център",
    avgPricePerSqm: 1950,
    trend: [
      { month: "Юли", price: 1850 },
      { month: "Авг", price: 1870 },
      { month: "Сеп", price: 1890 },
      { month: "Окт", price: 1910 },
      { month: "Ное", price: 1930 },
      { month: "Дек", price: 1950 },
    ],
    safety: 8,
    infrastructure: { schools: 8, hospitals: 4, supermarkets: 18 },
    transport: { busDistanceM: 80, cityCenterKm: 0 },
  },
};

export const NEIGHBORHOOD_NAMES = Object.keys(VARNA_NEIGHBORHOODS);

export const DEFAULT_NEIGHBORHOOD: NeighborhoodData = {
  name: "Варна (средни данни)",
  avgPricePerSqm: 1550,
  trend: [
    { month: "Юли", price: 1470 },
    { month: "Авг", price: 1490 },
    { month: "Сеп", price: 1510 },
    { month: "Окт", price: 1525 },
    { month: "Ное", price: 1540 },
    { month: "Дек", price: 1550 },
  ],
  safety: 7,
  infrastructure: { schools: 4, hospitals: 2, supermarkets: 9 },
  transport: { busDistanceM: 200, cityCenterKm: 3.5 },
};

export function getNeighborhood(name: string): NeighborhoodData {
  const exact = VARNA_NEIGHBORHOODS[name];
  if (exact) return exact;
  const found = Object.entries(VARNA_NEIGHBORHOODS).find(([k]) =>
    name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  );
  return found ? found[1] : DEFAULT_NEIGHBORHOOD;
}

export type Comparable = {
  title: string;
  price_eur: number;
  area_sqm: number;
  rooms: number;
  location: string;
  imot_url: string;
};

export function getComparables(neighborhood: string, propertyType: string, areaSqm: number): Comparable[] {
  const nb = getNeighborhood(neighborhood);
  const base = nb.avgPricePerSqm;
  const typeLabel = propertyType || "Имот";
  const sizes = [
    Math.max(30, Math.round(areaSqm * 0.85)),
    Math.max(30, Math.round(areaSqm * 0.95)),
    Math.max(30, Math.round(areaSqm * 1.05)),
    Math.max(30, Math.round(areaSqm * 1.15)),
  ];
  return sizes.map((sz, i) => ({
    title: `${typeLabel} ${sz} кв.м, ${nb.name}`,
    price_eur: Math.round(sz * base * (0.95 + i * 0.04)),
    area_sqm: sz,
    rooms: sz < 55 ? 2 : sz < 85 ? 3 : 4,
    location: `Варна, ${nb.name}`,
    imot_url: `https://www.imot.bg/pcgi/imot.cgi?act=3&slink=&f1=${encodeURIComponent(nb.name)}`,
  }));
}
