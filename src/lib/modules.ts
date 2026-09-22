import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  ListTodo,
  MapPin,
  Settings,
  ShieldAlert,
  Truck,
  CircleOff,
  type LucideIcon,
} from "lucide-react";

export type HubModule = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  paths: string[];
};

export const HUB_MODULES: HubModule[] = [
  {
    label: "Customers",
    description: "Accounts and their connected work",
    to: "/customers",
    icon: Building2,
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
    icon: MapPin,
    paths: ["/sites", "/records/sites"],
  },
  {
    label: "Site Assessments",
    description: "Reviews and site readiness",
    to: "/records/site_assessments",
    icon: ClipboardCheck,
    paths: ["/records/site_assessments"],
  },
  {
    label: "Equipment",
    description: "Fleet and assignments",
    to: "/equipment",
    icon: Truck,
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
    icon: FileText,
    paths: ["/bids", "/records/bids"],
  },
  {
    label: "Refused Loads",
    description: "Capacity and lost revenue",
    to: "/lost-loads",
    icon: CircleOff,
    paths: ["/lost-loads", "/records/refused_loads"],
  },
  {
    label: "Safety",
    description: "Incidents and corrective actions",
    to: "/safety",
    icon: ShieldAlert,
    paths: ["/safety", "/records/incidents", "/records/corrective_actions"],
  },
  {
    label: "Documents",
    description: "Files linked to records",
    to: "/records/documents",
    icon: FolderOpen,
    paths: ["/records/documents"],
  },
  {
    label: "Knowledge",
    description: "Guidance and reference",
    to: "/knowledge",
    icon: BookOpen,
    paths: ["/knowledge", "/records/knowledge_articles"],
  },
  {
    label: "Tasks",
    description: "Assignments and follow-ups",
    to: "/tasks",
    icon: ListTodo,
    paths: ["/tasks", "/records/tasks"],
  },
  {
    label: "Reporting",
    description: "Operational views",
    to: "/reports",
    icon: BarChart3,
    paths: ["/reports"],
  },
  {
    label: "Settings",
    description: "Your profile and preferences",
    to: "/settings",
    icon: Settings,
    paths: ["/settings", "/admin", "/profile"],
  },
];

export function activeModule(pathname: string): HubModule | undefined {
  return HUB_MODULES.find((module) =>
    module.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
  );
}
