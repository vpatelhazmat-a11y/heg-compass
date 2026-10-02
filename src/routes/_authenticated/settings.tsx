import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, KeyRound, Monitor, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel, Field, FieldGrid } from "@/components/app/Panels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { orDash } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Personal account, security and notification settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session } = useSession();
  const [email, setEmail] = useState(session?.email ?? "");
  const [password, setPassword] = useState("");
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => setEmail(session?.email ?? ""), [session?.email]);

  useEffect(() => {
    if (!session?.userId) return;
    try {
      setTaskAlerts(localStorage.getItem(`heg-task-alerts:${session.userId}`) !== "off");
    } catch {
      setTaskAlerts(true);
    }
  }, [session?.userId]);

  const saveTaskAlerts = (value: boolean) => {
    if (!session?.userId) return;
    setTaskAlerts(value);
    try {
      localStorage.setItem(`heg-task-alerts:${session.userId}`, value ? "on" : "off");
    } catch {
      /* The preference still applies to this page until reload. */
    }
    window.dispatchEvent(new Event("heg:preference-changed"));
  };

  const updateEmail = async () => {
    setStatus(null);
    const nextEmail = email.trim();
    if (!nextEmail || nextEmail === session?.email) return;
    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    setStatus(error ? error.message : "Check your email to confirm the address change.");
  };

  const updatePassword = async () => {
    setStatus(null);
    if (password.length < 8) {
      setStatus("Use at least 8 characters for your password.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus(error.message);
      return;
    }
    setPassword("");
    setStatus("Password updated.");
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Keep your account, security and work preferences up to date."
      />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Panel
          title="Account"
          description="Your identity comes from the signed-in HEG account."
          icon={<UserRound className="h-4 w-4" />}
        >
          <FieldGrid>
            <Field label="Name">{orDash(session?.fullName)}</Field>
            <Field label="Title">{orDash(session?.title)}</Field>
            <Field label="Current role">
              {session?.roles.length ? session.roles.join(", ") : "No role assigned"}
            </Field>
          </FieldGrid>
          <Separator className="my-5" />
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email address</Label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <Button
              variant="outline"
              onClick={updateEmail}
              disabled={!email.trim() || email.trim() === session?.email}
            >
              Update email
            </Button>
          </div>
        </Panel>

        <Panel
          title="Notifications"
          description="Choose whether the activity menu shows approaching deadlines."
          icon={<Bell className="h-4 w-4" />}
        >
          <div className="space-y-5">
            <SettingRow
              title="Activity alerts"
              description="Show assigned tasks and upcoming bid, contract and document deadlines in the top bar."
            >
              <Switch
                checked={taskAlerts}
                disabled={!session?.userId}
                onCheckedChange={saveTaskAlerts}
              />
            </SettingRow>
            <p className="text-xs text-muted-foreground">
              Email digests are not available until an email service is connected.
            </p>
          </div>
        </Panel>

        <Panel
          title="Security"
          description="Manage your password. Company roles and permissions are controlled by administrators."
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-password">New password</Label>
              <Input
                id="settings-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <Button onClick={updatePassword} disabled={!password}>
              Update password
            </Button>
            {status && (
              <p className="text-sm text-muted-foreground" role="status">
                {status}
              </p>
            )}
          </div>
        </Panel>

        <Panel
          title="Workstation"
          description="Preferences that stay local to this browser."
          icon={<Monitor className="h-4 w-4" />}
        >
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium">Keyboard shortcuts</p>
              <p className="text-xs text-muted-foreground">
                Use Ctrl/⌘ + K to open global search and quick navigation.
              </p>
            </div>
          </div>
        </Panel>

        <p className="text-xs text-muted-foreground">
          Need a different role or access to restricted safety information? Ask a Hub administrator
          rather than sharing credentials.
        </p>
      </div>
    </>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
