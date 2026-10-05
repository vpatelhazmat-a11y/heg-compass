import { useCallback, useMemo, useState, useRef, type ReactNode } from "react";
import { DraftContext } from "@/hooks/use-draft-protection";
import { useBlocker } from "@tanstack/react-router";
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

export function DraftProtection({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draftsRef = useRef<Record<string, string>>({});
  const register = useCallback((id: string, label: string | null) => {
    const current = draftsRef.current;
    if (label === null) {
      if (!(id in current)) return;
      const next = { ...current };
      delete next[id];
      draftsRef.current = next;
      setDrafts(next);
      return;
    }
    if (current[id] !== label) {
      const next = { ...current, [id]: label };
      draftsRef.current = next;
      setDrafts(next);
    }
  }, []);
  const labels = useMemo(() => [...new Set(Object.values(drafts))], [drafts]);
  const context = useMemo(
    () => ({ register, dirty: labels.length > 0 }),
    [register, labels.length],
  );
  const blocker = useBlocker({
    shouldBlockFn: ({ current, next }) =>
      Object.keys(draftsRef.current).length > 0 && current.pathname !== next.pathname,
    enableBeforeUnload: () => Object.keys(draftsRef.current).length > 0,
    withResolver: true,
  });
  return (
    <DraftContext.Provider value={context}>
      {children}
      <AlertDialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keep your unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.join(", ")} has changes that haven’t been saved. Stay here to save them, or
              discard them and leave.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              Discard and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DraftContext.Provider>
  );
}
