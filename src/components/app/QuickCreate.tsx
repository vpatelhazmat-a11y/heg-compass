import { useQuery } from "@tanstack/react-query";
import { RecordForm, type FieldConfig } from "./RecordForm";
import { listRows } from "@/lib/data";
import {
  bidFields,
  customerFields,
  documentFields,
  equipmentFields,
  opportunityFields,
  taskFields,
} from "@/lib/entities";

export type QuickCreateKind = "customer" | "opportunity" | "bid" | "equipment" | "task" | "document";

const CONFIG: Record<QuickCreateKind, { table: string; title: string; fields: FieldConfig[]; needsCustomer?: boolean }> = {
  customer: { table: "customers", title: "New customer", fields: customerFields },
  opportunity: { table: "opportunities", title: "New opportunity", fields: opportunityFields, needsCustomer: true },
  bid: { table: "bids", title: "New bid", fields: bidFields, needsCustomer: true },
  equipment: { table: "equipment", title: "New equipment", fields: equipmentFields },
  task: { table: "tasks", title: "New task", fields: taskFields },
  document: { table: "documents", title: "New document", fields: documentFields },
};

export function useCustomerOptions() {
  return useQuery({
    queryKey: ["customer-options"],
    queryFn: async () => {
      const rows = await listRows("customers", {
        select: "id, legal_name",
        order: { column: "legal_name", ascending: true },
        limit: 1000,
      });
      return rows.map((row) => ({ value: row.id as string, label: row.legal_name as string }));
    },
    staleTime: 60_000,
  });
}

export function QuickCreate({ kind, onClose }: { kind: QuickCreateKind | null; onClose: () => void }) {
  const { data: customerOptions = [] } = useCustomerOptions();
  if (!kind) return null;

  const config = CONFIG[kind];
  const fields: FieldConfig[] = config.needsCustomer
    ? [
        {
          name: "customer_id",
          label: "Customer",
          type: "select",
          required: true,
          options: customerOptions,
          section: "Basic information",
        },
        ...config.fields,
      ]
    : config.fields;

  return (
    <RecordForm
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={config.title}
      description="Only the essentials are required — you can add the rest later."
      table={config.table}
      fields={fields}
    />
  );
}
