import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(session?.email ?? "");
  const [password, setPassword] = useState("");
  const [digest, setDigest] = useState(() => localStorage.getItem("heg-notification-digest") !== "off");
  const [taskAlerts, setTaskAlerts] = useState(() => localStorage.getItem("heg-task-alerts") !== "off");
  const [status, setStatus] = useState<string | null>(null);

  const saveNotifications = (key: string, value: boolean, setter: (value: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, value ? "on" : "off");
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
      <PageHeader title="Settings" description="Keep your account, security and work preferences up to date." />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Panel title="Account" description="Your identity comes from the signed-in HEG account." icon={<UserRound className="h-4 w-4" />}>
          <FieldGrid>
            <Field label="Name">{orDash(session?.fullName)}</Field>
            <Field label="Title">{orDash(session?.title)}</Field>
            <Field label="Current role">{session?.roles.length ? session.roles.join(", ") : "No role assigned"}</Field>
          </FieldGrid>
          <Separator className="my-5" />
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email address</Label>
              <Input id="settings-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </div>
            <Button variant="outline" onClick={updateEmail} disabled={!email.trim() || email.trim() === session?.email}>Update email</Button>
          </div>
        </Panel>

        <Panel title="Notifications" description="Choose which personal alerts you want to receive." icon={<Bell className="h-4 w-4" />}>
          <div className="space-y-5">
            <SettingRow title="Task and follow-up alerts" description="Show reminders for assigned or overdue work.">
              <Switch checked={taskAlerts} onCheckedChange={(value) => saveNotifications("heg-task-alerts", value, setTaskAlerts)} />
            </SettingRow>
            <SettingRow title="Weekly activity digest" description="Keep a lightweight weekly summary of activity in the Hub.">
              <Switch checked={digest} onCheckedChange={(value) => saveNotifications("heg-notification-digest", value, setDigest)} />
            </SettingRow>
          </div>
        </Panel>

        <Panel title="Security" description="Manage your password. Company roles and permissions are controlled by administrators." icon={<ShieldCheck className="h-4 w-4" />}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-password">New password</Label>
              <Input id="settings-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
            </div>
            <Button onClick={updatePassword} disabled={!password}>Update password</Button>
            {status && <p className="text-sm text-muted-foreground" role="status">{status}</p>}
          </div>
        </Panel>

        <Panel title="Workstation" description="Preferences that stay local to this browser." icon={<Monitor className="h-4 w-4" />}>
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium">Keyboard shortcuts</p>
              <p className="text-xs text-muted-foreground">Use Ctrl/⌘ + K to open global search and quick navigation.</p>
            </div>
          </div>
        </Panel>

        <p className="text-xs text-muted-foreground">Need a different role or access to restricted safety information? Ask a Hub administrator rather than sharing credentials.</p>
      </div>
    </>
  );
}

function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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
