import { Link } from "@tanstack/react-router";
import { activeModule } from "@/lib/modules";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menus: Record<string, [string, string][]> = {
  Customers: [
    ["Customers", "/customers"],
    ["Pipeline", "/sales"],
    ["Contacts", "/records/contacts"],
    ["Rates", "/records/rates"],
    ["Contracts", "/records/contracts"],
    ["Products", "/records/products"],
    ["Lanes", "/records/lanes"],
    ["Requirements", "/records/requirements"],
    ["Lost business", "/records/lost_business"],
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
    ["Technology", "/records/equipment_technology"],
  ],
  "Bids / RFPs": [["Bids / RFPs", "/bids"]],
  "Refused Loads": [
    ["Summary", "/lost-loads"],
    ["Records", "/lost-loads/records"],
    ["Analysis", "/lost-loads/analysis"],
  ],
  Safety: [
    ["Safety overview", "/safety"],
    ["Incidents", "/records/incidents"],
    ["Corrective actions", "/records/corrective_actions"],
  ],
  Settings: [
    ["Preferences", "/settings"],
    ["Profile", "/profile"],
  ],
};

export function ModuleNavigation({ pathname }: { pathname: string }) {
  const module = activeModule(pathname);
  const links = module
    ? (menus[module.label] ?? [[module.label, module.to]]).filter(([, to]) => to !== module.to)
    : [];
  if (!links.length) return null;
  const canonicalPath = pathname.replace(
    /^\/records\/(customers|sites|equipment|bids)(?=\/|$)/,
    "/$1",
  );
  const selected = [...links]
    .sort((a, b) => b[1]!.length - a[1]!.length)
    .find(([, to]) => canonicalPath === to || canonicalPath.startsWith(`${to}/`))?.[1];
  return (
    <nav className="module-navigation" aria-label="Module navigation">
      {links.slice(0, 3).map(([label, to]) => (
        <Link key={to} to={to!} aria-current={selected === to ? "page" : undefined}>
          {label}
        </Link>
      ))}
      {links.length > 3 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="module-more"
              aria-label="More module pages"
              data-active={links.slice(3).some(([, to]) => to === selected) || undefined}
            >
              {links.slice(3).find(([, to]) => to === selected)?.[0] ?? "More"}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {links.slice(3).map(([label, to]) => (
              <DropdownMenuItem key={to} asChild>
                <Link to={to!} aria-current={selected === to ? "page" : undefined}>
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
