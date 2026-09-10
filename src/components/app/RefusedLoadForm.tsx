import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertRow, listRows, updateRow, recordAudit, type Row } from "@/lib/data";
import { useLookup, usePeople } from "@/lib/lookups";
import { useSession } from "@/hooks/use-session";
import { todayISO } from "@/lib/format";

const NONE = "__none__";

export type RefusedLoadFormState = {
  call_in_date: string;
  customer_id: string;
  contact_id: string;
  equipment_id: string;
  equipment_type: string;
  load_count: string;
  product_id: string;
  product: string;
  rated_status: string;
  pickup_city: string;
  pickup_state: string;
  delivery_city: string;
  delivery_state: string;
  multiple_requested_dates: boolean;
  requested_comments: string;
  offered_date: string;
  offered_comments: string;
  loss_reason: string;
  loss_reason_detail: string;
  cs_rep: string;
  estimated_lost_revenue: string;
};

const empty: RefusedLoadFormState = {
  call_in_date: todayISO(),
  customer_id: "",
  contact_id: "",
  equipment_id: "",
  equipment_type: "",
  load_count: "1",
  product_id: "",
  product: "",
  rated_status: "",
  pickup_city: "",
  pickup_state: "",
  delivery_city: "",
  delivery_state: "",
  multiple_requested_dates: false,
  requested_comments: "",
  offered_date: "",
  offered_comments: "",
  loss_reason: "",
  loss_reason_detail: "",
  cs_rep: "",
  estimated_lost_revenue: "",
};

export function toFormState(row: Row): RefusedLoadFormState {
  return {
    ...empty,
    call_in_date: row.call_in_date ?? todayISO(),
    customer_id: row.customer_id ?? "",
    contact_id: row.contact_id ?? "",
    equipment_id: row.equipment_id ?? "",
    equipment_type: row.equipment_type ?? "",
    load_count: String(row.load_count ?? 1),
    product_id: row.product_id ?? "",
    product: row.product ?? "",
    rated_status: row.rated_status ?? "",
    pickup_city: row.pickup_city ?? "",
    pickup_state: row.pickup_state ?? "",
    delivery_city: row.delivery_city ?? "",
    delivery_state: row.delivery_state ?? "",
    multiple_requested_dates: Boolean(row.multiple_requested_dates),
    requested_comments: row.requested_comments ?? "",
    offered_date: row.offered_date ?? "",
    offered_comments: row.offered_comments ?? "",
    loss_reason: row.loss_reason ?? "",
    loss_reason_detail: row.internal_notes ?? "",
    cs_rep: row.cs_rep ?? "",
    estimated_lost_revenue:
      row.estimated_lost_revenue === null || row.estimated_lost_revenue === undefined
        ? ""
        : String(row.estimated_lost_revenue),
  };
}

