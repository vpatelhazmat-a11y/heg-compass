import { createFileRoute } from "@tanstack/react-router";
import { RecordListPage } from "@/components/app/RecordWorkspace";

export const Route = createFileRoute("/_authenticated/records/$entityType/")({
  validateSearch: (search: Record<string, unknown>) => ({
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
    ascending: search["ascending"] === true,
    parent: typeof search["parent"] === "string" ? search["parent"] : undefined,
    parentId: typeof search["parentId"] === "string" ? search["parentId"] : undefined,
    q: typeof search["q"] === "string" ? search["q"].slice(0, 120) : undefined,
    field: typeof search["field"] === "string" ? search["field"] : undefined,
    filterField: typeof search["filterField"] === "string" ? search["filterField"] : undefined,
    filterValue:
      typeof search["filterValue"] === "string" ? search["filterValue"].slice(0, 120) : undefined,
    groupBy: typeof search["groupBy"] === "string" ? search["groupBy"] : undefined,
    view: search["view"] === "cards" ? ("cards" as const) : ("list" as const),
    archived: search["archived"] === true,
    folder:
      typeof search["folder"] === "string" &&
      ["customer", "site", "equipment", "unlinked"].includes(search["folder"])
        ? search["folder"]
        : undefined,
    page:
      typeof search["page"] === "number" && Number.isInteger(search["page"]) && search["page"] >= 0
        ? search["page"]
        : 0,
  }),
  component: RecordListRoute,
});
function RecordListRoute() {
  const { entityType } = Route.useParams();
  const state = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RecordListPage
      table={entityType}
      parent={state.parent}
      parentId={state.parentId}
      state={{
        sort: state.sort,
        ascending: state.ascending,
        search: state.q,
        searchField: state.field,
        filterField: state.filterField,
        filterValue: state.filterValue,
        groupBy: state.groupBy,
        view: state.view,
        page: state.page,
        archived: state.archived,
        folder: state.folder,
      }}
      onChange={(patch) => navigate({ search: (previous) => ({ ...previous, ...patch }) })}
    />
  );
}
