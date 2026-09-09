import type { FieldConfig } from "@/components/app/RecordForm";

const opts = (values: string[]) => values.map((value) => ({ value, label: value }));

export const OPTIONS = {
  customerStatus: opts(["Prospect", "Qualified Prospect", "Active", "On Hold", "Inactive", "Lost", "Archived"]),
  qualification: opts(["Not Reviewed", "Under Review", "Qualified", "Conditional", "Not Qualified"]),
  siteStatus: opts(["Active", "On Hold", "Inactive", "Archived"]),
  siteType: opts(["Generator", "Treatment Facility", "Disposal Facility", "Transfer Station", "Terminal", "Other"]),
  contactType: opts(["Primary", "Billing", "Operations", "Safety", "Executive", "Other"]),
  requirementCategory: opts([
    "Safety",
    "PPE",
    "Operations",
    "Scheduling",
    "Routing",
    "Equipment",
    "Documentation",
    "Security",
    "Environmental",
    "Customer-specific",
    "Other",
  ]),
  physicalState: opts(["Solid", "Liquid", "Sludge", "Gas", "Unknown / Needs Verification"]),
  rateType: opts(["Quote", "Contract Rate", "Historical Rate", "Spot Rate"]),
  rateStatus: opts(["Draft", "Quoted", "Pending Approval", "Active", "Expired", "Rejected", "Superseded"]),
  rateUnit: opts(["Per load", "Per mile", "Per ton", "Per gallon", "Per hour", "Flat"]),
  bidStatus: opts([
    "Identified",
    "Qualification",
    "Preparing",
    "Waiting on Information",
    "Pricing",
    "Internal Review",
    "Submitted",
    "Won",
    "Lost",
    "Withdrawn",
    "Cancelled",
  ]),
  bidType: opts(["RFP", "RFQ", "Renewal", "Spot Quote", "Other"]),
  workStatus: opts(["Not Started", "In Progress", "Complete"]),
  opportunityStage: opts(["New", "Qualification", "Qualified", "Proposal", "Negotiation", "Won", "Lost", "On Hold"]),
  capacityStatus: opts(["Serviceable", "Capacity Review", "Currently Not Serviceable"]),
  lostReason: opts([
    "Capacity",
    "Driver",
    "Equipment",
    "Rate",
    "Qualification",
    "Safety",
    "Service",
    "Customer Decision",
    "Competitor",
    "Route",
    "Scheduling",
    "Other",
  ]),
  equipmentCategory: opts(["Tractor", "Tank Trailer", "Van Trailer", "Dry Bulk", "Dump", "Vacuum Tank", "Other"]),
  equipmentStatus: opts(["Active", "Out of service", "In maintenance", "Sold", "Archived"]),
  ownershipType: opts(["Owned", "Leased", "Customer-owned", "Other"]),
  assignmentType: opts(["HEG Internal", "Customer Assigned", "Customer-Owned Hauled by HEG", "Leased to Customer", "Other"]),
  technologyType: opts(["Omnitracs", "Cable", "Telematics", "Other"]),
  incidentStatus: opts(["Open", "In Process", "Resolved", "Closed"]),
  severity: opts(["Low", "Moderate", "High", "Critical"]),
  taskStatus: opts(["Open", "In Progress", "Waiting", "Completed", "Cancelled"]),
  priority: opts(["Critical", "High", "Normal", "Low"]),
  documentType: opts([
    "Contract",
    "Rate Sheet",
    "RFP",
    "Site Assessment",
    "Safety Procedure",
    "Customer Requirement",
    "Equipment Document",
    "Compliance Document",
    "Training",
    "Insurance",
    "Other",
  ]),
  classification: opts(["Public Internal", "Commercial", "Operations", "Safety", "Confidential", "Restricted"]),
  contractStatus: opts(["Draft", "Active", "Expired", "Terminated", "Renewing"]),
  assessmentStatus: opts(["Draft", "Complete", "Expired"]),
  approvalStatus: opts(["Pending", "Approved", "Rejected"]),
  dataQuality: opts(["Verified", "Needs Review", "Conflicting Source", "Missing Information", "Imported — Unverified"]),
};

export type EntityForm = {
  table: string;
  singular: string;
  createTitle: string;
  fields: FieldConfig[];
};

