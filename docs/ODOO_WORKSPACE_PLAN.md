# HEG Compass: Odoo-style workspace plan

Status: approved direction, implementation in stages. This document describes the intended product, not features already delivered. Preserve HEG's existing records, rate revision rules, and role-based access throughout.

## Reference and interpretation

Odoo's form architecture has a header, sheet, grouped fields, notebook pages, related-record button box, and chatter. Its list control panel offers view switching, search, filters, grouping, and favorites. Import is a view-level action; export, archive, and delete act on records and depend on access rights. HEG will use these interaction patterns and original icons, rather than copy Odoo artwork or code.

- [Form and list architecture](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html)
- [Search, filters, grouping, and favorites](https://www.odoo.com/documentation/19.0/applications/essentials/search.html)
- [Views and when Kanban is useful](https://www.odoo.com/documentation/19.0/applications/studio/views.html)
- [Activities linked to records](https://www.odoo.com/documentation/19.0/applications/essentials/activities.html)
- [Import and export](https://www.odoo.com/documentation/19.0/applications/essentials/export_import_data.html)

## Screen anatomy

### App launcher

Keep the plum global bar and colorful original app icons. Remove the visible “Applications” heading and “Start typing” sentence; typing on the page and the search icon continue to open global search. Let each signed-in user drag app tiles into a preferred order. Provide keyboard Move earlier/Move later controls and Reset order, so the feature works without a mouse. Persist the order by stable module ID under that user's account, not as a shared sequence. New apps appear after the saved ones. Reordering changes only presentation, never module access. Test desktop, touch, keyboard, reload, and a second account.

### Module home and list view

Use one consistent control panel: module name and New on the left; contextual search and view-switch icons on the right. The search field searches only the current module's permitted records. Its dropdown offers field-specific search, predefined filters, custom filters, Group By, and saved Favorites. Active conditions appear as removable chips. Filter and group state belongs in the URL so back/forward navigation and shared links work. Saved favorites belong to the user; sharing them requires an explicit separate permission model.

Offer only useful views for each module. List is the default for record-heavy modules; Kanban is appropriate for staged work such as bids, opportunities, and tasks. Calendar or Activity should appear only where dates or linked activities support real content. A view switch must retain the same filter scope and record count. Search and pagination must query the server, because the current DataTable loads full tables and filters in the browser.

Use a view-level gear menu for Import records, column/layout controls, and other module settings. Selection reveals a separate Actions menu for Export selected, Archive, and, only where policy permits, Delete. Export current filtered results should be explicitly labeled. Do not put a universal Delete beside Import, or imply every HEG table supports hard deletion. Keep existing CSV export working while the new export workflow is built.

### Record detail

Establish one reusable layout for customer, site, equipment, and supporting records:

1. Header: breadcrumb/back, record title, status, primary action, and related smart buttons. Avoid repeating fields shown below.
2. Chatter: compact actions for Log note and Schedule activity, followed by a record-linked timeline. On wide screens it may sit beside the sheet, but reading and keyboard order start immediately after the header. On narrow screens it stacks before record information, as requested.
3. Record information: quiet, directly editable values in two-column groups where space allows. Related data uses a small number of meaningful notebook tabs or smart-button destinations; the current twelve customer tabs must be consolidated without losing records or creation paths.
4. Notes: a final dedicated section for durable commercial, risk, operational, and source notes. These fields are distinct from timestamped chatter entries. Attachments have authorized storage and record links, not a decorative upload button.

The chatter must be real: internal messages, activity assignments and due dates, author/time stamps, completion, and an auditable change trail. Build schema, row-level security, and tests before exposing write controls. Reuse existing linked tasks where valid. Do not send email, mentions, or external notifications until the corresponding delivery rules and consent are implemented.

## Implementation sequence and acceptance

1. **Launcher foundation.** Remove the two lines now; then build per-user drag/keyboard ordering, persistence, reset, and responsive layout. Verify ordering survives reload and does not affect another user.
2. **Record structure.** Extract a shared header/chatter/sheet/Notes layout, consolidate customer tabs and duplicate smart-button destinations, and verify all existing relationships and creation routes remain reachable. Preserve unsaved drafts when changing sections.
3. **Chatter data and permissions.** Add messages and activities with record links, migrations, RLS, author attribution, and audit tests. Test read-only roles and cross-customer access. Add UI only once those checks pass.
4. **Module control panel.** Add server-backed field search, safe filter operators, grouping, URL state, personal saved views, and view switching where meaningful. Confirm identical results across list/Kanban and correct paging under RLS.
5. **Action workflows.** Move import into the view gear with template, field mapping, validation preview, and dry run. Make export respect selected or filtered scope. Prefer archive/restore for master records; expose hard delete only after relationship checks, role policy, and an explicit confirmation flow. Test bulk operations and rate/refused-load invariants.
6. **Visual and workflow review.** Check desktop and phone screens, keyboard and screen reader behavior, empty/loading/error states, then run schema/type/lint/tests/build and verify the published Lovable app with non-destructive records.

## Existing constraints

Rate changes continue through the versioned `revise_rate` operation with a fresh reason. All search, chatter, import, export, and actions must observe existing RLS and relationships. The existing CSV exporter and table controls are the baseline; saved views, server-side grouping, a record chatter, and an import pipeline are not yet implemented.
