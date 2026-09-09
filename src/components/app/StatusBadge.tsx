import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/30",
  danger: "bg-danger-soft text-danger border-danger/25",
  info: "bg-info-soft text-info border-info/25",
  neutral: "bg-neutral-soft text-muted-foreground border-border",
};

const STATUS_TONES: Record<string, Tone> = {
  // customers / general
  Active: "success",
  Prospect: "info",
  "Qualified Prospect": "info",
  Qualified: "success",
  Conditional: "warning",
  "Under Review": "warning",
  "Not Reviewed": "neutral",
  "Not Qualified": "danger",
  "On Hold": "warning",
  Inactive: "neutral",
  Archived: "neutral",
  Lost: "danger",
  Won: "success",
  // bids
  Identified: "neutral",
  Qualification: "info",
  Preparing: "info",
  "Waiting on Information": "warning",
  Pricing: "info",
  "Internal Review": "info",
  Submitted: "success",
  Withdrawn: "neutral",
  Cancelled: "neutral",
  // rates
  Draft: "neutral",
  Quoted: "info",
  "Pending Approval": "warning",
  Expired: "danger",
  Rejected: "danger",
  Superseded: "neutral",
  // work items
  Open: "warning",
  "In Progress": "info",
  "In Process": "info",
  Waiting: "warning",
  Completed: "success",
  Resolved: "success",
  Closed: "neutral",
  Overdue: "danger",
  // capacity
  Serviceable: "success",
  "Capacity Review": "warning",
  "Currently Not Serviceable": "danger",
  // data quality
  Verified: "success",
  "Needs Review": "warning",
  "Conflicting Source": "danger",
  "Missing Information": "warning",
  "Imported — Unverified": "info",
};

export function statusTone(status?: string | null): Tone {
  if (!status) return "neutral";
  return STATUS_TONES[status] ?? "neutral";
}

export function StatusBadge({
  status,
  tone,
  className,
}: {
  status?: string | null;
  tone?: Tone;
  className?: string;
}) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone ?? statusTone(status)],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status}
    </span>
  );
}
