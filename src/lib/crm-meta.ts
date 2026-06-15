export const CLIENT_TYPES = [
  { value: "buyer", label: "Купувач" },
  { value: "seller", label: "Продавач" },
  { value: "renter", label: "Наемател" },
] as const;

export const CLIENT_STATUSES = [
  { value: "new", label: "Нов", tone: "info" },
  { value: "contacted", label: "Свързан се", tone: "muted" },
  { value: "viewing_scheduled", label: "Насрочен оглед", tone: "warning" },
  { value: "negotiating", label: "Преговори", tone: "warning" },
  { value: "closed", label: "Сделка приключена", tone: "success" },
] as const;

export const clientTypeLabel = (v: string) =>
  CLIENT_TYPES.find((t) => t.value === v)?.label ?? v;
export const clientStatusLabel = (v: string) =>
  CLIENT_STATUSES.find((s) => s.value === v)?.label ?? v;
export const clientStatusTone = (v: string) =>
  CLIENT_STATUSES.find((s) => s.value === v)?.tone ?? "muted";

export const crmToneClasses: Record<string, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
  info: "bg-primary/15 text-primary",
};

export const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric" });
};
