import { useEffect, useState } from "react";
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
import { Building2, MapPin, Truck, FileText, Gauge, ShieldAlert, Users } from "lucide-react";

type Hit = { id: string; label: string; sublabel?: string; group: string; to: string; params?: Record<string, string> };

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const like = `%${q}%`;
      const [customers, sites, equipment, bids, contacts, incidents] = await Promise.all([
        (supabase.from("customers" as never) as any).select("id, legal_name, status").ilike("legal_name", like).limit(5),
        (supabase.from("sites" as never) as any).select("id, site_name, city, state").ilike("site_name", like).limit(5),
        (supabase.from("equipment" as never) as any).select("id, unit_number, category").ilike("unit_number", like).limit(5),
        (supabase.from("bids" as never) as any).select("id, bid_name, status").ilike("bid_name", like).limit(5),
        (supabase.from("contacts" as never) as any).select("id, first_name, last_name, customer_id").or(`first_name.ilike.${like},last_name.ilike.${like}`).limit(5),
        (supabase.from("incidents" as never) as any).select("id, incident_type, status").ilike("incident_type", like).limit(5),
      ]);
      if (cancelled) return;
      const next: Hit[] = [
        ...((customers.data ?? []) as any[]).map((r) => ({
          id: r.id, group: "Customers", label: r.legal_name, sublabel: r.status, to: "/customers/$customerId", params: { customerId: r.id },
        })),
        ...((sites.data ?? []) as any[]).map((r) => ({
          id: r.id, group: "Sites", label: r.site_name, sublabel: [r.city, r.state].filter(Boolean).join(", "), to: "/sites/$siteId", params: { siteId: r.id },
        })),
        ...((equipment.data ?? []) as any[]).map((r) => ({
          id: r.id, group: "Equipment", label: `Unit ${r.unit_number}`, sublabel: r.category, to: "/equipment/$equipmentId", params: { equipmentId: r.id },
        })),
        ...((bids.data ?? []) as any[]).map((r) => ({ id: r.id, group: "Bids", label: r.bid_name, sublabel: r.status, to: "/bids" })),
        ...((contacts.data ?? []) as any[]).map((r) => ({
          id: r.id, group: "Contacts", label: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
          to: "/customers/$customerId", params: { customerId: r.customer_id },
        })),
        ...((incidents.data ?? []) as any[]).map((r) => ({ id: r.id, group: "Incidents", label: r.incident_type ?? "Incident", sublabel: r.status, to: "/safety" })),
      ];
      setHits(next);
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const go = (to: string, params?: Record<string, string>) => {
    onOpenChange(false);
    setTerm("");
    navigate({ to, params: params as never });
  };

  const groups = [...new Set(hits.map((hit) => hit.group))];
  const icons: Record<string, typeof Building2> = {
    Customers: Building2,
    Sites: MapPin,
    Equipment: Truck,
    Bids: FileText,
    Contacts: Users,
    Incidents: ShieldAlert,
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput value={term} onValueChange={setTerm} placeholder="Search customers, sites, equipment, bids…" />
      <CommandList>
        {term.trim().length < 2 ? (
          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => go("/command-center")}>
              <Gauge className="h-4 w-4" /> Command Center
            </CommandItem>
            <CommandItem onSelect={() => go("/customers")}>
              <Building2 className="h-4 w-4" /> Customers
            </CommandItem>
            <CommandItem onSelect={() => go("/bids")}>
              <FileText className="h-4 w-4" /> Bids
            </CommandItem>
            <CommandItem onSelect={() => go("/equipment")}>
              <Truck className="h-4 w-4" /> Equipment
            </CommandItem>
            <CommandItem onSelect={() => go("/safety")}>
              <ShieldAlert className="h-4 w-4" /> Safety
            </CommandItem>
          </CommandGroup>
        ) : (
          <>
            <CommandEmpty>No matches found.</CommandEmpty>
            {groups.map((group) => {
              const Icon = icons[group] ?? Building2;
              return (
                <CommandGroup key={group} heading={group}>
                  {hits
                    .filter((hit) => hit.group === group)
                    .map((hit) => (
                      <CommandItem key={`${group}-${hit.id}`} value={`${group}-${hit.id}`} onSelect={() => go(hit.to, hit.params)}>
                        <Icon className="h-4 w-4" />
                        <span>{hit.label}</span>
                        {hit.sublabel && <span className="ml-auto text-xs text-muted-foreground">{hit.sublabel}</span>}
                      </CommandItem>
                    ))}
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