export function RefusedLoadForm({
  recordId,
  initial,
  onSaved,
  onCancel,
}: {
  recordId?: string | undefined;
  initial?: RefusedLoadFormState | undefined;
  onSaved?: ((row: Row, mode: "again" | "view") => void) | undefined;
  onCancel?: (() => void) | undefined;
}) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RefusedLoadFormState>(initial ?? empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [intent, setIntent] = useState<"again" | "view">("view");

  const states = useLookup("us_state");
  const equipmentTypes = useLookup("refused_load_equipment_type", ["Product Tanker", "Box Van", "Waste Tanker", "Power Only", "Other"]);
  const ratedOptions = useLookup("rated_status", ["Rated", "Not Rated", "Unknown"]);
  const lossReasons = useLookup("loss_reason");
  const people = usePeople();

  const customers = useQuery({
    queryKey: ["form-customers"],
    queryFn: () => listRows("customers", { order: { column: "legal_name", ascending: true } }),
  });
  const contacts = useQuery({
    queryKey: ["form-contacts"],
    queryFn: () => listRows("contacts", { order: { column: "last_name", ascending: true } }),
  });
  const products = useQuery({
    queryKey: ["form-products"],
    queryFn: () => listRows("products", { order: { column: "product_name", ascending: true } }),
  });
  const equipment = useQuery({
    queryKey: ["form-equipment"],
    queryFn: () => listRows("equipment", { order: { column: "unit_number", ascending: true } }),
  });

  const filteredContacts = useMemo(() => {
    const all = contacts.data ?? [];
    if (!form.customer_id) return all;
    const scoped = all.filter((row: Row) => row.customer_id === form.customer_id);
    return scoped.length ? scoped : all;
  }, [contacts.data, form.customer_id]);

  const filteredProducts = useMemo(() => {
    const all = products.data ?? [];
    if (!form.customer_id) return all;
    const scoped = all.filter((row: Row) => row.customer_id === form.customer_id);
    return scoped.length ? scoped : all;
  }, [products.data, form.customer_id]);

  const set = (key: keyof RefusedLoadFormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.call_in_date) next['call_in_date'] = "Enter the date the customer called in.";
    else if (Number.isNaN(new Date(`${form.call_in_date}T00:00:00`).getTime())) next['call_in_date'] = "That date is not valid.";
    if (!form.customer_id) next['customer_id'] = "Choose the customer.";
    if (!form.equipment_type) next['equipment_type'] = "Choose the equipment needed.";
    const loads = Number(form.load_count);
    if (!Number.isFinite(loads) || loads < 1) next['load_count'] = "Enter at least one load.";
    if (!form.pickup_city.trim()) next['pickup_city'] = "Enter the pickup city.";
    if (!form.pickup_state) next['pickup_state'] = "Choose the pickup state.";
    if (!form.delivery_city.trim()) next['delivery_city'] = "Enter the delivery city.";
    if (!form.delivery_state) next['delivery_state'] = "Choose the delivery state.";
    if (!form.loss_reason) next['loss_reason'] = "Choose why the load was lost.";
    if (form.offered_date && Number.isNaN(new Date(`${form.offered_date}T00:00:00`).getTime()))
      next['offered_date'] = "That date is not valid.";
    if (form.estimated_lost_revenue && Number(form.estimated_lost_revenue) < 0)
      next['estimated_lost_revenue'] = "Revenue cannot be negative.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: Row = {
        call_in_date: form.call_in_date,
        customer_id: form.customer_id || null,
        contact_id: form.contact_id || null,
        equipment_id: form.equipment_id || null,
        equipment_type: form.equipment_type || null,
        load_count: Number(form.load_count),
        product_id: form.product_id || null,
        product: form.product.trim() || null,
        rated_status: form.rated_status || null,
        pickup_city: form.pickup_city.trim(),
        pickup_state: form.pickup_state,
        delivery_city: form.delivery_city.trim(),
        delivery_state: form.delivery_state,
        multiple_requested_dates: form.multiple_requested_dates,
        requested_comments: form.requested_comments.trim() || null,
        offered_date: form.offered_date || null,
        offered_comments: form.offered_comments.trim() || null,
        loss_reason: form.loss_reason,
        internal_notes: form.loss_reason_detail.trim() || null,
        cs_rep: form.cs_rep || null,
        estimated_lost_revenue: form.estimated_lost_revenue === "" ? null : Number(form.estimated_lost_revenue),
      };
      if (recordId) {
        payload['updated_by'] = session?.userId ?? null;
        return updateRow("refused_loads", recordId, payload);
      }
      payload['created_by'] = session?.userId ?? null;
      payload['updated_by'] = session?.userId ?? null;
      return insertRow("refused_loads", payload);
    },
    onSuccess: (row) => {
      void recordAudit({ entity_type: "refused_load", entity_id: row.id, action: recordId ? "update" : "create" });
      queryClient.invalidateQueries({ queryKey: ["refused-loads"] });
      toast.success(recordId ? "Refused load updated" : "Refused load recorded");
      if (intent === "again") setForm({ ...empty, cs_rep: form.cs_rep, call_in_date: form.call_in_date });
      onSaved?.(row, intent);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = (mode: "again" | "view") => {
    setIntent(mode);
    if (!validate()) {
      toast.error("Check the highlighted fields.");
      return;
    }
    save.mutate();
  };

  return (
    <form
      className="grid gap-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit("view");
      }}
    >
      <Field label="Call in date" required error={errors['call_in_date']}>
        <Input type="date" value={form.call_in_date} onChange={(e) => set("call_in_date", e.target.value)} />
      </Field>

      <Field label="Customer" required error={errors['customer_id']}>
        <Choice
          value={form.customer_id}
          onChange={(v) => {
            set("customer_id", v);
            set("contact_id", "");
            set("product_id", "");
          }}
          options={(customers.data ?? []).map((row: Row) => ({ value: row.id, label: row.legal_name ?? row.dba_name ?? "Unnamed customer" }))}
          placeholder="Select a customer"
        />
      </Field>

      <Field label="Contact" hint="Filtered to the selected customer where contacts exist.">
        <Choice
          value={form.contact_id}
          onChange={(v) => set("contact_id", v)}
          options={filteredContacts.map((row: Row) => ({
            value: row.id,
            label: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Unnamed contact",
          }))}
          placeholder="Select a contact"
          clearable
        />
      </Field>

      <Field label="Equipment needed" required error={errors['equipment_type']}>
        <Choice
          value={form.equipment_type}
          onChange={(v) => set("equipment_type", v)}
          options={equipmentTypes.options}
          placeholder="Select equipment"
        />
      </Field>

      <Field label="Specific unit" hint="Only if a particular unit was requested.">
        <Choice
          value={form.equipment_id}
          onChange={(v) => set("equipment_id", v)}
          options={(equipment.data ?? []).map((row: Row) => ({
            value: row.id,
            label: [row.unit_number, row.equipment_type].filter(Boolean).join(" · ") || "Unit",
          }))}
          placeholder="Select a unit"
          clearable
        />
      </Field>

      <Field label="Number of loads" required error={errors['load_count']}>
        <Input type="number" min="1" step="1" value={form.load_count} onChange={(e) => set("load_count", e.target.value)} />
      </Field>

      <Field label="Product" hint="Choose a known product, or describe it below.">
        <Choice
          value={form.product_id}
          onChange={(v) => set("product_id", v)}
          options={filteredProducts.map((row: Row) => ({ value: row.id, label: row.product_name ?? "Product" }))}
          placeholder="Select a product"
          clearable
        />
      </Field>

      <Field label="Product description" hint="Used when the product is not in the system yet.">
        <Input value={form.product} onChange={(e) => set("product", e.target.value)} placeholder="As described by the customer" />
      </Field>

      <Field label="Rated or not rated">
        <Choice value={form.rated_status} onChange={(v) => set("rated_status", v)} options={ratedOptions.options} placeholder="Select" clearable />
      </Field>

      <div className="hidden md:block" aria-hidden />

      <Field label="Pickup city" required error={errors['pickup_city']}>
        <Input value={form.pickup_city} onChange={(e) => set("pickup_city", e.target.value)} />
      </Field>
      <Field label="Pickup state" required error={errors['pickup_state']}>
        <Choice value={form.pickup_state} onChange={(v) => set("pickup_state", v)} options={states.options} placeholder="Select a state" />
      </Field>
      <Field label="Delivery city" required error={errors['delivery_city']}>
        <Input value={form.delivery_city} onChange={(e) => set("delivery_city", e.target.value)} />
      </Field>
      <Field label="Delivery state" required error={errors['delivery_state']}>
        <Choice value={form.delivery_state} onChange={(v) => set("delivery_state", v)} options={states.options} placeholder="Select a state" />
      </Field>

      <label className="flex items-center gap-3 md:col-span-2">
        <Checkbox
          checked={form.multiple_requested_dates}
          onCheckedChange={(value) => set("multiple_requested_dates", Boolean(value))}
        />
        <span className="text-sm">The customer requested more than one date</span>
      </label>

      <Field label="Requested / comments" full>
        <textarea
          className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm"
          value={form.requested_comments}
          onChange={(e) => set("requested_comments", e.target.value)}
          placeholder="What the customer asked for"
        />
      </Field>

      <Field label="Offered date" error={errors['offered_date']}>
        <Input type="date" value={form.offered_date} onChange={(e) => set("offered_date", e.target.value)} />
      </Field>

      <Field label="CS representative">
        <Choice value={form.cs_rep} onChange={(v) => set("cs_rep", v)} options={people.options} placeholder="Select a person" clearable />
      </Field>

      <Field label="Offered / comments" full>
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm"
          value={form.offered_comments}
          onChange={(e) => set("offered_comments", e.target.value)}
          placeholder="What HEG was able to offer"
        />
      </Field>

      <Field label="Reason for lost revenue" required error={errors['loss_reason']}>
        <Choice value={form.loss_reason} onChange={(v) => set("loss_reason", v)} options={lossReasons.options} placeholder="Select a reason" />
      </Field>

      <Field
        label="Estimated lost revenue"
        hint="Leave blank if no rate is known — never estimate a rate."
        error={errors['estimated_lost_revenue']}
      >
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.estimated_lost_revenue}
          onChange={(e) => set("estimated_lost_revenue", e.target.value)}
          placeholder="Optional"
        />
      </Field>

      <Field label="Additional explanation" full>
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm"
          value={form.loss_reason_detail}
          onChange={(e) => set("loss_reason_detail", e.target.value)}
          placeholder="Anything else worth knowing about this loss"
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {!recordId && (
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => submit("again")}>
            Save &amp; add another
          </Button>
        )}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : recordId ? "Save changes" : "Save & view record"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  full,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className={full ? "space-y-1.5 md:col-span-2" : "space-y-1.5"}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Choice({
  value,
  onChange,
  options,
  placeholder,
  clearable,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  clearable?: boolean;
}) {
  return (
    <Select value={value ? value : ""} onValueChange={(next) => onChange(next === NONE ? "" : next)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {clearable && <SelectItem value={NONE}>None</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
