# Odoo-style rebuild status

This tracks the user's ten-phase HEG Hub rebuild plan against the running application. A phase is complete only when its user workflow, permissions, data model, and production deployment are verified.

| Phase | Current state | Work still required |
| --- | --- | --- |
| 1. Navigation and shell | App launcher, plum top bar, module navigation, global search, and reorderable apps are live. | Signed-in visual review and final responsive polish. |
| 2. Navigable records | Registered lists, record pages, relational links, smart buttons, and filtered related lists are live. | Audit every relation and module-specific list for parity. |
| 3. Chatter | Messages, internal notes, scheduled tasks, and field-change entries exist. | Mention picker, followers, notification delivery, typed activities, assignees, and overdue/today states. |
| 4. Notes and attachments | Existing Notes fields share a rich-text editor with headings, emphasis, lists, links, and undo. Server-sanitized formatting is stored separately from searchable/exportable plain text. Document records can hold one private file. | Add Notes to record types without an existing notes field and add attachment entry points throughout records. Signed-in visual review remains. |
| 5. Documents | Private file upload, short-lived signed downloads, and a searchable customer/site/equipment folder tree exist. | Folders for other linked record types, file replacement/versioning, richer filters, and expiry alerts. |
| 6. Import/export | List export exists. Import batch and staging tables exist. | Templates, mapping, validation preview, upsert matching, batch provenance, rejects download, and complete per-module export. |
| 7. Reporting | Fixed report summaries and Refused Loads analysis exist. | Report definition model, editable filters/grouping/measures, saved and shared views, pivot/charts/kanban, XLSX export. |
| 8. Notifications/digests | The top-bar activity menu shows assigned tasks and approaching bid, document, and contract deadlines. | Mention notifications, subscriptions, email provider, schedule, delivery logs, and cross-device preferences. |
| 9. General Settings | Personal Settings and separate Administration page exist. | Unified module settings, granular permission management, lookup/template/type management, audit and data quality views, backend health. |
| 10. Equipment rates | Lease and maintenance terms have amount/unit/currency, effective/expiry dates, customer/contract links, protected revision history, and equipment/list CSV export. | Reporting engine integration, signed-in workflow review, and remaining rate-view polish. |

Cross-cutting: personal saved searches now work on the current device. Customers, sites, and equipment have archive/restore controls and archived list filters. Team-shared views, cross-device sync, archive support for other record types, record tags, and a complete related-record audit remain. Global keyboard search exists.
