import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  icon?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden />}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-11 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string | undefined; onRetry?: (() => void) | undefined }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-4 text-sm">
      <p className="font-medium text-danger">We couldn't load this information.</p>
      <p className="mt-1 text-muted-foreground">{message ?? "Please try again in a moment."}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-medium text-danger underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}
