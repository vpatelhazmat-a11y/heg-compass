import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDraftProtection } from "@/hooks/use-draft-protection";
import { useSession } from "@/hooks/use-session";
import { insertRow, listRows, updateRow } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { SHARED_RECORD_KINDS } from "@/lib/record-registry";
import { todayISO } from "@/lib/format";

export function RecordChatter({ table, id }: { table: string; id: string }) {
  const kind = Object.hasOwn(SHARED_RECORD_KINDS, table) ? SHARED_RECORD_KINDS[table] : undefined;
  const composerId = useId();
  const { session, canEdit } = useSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"message" | "note" | "activity" | null>(null);
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const owner = assignee ?? session?.userId ?? "";
  const clearDraft = useDraftProtection(
    Boolean(mode && (body.trim() || dueDate || (assignee && assignee !== session?.userId))),
    "Chatter draft",
  );
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
    queryFn: () =>
      listRows("profiles", {
        select: "id,full_name,active,created_at",
        order: { column: "full_name", ascending: true },
      }),
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!kind || !canEdit(table)) throw new Error("You cannot add activity to this record.");
      const value = body.trim();
      if (!value) throw new Error("Enter a message or activity title.");
      if (mode === "activity") {
        if (!canEdit("tasks")) throw new Error("You cannot create activities.");
        if (!dueDate) throw new Error("Choose a due date.");
        if (
          !owner ||
          (owner !== session?.userId &&
            !profiles.data?.some((person) => person.id === owner && person.active))
        )
          throw new Error("Choose an active assignee.");
        await insertRow("tasks", {
          title: value,
          linked_entity_type: kind,
          linked_entity_id: id,
          owner,
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
      clearDraft();
      setMode(null);
      setBody("");
      setDueDate("");
      setAssignee(null);
      refreshActivity();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const complete = useMutation({
    mutationFn: (taskId: string) => {
      if (!canEdit(table) || !canEdit("tasks"))
        throw new Error("You cannot complete this activity.");
      return updateRow("tasks", taskId, {
        status: "Completed",
        completed_date: todayISO(),
      });
    },
    onSuccess: () => refreshActivity(),
    onError: (error: Error) => toast.error(error.message),
  });

  function refreshActivity() {
    for (const queryKey of [
      key,
      ["activity-feed"],
      ["record-list-page", "tasks"],
      ["record", "tasks"],
      ["related-count", table, id, "tasks"],
    ])
      void queryClient.invalidateQueries({ queryKey });
  }

  if (!kind) return null;
  const writable = canEdit(table);
  return (
    <section
      aria-label="Chatter"
      className="record-chatter border-b border-border bg-surface px-6 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Chatter</h2>
        {writable && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={save.isPending}
              onClick={() => {
                save.reset();
                setMode("message");
              }}
            >
              Send message
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={save.isPending}
              onClick={() => {
                save.reset();
                setMode("note");
              }}
            >
              Log note
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={save.isPending || !canEdit("tasks")}
              onClick={() => {
                save.reset();
                setMode("activity");
              }}
            >
              Activity
            </Button>
          </div>
        )}
      </div>
      {mode && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!save.isPending) save.mutate();
          }}
        >
          <label className="block text-sm font-medium" htmlFor={`${composerId}-body`}>
            {mode === "activity" ? "Activity title" : mode === "note" ? "Internal note" : "Message"}
          </label>
          <Textarea
            id={`${composerId}-body`}
            value={body}
            maxLength={10000}
            disabled={save.isPending}
            onChange={(event) => setBody(event.target.value)}
          />
          {mode === "activity" && (
            <label className="block text-sm font-medium" htmlFor={`${composerId}-due`}>
              Due date
              <Input
                id={`${composerId}-due`}
                type="date"
                disabled={save.isPending}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1 max-w-48"
              />
            </label>
          )}
          {mode === "activity" && (
            <label className="block text-sm font-medium" htmlFor={`${composerId}-owner`}>
              Assigned to
              <select
                id={`${composerId}-owner`}
                value={owner}
                disabled={save.isPending}
                onChange={(event) => setAssignee(event.target.value)}
                className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                {session?.userId && <option value={session.userId}>Me</option>}
                {(profiles.data ?? [])
                  .filter((person) => person.active && person.id !== session?.userId)
                  .map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name || "Team member"}
                    </option>
                  ))}
              </select>
              {profiles.error && (
                <span className="block mt-1 text-xs text-destructive">
                  Team choices could not load.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void profiles.refetch()}
                  >
                    Try again
                  </button>
                </span>
              )}
            </label>
          )}
          {save.error && (
            <p role="alert" className="text-sm text-destructive">
              {save.error.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              disabled={save.isPending}
              onClick={() => {
                clearDraft();
                setMode(null);
                setBody("");
                setDueDate("");
                setAssignee(null);
                save.reset();
              }}
            >
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
          <button type="button" className="ml-2 underline" onClick={() => void chatter.refetch()}>
            Try again
          </button>
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
                    {item.status !== "Completed" && item.due_date && item.due_date < todayISO()
                      ? " · Overdue"
                      : item.status !== "Completed" && item.due_date === todayISO()
                        ? " · Today"
                        : ""}
                  </span>
                  {writable && canEdit("tasks") && item.status !== "Completed" && (
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      disabled={complete.isPending}
                      onClick={() => {
                        if (!complete.isPending) complete.mutate(item.id);
                      }}
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
