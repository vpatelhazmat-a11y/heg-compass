import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { HUB_MODULES } from "@/lib/modules";
import { recordDefinition, recordHref, recordLabel } from "@/lib/record-registry";
import { CompassIcon } from "./CompassIcon";
import { ArrowUpRight, FileText } from "lucide-react";

type Hit = { id: string; table: string; label: string; to: string };

// Only searchable, public-facing record labels are queried. RLS still governs each result.
const SEARCH_FIELDS: Record<string, string> = {
  customers: "legal_name",
  sites: "site_name",
  equipment: "unit_number",
  bids: "bid_name",
  contacts: "last_name",
  products: "product_name",
  lanes: "lane_name",
  rates: "quote_reference",
  contracts: "contract_name",
  opportunities: "name",
  refused_loads: "product",
  incidents: "incident_type",
  site_assessments: "assessment_type",
  tasks: "title",
  documents: "document_name",
  requirements: "requirement",
  lost_business: "reason_category",
  corrective_actions: "action",
  equipment_assignments: "assignment_type",
  equipment_compliance: "requirement",
  equipment_technology: "technology_type",
  knowledge_articles: "title",
};

export function CommandPalette({
  open,
  onOpenChange,
  initialQuery = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) setTerm(initialQuery);
    else {
      setTerm("");
      setHits([]);
    }
  }, [open, initialQuery]);

  const apps = useMemo(
    () =>
      HUB_MODULES.filter((module) =>
        `${module.label} ${module.description}`.toLowerCase().includes(term.trim().toLowerCase()),
      ),
    [term],
  );

  useEffect(() => {
    const q = term.trim();
    if (!open || q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      const result = await Promise.allSettled(
        Object.entries(SEARCH_FIELDS).map(async ([table, field]) => {
          // The table and column names come only from the allowlist above.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let query = (supabase.from(table as never) as any)
            .select(`id,${recordDefinition(table)?.title.join(",") ?? field}`)
            .ilike(field, `%${q}%`)
            .abortSignal(controller.signal)
            .limit(3);
          if (["customers", "sites", "equipment"].includes(table))
            query = query.is("archived_at", null);
          const { data, error } = await query;
          if (error) throw error;
          return (data ?? []).map((row: Record<string, unknown>) => ({
            id: String(row["id"]),
            table,
            label: recordLabel(table, row),
            to: recordHref(table, String(row["id"])),
          }));
        }),
      );
      if (!cancelled) {
        setHits(result.flatMap((item) => (item.status === "fulfilled" ? item.value : [])));
        setSearching(false);
      }
    }, 260);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, term]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={term}
        onValueChange={setTerm}
        placeholder="Search apps and records…"
        aria-label="Search apps and records"
      />
      <CommandList>
        <CommandEmpty>{searching ? "Searching records…" : "No matches found."}</CommandEmpty>
        {apps.length > 0 && (
          <CommandGroup heading="Apps">
            {apps.map((module) => (
              <CommandItem
                key={module.to}
                value={`app ${module.label} ${module.description}`}
                onSelect={() => go(module.to)}
              >
                <CompassIcon name={module.label} className="h-5 w-5" />
                <span>{module.label}</span>
                <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-50" aria-hidden />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {hits.length > 0 && (
          <CommandGroup heading="Records">
            {hits.map((hit) => (
              <CommandItem
                key={`${hit.table}-${hit.id}`}
                value={`record ${hit.table} ${hit.label}`}
                onSelect={() => go(hit.to)}
              >
                <FileText className="h-4 w-4" aria-hidden />
                <span className="truncate">{hit.label}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {recordDefinition(hit.table)?.singular}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
