import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { HUB_MODULES } from "@/lib/modules";
import { CompassIcon } from "./CompassIcon";

export function AppLauncher() {
  const [search, setSearch] = useState("");
  const modules = HUB_MODULES.filter((module) =>
    `${module.label} ${module.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section aria-labelledby="modules-heading" className="app-desktop">
      <div className="launcher-intro">
        <p className="launcher-eyebrow">HAZMAT ENVIRONMENTAL GROUP</p>
        <h1 id="modules-heading">HEG Compass</h1>
        <p>Select an app to open your workspace.</p>
      </div>
      <label className="app-finder">
        <Search size={18} aria-hidden />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Find an app..."
          aria-label="Find an app"
        />
        <span aria-hidden>
          {modules.length} {modules.length === 1 ? "app" : "apps"}
        </span>
      </label>
      <div className="app-grid">
        {modules.map(({ label, description, to }) => (
          <Link key={label} to={to} className="app-tile" title={description}>
            <span className="app-icon" data-app={label}>
              <CompassIcon name={label} />
            </span>
            <span className="app-label">{label}</span>
            <span className="app-description">{description}</span>
          </Link>
        ))}
      </div>
      {!modules.length && (
        <p className="launcher-empty">No apps match "{search}". Try a different name.</p>
      )}
      <div className="launcher-footer">
        <span>
          HEG <strong>Compass</strong>
        </span>
        <span>Customers · Operations · Safety</span>
      </div>
    </section>
  );
}
