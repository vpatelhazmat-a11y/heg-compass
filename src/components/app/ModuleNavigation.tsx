import { Link } from "@tanstack/react-router";
import { activeModule } from "@/lib/modules";

const menus: Record<string, [string, string][]> = {
  Customers: [
    ["Customers", "/customers"],
    ["Pipeline", "/sales"],
    ["Contacts", "/records/contacts"],
    ["Rates", "/records/rates"],
    ["Contracts", "/records/contracts"],
  ],
  Sites: [
    ["Sites", "/sites"],
    ["Assessments", "/records/site_assessments"],
  ],
  "Site Assessments": [
    ["Assessments", "/records/site_assessments"],
    ["Sites", "/sites"],
  ],
  Equipment: [
    ["Equipment", "/equipment"],
    ["Assignments", "/records/equipment_assignments"],
    ["Compliance", "/records/equipment_compliance"],
  ],
  "Bids / RFPs": [
    ["Bids / RFPs", "/bids"],
    ["Opportunities", "/records/opportunities"],
  ],
  "Refused Loads": [
    ["Dashboard", "/lost-loads"],
    ["Records", "/lost-loads/records"],
    ["Load entry", "/lost-loads/new"],
  ],
  Safety: [
    ["Safety overview", "/safety"],
    ["Incidents", "/records/incidents"],
    ["Corrective actions", "/records/corrective_actions"],
  ],
};

export function ModuleNavigation({ pathname }: { pathname: string }) {
  const module = activeModule(pathname);
  const links = module
    ? (menus[module.label] ?? [[module.label, module.to]])
    : [
        ["Apps", "/command-center"],
        ["Daily overview", "/overview"],
      ];
  const canonicalPath = pathname.replace(
    /^\/records\/(customers|sites|equipment|bids)(?=\/|$)/,
    "/$1",
  );
  const selected = [...links]
    .sort((a, b) => b[1]!.length - a[1]!.length)
    .find(([, to]) => canonicalPath === to || canonicalPath.startsWith(`${to}/`))?.[1];
  return (
    <nav className="module-navigation" aria-label="Module navigation">
      {links.map(([label, to]) => (
        <Link key={to} to={to!} aria-current={selected === to ? "page" : undefined}>
          {label}
        </Link>
      ))}
      {module && (
        <Link className="overview-link" to="/overview">
          Daily overview
        </Link>
      )}
    </nav>
  );
}
