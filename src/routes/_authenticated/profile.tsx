import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel, Field, FieldGrid } from "@/components/app/Panels";
import { ROLE_LABELS, useSession } from "@/hooks/use-session";
import { orDash } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Your account details and assigned role in the Hub." },
      { property: "og:title", content: "Your profile — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Account details for HEG Hub users." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, roles } = useSession();
  return (
    <>
      <PageHeader title="Your profile" description="Your account details and what you can access." />
      <div className="p-6">
        <Panel title="Account">
          <FieldGrid>
            <Field label="Name">{orDash(session?.fullName)}</Field>
            <Field label="Email">{orDash(session?.email)}</Field>
            <Field label="Title">{orDash(session?.title)}</Field>
            <Field label="Role">
              {roles.length ? roles.map((role) => ROLE_LABELS[role]).join(", ") : "No role assigned yet"}
            </Field>
          </FieldGrid>
          <p className="mt-4 text-sm text-muted-foreground">
            Roles are assigned by an administrator. Ask one if you need access to safety information or editing rights.
          </p>
        </Panel>
      </div>
    </>
  );
}
