import type { FieldConfig } from "@/components/app/RecordForm";
import * as fields from "./entities";

export type RecordDefinition = {
  label: string;
  singular: string;
  title: string[];
  columns: string[];
  fields: FieldConfig[];
  relations: string[];
};

const define = (
  label: string,
  singular: string,
  title: string[],
  columns: string[],
  form: FieldConfig[],
  relations: string[] = [],
): RecordDefinition => ({ label, singular, title, columns, fields: form, relations });

/** The allowlist used by record routes, forms, relationship links and list filters. */
export const RECORDS: Record<string, RecordDefinition> = {
  customers: define(
    "Customers",
    "Customer",
    ["legal_name"],
    [
      "legal_name",
      "dba_name",
      "industry",
      "status",
      "qualification_status",
      "customer_since",
      "data_quality_status",
    ],
    fields.customerFields,
  ),
  sites: define(
    "Sites",
    "Site",
    ["site_name"],
    ["site_name", "customer_id", "city", "state", "status"],
    fields.siteFields,
    ["customer_id"],
  ),
  equipment: define(
    "Equipment",
    "Equipment",
    ["unit_number"],
    [
      "unit_number",
      "category",
      "equipment_type",
      "model_year",
      "make",
      "capacity",
      "ownership_type",
      "status",
    ],
    fields.equipmentFields,
  ),
  bids: define(
    "Bids / RFPs",
    "Bid",
    ["bid_name"],
    [
      "bid_name",
      "customer_id",
      "bid_type",
      "status",
      "due_date",
      "pricing_status",
      "document_status",
      "estimated_revenue",
    ],
    fields.bidFields,
    ["customer_id", "opportunity_id"],
  ),
  contacts: define(
    "Contacts",
    "Contact",
    ["first_name", "last_name"],
    ["first_name", "last_name", "customer_id", "site_id", "contact_type"],
    fields.contactFields,
    ["customer_id", "site_id"],
  ),
  products: define(
    "Products",
    "Product",
    ["product_name"],
    ["product_name", "customer_id", "physical_state"],
    fields.productFields,
    ["customer_id"],
  ),
  lanes: define(
    "Lanes",
    "Lane",
    ["lane_name"],
    ["lane_name", "customer_id", "origin_site_id", "destination_site_id"],
    fields.laneFields,
    ["customer_id", "origin_site_id", "destination_site_id"],
  ),
  rates: define(
    "Rates",
    "Rate",
    ["quote_reference"],
    ["customer_id", "amount", "unit", "status", "effective_date"],
    fields.rateFields,
    ["customer_id", "site_id", "lane_id", "product_id"],
  ),
  contracts: define(
    "Contracts",
    "Contract",
    ["contract_name"],
    ["contract_name", "customer_id", "status", "expiration_date"],
    fields.contractFields,
    ["customer_id"],
  ),
  opportunities: define(
    "Opportunities",
    "Opportunity",
    ["name"],
    ["name", "customer_id", "stage", "expected_close_date"],
    fields.opportunityFields,
    ["customer_id", "site_id"],
  ),
  refused_loads: define(
    "Refused Loads",
    "Refused load",
    ["call_in_date", "product"],
    [
      "call_in_date",
      "customer_id",
      "product",
      "equipment_type",
      "load_count",
      "loss_reason",
      "estimated_lost_revenue",
      "cs_rep",
    ],
    [
      { name: "call_in_date", label: "Call in date", type: "date", section: "Request" },
      { name: "equipment_type", label: "Equipment needed", section: "Request" },
      { name: "load_count", label: "Number of loads", type: "number", section: "Request" },
      { name: "product", label: "Product description", section: "Request" },
      { name: "rated_status", label: "Rated status", section: "Request" },
      { name: "pickup_city", label: "Pickup city", section: "Lane" },
      { name: "pickup_state", label: "Pickup state", section: "Lane" },
      { name: "delivery_city", label: "Delivery city", section: "Lane" },
      { name: "delivery_state", label: "Delivery state", section: "Lane" },
      { name: "offered_date", label: "Offered date", type: "date", section: "Outcome" },
      { name: "cs_rep", label: "CS representative", section: "Outcome" },
      { name: "loss_reason", label: "Reason for lost revenue", section: "Outcome" },
      { name: "estimated_lost_revenue", label: "Lost revenue", type: "money", section: "Outcome" },
      {
        name: "requested_comments",
        label: "Requested / comments",
        type: "richtext",
        section: "Notes",
      },
      { name: "offered_comments", label: "Offered / comments", type: "richtext", section: "Notes" },
      {
        name: "internal_notes",
        label: "Additional explanation",
        type: "richtext",
        section: "Notes",
      },
    ],
    [
      "customer_id",
      "site_id",
      "equipment_id",
      "lane_id",
      "product_id",
      "contact_id",
      "bid_id",
      "rate_id",
      "opportunity_id",
    ],
  ),
  incidents: define(
    "Incidents",
    "Incident",
    ["incident_type", "incident_date"],
    ["incident_date", "incident_type", "customer_id", "severity", "status"],
    fields.incidentFields,
    ["customer_id", "site_id", "equipment_id", "lane_id"],
  ),
  site_assessments: define(
    "Site Assessments",
    "Site assessment",
    ["assessment_type", "assessment_date"],
    ["site_id", "assessment_type", "assessment_date", "next_review_date", "status"],
    fields.assessmentFields,
    ["site_id"],
  ),
  tasks: define(
    "Tasks",
    "Task",
    ["title"],
    ["title", "priority", "status", "due_date"],
    fields.taskFields,
  ),
  documents: define(
    "Documents",
    "Document",
    ["document_name"],
    ["document_name", "document_type", "classification", "expiration_date"],
    fields.documentFields,
  ),
  requirements: define(
    "Requirements",
    "Requirement",
    ["requirement"],
    ["requirement", "category", "status"],
    fields.requirementFields,
  ),
  lost_business: define(
    "Lost Business",
    "Lost business",
    ["occurred_on", "reason_category"],
    ["occurred_on", "customer_id", "reason_category"],
    fields.lostBusinessFields,
    ["customer_id", "site_id", "lane_id", "product_id"],
  ),
  corrective_actions: define(
    "Corrective Actions",
    "Corrective action",
    ["action"],
    ["action", "incident_id", "due_date", "status"],
    fields.correctiveActionFields,
    ["incident_id"],
  ),
  equipment_assignments: define(
    "Equipment Assignments",
    "Assignment",
    ["assignment_type"],
    ["equipment_id", "customer_id", "site_id", "start_date", "end_date"],
    fields.equipmentAssignmentFields,
    ["equipment_id", "customer_id", "site_id", "lane_id", "product_id"],
  ),
  equipment_leases: define(
    "Equipment Rates",
    "Equipment rate",
    ["rate_kind", "rate_unit"],
    [
      "equipment_id",
      "rate_kind",
      "rate",
      "rate_unit",
      "currency_code",
      "effective_date",
      "expiration_date",
    ],
    fields.equipmentLeaseFields,
    ["equipment_id", "customer_id", "contract_id"],
  ),
  equipment_compliance: define(
    "Equipment Compliance",
    "Compliance record",
    ["requirement"],
    ["equipment_id", "requirement", "expiration_date", "status"],
    fields.equipmentComplianceFields,
    ["equipment_id"],
  ),
  equipment_technology: define(
    "Equipment Technology",
    "Technology record",
    ["technology_type"],
    ["equipment_id", "technology_type", "status"],
    fields.equipmentTechnologyFields,
    ["equipment_id"],
  ),
  knowledge_articles: define(
    "Knowledge",
    "Article",
    ["title"],
    ["title", "category", "updated_at"],
    [
      { name: "title", label: "Title", required: true },
      { name: "category", label: "Category" },
      { name: "content", label: "Article", type: "textarea" },
    ],
  ),
};

