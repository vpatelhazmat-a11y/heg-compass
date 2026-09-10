import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown, FileText, Gauge, LogOut, MapPin, Menu, Plus, Search, Settings, ShieldAlert, Target, Truck, BarChart3, CheckSquare, BookOpen, CircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { QuickCreate, type QuickCreateKind } from "./QuickCreate";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: "/command-center", label: "Home", icon: Gauge },
      { to: "/tasks", label: "Tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Commercial",
    items: [
      { to: "/sales", label: "Sales Control Center", icon: Target },
      { to: "/customers", label: "Customers", icon: Building2 },
      { to: "/sites", label: "Sites", icon: MapPin },
      { to: "/bids", label: "Bids / RFPs", icon: FileText },
      { to: "/lost-loads", label: "Lost Loads", icon: CircleOff },
    ],
  },
  {
    label: "Operations",
    items: [{ to: "/equipment", label: "Equipment", icon: Truck }],
  },
  {
    label: "Safety",
    items: [{ to: "/safety", label: "Incidents & Assessments", icon: ShieldAlert }],
  },
  {
    label: "Knowledge & reporting",
    items: [
      { to: "/knowledge", label: "Knowledge", icon: BookOpen },
      { to: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { session, roles, canWrite } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickCreate, setQuickCreate] = useState<QuickCreateKind | null>(null);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((prev) => !prev); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); };
  const initials = (session?.fullName ?? session?.email ?? "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  const isAdmin = roles.includes("admin");
  return <div className="flex min-h-screen bg-background">
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0", mobileNavOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4"><div className="flex h-7 w-7 items-center justify-center rounded bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">HEG</div><div className="leading-tight"><p className="text-sm font-semibold">Commercial Hub</p><p className="text-[11px] text-sidebar-muted">HazMat Environmental Group</p></div></div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Main">{NAV.map((item) => { const active = pathname.startsWith(item.to); return <Link key={item.to} to={item.to} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}><item.icon className="h-4 w-4 shrink-0" aria-hidden />{item.label}</Link>; })}{isAdmin && <Link to="/admin" className={cn("mt-2 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors", pathname.startsWith("/admin") ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60")}><Settings className="h-4 w-4" aria-hidden />Administration</Link>}</nav>
      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-sidebar-muted">Trimble/TMW remains the system of record for operational data.</div>
    </aside>
    {mobileNavOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
    <div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button><button type="button" onClick={() => setPaletteOpen(true)} className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:border-border-strong"><Search className="h-4 w-4" aria-hidden /><span className="flex-1 text-left">Search everything</span><kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd></button><div className="ml-auto flex items-center gap-2">{canWrite && <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm"><Plus className="h-4 w-4" aria-hidden />New<ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuLabel>Create</DropdownMenuLabel><DropdownMenuItem onSelect={() => setQuickCreate("customer")}>Customer</DropdownMenuItem><DropdownMenuItem onSelect={() => setQuickCreate("opportunity")}>Opportunity</DropdownMenuItem><DropdownMenuItem onSelect={() => setQuickCreate("bid")}>Bid</DropdownMenuItem><DropdownMenuItem onSelect={() => setQuickCreate("equipment")}>Equipment</DropdownMenuItem><DropdownMenuItem onSelect={() => setQuickCreate("task")}>Task</DropdownMenuItem><DropdownMenuItem onSelect={() => setQuickCreate("document")}>Document</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
      <DropdownMenu><DropdownMenuTrigger asChild><button className="flex h-9 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</span><span className="hidden max-w-[10rem] truncate sm:inline">{session?.fullName ?? "Account"}</span></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-60"><DropdownMenuLabel className="font-normal"><p className="text-sm font-medium">{session?.fullName ?? "Signed in"}</p><p className="text-xs text-muted-foreground">{session?.email}</p><p className="mt-1 text-xs text-muted-foreground">{roles.length ? roles.map((role) => ROLE_LABELS[role]).join(", ") : "No role assigned yet"}</p></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>Your profile</DropdownMenuItem><DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>Settings</DropdownMenuItem><DropdownMenuItem onSelect={signOut}><LogOut className="h-4 w-4" aria-hidden />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></header><main className="min-w-0 flex-1">{children}</main></div><CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} /><QuickCreate kind={quickCreate} onClose={() => setQuickCreate(null)} />
  </div>;
}
