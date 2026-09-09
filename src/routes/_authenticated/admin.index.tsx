import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel } from "@/components/app/Panels";
import { DataTable } from "@/components/app/DataTable";
import { EmptyState } from "@/components/app/EmptyState";
import { listRows } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, useSession, type AppRole } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Administration — HEG Commercial Intelligence Hub" },
      { name: "description", content: "People, roles and record activity in the Hub." },
      { property: "og:title", content: "Administration — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Administration for HazMat Environmental Group's Hub." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useSession();

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
          .filter((role) => role.user_id === profile.id)
          .map((role) => ROLE_LABELS[role.role as AppRole] ?? role.role)
          .join(", "),
      }));
    },
    enabled: isAdmin,
  });

  const audit = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => listRows("audit_log", { order: { column: "created_at", ascending: false }, limit: 100 }),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <>
        <PageHeader title="Administration" />
        <div className="p-6">
          <EmptyState title="Administrators only" description="Ask an administrator if you need access to this area." />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Administration" description="People, roles and a record of changes." />
      <div className="space-y-6 p-6">
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
            emptyTitle="No people yet"
          />
        </Panel>

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
            emptyTitle="No changes recorded yet"
          />
        </Panel>
      </div>
    </>
  );
}
