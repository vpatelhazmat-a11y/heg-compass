import { recordDefinition, SHARED_RECORD_KINDS } from "./record-registry";

const searchable = {
  customers: "legal_name",
  sites: "site_name",
  equipment: "unit_number",
  bids: "bid_name",
  rates: "quote_reference",
  contracts: "contract_name",
  opportunities: "name",
  incidents: "incident_type",
};
/** Only record types supported by the current shared-link constraints. */
export const DOCUMENT_FOLDERS = Object.entries(searchable).map(([table, searchField]) => ({
  table,
  searchField,
  kind: SHARED_RECORD_KINDS[table]!,
  label: recordDefinition(table)!.label,
}));
export function validDocumentFolder(value: unknown): string | undefined {
  return typeof value === "string" &&
    (value === "unlinked" || DOCUMENT_FOLDERS.some((folder) => folder.kind === value))
    ? value
    : undefined;
}
