# HEG Compass: open requests

This is the consolidated backlog from the original Odoo-style rebuild request, later design feedback, and the [workspace implementation plan](ODOO_WORKSPACE_PLAN.md). “Foundation” means usable pieces exist but the requested workflow is unfinished. This list does not authorize fabricated data or weakening rate, relationship, or access controls.

| Priority | Request | Status | Next acceptance point |
| --- | --- | --- | --- |
| 1 | Odoo-like app launcher: quiet grid, original colorful icons, global type-to-search, user-prioritized app order | Foundation; ordering in progress | Drag and accessible move controls, reset, and per-user persistence; later sync across devices |
| 2 | Consistent record anatomy: breadcrumb/header, smart buttons, chatter, grouped record information, final Notes section | Foundation | Consolidate the twelve customer tabs and preserve every related record and create path |
| 3 | Direct editing by selecting a value, with no form-box grid or redundant Edit buttons | Implemented on supporting records and primary customer/site/equipment tabs | Extend and visually review remaining record-specific sections |
| 4 | Shared module home/control panel with contextual field search, filters, Group By, saved personal/team views, and view switcher | Pending | Server-backed, permission-scoped results consistent across list and appropriate Kanban/calendar/activity views |
| 5 | Real chatter on each record: messages, internal notes, tracked changes, @mentions, activities, followers | Pending | Shared tables, role/RLS tests, timeline, due/overdue activity behavior, and no unsolicited outbound messages |
| 6 | Rich record Notes and attachments | Pending | Sanitized editor, authorized storage, and automatic registration in Documents |
| 7 | Document library following module → record links, with flat search, filters, and expiry | Basic record list only | Folder-style navigation, upload/attach flows, and expiry signals |
| 8 | Guided import and contextual export | CSV export only | Template, mapping, validation preview, staging/provenance, create/update matching, rejects; export respects selected or filtered scope |
| 9 | Selection actions and archive/restore instead of casual delete | Inconsistent | Permission-checked bulk actions, relationship checks, Archived filter, and explicit delete policy |
| 10 | Custom report builder and saved/shared reports | Fixed reports only | Source, filters, grouping, measures, pivot/chart/list, export, and rebuilt Refused Loads analysis |
| 11 | Notifications and digests | Pending | Bell for real mentions/assignments/dates; opt-in preferences and protected scheduled delivery |
| 12 | General Settings replacing scattered administration | Basic profile/admin screens | Users, granular roles, lookup values, templates, tags, audit/data-quality, and backend health |
| 13 | Equipment lease and maintenance rates | Pending | Effective-dated values with customer/contract links and reporting |
| 14 | Full relationship coverage, tags, data quality, and keyboard-first search across fields | Foundation | No orphaned related work; scoped counts and lists agree; search expands beyond primary labels |
| 15 | Visual polish and usability across every module | Foundation | Consistent plum/white system, original icons, restrained buttons/tabs/tables, responsive and keyboard/screen-reader review |

The Architecture Stabilization Sprint is already delivered: schema/relationships, Refused Loads, RLS/security, rate history, forms, and tests were stabilized before the redesign. Continue regression coverage as new screens and tables are added. The original source plan is preserved in the user-provided attachment; this backlog is the working tracker for the repository.
