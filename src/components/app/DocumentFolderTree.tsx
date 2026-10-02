import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Search } from "lucide-react";
import { listRowsPage } from "@/lib/data";
import { recordLabel } from "@/lib/record-registry";

const folders = [
  { kind: "customer", table: "customers", label: "Customers", searchField: "legal_name" },
  { kind: "site", table: "sites", label: "Sites", searchField: "site_name" },
  { kind: "equipment", table: "equipment", label: "Equipment", searchField: "unit_number" },
] as const;

export function DocumentFolderTree({
  folder,
  parent,
  parentId,
  onSelect,
}: {
  folder?: string | undefined;
  parent?: string | undefined;
  parentId?: string | undefined;
  onSelect: (selection: {
    folder?: string;
    parent?: string;
    parentId?: string;
    page: number;
  }) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(
    folders.find((item) => item.table === parent)?.kind ?? null,
  );
  const [search, setSearch] = useState("");
  const active = folders.find((item) => item.kind === expanded);
  const choices = useQuery({
    queryKey: ["document-folders", expanded, search],
    enabled: Boolean(active),
    queryFn: () =>
      listRowsPage(active!.table, {
        searchField: active!.searchField,
        search: search.trim().slice(0, 120),
        limit: 30,
      }),
  });
  return (
    <nav className="document-folder-tree" aria-label="Document folders">
      <h2>Folders</h2>
      <button
        type="button"
        className="document-folder"
        aria-current={!folder && !parent ? "page" : undefined}
        onClick={() => onSelect({ page: 0 })}
      >
        <FolderOpen className="h-4 w-4" /> All documents
      </button>
      {folders.map((item) => (
        <div key={item.kind}>
          <button
            type="button"
            className="document-folder"
            aria-current={folder === item.kind || parent === item.table ? "page" : undefined}
            aria-expanded={expanded === item.kind}
            onClick={() => {
              setExpanded(expanded === item.kind ? null : item.kind);
              setSearch("");
              onSelect({ folder: item.kind, page: 0 });
            }}
          >
            {expanded === item.kind ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Folder className="h-4 w-4" /> {item.label}
          </button>
          {expanded === item.kind && (
            <div className="document-folder-children">
              <label className="document-folder-search">
                <Search className="h-3.5 w-3.5" />
                <input
                  aria-label={`Find ${item.label.toLowerCase()} folder`}
                  placeholder={`Find ${item.label.toLowerCase()}…`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              {choices.isLoading ? (
                <span className="document-folder-hint">Loading…</span>
              ) : choices.error ? (
                <span className="document-folder-hint">Folders unavailable</span>
              ) : choices.data?.rows.length ? (
                choices.data.rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="document-folder-child"
                    aria-current={parent === item.table && parentId === row.id ? "page" : undefined}
                    onClick={() =>
                      onSelect({ folder: item.kind, parent: item.table, parentId: row.id, page: 0 })
                    }
                  >
                    {recordLabel(item.table, row)}
                  </button>
                ))
              ) : (
                <span className="document-folder-hint">No matching records</span>
              )}
              {(choices.data?.count ?? 0) > 30 && (
                <span className="document-folder-hint">Search to find more</span>
              )}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        className="document-folder"
        aria-current={folder === "unlinked" ? "page" : undefined}
        onClick={() => {
          setExpanded(null);
          onSelect({ folder: "unlinked", page: 0 });
        }}
      >
        <Folder className="h-4 w-4" /> Unlinked
      </button>
    </nav>
  );
}
