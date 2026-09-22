export type HubModule = {
  label: string;
  description: string;
  to: string;
  paths: string[];
};

export const HUB_MODULES: HubModule[] = [
  {
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
    label: "Sites",
    description: "Locations across customers",
    to: "/sites",
    paths: ["/sites", "/records/sites"],
  },
  {
    label: "Site Assessments",
    description: "Reviews and site readiness",
    to: "/records/site_assessments",
    paths: ["/records/site_assessments"],
  },
  {
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
    label: "Bids / RFPs",
    description: "Deadlines and outcomes",
    to: "/bids",
    paths: ["/bids", "/records/bids"],
  },
  {
    label: "Refused Loads",
    description: "Capacity and lost revenue",
    to: "/lost-loads",
    paths: ["/lost-loads", "/records/refused_loads"],
  },
  {
    label: "Safety",
    description: "Incidents and corrective actions",
    to: "/safety",
    paths: ["/safety", "/records/incidents", "/records/corrective_actions"],
  },
  {
    label: "Documents",
    description: "Files linked to records",
    to: "/records/documents",
    paths: ["/records/documents"],
  },
  {
    label: "Knowledge",
    description: "Guidance and reference",
    to: "/knowledge",
    paths: ["/knowledge", "/records/knowledge_articles"],
  },
  {
    label: "Tasks",
    description: "Assignments and follow-ups",
    to: "/tasks",
    paths: ["/tasks", "/records/tasks"],
  },
  {
    label: "Reporting",
    description: "Operational views",
    to: "/reports",
    paths: ["/reports"],
  },
  {
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
