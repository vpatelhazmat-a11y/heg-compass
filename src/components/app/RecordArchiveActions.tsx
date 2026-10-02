import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveRow, restoreRow } from "@/lib/data";
import { useSession } from "@/hooks/use-session";

export function RecordArchiveActions({
  table,
  id,
  archived,
  onChanged,
}: {
  table: "customers" | "sites" | "equipment";
  id: string;
  archived: boolean;
  onChanged?: () => void;
}) {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  if (!canEdit(table)) return null;

  const change = async () => {
    if (
      !archived &&
      !window.confirm("Archive this record? It will remain available in Archived records.")
    )
      return;
    setBusy(true);
    try {
      if (archived) await restoreRow(table, id);
      else await archiveRow(table, id);
      await queryClient.invalidateQueries();
      onChanged?.();
      toast.success(archived ? "Record restored" : "Record archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The record could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={change}>
      {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
      {archived ? "Restore" : "Archive"}
    </Button>
  );
}

export function ArchiveVisibility({
  archived,
  onChange,
}: {
  archived: boolean;
  onChange: (archived: boolean) => void;
}) {
  return (
    <select
      aria-label="Record visibility"
      className="h-9 rounded border border-border bg-background px-2 text-sm"
      value={archived ? "archived" : "active"}
      onChange={(event) => onChange(event.target.value === "archived")}
    >
      <option value="active">Active records</option>
      <option value="archived">Archived records</option>
    </select>
  );
}
