export type HubModule = {
  id: string;
  label: string;
  description: string;
  to: string;
  paths: string[];
};

export const HUB_MODULES: HubModule[] = [
  {
    id: "customers",
    label: "Customers",
    description: "Accounts and their connected work",
    to: "/customers",
    paths: [
      "/customers",
      "/sales",
      "/records/customers",
      "/records/contacts",
      "/records/products",
      "/records/lanes",
      "/records/rates",
      "/records/contracts",
      "/records/opportunities",
      "/records/lost_business",
      "/records/requirements",
    ],
  },
  {
    id: "sites",
    label: "Sites",
    description: "Locations across customers",
    to: "/sites",
    paths: ["/sites", "/records/sites"],
  },
  {
    id: "site-assessments",
    label: "Site Assessments",
    description: "Reviews and site readiness",
    to: "/records/site_assessments",
    paths: ["/records/site_assessments"],
  },
  {
    id: "equipment",
    label: "Equipment",
    description: "Fleet and assignments",
    to: "/equipment",
    paths: [
      "/equipment",
      "/records/equipment",
      "/records/equipment_assignments",
      "/records/equipment_compliance",
      "/records/equipment_technology",
    ],
  },
  {
    id: "bids",
    label: "Bids / RFPs",
    description: "Deadlines and outcomes",
    to: "/bids",
    paths: ["/bids", "/records/bids"],
  },
  {
    id: "refused-loads",
    label: "Refused Loads",
    description: "Capacity and lost revenue",
    to: "/lost-loads",
    paths: ["/lost-loads", "/records/refused_loads"],
  },
  {
    id: "safety",
    label: "Safety",
    description: "Incidents and corrective actions",
    to: "/safety",
    paths: ["/safety", "/records/incidents", "/records/corrective_actions"],
  },
  {
    id: "documents",
    label: "Documents",
    description: "Files linked to records",
    to: "/records/documents",
    paths: ["/records/documents"],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    description: "Guidance and reference",
    to: "/knowledge",
    paths: ["/knowledge", "/records/knowledge_articles"],
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Assignments and follow-ups",
    to: "/tasks",
    paths: ["/tasks", "/records/tasks"],
  },
  {
    id: "reporting",
    label: "Reporting",
    description: "Operational views",
    to: "/reports",
    paths: ["/reports"],
  },
  {
    id: "settings",
    label: "Settings",
    description: "Your profile and preferences",
    to: "/settings",
    paths: ["/settings", "/admin", "/profile"],
  },
];

export function activeModule(pathname: string): HubModule | undefined {
  return HUB_MODULES.find((module) =>
    module.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
  );
}
