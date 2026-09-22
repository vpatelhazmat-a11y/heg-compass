import { Link } from "@tanstack/react-router";
import { HUB_MODULES } from "@/lib/modules";

export function AppLauncher() {
  return (
    <section
      aria-labelledby="modules-heading"
      className="border-b border-border bg-surface px-6 py-8"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          HEG Compass
        </p>
        <h1 id="modules-heading" className="mt-1 text-2xl font-semibold text-foreground">
          Apps
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a workspace. Open a customer to work with its sites and related records.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {HUB_MODULES.map(({ label, description, to, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="group flex min-h-28 items-start gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">{label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
