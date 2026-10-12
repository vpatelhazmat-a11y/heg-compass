import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SearchMenu({
  filters,
  grouping,
  favorites,
  className,
}: {
  filters: ReactNode;
  grouping: ReactNode;
  favorites?: ((close: () => void) => ReactNode) | undefined;
  className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Search options"
          aria-expanded={open}
          className={cn("record-search-options-trigger", className)}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="search-options-menu" aria-label="Search options">
        <section aria-label="Filters">
          <h3>Filters</h3>
          {filters}
        </section>
        <section aria-label="Group By">
          <h3>Group By</h3>
          {grouping}
        </section>
        {favorites && (
          <section aria-label="Favorites">
            <h3>Favorites</h3>
            {favorites(() => setOpen(false))}
          </section>
        )}
      </PopoverContent>
    </Popover>
  );
}