export const customerFields: FieldConfig[] = [
  { name: "legal_name", label: "Legal name", required: true, section: "Basic information" },
  { name: "dba_name", label: "Doing business as", section: "Basic information" },
  { name: "customer_type", label: "Customer type", section: "Basic information" },
  { name: "industry", label: "Industry", section: "Basic information" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.customerStatus, section: "Basic information" },
  { name: "customer_since", label: "Customer since", type: "date", section: "Basic information" },
  { name: "website", label: "Website", section: "Basic information" },
  { name: "headquarters_address", label: "Headquarters address", section: "Basic information", full: true },
  {
    name: "qualification_status",
    label: "Qualification",
    type: "select",
    options: OPTIONS.qualification,
    section: "Qualification",
  },
  { name: "qualification_notes", label: "Qualification notes", type: "textarea", section: "Qualification" },
  { name: "strategic_priority", label: "Strategic priority", section: "Commercial" },
  { name: "commercial_notes", label: "Commercial notes", type: "textarea", section: "Commercial" },
  { name: "risk_notes", label: "Risk notes", type: "textarea", section: "Commercial" },
];

export const siteFields: FieldConfig[] = [
  { name: "site_name", label: "Site name", required: true, section: "Basic information" },
  { name: "site_code", label: "Site code", section: "Basic information" },
  { name: "site_type", label: "Site type", type: "select", options: OPTIONS.siteType, section: "Basic information" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.siteStatus, section: "Basic information" },
  { name: "address", label: "Street address", section: "Location", full: true },
  { name: "city", label: "City", section: "Location" },
  { name: "state", label: "State", section: "Location" },
  { name: "postal_code", label: "ZIP code", section: "Location" },
  { name: "latitude", label: "Latitude", type: "number", section: "Location" },
  { name: "longitude", label: "Longitude", type: "number", section: "Location" },
  { name: "operating_hours", label: "Operating hours", section: "Operations" },
  { name: "appointment_required", label: "Appointment required", type: "checkbox", section: "Operations" },
  { name: "emergency_contact", label: "Emergency contact", section: "Operations" },
  { name: "access_requirements", label: "Access requirements", type: "textarea", section: "Operations" },
  { name: "security_requirements", label: "Security requirements", type: "textarea", section: "Operations" },
  { name: "route_notes", label: "Route notes", type: "textarea", section: "Operations" },
  { name: "parking_notes", label: "Parking notes", type: "textarea", section: "Operations" },
  { name: "ppe_requirements", label: "PPE required", type: "textarea", section: "Safety & environmental" },
  { name: "safety_requirements", label: "Safety requirements", type: "textarea", section: "Safety & environmental" },
  { name: "environmental_requirements", label: "Environmental requirements", type: "textarea", section: "Safety & environmental" },
  { name: "loading_requirements", label: "Loading instructions", type: "textarea", section: "Safety & environmental" },
  { name: "unloading_requirements", label: "Unloading instructions", type: "textarea", section: "Safety & environmental" },
  { name: "special_instructions", label: "Special instructions", type: "textarea", section: "Notes" },
];

