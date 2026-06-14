export const PROPERTY_TYPES = [
  { value: "apartment", label: "Апартамент" },
  { value: "house", label: "Къща" },
  { value: "land", label: "Парцел" },
  { value: "business", label: "Бизнес имот" },
] as const;

export const STATUSES = [
  { value: "active", label: "Активна", tone: "success" },
  { value: "reserved", label: "Резервирана", tone: "warning" },
  { value: "sold", label: "Продадена", tone: "muted" },
  { value: "rented", label: "Под наем", tone: "muted" },
] as const;

export const propertyTypeLabel = (v: string) =>
  PROPERTY_TYPES.find(p => p.value === v)?.label ?? v;
export const statusLabel = (v: string) =>
  STATUSES.find(s => s.value === v)?.label ?? v;
export const statusTone = (v: string) =>
  STATUSES.find(s => s.value === v)?.tone ?? "muted";

export const fmtPrice = (n: number) =>
  new Intl.NumberFormat("bg-BG").format(n) + " €";
