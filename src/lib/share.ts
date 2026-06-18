// Sharing & calendar export helpers (Bulgarian UI)

export function whatsappUrl(text: string, url?: string) {
  const msg = url ? `${text}\n${url}` : text;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function viberUrl(text: string, url?: string) {
  const msg = url ? `${text}\n${url}` : text;
  // viber://forward works on mobile; desktop falls back gracefully
  return `viber://forward?text=${encodeURIComponent(msg)}`;
}

export async function nativeShare(opts: { title?: string; text?: string; url?: string }) {
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share(opts);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// Format Date → YYYYMMDDTHHmmssZ (UTC) for Google Calendar
function gcalDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function googleCalendarUrl(opts: {
  title: string;
  start: Date | string;
  durationMinutes?: number;
  details?: string;
  location?: string;
}) {
  const start = typeof opts.start === "string" ? new Date(opts.start) : opts.start;
  const end = new Date(start.getTime() + (opts.durationMinutes ?? 60) * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${gcalDate(start)}/${gcalDate(end)}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