export const contactFields: FieldConfig[] = [
  { name: "first_name", label: "First name", required: true, section: "Basic information" },
  { name: "last_name", label: "Last name", required: true, section: "Basic information" },
  { name: "title", label: "Title", section: "Basic information" },
  { name: "department", label: "Department", section: "Basic information" },
  { name: "contact_type", label: "Contact type", type: "select", options: OPTIONS.contactType, section: "Basic information" },
  { name: "email", label: "Email", section: "How to reach them" },
  { name: "phone", label: "Phone", section: "How to reach them" },
  { name: "mobile", label: "Mobile", section: "How to reach them" },
  { name: "preferred_contact_method", label: "Preferred contact method", section: "How to reach them" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const productFields: FieldConfig[] = [
  { name: "product_name", label: "Product or material", required: true, section: "Basic information" },
  { name: "customer_product_code", label: "Customer product code", section: "Basic information" },
  { name: "material_description", label: "Material description", type: "textarea", section: "Basic information" },
  {
    name: "hazard_classification",
    label: "Hazard classification",
    section: "Hazard information",
    help: "Leave blank if unknown — do not guess. Mark data quality as Needs review instead.",
  },
  { name: "un_number", label: "UN number", section: "Hazard information" },
  { name: "packing_group", label: "Packing group", section: "Hazard information" },
  { name: "physical_state", label: "Physical state", type: "select", options: OPTIONS.physicalState, section: "Hazard information" },
  { name: "handling_requirements", label: "Handling requirements", type: "textarea", section: "Requirements" },
  { name: "equipment_requirements", label: "Equipment requirements", type: "textarea", section: "Requirements" },
  { name: "driver_requirements", label: "Driver requirements", type: "textarea", section: "Requirements" },
  { name: "special_instructions", label: "Special instructions", type: "textarea", section: "Requirements" },
  { name: "data_quality_status", label: "Data quality", type: "select", options: OPTIONS.dataQuality, section: "Source" },
  { name: "source", label: "Information source", section: "Source" },
];

export const laneFields: FieldConfig[] = [
  { name: "lane_name", label: "Lane name", required: true, section: "Basic information" },
  { name: "origin_description", label: "Origin", section: "Basic information" },
  { name: "destination_description", label: "Destination", section: "Basic information" },
  { name: "mileage", label: "Miles", type: "number", section: "Basic information" },
  { name: "states_traversed", label: "States traversed", section: "Route" },
  { name: "route_description", label: "Route description", type: "textarea", section: "Route" },
  { name: "route_restrictions", label: "Route restrictions", type: "textarea", section: "Route" },
  { name: "permit_requirements", label: "Permit requirements", type: "textarea", section: "Route" },
  { name: "seasonal_notes", label: "Seasonal notes", type: "textarea", section: "Route" },
  { name: "equipment_requirements", label: "Equipment requirements", type: "textarea", section: "Requirements" },
  { name: "driver_requirements", label: "Driver requirements", type: "textarea", section: "Requirements" },
  { name: "site_requirements", label: "Site requirements", type: "textarea", section: "Requirements" },
];

export const rateFields: FieldConfig[] = [
  { name: "rate_type", label: "Rate type", type: "select", options: OPTIONS.rateType, section: "Basic information" },
  { name: "amount", label: "Amount", type: "money", required: true, section: "Basic information" },
  { name: "unit", label: "Unit", type: "select", options: OPTIONS.rateUnit, section: "Basic information" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.rateStatus, section: "Basic information" },
  { name: "effective_date", label: "Effective date", type: "date", required: true, section: "Validity" },
  { name: "expiration_date", label: "Expires", type: "date", section: "Validity" },
  { name: "fuel_surcharge", label: "Fuel surcharge", section: "Charges" },
  { name: "fuel_method", label: "Fuel method", section: "Charges" },
  { name: "minimum_charge", label: "Minimum charge", type: "money", section: "Charges" },
  { name: "accessorials", label: "Accessorials", type: "textarea", section: "Charges" },
  { name: "quote_reference", label: "Quote reference", section: "Support" },
  { name: "source", label: "Supporting source", section: "Support" },
  { name: "notes", label: "Notes", type: "textarea", section: "Support" },
];

export const bidFields: FieldConfig[] = [
  { name: "bid_name", label: "Bid name", required: true, section: "Basic information" },
  { name: "bid_type", label: "Bid type", type: "select", options: OPTIONS.bidType, section: "Basic information" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.bidStatus, section: "Basic information" },
  { name: "issue_date", label: "Issued", type: "date", section: "Key dates" },
  { name: "question_deadline", label: "Questions due", type: "date", section: "Key dates" },
  { name: "due_date", label: "Bid due date", type: "date", section: "Key dates" },
  { name: "decision_date", label: "Decision expected", type: "date", section: "Key dates" },
  { name: "qualification_status", label: "Qualification", type: "select", options: OPTIONS.qualification, section: "Readiness" },
  { name: "pricing_status", label: "Pricing", type: "select", options: OPTIONS.workStatus, section: "Readiness" },
  { name: "document_status", label: "Documents", type: "select", options: OPTIONS.workStatus, section: "Readiness" },
  { name: "estimated_revenue", label: "Estimated revenue", type: "money", section: "Value" },
  { name: "estimated_loads", label: "Estimated loads", type: "number", section: "Value" },
  { name: "outcome", label: "Outcome", section: "Outcome" },
  { name: "loss_reason", label: "Reason lost", type: "select", options: OPTIONS.lostReason, section: "Outcome" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const opportunityFields: FieldConfig[] = [
  { name: "name", label: "Opportunity name", required: true, section: "Basic information" },
  { name: "stage", label: "Stage", type: "select", options: OPTIONS.opportunityStage, section: "Basic information" },
  { name: "probability", label: "Probability (%)", type: "number", section: "Basic information" },
  { name: "expected_close_date", label: "Expected close", type: "date", section: "Basic information" },
  { name: "estimated_loads", label: "Estimated loads", type: "number", section: "Value" },
  { name: "estimated_revenue", label: "Estimated revenue", type: "money", section: "Value" },
  { name: "qualification", label: "Qualification summary", type: "textarea", section: "Qualification" },
  {
    name: "capacity_status",
    label: "Can we service it?",
    type: "select",
    options: OPTIONS.capacityStatus,
    section: "Qualification",
    help: "Record what Sales knows today — capacity is confirmed with Operations.",
  },
  { name: "next_action", label: "Next action", section: "Follow-up" },
  { name: "next_action_date", label: "Next action date", type: "date", section: "Follow-up" },
  { name: "source", label: "Source", section: "Follow-up" },
  { name: "competitor", label: "Competitor", section: "Outcome" },
  { name: "loss_reason", label: "Reason lost", type: "select", options: OPTIONS.lostReason, section: "Outcome" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const equipmentFields: FieldConfig[] = [
  { name: "unit_number", label: "Unit number", required: true, section: "Identity" },
  { name: "category", label: "Category", type: "select", options: OPTIONS.equipmentCategory, section: "Identity" },
  { name: "equipment_type", label: "Type", section: "Identity" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.equipmentStatus, section: "Identity" },
  { name: "ownership_type", label: "Ownership", type: "select", options: OPTIONS.ownershipType, section: "Identity" },
  { name: "model_year", label: "Year", type: "number", section: "Specification" },
  { name: "make", label: "Make", section: "Specification" },
  { name: "color", label: "Color", section: "Specification" },
  { name: "capacity", label: "Capacity", section: "Specification" },
  { name: "certified_weight", label: "Certified weight", section: "Specification" },
  { name: "vin", label: "VIN", section: "Identifiers" },
  { name: "serial_number", label: "Serial number", section: "Identifiers" },
  { name: "plate_number", label: "Plate number", section: "Identifiers" },
  { name: "data_quality_status", label: "Data quality", type: "select", options: OPTIONS.dataQuality, section: "Source" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const incidentFields: FieldConfig[] = [
  { name: "incident_date", label: "Incident date", type: "date", required: true, section: "What happened" },
  { name: "incident_type", label: "Incident type", section: "What happened" },
  { name: "severity", label: "Severity", type: "select", options: OPTIONS.severity, section: "What happened" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.incidentStatus, section: "What happened" },
  { name: "description", label: "Description", type: "textarea", required: true, section: "What happened" },
  { name: "immediate_action", label: "Immediate action taken", type: "textarea", section: "Response" },
  { name: "root_cause", label: "Root cause", type: "textarea", section: "Response" },
  { name: "corrective_action", label: "Corrective action", type: "textarea", section: "Response" },
  { name: "due_date", label: "Action due", type: "date", section: "Ownership" },
  { name: "review_date", label: "Review date", type: "date", section: "Ownership" },
  { name: "customer_notified", label: "Customer notified", type: "checkbox", section: "Customer" },
  { name: "customer_communication", label: "Customer communication", type: "textarea", section: "Customer" },
  { name: "resolution", label: "Resolution", type: "textarea", section: "Closure" },
  { name: "closed_date", label: "Closed", type: "date", section: "Closure" },
];

export const taskFields: FieldConfig[] = [
  { name: "title", label: "Task", required: true, section: "Basic information" },
  { name: "priority", label: "Priority", type: "select", options: OPTIONS.priority, section: "Basic information" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.taskStatus, section: "Basic information" },
  { name: "due_date", label: "Due date", type: "date", section: "Basic information" },
  { name: "description", label: "Details", type: "textarea", section: "Details" },
];

export const documentFields: FieldConfig[] = [
  { name: "document_name", label: "Document name", required: true, section: "Basic information" },
  { name: "document_type", label: "Document type", type: "select", options: OPTIONS.documentType, section: "Basic information" },
  { name: "classification", label: "Sensitivity", type: "select", options: OPTIONS.classification, section: "Basic information" },
  { name: "version", label: "Version", section: "Basic information" },
  { name: "effective_date", label: "Effective date", type: "date", section: "Validity" },
  { name: "expiration_date", label: "Expires", type: "date", section: "Validity" },
  { name: "storage_path", label: "Link or file location", section: "Storage", full: true },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const contractFields: FieldConfig[] = [
  { name: "contract_name", label: "Contract name", required: true, section: "Basic information" },
  { name: "contract_number", label: "Contract number", section: "Basic information" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.contractStatus, section: "Basic information" },
  { name: "effective_date", label: "Effective date", type: "date", section: "Key dates" },
  { name: "expiration_date", label: "Expires", type: "date", section: "Key dates" },
  { name: "renewal_date", label: "Renewal date", type: "date", section: "Key dates" },
  { name: "commercial_terms_summary", label: "Commercial terms summary", type: "textarea", section: "Terms" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const assessmentFields: FieldConfig[] = [
  { name: "assessment_type", label: "Assessment type", section: "Basic information" },
  { name: "assessment_date", label: "Assessment date", type: "date", required: true, section: "Basic information" },
  { name: "next_review_date", label: "Next review due", type: "date", section: "Basic information" },
  { name: "assessor", label: "Assessed by", section: "Basic information" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.assessmentStatus, section: "Basic information" },
  { name: "approval_status", label: "Approval", type: "select", options: OPTIONS.approvalStatus, section: "Basic information" },
  { name: "findings", label: "Findings", type: "textarea", section: "Results" },
  { name: "restrictions", label: "Restrictions", type: "textarea", section: "Results" },
  { name: "corrective_actions", label: "Corrective actions", type: "textarea", section: "Results" },
];

export const requirementFields: FieldConfig[] = [
  { name: "requirement", label: "Requirement", required: true, section: "Basic information" },
  { name: "category", label: "Category", type: "select", options: OPTIONS.requirementCategory, section: "Basic information" },
  { name: "mandatory", label: "Mandatory", type: "checkbox", section: "Basic information" },
  { name: "description", label: "Description", type: "textarea", section: "Basic information" },
  { name: "effective_date", label: "Effective date", type: "date", section: "Validity" },
  { name: "expiration_date", label: "Expires", type: "date", section: "Validity" },
  { name: "source_document", label: "Source document", section: "Source" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const lostBusinessFields: FieldConfig[] = [
  { name: "occurred_on", label: "Date", type: "date", required: true, section: "Basic information" },
  { name: "reason_category", label: "Primary reason", type: "select", options: OPTIONS.lostReason, section: "Basic information" },
  { name: "reason_detail", label: "What happened", type: "textarea", section: "Basic information" },
  { name: "estimated_loads", label: "Loads lost", type: "number", section: "Impact" },
  { name: "estimated_revenue", label: "Revenue lost", type: "money", section: "Impact" },
  { name: "competitor", label: "Competitor", section: "Impact" },
  { name: "capacity_issue", label: "Capacity was a factor", type: "checkbox", section: "Contributing factors" },
  { name: "driver_issue", label: "Driver availability was a factor", type: "checkbox", section: "Contributing factors" },
  { name: "equipment_issue", label: "Equipment was a factor", type: "checkbox", section: "Contributing factors" },
  { name: "rate_issue", label: "Rate was a factor", type: "checkbox", section: "Contributing factors" },
  { name: "qualification_issue", label: "Qualification was a factor", type: "checkbox", section: "Contributing factors" },
  { name: "service_issue", label: "Service was a factor", type: "checkbox", section: "Contributing factors" },
  { name: "recoverable", label: "Potentially recoverable", type: "checkbox", section: "Recovery" },
  { name: "recovery_plan", label: "Recovery plan", type: "textarea", section: "Recovery" },
];

export const correctiveActionFields: FieldConfig[] = [
  { name: "action", label: "Corrective action", required: true, section: "Basic information" },
  { name: "due_date", label: "Due date", type: "date", section: "Basic information" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.taskStatus, section: "Basic information" },
  { name: "completion_date", label: "Completed", type: "date", section: "Completion" },
  { name: "completion_evidence", label: "Evidence", type: "textarea", section: "Completion" },
];

export const equipmentAssignmentFields: FieldConfig[] = [
  { name: "assignment_type", label: "Assignment type", type: "select", options: OPTIONS.assignmentType, section: "Assignment" },
  { name: "start_date", label: "Start date", type: "date", section: "Assignment" },
  { name: "end_date", label: "End date", type: "date", section: "Assignment" },
  { name: "status", label: "Status", type: "select", options: OPTIONS.siteStatus, section: "Assignment" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const equipmentComplianceFields: FieldConfig[] = [
  { name: "jurisdiction", label: "Jurisdiction", required: true, section: "Registration" },
  { name: "requirement", label: "Requirement", section: "Registration" },
  { name: "registration_type", label: "Registration type", section: "Registration" },
  { name: "plate_number", label: "Plate or permit number", section: "Registration" },
  { name: "effective_date", label: "Effective date", type: "date", section: "Validity" },
  { name: "expiration_date", label: "Expires", type: "date", section: "Validity" },
  { name: "required", label: "Required", type: "checkbox", section: "Validity" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];

export const equipmentTechnologyFields: FieldConfig[] = [
  { name: "technology_type", label: "Technology", type: "select", options: OPTIONS.technologyType, section: "Device" },
  { name: "device_id", label: "Device ID", section: "Device" },
  { name: "cable_id", label: "Cable ID", section: "Device" },
  { name: "installation_date", label: "Installed", type: "date", section: "Timeline" },
  { name: "removal_date", label: "Removed", type: "date", section: "Timeline" },
  { name: "notes", label: "Notes", type: "textarea", section: "Notes" },
];
