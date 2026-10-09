import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel } from "@/components/app/Panels";
import { DataTable } from "@/components/app/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDraftProtection } from "@/hooks/use-draft-protection";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listRows } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, useSession, type AppRole } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { section?: "people" | "invitations" | "history" } => ({
    ...(["people", "invitations", "history"].includes(String(search["section"]))
      ? { section: String(search["section"]) as "people" | "invitations" | "history" }
      : {}),
  }),
  head: () => ({
    meta: [
      { title: "Administration — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "People, invitations, roles and record activity in the Hub.",
      },
    ],
  }),
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

export function AdminPage() {
  const { section = "people" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { isAdmin } = useSession();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<AppRole>("read_only");
  useDraftProtection(
    Boolean(email.trim() || fullName.trim() || title.trim() || role !== "read_only"),
    "Invitation draft",
  );

  const people = useQuery({
    queryKey: ["admin-people"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        listRows("profiles", { order: { column: "full_name", ascending: true } }),
        listRows("user_roles", {}),
      ]);
      return profiles.map((profile) => ({
        ...profile,
        role_labels: roles
          .filter((userRole) => userRole.user_id === profile.id)
          .map((userRole) => ROLE_LABELS[userRole.role as AppRole] ?? userRole.role)
          .join(", "),
      }));
    },
    enabled: isAdmin && section === "people",
  });

  const invitations = useQuery({
    queryKey: ["admin-invitations"],
    queryFn: () =>
      listRows("user_invitations", {
        order: { column: "invited_at", ascending: false },
        limit: 50,
      }),
    enabled: isAdmin && section === "invitations",
  });

  const audit = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () =>
      listRows("audit_log", { order: { column: "created_at", ascending: false }, limit: 100 }),
    enabled: isAdmin && section === "history",
  });

  const invite = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email, full_name: fullName, title, role },
      });
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
    return (
      <>
        <PageHeader title="Users and access" />
        <div className="p-6">
          <EmptyState
            title="Administrators only"
            description="Ask an administrator if you need access to this area."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Users and access"
        breadcrumbs={[
          { label: "Apps", to: "/command-center" },
          { label: "Settings", to: "/settings" },
          { label: "Users and access" },
        ]}
      />
      <Tabs
        value={section}
        onValueChange={(value) => {
          void navigate({ search: { section: value as typeof section } });
        }}
        className="bg-surface"
      >
        <TabsList className="record-tabs" aria-label="Administration sections">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="history">Change log</TabsTrigger>
        </TabsList>
        <TabsContent value="invitations" className="mt-0">
          <Panel title="Invite a user">
            <form
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                invite.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="invite-email">Work email *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Full name</Label>
                <Input
                  id="invite-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-title">Job title</Label>
                <Input
                  id="invite-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Starting role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 xl:col-span-4 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Invitations expire after 7 days. The user can finish account setup from the
                  invitation email.
                </p>
                <Button type="submit" disabled={invite.isPending}>
                  {invite.isPending ? "Sending…" : "Send invitation"}
                </Button>
              </div>
              {invite.error && (
                <p role="alert" className="md:col-span-2 xl:col-span-4 text-sm text-destructive">
                  {invite.error.message}
                </p>
              )}
              {invite.isSuccess && (
                <p
                  role="status"
                  className="md:col-span-2 xl:col-span-4 text-sm text-muted-foreground"
                >
                  Invitation sent successfully.
                </p>
              )}
            </form>
          </Panel>

          <Panel
            title="Pending invitations"
            description="Recent invitations sent by administrators."
          >
            <DataTable
              columns={[
                { key: "email", header: "Email" },
                { key: "full_name", header: "Name" },
                {
                  key: "role",
                  header: "Role",
                  render: (row) => ROLE_LABELS[row.role as AppRole] ?? row.role,
                },
                { key: "status", header: "Status" },
                {
                  key: "expires_at",
                  header: "Expires",
                  render: (row) => formatDate(row.expires_at),
                },
              ]}
              rows={invitations.data ?? []}
              isLoading={invitations.isLoading}
              error={invitations.error}
              onRetry={() => void invitations.refetch()}
              emptyTitle="No invitations"
            />
          </Panel>
        </TabsContent>
        <TabsContent value="people" className="mt-0">
          <Panel title="People and roles">
            <DataTable
              columns={[
                { key: "full_name", header: "Name" },
                { key: "email", header: "Email" },
                { key: "title", header: "Title" },
                { key: "role_labels", header: "Roles" },
              ]}
              rows={people.data ?? []}
              isLoading={people.isLoading}
              error={people.error}
              onRetry={() => void people.refetch()}
              emptyTitle="No people yet"
            />
          </Panel>
        </TabsContent>
        <TabsContent value="history" className="mt-0">
          <Panel title="Recent changes" description="Who changed what, and when">
            <DataTable
              columns={[
                { key: "created_at", header: "When", render: (row) => formatDate(row.created_at) },
                { key: "entity_type", header: "Record type" },
                { key: "action", header: "Action" },
                { key: "field_name", header: "Field" },
              ]}
              rows={audit.data ?? []}
              isLoading={audit.isLoading}
              error={audit.error}
              onRetry={() => void audit.refetch()}
              emptyTitle="No changes recorded yet"
            />
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}
