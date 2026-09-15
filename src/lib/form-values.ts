import type { FieldConfig } from "@/components/app/RecordForm";

export function validateFields(fields: FieldConfig[], values: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const raw = values[field.name];
    const blank = raw === null || raw === undefined || (typeof raw === "string" && !raw.trim());
    if (field.required && blank) errors[field.name] = `${field.label} is required`;
    if (
      !blank &&
      (field.type === "number" || field.type === "money") &&
      !Number.isFinite(Number(raw))
    )
      errors[field.name] = "Enter a valid number";
    if (!blank && field.type === "money" && Number(raw) < 0)
      errors[field.name] = "Amount cannot be negative";
    if (!blank && field.type === "date" && !isValidDate(String(raw)))
      errors[field.name] = "Enter a valid date";
  }
  return errors;
}
export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function formPayload(
  fields: FieldConfig[],
  values: Record<string, unknown>,
  editing: boolean,
) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.name];
    if (field.type === "checkbox") payload[field.name] = Boolean(raw);
    else if (raw === "" || raw === undefined || raw === null) {
      // Omitting blank optional values on INSERT lets database defaults apply.
      if (editing) payload[field.name] = null;
    } else
      payload[field.name] =
        field.type === "number" || field.type === "money"
          ? Number(raw)
          : typeof raw === "string"
            ? raw.trim()
            : raw;
  }
  return payload;
}
