import { visibleModuleLinks } from "@/lib/module-navigation";
import { Link } from "@tanstack/react-router";
import type { AppRole } from "@/hooks/use-session";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModuleNavigation({ pathname, roles }: { pathname: string; roles: AppRole[] }) {
  const links = visibleModuleLinks(pathname, roles);
  if (!links.length) return null;
  const canonicalPath = pathname.replace(
    /^\/records\/(customers|sites|equipment|bids)(?=\/|$)/,
    "/$1",
  );
  const selected = [...links]
    .sort((a, b) => b[1]!.length - a[1]!.length)
    .find(
      ([, to]) =>
        canonicalPath === to || (to !== "/lost-loads" && canonicalPath.startsWith(`${to}/`)),
    )?.[1];
  return (
    <nav className="module-navigation" aria-label="Module navigation">
      {links.slice(0, 3).map(([label, to]) => (
        <Link key={to} to={to!} aria-current={selected === to ? "page" : undefined}>
          {label}
        </Link>
      ))}
      {links.length > 3 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="module-more"
              aria-label="More module pages"
              data-active={links.slice(3).some(([, to]) => to === selected) || undefined}
            >
              {links.slice(3).find(([, to]) => to === selected)?.[0] ?? "More"}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {links.slice(3).map(([label, to]) => (
              <DropdownMenuItem key={to} asChild>
                <Link to={to!} aria-current={selected === to ? "page" : undefined}>
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
