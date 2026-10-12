import { activeModule } from "./modules";
import { canViewTable } from "./permissions";
import type { AppRole } from "@/hooks/use-session";

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
    ["Agreements", "/records/equipment_leases"],
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
    ["Personal settings", "/settings"],
    ["Users and access", "/admin"],
    ["Profile", "/profile"],
  ],
};

export function visibleModuleLinks(pathname: string, roles: AppRole[]) {
  const module = activeModule(pathname);
  if (!module) return [];
  const tables: Record<string, string> = {
    "/customers": "customers",
    "/sites": "sites",
    "/equipment": "equipment",
    "/sales": "opportunities",
    "/safety": "incidents",
    "/bids": "bids",
  };
  return (menus[module.label] ?? [[module.label, module.to]]).filter(([, to]) => {
    if (to === module.to) return false;
    if (to === "/admin") return roles.includes("admin");
    if (to === "/settings" || to === "/profile") return true;
    const table = to?.startsWith("/records/")
      ? to.split("/")[2]
      : to?.startsWith("/lost-loads")
        ? "refused_loads"
        : tables[to ?? ""];
    return Boolean(table && canViewTable(roles, table));
  });
}
