import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Sign in to the HEG Commercial Intelligence Hub." },
      { property: "og:title", content: "Sign in — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Internal access for HazMat Environmental Group staff." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/command-center", replace: true });
    });
  }, [navigate]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("We couldn't sign you in. Check your email and password and try again.");
      return;
    }
    navigate({ to: "/command-center", replace: true });
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setConfirmSent(true);
      return;
    }
    navigate({ to: "/command-center", replace: true });
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in isn't available right now.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/command-center", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground">
            HEG
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Commercial Intelligence Hub</h1>
            <p className="text-sm text-muted-foreground">HazMat Environmental Group Inc.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          {confirmSent ? (
            <div className="space-y-3 text-center">
              <h2 className="text-base font-semibold">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Open it to finish setting up your account.
              </p>
              <Button variant="outline" onClick={() => setConfirmSent(false)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="mb-5 grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Request access</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="mb-1.5 block">
                      Work email
                    </Label>
                    <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="password" className="mb-1.5 block">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="mb-1.5 block">
                      Full name
                    </Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email-up" className="mb-1.5 block">
                      Work email
                    </Label>
                    <Input id="email-up" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="password-up" className="mb-1.5 block">
                      Password
                    </Label>
                    <Input
                      id="password-up"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Creating account…" : "Create account"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    New accounts start with view-only access. An administrator assigns your role.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {!confirmSent && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
                Continue with Google
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
