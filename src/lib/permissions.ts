import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/** Mirrors database policy for controls; Postgres remains the authority. */
export function canEditTable(roles: AppRole[], table: string): boolean {
  if (roles.includes("admin")) return table !== "rate_history";
  let allowed: AppRole[] = [];
  if (
    [
      "customers",
      "contacts",
      "products",
      "lanes",
      "opportunities",
      "lost_business",
      "rates",
      "bids",
      "contracts",
    ].includes(table)
  )
    allowed = ["sales"];
  else if (["sites", "refused_loads"].includes(table)) allowed = ["sales", "operations"];
  else if (
    [
      "equipment",
      "equipment_assignments",
      "equipment_leases",
      "equipment_compliance",
      "equipment_technology",
    ].includes(table)
  )
    allowed = ["operations"];
  else if (["drivers", "driver_qualifications", "driver_safety_events"].includes(table))
    allowed = ["safety"];
  else if (["incidents", "corrective_actions", "site_assessments"].includes(table))
    allowed = ["safety", "operations"];
  else if (["requirements", "documents", "tasks", "meetings", "knowledge_articles"].includes(table))
    allowed = ["sales", "operations", "safety"];
  return roles.some((role) => allowed.includes(role));
}
