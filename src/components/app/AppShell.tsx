import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, ChevronRight, LayoutGrid, LogOut, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { QuickCreate, type QuickCreateKind } from "./QuickCreate";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, roles, canWrite, canEdit } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickCreate, setQuickCreate] = useState<QuickCreateKind | null>(null);
  const module = activeModule(pathname);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
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
        <nav aria-label="Workspace breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <Link to="/command-center" className="hidden font-semibold hover:underline sm:inline">
            HEG Compass
          </Link>
          {module && (
            <>
              <ChevronRight
                className="hidden h-3.5 w-3.5 text-muted-foreground sm:block"
                aria-hidden
              />
              <span className="truncate font-medium">{module.label}</span>
            </>
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
          onClick={() => setPaletteOpen(true)}
          className={`global-search ${module ? "module-search" : ""} ml-auto flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent sm:w-full sm:max-w-xs sm:justify-start sm:gap-2 sm:px-3`}
          aria-label="Search everything"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden flex-1 text-left text-sm sm:inline">Search everything</span>
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] lg:inline">
            ⌘K
          </kbd>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Activity menu">
              <Bell className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Activity</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => navigate({ to: "/tasks" })}>
              Tasks and follow-ups
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/overview" })}>
              Deadlines and today's overview
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="header-create inline-flex">
                <Plus className="h-4 w-4" aria-hidden /> New
                <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Create</DropdownMenuLabel>
              {(
                [
                  ["customer", "Customer", "customers"],
                  ["opportunity", "Opportunity", "opportunities"],
                  ["bid", "Bid", "bids"],
                  ["equipment", "Equipment", "equipment"],
                  ["task", "Task", "tasks"],
                  ["document", "Document", "documents"],
                ] as const
              ).map(([kind, label, table]) => (
                <DropdownMenuItem
                  key={kind}
                  disabled={!canEdit(table)}
                  onSelect={() => setQuickCreate(kind)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
            <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
              Your profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              Settings
            </DropdownMenuItem>
            {roles.includes("admin") && (
              <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}>
                Administration
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={signOut}>
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className={module ? "mobile-module-menu" : "home-module-menu"}>
        <ModuleNavigation pathname={pathname} />
      </div>
      <main id="main-content" className="min-w-0 flex-1">
        {children}
      </main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <QuickCreate kind={quickCreate} onClose={() => setQuickCreate(null)} />
    </div>
  );
}
