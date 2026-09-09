export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatMoney(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatNumber(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("en-US");
}

export function orDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function dueLabel(value?: string | null): { label: string; tone: "danger" | "warning" | "neutral" | "success" } {
  const days = daysUntil(value);
  if (days === null) return { label: "No date", tone: "neutral" };
  if (days < 0) return { label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`, tone: "danger" };
  if (days === 0) return { label: "Due today", tone: "danger" };
  if (days <= 7) return { label: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: "warning" };
  return { label: formatDate(value), tone: "neutral" };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
