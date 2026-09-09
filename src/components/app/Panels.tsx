import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  footer,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </section>
  );
}

export function FieldGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
      )}
    >
      {children}
    </dl>
  );
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="field-label">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "danger" | "warning" | "success" | "info";
  onClick?: () => void;
}) {
  const toneClass = {
    neutral: "text-foreground",
    danger: "text-danger",
    warning: "text-warning",
    success: "text-success",
    info: "text-info",
  }[tone];

  const content = (
    <>
      <span className="field-label">{label}</span>
      <span className={cn("mt-1 block text-2xl font-semibold tabular", toneClass)}>{value}</span>
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-accent/40"
      >
        {content}
      </button>
    );
  }
  return <div className="rounded-lg border border-border bg-surface px-4 py-3">{content}</div>;
}

export function Timeline({ items }: { items: { date?: string | null; title: string; detail?: string | null }[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No history recorded yet.</p>;
  }
  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {items.map((item, index) => (
        <li key={index} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-border-strong" aria-hidden />
          <p className="text-xs text-muted-foreground">{item.date ?? "Date unknown"}</p>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          {item.detail && <p className="text-sm text-muted-foreground">{item.detail}</p>}
        </li>
      ))}
    </ol>
  );
}
