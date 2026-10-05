# HEG ERP refurbishment

This supersedes the visual acceptance criteria in earlier progress documents. Existing functionality is a baseline, not evidence that a screen is finished. The ten-phase functional backlog remains open. Refurbishment preserves data, permissions, history, and existing creation paths.

## Product structure

One global shell, one module control panel, one record layout. The shell identifies the current application and contains its navigation. Search, activities, and account preferences are global utilities. Creation belongs to the current list or record; unrelated global creation is removed. Settings remains a launcher application and an account-menu destination. Administration is permission restricted.

App launcher → module list → record → linked record is the main journey. Breadcrumbs return to the originating collection. Browser back restores search, filters, paging, and selected view. Opening related records must never silently lose a draft. Links are real navigable links; menus and editing are buttons. The header must never require horizontal scrolling to find utilities.

## Design specification

| Element | Required behavior and appearance | Acceptance |
| --- | --- | --- |
| Colors | Plum application bar, white work surfaces, quiet gray canvas; semantic status colors paired with text | Contrast checked in default, hover, disabled, and focus states |
| Type | One loaded or system font stack; 14px working text, 12px secondary labels, restrained 20–24px record titles | No missing-font dependency, clipped text, or all-caps paragraphs |
| Spacing | Consistent 4/8/12/16/24px rhythm; lines separate work areas instead of nested cards | No competing panel borders or empty decorative space |
| Buttons | One primary action per context; secondary actions quiet; destructive actions in contextual menu | Keyboard accessible, permission checked, pending state prevents duplicate submission |
| Icons | Original colorful app icons; consistent monochrome functional icons | Accessible names for every icon-only control; no decorative icon on every field |
| Header | Launcher, application name, up to three primary menus, overflow menu, global utilities | Stable at desktop and mobile widths; active page remains identifiable |
| Launcher | Uncluttered app grid; hold/drag with visible destination; keyboard alternative | Touch, mouse, keyboard, reload, and separate-user checks |
| List control panel | Breadcrumb/title and New; module search; filters/group/favorites; supported view switch; pager | Same query scope across views; filter state survives record/back journey |
| Record header | Breadcrumb/title/status; contextual actions; centered related smart buttons | No duplicated record title or unrelated action; related counts agree with destination |
| Form sheet | Quiet values edited directly; meaningful field groups and tabs; Notes last | Required, invalid, saving, saved, stale, and read-only states visible without boxed display fields |
| Smart buttons | Short label, count, consistent placement; link to scoped related collection | Relationship and RLS verified; no fake counts or dead destinations |
| Chatter | Compact real message/note/activity actions and timeline; beside sheet on wide screens, stacked on narrow screens | Correct author/time, permissions, empty state; no invented delivery state |
| Notes | Durable rich text separated from chatter, light toolbar during editing | Legacy text preserved; safe links; clear save/cancel and keyboard behavior |
| Tables | Aligned numeric values, readable dates, restrained row separators, deliberate column widths | Row links coexist with selection/actions; loading/error/empty distinguishable |
| Tabs | Only meaningful record sections; consistent active underline | Keyboard operation, draft preservation, narrow-screen overflow |
| Menus | View settings separate from selected-record actions | Import/export/archive/delete shown only when fully implemented and permitted |
| Search | Global search for apps/records; contextual search for current module | No duplicate Home search field; typing never intercepts editor or modal input |
| Feedback | Inline validation, visible retry, success confirmation; no silent failures | Network failure and permission denial tested; draft retained after failed save |

## Delivery order and release gates

1. **Shell and navigation:** remove global creation, eliminate repeated overview links, complete module menus, keep header compact. PR #29 is published; signed-in header verified. Full responsive and navigation acceptance remains pending.
2. **Shared control panel:** unify module lists before revising individual pages. Audit search, filters, grouping, favorites, selection, export, and browser history. Unsupported view/action controls are not displayed.
3. **Record framework:** reconcile customer/site/equipment and generic forms into the same header/smart-buttons/sheet/chatter/Notes anatomy. Audit direct editing, save/cancel, stale writes, read-only roles, and relation links.
4. **Module pass:** Customers, Sites, Equipment, Bids, Refused Loads, Safety, Documents, Knowledge, Tasks, Reporting, Settings. Each gets a recorded screen inventory and journey checklist; dashboard cards must earn their place through a task they support.
5. **Visual system cleanup:** consolidate accumulated CSS rules into component styles and tokens after layout contracts are stable. Review icons, contrast, typography, button hierarchy, density, mobile, and empty states.
6. **Production acceptance:** test signed-in desktop and phone journeys with permitted non-destructive records, then verify published assets and deployment. Automated checks alone do not establish visual quality.

For each stage: capture before/after screens; verify keyboard and pointer interactions; run focused behavior tests, types, lint, and production build; inspect affected permissions and data invariants. A stage stays pending until visual and workflow acceptance is recorded. Do not describe the application as enterprise-ready while these gates are open.

## Initial code audit

- Global New offered unrelated record types alongside module actions.
- Module menus omitted several reachable record collections, and Bids linked to Opportunities owned by Customers, changing application context unexpectedly.
- Daily overview appeared as an extra module navigation item despite being global.
- Application identity was hidden on desktop while the brand occupied the same space.
- Multiple late CSS overrides complicate spacing and visual consistency; consolidating them requires screen verification.
- Signed-in production visual acceptance has not been completed. Existing 87 tests validate important behavior, not the complete interface or all workflows.
- Signed-in related Sites review exposed a search field squeezed by separate field/filter/group controls. The next pass places these in a searchable-view options popover, keeps active filter/group chips visible, and retains URL state. Relationship links and document-save navigation also needed router transitions.

## References

Official Odoo references for interaction anatomy, not copied branding or artwork:

- https://www.odoo.com/documentation/19.0/applications/studio/views.html
- https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html
- https://www.odoo.com/documentation/19.0/applications/essentials/search.html
