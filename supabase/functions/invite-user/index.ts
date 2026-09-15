import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("You must be signed in");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: role, error: roleError } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError || !role) throw new Error("Administrator access is required");

    const body = await req.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const fullName = String(body.full_name ?? "").trim();
    const title = String(body.title ?? "").trim();
    const requestedRole = String(body.role ?? "read_only").trim();
    const allowedRoles = ["admin", "sales", "operations", "safety", "management", "read_only"];
    if (!email || !email.includes("@")) throw new Error("A valid email address is required");
    if (!allowedRoles.includes(requestedRole)) throw new Error("Invalid role");

    const { data: invitation, error: invitationError } = await adminClient
      .from("user_invitations")
      .insert({
        email,
        full_name: fullName || null,
        title: title || null,
        role: requestedRole,
        invited_by: user.id,
      })
      .select()
      .single();
    if (invitationError) throw invitationError;

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName || null, title: title || null },
      },
    );
    if (inviteError) {
      await adminClient
        .from("user_invitations")
        .update({ status: "revoked" })
        .eq("id", invitation.id);
      throw inviteError;
    }
    if (!invited.user) throw new Error("Invitation did not return a user");
    // Role comes from the authenticated administrator, never editable user metadata.
    const { error: grantError } = await adminClient
      .from("user_roles")
      .insert({ user_id: invited.user.id, role: requestedRole });
    if (grantError) {
      await adminClient
        .from("user_invitations")
        .update({ status: "revoked" })
        .eq("id", invitation.id);
      throw new Error(
        "Invitation sent, but role assignment failed. An administrator must review this account.",
      );
    }

    return new Response(JSON.stringify({ invitation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unable to send invitation",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