export const RELATION_TARGETS: Record<string, string> = {
  contact_id: "contacts",
  rate_id: "rates",
  customer_id: "customers",
  site_id: "sites",
  origin_site_id: "sites",
  destination_site_id: "sites",
  equipment_id: "equipment",
  lane_id: "lanes",
  product_id: "products",
  contract_id: "contracts",
  opportunity_id: "opportunities",
  incident_id: "incidents",
  bid_id: "bids",
};
export const ENTITY_TABLES: Record<string, string> = {
  customer: "customers",
  site: "sites",
  equipment: "equipment",
  bid: "bids",
  rate: "rates",
  contact: "contacts",
  lane: "lanes",
  product: "products",
  contract: "contracts",
  incident: "incidents",
  assessment: "site_assessments",
  site_assessment: "site_assessments",
  task: "tasks",
  document: "documents",
  opportunity: "opportunities",
  refused_load: "refused_loads",
};

export function recordDefinition(table: string): RecordDefinition | undefined {
  return Object.hasOwn(RECORDS, table) ? RECORDS[table] : undefined;
}
export function editableRelationKeys(table: string): string[] {
  // Rate revisions and assignment history keep their original record identity.
  return ["rates", "equipment_assignments"].includes(table)
    ? []
    : (recordDefinition(table)?.relations ?? []);
}
export function relationDependsOnCustomer(table: string, key: string): boolean {
  // Lane endpoints are physical locations and may belong to different customers.
  return (
    Boolean(recordDefinition(table)?.relations.includes("customer_id")) &&
    ["site_id", "lane_id", "product_id", "opportunity_id", "contract_id"].includes(key)
  );
}
export function fieldLabel(name: string): string {
  return name
    .replace(/_id$/, "")
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
export function recordLabel(table: string, row: Record<string, unknown>): string {
  const definition = recordDefinition(table);
  return (
    definition?.title
      .map((key) => row[key])
      .filter(Boolean)
      .join(" · ") || `${definition?.singular ?? "Record"} ${String(row["id"] ?? "").slice(0, 8)}`
  );
}
export function recordHref(table: string, id: string, returnTo?: string): string {
  if (!recordDefinition(table)) return "/command-center";
  const href = ["customers", "sites", "equipment"].includes(table)
    ? `/${table}/${encodeURIComponent(id)}`
    : `/records/${encodeURIComponent(table)}/${encodeURIComponent(id)}`;
  return returnTo ? `${href}?returnTo=${encodeURIComponent(returnTo)}` : href;
}

export function recordListHref(table: string): string {
  const workspaces: Record<string, string> = {
    customers: "/customers",
    sites: "/sites",
    equipment: "/equipment",
    bids: "/bids",
    refused_loads: "/lost-loads/records",
    incidents: "/safety",
    tasks: "/tasks",
    knowledge_articles: "/knowledge",
  };
  return workspaces[table] ?? `/records/${encodeURIComponent(table)}`;
}

export type RelatedList = {
  table: string;
  label: string;
  column?: string;
  entityType?: string;
  equipmentAtSite?: boolean;
};
export const RELATED_LISTS: Record<string, RelatedList[]> = {
  customers: [
    { table: "sites", label: "Sites", column: "customer_id" },
    { table: "bids", label: "Bids", column: "customer_id" },
    { table: "rates", label: "Rates", column: "customer_id" },
    { table: "refused_loads", label: "Refused Loads", column: "customer_id" },
    { table: "incidents", label: "Incidents", column: "customer_id" },
    { table: "documents", label: "Documents", entityType: "customer" },
  ],
  sites: [
    { table: "site_assessments", label: "Assessments", column: "site_id" },
    { table: "equipment", label: "Equipment", equipmentAtSite: true },
    { table: "contacts", label: "Contacts", column: "site_id" },
    { table: "incidents", label: "Incidents", column: "site_id" },
    { table: "documents", label: "Documents", entityType: "site" },
  ],
  equipment: [
    { table: "equipment_assignments", label: "Assignments", column: "equipment_id" },
    { table: "equipment_leases", label: "Rates", column: "equipment_id" },
    { table: "incidents", label: "Incidents", column: "equipment_id" },
    { table: "documents", label: "Documents", entityType: "equipment" },
  ],
};
export function relatedList(parent: string, table: string): RelatedList | undefined {
  return Object.hasOwn(RELATED_LISTS, parent)
    ? RELATED_LISTS[parent]?.find((item) => item.table === table)
    : undefined;
}
export function relatedFilters(relation: RelatedList, id: string): Record<string, string> {
  if (relation.entityType) return { linked_entity_type: relation.entityType, linked_entity_id: id };
  if (relation.column) return { [relation.column]: id };
  throw new Error("This relationship needs its dedicated loader.");
}

export function recordReturnHref(table: string, value?: string): string {
  const fallback = recordListHref(table);
  if (!value || value.length > 2000 || !value.startsWith("/") || value.startsWith("//"))
    return fallback;
  try {
    const url = new URL(value, "https://heg.invalid");
    const allowed = [
      fallback,
      "/records/" + table,
      "/records/" + table + "/",
      "/customers",
      "/sites",
      "/equipment",
      "/sales",
      "/safety",
      "/bids",
      "/tasks",
      "/knowledge",
      "/lost-loads/records",
    ];
    const masterRecord = /^\/(customers|sites|equipment)\/[0-9a-f-]{36}$/i.test(url.pathname);
    const genericRecord = /^\/records\/([a-z_]+)(?:\/([0-9a-f-]{36}))?\/?$/i.exec(url.pathname);
    const knownRecord = Boolean(genericRecord && recordDefinition(genericRecord[1]!));
    if (table === "corrective_actions") allowed.push("/safety");
    if (table === "lost_business") allowed.push("/sales");
    return url.origin === "https://heg.invalid" &&
      (allowed.includes(url.pathname) || masterRecord || knownRecord)
      ? url.pathname + url.search
      : fallback;
  } catch {
    return fallback;
  }
}

export function recordReturnLabel(table: string, value?: string): string {
  const url = new URL(recordReturnHref(table, value), "https://heg.invalid");
  const generic = /^\/records\/([a-z_]+)(?:\/([^/]+))?/.exec(url.pathname);
  const master = /^\/(customers|sites|equipment)(?:\/([^/]+))?/.exec(url.pathname);
  const match = generic ?? master;
  if (match) {
    const definition = recordDefinition(match[1]!);
    return (match[2] ? definition?.singular : definition?.label) ?? "Records";
  }
  if (url.pathname === "/sales")
    return url.searchParams.get("section") === "lost" ? "Lost business" : "Opportunities";
  if (url.pathname === "/safety")
    return url.searchParams.get("section") === "actions" ? "Corrective actions" : "Incidents";
  return (
    (
      {
        "/bids": "Bids / RFPs",
        "/tasks": "Tasks",
        "/knowledge": "Knowledge",
        "/lost-loads/records": "Refused Loads",
      } as Record<string, string>
    )[url.pathname] ??
    recordDefinition(table)?.label ??
    "Records"
  );
}
