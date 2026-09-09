import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "sales" | "operations" | "safety" | "management" | "read_only";

export type SessionInfo = {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  title: string | null;
  roles: AppRole[];
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  sales: "Sales",
  operations: "Operations",
  safety: "Safety & Compliance",
  management: "Management",
  read_only: "Read only",
};

async function fetchSession(): Promise<SessionInfo> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { userId: null, email: null, fullName: null, title: null, roles: [] };

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    (supabase.from("profiles" as never) as any).select("full_name, title").eq("id", user.id).maybeSingle(),
    (supabase.from("user_roles" as never) as any).select("role").eq("user_id", user.id),
  ]);

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: (profile as any)?.full_name || user.email || null,
    title: (profile as any)?.title ?? null,
    roles: ((roleRows as any[]) ?? []).map((r) => r.role as AppRole),
  };
}

export function useSession() {
  const query = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const roles = query.data?.roles ?? [];

  return {
    ...query,
    session: query.data,
    roles,
    hasRole: (role: AppRole) => roles.includes(role),
    hasAnyRole: (wanted: AppRole[]) => wanted.some((r) => roles.includes(r)),
    canWrite: roles.some((r) => r !== "read_only"),
    canViewSafety: roles.some((r) => ["admin", "safety", "management"].includes(r)),
    isAdmin: roles.includes("admin"),
  };
}
