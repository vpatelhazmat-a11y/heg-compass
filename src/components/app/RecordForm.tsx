import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { insertRow, recordAudit, updateRow, type Row } from "@/lib/data";

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "money";

export type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  section?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  full?: boolean;
};

export function RecordForm({
  open,
  onOpenChange,
  title,
  description,
  fields,
  table,
  recordId,
  initialValues,
  defaults,
  invalidateKeys = [],
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  table: string;
  recordId?: string;
  initialValues?: Row;
  defaults?: Row;
  invalidateKeys?: string[][];
  onSaved?: (row: Row) => void;
}) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Row>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const base: Row = {};
    for (const field of fields) {
      const initial = initialValues?.[field.name] ?? defaults?.[field.name];
      base[field.name] = initial ?? (field.type === "checkbox" ? false : "");
    }
    setValues(base);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recordId]);

  const sections = useMemo(() => {
    const grouped = new Map<string, FieldConfig[]>();
    for (const field of fields) {
      const key = field.section ?? "Details";
      grouped.set(key, [...(grouped.get(key) ?? []), field]);
    }
    return [...grouped.entries()];
  }, [fields]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Row = {};
      for (const field of fields) {
        const raw = values[field.name];
        if (field.type === "checkbox") payload[field.name] = Boolean(raw);
        else if (raw === "" || raw === undefined) payload[field.name] = null;
        else if (field.type === "number" || field.type === "money") payload[field.name] = Number(raw);
        else payload[field.name] = raw;
      }
      for (const [key, value] of Object.entries(defaults ?? {})) {
        if (payload[key] === undefined || payload[key] === null) payload[key] = value;
      }

      const saved = recordId ? await updateRow(table, recordId, payload) : await insertRow(table, payload);
      await recordAudit({
        entity_type: table,
        entity_id: saved.id as string,
        action: recordId ? "Updated" : "Created",
      }).catch(() => undefined);
      return saved;
    },
    onSuccess: (saved) => {
      toast.success(recordId ? "Changes saved" : "Record created");
      queryClient.invalidateQueries();
      for (const key of invalidateKeys) queryClient.invalidateQueries({ queryKey: key });
      onSaved?.(saved);
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && (values[field.name] === "" || values[field.name] === undefined || values[field.name] === null)) {
        nextErrors[field.name] = `${field.label} is required`;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-7">
            {sections.map(([sectionName, sectionFields]) => (
              <section key={sectionName} className="space-y-4">
                <h3 className="section-title">{sectionName}</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {sectionFields.map((field) => {
                    const id = `field-${field.name}`;
                    const error = errors[field.name];
                    return (
                      <div
                        key={field.name}
                        className={field.full || field.type === "textarea" ? "sm:col-span-2" : undefined}
                      >
                        {field.type === "checkbox" ? (
                          <div className="flex items-center gap-2 pt-6">
                            <Checkbox
                              id={id}
                              checked={Boolean(values[field.name])}
                              onCheckedChange={(checked) =>
                                setValues((prev: Row) => ({ ...prev, [field.name]: Boolean(checked) }))
                              }
                            />
                            <Label htmlFor={id} className="text-sm font-normal">
                              {field.label}
                            </Label>
                          </div>
                        ) : (
                          <>
                            <Label htmlFor={id} className="mb-1.5 block text-sm">
                              {field.label}
                              {field.required && <span className="ml-1 text-danger">*</span>}
                            </Label>
                            {field.type === "textarea" ? (
                              <Textarea
                                id={id}
                                rows={3}
                                value={values[field.name] ?? ""}
                                placeholder={field.placeholder}
                                onChange={(event) => setValues((prev: Row) => ({ ...prev, [field.name]: event.target.value }))}
                              />
                            ) : field.type === "select" ? (
                              <select
                                id={id}
                                value={values[field.name] ?? ""}
                                onChange={(event) => setValues((prev: Row) => ({ ...prev, [field.name]: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm text-foreground"
                              >
                                <option value="">Select…</option>
                                {(field.options ?? []).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                id={id}
                                type={field.type === "date" ? "date" : field.type === "number" || field.type === "money" ? "number" : "text"}
                                step={field.type === "money" ? "0.01" : undefined}
                                value={values[field.name] ?? ""}
                                placeholder={field.placeholder}
                                aria-invalid={Boolean(error)}
                                onChange={(event) => setValues((prev: Row) => ({ ...prev, [field.name]: event.target.value }))}
                              />
                            )}
                            {field.help && !error && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>}
                            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : recordId ? "Save changes" : "Create"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
