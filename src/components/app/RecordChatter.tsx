import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { insertRow, listRows, updateRow } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const kinds: Record<string, string> = {
  customers: "customer",
  sites: "site",
  equipment: "equipment",
  incidents: "incident",
  drivers: "driver",
  rates: "rate",
  bids: "bid",
  opportunities: "opportunity",
  contracts: "contract",
};

export function RecordChatter({ table, id }: { table: string; id: string }) {
  const kind = kinds[table];
  const { session, canEdit } = useSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"message" | "note" | "activity" | null>(null);
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");
  const key = ["record-chatter", table, id];
  const chatter = useQuery({
    queryKey: key,
    enabled: Boolean(kind),
    queryFn: async () => {
      const filters = { linked_entity_type: kind, linked_entity_id: id };
      const [messages, activities] = await Promise.all([
        listRows("mail_messages", { filters, order: { column: "created_at", ascending: false } }),
        listRows("tasks", { filters, order: { column: "created_at", ascending: false } }),
      ]);
      return [
        ...messages.map((row) => ({ ...row, entry: "message" })),
        ...activities.map((row) => ({ ...row, entry: "activity" })),
      ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    },
  });
  const profiles = useQuery({
    queryKey: ["chatter-profiles"],
    enabled: Boolean(kind),
    queryFn: () => listRows("profiles", { order: { column: "full_name", ascending: true } }),
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!kind || !canEdit(table)) throw new Error("You cannot add activity to this record.");
      const value = body.trim();
      if (!value) throw new Error("Enter a message or activity title.");
      if (mode === "activity") {
        if (!dueDate) throw new Error("Choose a due date.");
        await insertRow("tasks", {
          title: value,
          linked_entity_type: kind,
          linked_entity_id: id,
          owner: session?.userId,
          due_date: dueDate,
        });
      } else if (mode) {
        await insertRow("mail_messages", {
          linked_entity_type: kind,
          linked_entity_id: id,
          kind: mode,
          body: value,
        });
      }
    },
    onSuccess: () => {
      setMode(null);
      setBody("");
      setDueDate("");
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const complete = useMutation({
    mutationFn: (taskId: string) =>
      updateRow("tasks", taskId, {
        status: "Completed",
        completed_date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (error: Error) => toast.error(error.message),
  });

  if (!kind) return null;
  const writable = canEdit(table);
  return (
    <section aria-label="Chatter" className="border-b border-border bg-surface px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Chatter</h2>
        {writable && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setMode("message")}>
              Post update
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode("note")}>
              Log note
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode("activity")}>
              Schedule activity
            </Button>
          </div>
        )}
      </div>
      {mode && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label className="block text-sm font-medium" htmlFor="chatter-body">
            {mode === "activity" ? "Activity title" : mode === "note" ? "Internal note" : "Message"}
          </label>
          <Textarea
            id="chatter-body"
            value={body}
            maxLength={10000}
            onChange={(event) => setBody(event.target.value)}
          />
          {mode === "activity" && (
            <label className="block text-sm font-medium" htmlFor="chatter-due">
              Due date
              <Input
                id="chatter-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1 max-w-48"
              />
            </label>
          )}
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={save.isPending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {chatter.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading activity…</p>
      ) : chatter.error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {chatter.error.message}
        </p>
      ) : chatter.data?.length ? (
        <ol className="mt-4 space-y-3">
          {chatter.data.map((item) => (
            <li key={`${item.entry}-${item.id}`} className="border-t border-border pt-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {item.entry === "activity"
                    ? "Activity"
                    : item.kind === "change"
                      ? "Record change"
                      : item.kind === "note"
                        ? "Internal note"
                        : "Message"}
                  {(() => {
                    const person = item.entry === "activity" ? item.owner : item.author_id;
                    const name = !person
                      ? "System"
                      : person === session?.userId
                        ? "You"
                        : profiles.data?.find((profile) => profile.id === person)?.full_name ||
                          "Team member";
                    return ` · ${item.entry === "activity" ? "Assigned to " : ""}${name}`;
                  })()}
                </span>
                <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
              </div>
              {item.kind === "change" ? (
                <details className="mt-1 text-foreground">
                  <summary className="cursor-pointer">{item.body}</summary>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    <p className="break-words">
                      <span className="text-muted-foreground">Before: </span>
                      {item.old_value ?? "Empty"}
                    </p>
                    <p className="break-words">
                      <span className="text-muted-foreground">After: </span>
                      {item.new_value ?? "Empty"}
                    </p>
                  </div>
                </details>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-foreground">
                  {item.entry === "activity" ? item.title : item.body}
                </p>
              )}
              {item.entry === "activity" && (
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Due {item.due_date || "—"} · {item.status}
                    {item.status !== "Completed" &&
                    item.due_date &&
                    item.due_date < new Date().toISOString().slice(0, 10)
                      ? " · Overdue"
                      : ""}
                  </span>
                  {writable && item.status !== "Completed" && (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => complete.mutate(item.id)}
                    >
                      Mark done
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No messages or activities yet.</p>
      )}
    </section>
  );
}
