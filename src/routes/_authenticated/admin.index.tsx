import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel } from "@/components/app/Panels";
import { DataTable } from "@/components/app/DataTable";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listRows } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, useSession, type AppRole } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Administration — HEG Commercial Intelligence Hub" }, { name: "description", content: "People, invitations, roles and record activity in the Hub." }] }),
  component: AdminPage,
});

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "safety", label: "Safety & Compliance" },
  { value: "management", label: "Management" },
  { value: "read_only", label: "Read only" },
  { value: "admin", label: "Administrator" },
];

function AdminPage() {
  const { isAdmin } = useSession();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<AppRole>("read_only");

  const people = useQuery({
    queryKey: ["admin-people"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        listRows("profiles", { order: { column: "full_name", ascending: true } }),
        listRows("user_roles", {}),
      ]);
      return profiles.map((profile) => ({
        ...profile,
        role_labels: roles.filter((userRole) => userRole.user_id === profile.id).map((userRole) => ROLE_LABELS[userRole.role as AppRole] ?? userRole.role).join(", "),
      }));
    },
    enabled: isAdmin,
  });

  const invitations = useQuery({
    queryKey: ["admin-invitations"],
    queryFn: () => listRows("user_invitations", { order: { column: "invited_at", ascending: false }, limit: 50 }),
    enabled: isAdmin,
  });

  const audit = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => listRows("audit_log", { order: { column: "created_at", ascending: false }, limit: 100 }),
    enabled: isAdmin,
  });

  const invite = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", { body: { email, full_name: fullName, title, role } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setEmail("");
      setFullName("");
      setTitle("");
      setRole("read_only");
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
  });

  if (!isAdmin) {
    return <><PageHeader title="Administration" /><div className="p-6"><EmptyState title="Administrators only" description="Ask an administrator if you need access to this area." /></div></>;
  }

  return (
    <>
      <PageHeader title="Administration" description="People, invitations, roles and a record of changes." />
      <div className="space-y-6 p-6">
        <Panel title="Invite a user" description="Send a secure Supabase invitation and assign the user's starting role.">
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => { event.preventDefault(); invite.mutate(); }}>
            <div className="space-y-2"><Label htmlFor="invite-email">Work email *</Label><Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="invite-name">Full name</Label><Input id="invite-name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="invite-title">Job title</Label><Input id="invite-title" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
            <div className="space-y-2"><Label>Starting role</Label><Select value={role} onValueChange={(value) => setRole(value as AppRole)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="md:col-span-2 xl:col-span-4 flex items-center justify-between gap-4"><p className="text-sm text-muted-foreground">Invitations expire after 7 days. The user can finish account setup from the invitation email.</p><Button type="submit" disabled={invite.isPending}>{invite.isPending ? "Sending…" : "Send invitation"}</Button></div>
            {invite.error && <p className="md:col-span-2 xl:col-span-4 text-sm text-destructive">{invite.error.message}</p>}
            {invite.isSuccess && <p className="md:col-span-2 xl:col-span-4 text-sm text-muted-foreground">Invitation sent successfully.</p>}
          </form>
        </Panel>

        <Panel title="Pending invitations" description="Recent invitations sent by administrators.">
          <DataTable columns={[{ key: "email", header: "Email" }, { key: "full_name", header: "Name" }, { key: "role", header: "Role", render: (row) => ROLE_LABELS[row.role as AppRole] ?? row.role }, { key: "status", header: "Status" }, { key: "expires_at", header: "Expires", render: (row) => formatDate(row.expires_at) }]} rows={invitations.data ?? []} isLoading={invitations.isLoading} error={invitations.error} emptyTitle="No invitations" />
        </Panel>

        <Panel title="People and roles">
          <DataTable columns={[{ key: "full_name", header: "Name" }, { key: "email", header: "Email" }, { key: "title", header: "Title" }, { key: "role_labels", header: "Roles" }]} rows={people.data ?? []} isLoading={people.isLoading} error={people.error} emptyTitle="No people yet" />
        </Panel>

        <Panel title="Recent changes" description="Who changed what, and when">
          <DataTable columns={[{ key: "created_at", header: "When", render: (row) => formatDate(row.created_at) }, { key: "entity_type", header: "Record type" }, { key: "action", header: "Action" }, { key: "field_name", header: "Field" }]} rows={audit.data ?? []} isLoading={audit.isLoading} error={audit.error} emptyTitle="No changes recorded yet" />
        </Panel>
      </div>
    </>
  );
}
