import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Search, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, useSession } from "@/hooks/use-session";
import { CompassIcon } from "./CompassIcon";
import { ModuleNavigation } from "./ModuleNavigation";
import { activeModule } from "@/lib/modules";
import { CommandPalette } from "./CommandPalette";
import { ActivityMenu } from "./ActivityMenu";
import { DraftProtection } from "./DraftProtection";
import { useHasDrafts } from "@/hooks/use-draft-protection";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DraftProtection>
      <ShellLayout>{children}</ShellLayout>
    </DraftProtection>
  );
}

function ShellLayout({ children }: { children: ReactNode }) {
  const hasDrafts = useHasDrafts();
  const { session, roles } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const module = activeModule(pathname);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteQuery("");
        setPaletteOpen((open) => !open);
      } else if (
        !paletteOpen &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.key.length === 1 &&
        event.key.trim().length === 1 &&
        !event.isComposing &&
        !(
          event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            event.target.closest(
              'input, textarea, select, button, a, [role="combobox"], [role="dialog"]',
            ))
        )
      ) {
        setPaletteQuery(event.key);
        setPaletteOpen(true);
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen]);

  const signOut = async () => {
    if (signingOut || hasDrafts) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await queryClient.cancelQueries();
      queryClient.clear();
      await navigate({ to: "/auth", replace: true });
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Unable to sign out. Try again.");
    } finally {
      setSigningOut(false);
    }
  };
  const initials = (session?.fullName ?? session?.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="compass-shell flex min-h-screen flex-col bg-background">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="compass-topbar sticky top-0 z-20 flex min-h-12 items-center gap-3 px-3 sm:px-5">
        <Link
          to="/command-center"
          aria-label="Open app launcher"
          className="compass-home flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        >
          <CompassIcon name="Compass" className="h-7 w-7" />
        </Link>
        <nav aria-label="Current application" className="flex min-w-0 items-center gap-2 text-sm">
          <Link
            to="/command-center"
            className={module ? "hidden" : "hidden font-semibold hover:underline sm:inline"}
          >
            HEG Compass
          </Link>
          {module && (
            <Link to={module.to} className="truncate font-semibold hover:underline">
              {module.label}
            </Link>
          )}
          {!module && (
            <span className="font-semibold sm:hidden">
              {pathname === "/overview" ? "Overview" : "Apps"}
            </span>
          )}
        </nav>
        {module && (
          <div className="desktop-module-menu">
            <ModuleNavigation pathname={pathname} />
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setPaletteQuery("");
            setPaletteOpen(true);
          }}
          className="global-search module-search ml-auto flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Search everything"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden flex-1 text-left text-sm sm:inline">Search everything</span>
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] lg:inline">
            ⌘K
          </kbd>
        </button>
        <ActivityMenu />
        <Link
          to={roles.includes("admin") ? "/admin" : "/settings"}
          aria-label={roles.includes("admin") ? "Users and access" : "Personal settings"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-white/10"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account menu"
              className="flex h-9 items-center gap-2 rounded-md px-1.5 text-sm hover:bg-accent"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
              <span className="hidden max-w-36 truncate lg:inline">
                {session?.fullName ?? "Account"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{session?.fullName ?? "Signed in"}</p>
              <p className="text-xs text-muted-foreground">{session?.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {roles.length
                  ? roles.map((role) => ROLE_LABELS[role]).join(", ")
                  : "No role assigned yet"}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/overview" })}>
              Daily overview
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
              Your profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              Personal settings
            </DropdownMenuItem>
            {roles.includes("admin") && (
              <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}>
                Users and access
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void signOut();
              }}
              disabled={hasDrafts || signingOut}
            >
              <LogOut className="h-4 w-4" aria-hidden />{" "}
              {hasDrafts
                ? "Save or discard edits to sign out"
                : signingOut
                  ? "Signing out…"
                  : "Sign out"}
            </DropdownMenuItem>
            {signOutError && (
              <p role="alert" className="px-2 py-1 text-xs text-destructive">
                {signOutError}
              </p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className={module ? "mobile-module-menu" : "home-module-menu"}>
        <ModuleNavigation pathname={pathname} />
      </div>
      <main id="main-content" className="min-w-0 flex-1">
        {children}
      </main>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        initialQuery={paletteQuery}
      />
    </div>
  );
}
