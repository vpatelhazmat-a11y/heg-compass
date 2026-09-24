import { Link } from "@tanstack/react-router";
import { HUB_MODULES } from "@/lib/modules";
import { CompassIcon } from "./CompassIcon";

export function AppLauncher() {
  return (
    <section aria-label="Applications" className="app-desktop">
      <div className="app-grid">
        {HUB_MODULES.map(({ label, description, to }) => (
          <Link key={label} to={to} className="app-tile" title={description}>
            <span className="app-icon" data-app={label}>
              <CompassIcon name={label} />
            </span>
            <span className="app-label">{label}</span>
            <span className="sr-only">{description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
