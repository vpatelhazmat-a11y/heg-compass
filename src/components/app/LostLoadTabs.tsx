import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/lost-loads", label: "Dashboard" },
  { to: "/lost-loads/new", label: "Refused load entry" },
  { to: "/lost-loads/records", label: "Records" },
  { to: "/lost-loads/analysis", label: "Lost revenue analysis" },
] as const;

export function LostLoadTabs() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav aria-label="Lost loads" className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-4">
      {TABS.map((tab) => {
        const active = tab.to === "/lost-loads" ? pathname === "/lost-loads" || pathname === "/lost-loads/" : pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
