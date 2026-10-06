import { useSession } from "@/hooks/use-session";
import { formPayload, validateFields } from "@/lib/form-values";
import { supabase } from "@/integrations/supabase/client";
import { lazy, Suspense, useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { insertRow, updateRow, type Row } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { noteDocument, parseNoteValue } from "@/lib/rich-text";
import { RichTextView } from "./RichText";
import { useDraftProtection } from "@/hooks/use-draft-protection";
const RichTextEditor = lazy(() => import("./RichTextEditor"));

export type FieldType =
  "text" | "textarea" | "richtext" | "number" | "date" | "select" | "checkbox" | "money";

export type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  section?: string;
  required?: boolean;
  options?: { value: string; label: string; parentValue?: string | null }[];
  dependsOn?: string;
  placeholder?: string;
  help?: string;
  full?: boolean;
};

function startingValues(fields: FieldConfig[], initialValues?: Row, defaults?: Row): Row {
  const base: Row = {};
  for (const field of fields) {
    const initial = initialValues?.[field.name] ?? defaults?.[field.name];
    base[field.name] =
      field.type === "richtext"
        ? JSON.stringify(
            noteDocument(initialValues?.rich_text?.[field.name], String(initial ?? "")),
          )
        : (initial ?? (field.type === "checkbox" ? false : ""));
  }
  return base;
}

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
  presentation = "sheet",
  readOnly = false,
}: {
  presentation?: "sheet" | "inline" | "record";
  readOnly?: boolean;
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
  const formId = useId();
  const { canEdit } = useSession();
  const [values, setValues] = useState<Row>(() => startingValues(fields, initialValues, defaults));
  const [baseline, setBaseline] = useState<Row>(() =>
    startingValues(fields, initialValues, defaults),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [closeRequested, setCloseRequested] = useState(false);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | undefined>(
    initialValues?.updated_at,
  );
  const dirty = fields.some(
    (field) => String(values[field.name] ?? "") !== String(baseline[field.name] ?? ""),
  );
  const clearDraft = useDraftProtection(open && dirty, title);

  useEffect(() => {
    if (!open) return;
    const base = startingValues(fields, initialValues, defaults);
    setValues(base);
    setBaseline(base);
    setErrors({});
    setActiveField(null);
    setExpectedUpdatedAt(initialValues?.updated_at);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recordId]);

  useEffect(() => {
    if (!open || dirty || initialValues?.updated_at === expectedUpdatedAt) return;
    const next = startingValues(fields, initialValues, defaults);
    setValues(next);
    setBaseline(next);
    setExpectedUpdatedAt(initialValues?.updated_at);
    // A refreshed version can update clean editors; an active draft keeps its original version.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.updated_at]);

  const sections = useMemo(() => {
    const grouped = new Map<string, FieldConfig[]>();
    for (const field of fields) {
      const key = field.section ?? "Details";
      grouped.set(key, [...(grouped.get(key) ?? []), field]);
    }
    return [...grouped.entries()].sort(([a], [b]) => Number(a === "Notes") - Number(b === "Notes"));
  }, [fields]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!canEdit(table)) throw new Error("You do not have permission to edit this record.");
      const payload: Row = formPayload(fields, values, Boolean(recordId));
      if (payload.rich_text)
        payload.rich_text = { ...(initialValues?.rich_text ?? {}), ...payload.rich_text };
      for (const [key, value] of Object.entries(defaults ?? {})) {
        if (payload[key] === undefined || payload[key] === null) payload[key] = value;
      }

      let saved: Row;
      if (table === "rates" && recordId) {
        const { data, error } = await supabase.rpc("revise_rate", {
          _id: recordId,
          _expected_updated_at: expectedUpdatedAt!,
          _values: payload,
        });
        if (error) throw new Error(error.message);
        saved = Array.isArray(data) ? data[0] : data;
      } else
        saved = recordId
          ? await updateRow(table, recordId, payload, expectedUpdatedAt)
          : await insertRow(table, payload);
      return saved;
    },
    onSuccess: (saved) => {
      clearDraft();
      setExpectedUpdatedAt(saved.updated_at);
      toast.success(recordId ? "Changes saved" : "Record created");
      queryClient.invalidateQueries();
      for (const key of invalidateKeys) queryClient.invalidateQueries({ queryKey: key });
      if (presentation === "record") {
        const next = startingValues(fields, saved, defaults);
        if (["rates", "equipment_leases"].includes(table)) next.change_reason = "";
        setBaseline(next);
        setValues(next);
        setErrors({});
      }
      onSaved?.(saved);
      if (presentation !== "record") onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = () => {
    const nextErrors = validateFields(fields, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = Object.keys(nextErrors)[0]!;
      setActiveField(first);
      window.setTimeout(() => document.getElementById(`${formId}-field-${first}`)?.focus(), 0);
      return;
    }
    mutation.mutate();
  };

  const contents = (
    <>
      {presentation !== "record" && (
        <SheetHeader className="border-b border-border px-6 py-4">
          {presentation === "inline" ? (
            <h2 className="text-lg font-semibold">{title}</h2>
          ) : (
            <SheetTitle>{title}</SheetTitle>
          )}
          {description &&
            (presentation === "inline" ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : (
              <SheetDescription>{description}</SheetDescription>
            ))}
        </SheetHeader>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className={presentation !== "sheet" ? "inline-form-sections" : "space-y-7"}>
          {sections.map(([sectionName, sectionFields]) =>
            presentation === "record" && sectionName === "Revision" && !dirty ? null : (
              <section
                key={sectionName}
                className={`space-y-4 ${sectionName === "Notes" ? "record-form-notes" : ""}`}
              >
                <h3 className="section-title">{sectionName}</h3>
                <div
                  className={
                    presentation === "record"
                      ? "grid grid-cols-1 gap-x-6 gap-y-1"
                      : presentation !== "sheet"
                        ? "grid grid-cols-1 gap-4"
                        : "grid grid-cols-1 gap-4 sm:grid-cols-2"
                  }
                >
                  {sectionFields.map((field) => {
                    const id = `${formId}-field-${field.name}`;
                    const error = errors[field.name];
                    const isDisplayValue =
                      presentation === "record" &&
                      field.type !== "checkbox" &&
                      (readOnly || activeField !== field.name);
                    const rawValue = values[field.name];
                    const displayValue =
                      field.type === "money"
                        ? formatMoney(
                            rawValue,
                            values.currency_code ||
                              values.currency ||
                              initialValues?.currency_code ||
                              initialValues?.currency ||
                              "USD",
                            2,
                          )
                        : field.type === "select"
                          ? (field.options?.find((option) => option.value === rawValue)?.label ??
                            rawValue)
                          : field.type === "date" && rawValue
                            ? formatDate(rawValue)
                            : rawValue;
                    return (
                      <div
                        key={field.name}
                        className={
                          [
                            presentation === "record"
                              ? `record-data-field ${field.type === "richtext" || field.type === "textarea" ? "record-data-field-long" : ""}`
                              : "",
                            presentation === "sheet" && (field.full || field.type === "textarea")
                              ? "sm:col-span-2"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ") || undefined
                        }
                        onBlur={(event) => {
                          if (
                            activeField === field.name &&
                            !event.currentTarget.contains(event.relatedTarget)
                          )
                            setActiveField(null);
                        }}
                      >
                        {field.type === "checkbox" ? (
                          <div className="flex items-center gap-2 pt-6">
                            <Checkbox
                              id={id}
                              checked={Boolean(values[field.name])}
                              disabled={readOnly}
                              onCheckedChange={(checked) =>
                                setValues((prev: Row) => ({
                                  ...prev,
                                  [field.name]: Boolean(checked),
                                }))
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
                            {field.type === "richtext" ? (
                              isDisplayValue ? (
                                <div
                                  id={id}
                                  role={readOnly ? "document" : "button"}
                                  tabIndex={readOnly ? undefined : 0}
                                  className="record-data-value"
                                  aria-label={readOnly ? field.label : `Edit ${field.label}`}
                                  onClick={() => {
                                    if (!readOnly) setActiveField(field.name);
                                  }}
                                  onKeyDown={(event) => {
                                    if (!readOnly && (event.key === "Enter" || event.key === " ")) {
                                      event.preventDefault();
                                      setActiveField(field.name);
                                    }
                                  }}
                                >
                                  <RichTextView
                                    document={parseNoteValue(values[field.name])}
                                    interactive={false}
                                  />
                                </div>
                              ) : (
                                <Suspense
                                  fallback={
                                    <p className="text-sm text-muted-foreground">Loading editor…</p>
                                  }
                                >
                                  <RichTextEditor
                                    autoFocus={presentation === "record"}
                                    id={id}
                                    label={field.label}
                                    value={values[field.name] ?? ""}
                                    onChange={(value) =>
                                      setValues((prev: Row) => ({ ...prev, [field.name]: value }))
                                    }
                                  />
                                </Suspense>
                              )
                            ) : isDisplayValue ? (
                              <button
                                id={id}
                                type="button"
                                disabled={readOnly}
                                className="record-data-value"
                                aria-label={`${readOnly ? "" : "Edit "}${field.label}: ${String(displayValue ?? "").trim() || "empty"}`}
                                onClick={() => setActiveField(field.name)}
                              >
                                {String(displayValue ?? "").trim() || (
                                  <span className="record-data-empty">—</span>
                                )}
                              </button>
                            ) : field.type === "textarea" ? (
                              <Textarea
                                id={id}
                                aria-invalid={Boolean(error)}
                                aria-required={field.required}
                                aria-describedby={error || field.help ? `${id}-message` : undefined}
                                autoFocus={presentation === "record"}
                                rows={3}
                                value={values[field.name] ?? ""}
                                placeholder={field.placeholder}
                                onChange={(event) =>
                                  setValues((prev: Row) => ({
                                    ...prev,
                                    ...Object.fromEntries(
                                      fields
                                        .filter((child) => child.dependsOn === field.name)
                                        .map((child) => [child.name, ""]),
                                    ),
                                    [field.name]: event.target.value,
                                  }))
                                }
                              />
                            ) : field.type === "select" ? (
                              <select
                                id={id}
                                aria-invalid={Boolean(error)}
                                aria-required={field.required}
                                aria-describedby={error || field.help ? `${id}-message` : undefined}
                                autoFocus={presentation === "record"}
                                value={values[field.name] ?? ""}
                                onChange={(event) =>
                                  setValues((prev: Row) => ({
                                    ...prev,
                                    ...Object.fromEntries(
                                      fields
                                        .filter((child) => child.dependsOn === field.name)
                                        .map((child) => [child.name, ""]),
                                    ),
                                    [field.name]: event.target.value,
                                  }))
                                }
                                className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm text-foreground"
                              >
                                <option value="">Select…</option>
                                {(field.options ?? [])
                                  .filter(
                                    (option) =>
                                      !field.dependsOn ||
                                      option.parentValue === values[field.dependsOn],
                                  )
                                  .map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                              </select>
                            ) : (
                              <Input
                                id={id}
                                aria-required={field.required}
                                aria-describedby={error || field.help ? `${id}-message` : undefined}
                                autoFocus={presentation === "record"}
                                type={
                                  field.type === "date"
                                    ? "date"
                                    : field.type === "number" || field.type === "money"
                                      ? "number"
                                      : "text"
                                }
                                step={field.type === "money" ? "0.01" : undefined}
                                value={values[field.name] ?? ""}
                                placeholder={field.placeholder}
                                aria-invalid={Boolean(error)}
                                onChange={(event) =>
                                  setValues((prev: Row) => ({
                                    ...prev,
                                    [field.name]: event.target.value,
                                  }))
                                }
                              />
                            )}
                            {field.help && !error && (
                              <p
                                id={`${id}-message`}
                                className="mt-1 text-xs text-muted-foreground"
                              >
                                {field.help}
                              </p>
                            )}
                            {error && (
                              <p
                                id={`${id}-message`}
                                role="alert"
                                className="mt-1 text-xs text-danger"
                              >
                                {error}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ),
          )}
        </div>
      </div>

      {mutation.isError && (
        <p role="alert" className="form-save-error px-6 py-2 text-sm text-destructive">
          {mutation.error.message}
        </p>
      )}
      {!readOnly && (presentation !== "record" || dirty) && (
        <SheetFooter className="form-savebar flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              if (presentation === "record") {
                clearDraft();
                mutation.reset();
                setValues(baseline);
                setErrors({});
                setActiveField(null);
              } else {
                clearDraft();
                onOpenChange(false);
              }
            }}
          >
            {presentation === "record" ? "Discard" : "Cancel"}
          </Button>
          <Button onClick={submit} disabled={mutation.isPending || !canEdit(table)}>
            {mutation.isPending ? "Saving…" : recordId ? "Save changes" : "Create"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
  if (presentation !== "sheet")
    return open ? (
      <section
        className={`record-editor inline-record-editor ${presentation === "record" ? "always-editable-record" : ""}`}
        aria-label={title}
      >
        {contents}
      </section>
    ) : null;
  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next) onOpenChange(true);
          else if (mutation.isPending) return;
          else if (dirty) setCloseRequested(true);
          else onOpenChange(false);
        }}
      >
        <SheetContent className="record-editor flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {contents}
        </SheetContent>
      </Sheet>
      <AlertDialog open={closeRequested} onOpenChange={setCloseRequested}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes to {title.toLowerCase()} haven’t been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearDraft();
                setCloseRequested(false);
                onOpenChange(false);
              }}
            >
              Discard draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
