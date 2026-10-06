import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Search } from "lucide-react";
import { listRowsPage } from "@/lib/data";
import { recordLabel } from "@/lib/record-registry";

import { DOCUMENT_FOLDERS } from "@/lib/document-folders";
import { canViewTable } from "@/lib/permissions";
import { useSession } from "@/hooks/use-session";

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
  const { roles = [] } = useSession();
  const folders = DOCUMENT_FOLDERS.filter((folder) => canViewTable(roles, folder.table));
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(
    folders.find((item) => item.table === parent)?.kind ?? null,
  );
  const [search, setSearch] = useState("");
  const active = folders.find((item) => item.kind === expanded);
  const choices = useQuery({
    queryKey: ["document-folders", expanded, search, page],
    enabled: Boolean(active),
    queryFn: () =>
      listRowsPage(active!.table, {
        searchField: active!.searchField,
        search: search.trim().slice(0, 120),
        limit: 30,
        offset: page * 30,
        order: { column: active!.searchField, ascending: true },
      }),
  });
  return (
    <nav className="document-folder-tree" aria-label="Document folders">
      <h2>Folders</h2>
      <button
        type="button"
        className="document-folder"
        aria-current={!folder && !parent ? "page" : undefined}
        onClick={() => {
          setExpanded(null);
          setSearch("");
          setPage(0);
          onSelect({ page: 0 });
        }}
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
              setPage(0);
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
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                />
              </label>
              {choices.isLoading ? (
                <span className="document-folder-hint">Loading…</span>
              ) : choices.error ? (
                <div className="document-folder-hint">
                  <span role="alert">Folders could not load.</span>
                  <button
                    type="button"
                    className="ml-2 text-primary hover:underline"
                    onClick={() => void choices.refetch()}
                  >
                    Try again
                  </button>
                </div>
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
                <div className="document-folder-pager">
                  <span>
                    {page * 30 + 1}–{Math.min((page + 1) * 30, choices.data!.count)} of{" "}
                    {choices.data!.count}
                  </span>
                  <button
                    type="button"
                    aria-label="Previous folder page"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    aria-label="Next folder page"
                    disabled={(page + 1) * 30 >= choices.data!.count}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
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
