import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveRow, restoreRow } from "@/lib/data";
import { useSession } from "@/hooks/use-session";
import { useHasDrafts } from "@/hooks/use-draft-protection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const hasDrafts = useHasDrafts();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canEdit(table)) return null;

  const change = async () => {
    if (inFlight.current || hasDrafts) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      if (archived) await restoreRow(table, id);
      else await archiveRow(table, id);
      await queryClient.invalidateQueries();
      setConfirmOpen(false);
      onChanged?.();
      toast.success(archived ? "Record restored" : "Record archived");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The record could not be updated.";
      setError(message);
      if (archived) toast.error(message);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Record actions"
            title="Record actions"
            disabled={busy}
          >
            <Settings className="h-4 w-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(event) => {
            if (confirmOpen) event.preventDefault();
          }}
        >
          <DropdownMenuItem
            disabled={busy || hasDrafts}
            onSelect={() => {
              setError(null);
              if (archived) void change();
              else setConfirmOpen(true);
            }}
          >
            {archived ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
            {hasDrafts ? "Save or discard edits first" : archived ? "Restore" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!inFlight.current) setConfirmOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive record?</AlertDialogTitle>
            <AlertDialogDescription>
              This record will remain available in Archived records. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || hasDrafts}
              onClick={(event) => {
                event.preventDefault();
                void change();
              }}
            >
              {busy ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
