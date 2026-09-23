import { Link } from "@tanstack/react-router";
import { HUB_MODULES } from "@/lib/modules";
import { CompassIcon } from "./CompassIcon";

export function AppLauncher() {
  return (
    <section aria-labelledby="modules-heading" className="app-desktop">
      <div className="launcher-intro">
        <h1 id="modules-heading">Applications</h1>
      </div>
      <p className="launcher-hint">Start typing to find an app or record</p>
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
