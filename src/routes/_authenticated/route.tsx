import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { hasApprovedAccess } from "@/lib/auth-guard";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const [profile, roles] = await Promise.all([
      supabase.from("profiles").select("active").eq("id", data.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    ]);
    if (
      profile.error ||
      roles.error ||
      !hasApprovedAccess(
        data.user.id,
        profile.data?.active ?? null,
        (roles.data ?? []).map((row) => row.role),
      )
    ) {
      throw new Error(
        "Your account needs administrator approval or has been disabled. Contact your HEG administrator.",
      );
    }
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
