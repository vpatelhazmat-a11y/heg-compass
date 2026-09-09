import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; to?: string; params?: Record<string, string> };

export function PageHeader({
  title,
  description,
  breadcrumbs,
  meta,
  actions,
}: {
  title: string;
  description?: string | undefined;
  breadcrumbs?: Crumb[] | undefined;
  meta?: ReactNode | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <header className="border-b border-border bg-surface px-6 py-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />}
              {crumb.to ? (
                <Link to={crumb.to} params={crumb.params as never} className="hover:text-foreground hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title text-foreground">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="field-label">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}
