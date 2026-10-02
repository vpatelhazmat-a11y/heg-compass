# Odoo-style rebuild status

This tracks the user's ten-phase HEG Hub rebuild plan against the running application. A phase is complete only when its user workflow, permissions, data model, and production deployment are verified.

| Phase | Current state | Work still required |
| --- | --- | --- |
| 1. Navigation and shell | App launcher, plum top bar, module navigation, global search, and reorderable apps are live. | Signed-in visual review and final responsive polish. |
| 2. Navigable records | Registered lists, record pages, relational links, smart buttons, and filtered related lists are live. | Audit every relation and module-specific list for parity. |
| 3. Chatter | Messages, internal notes, scheduled tasks, and field-change entries exist. | Mention picker, followers, notification delivery, typed activities, assignees, and overdue/today states. |
| 4. Notes and attachments | Customer, site, and equipment Notes sections use plain text. | Shared rich-text editor, sanitized storage, all-record coverage, file upload and document registration. |
| 5. Documents | A flat document record list exists. | File storage, folder-style record tree, upload, filters, signed downloads, expiry alerts. |
| 6. Import/export | List export exists. Import batch and staging tables exist. | Templates, mapping, validation preview, upsert matching, batch provenance, rejects download, and complete per-module export. |
| 7. Reporting | Fixed report summaries and Refused Loads analysis exist. | Report definition model, editable filters/grouping/measures, saved and shared views, pivot/charts/kanban, XLSX export. |
| 8. Notifications/digests | The top-bar activity menu shows assigned tasks and approaching bid, document, and contract deadlines. | Mention notifications, subscriptions, email provider, schedule, delivery logs, and cross-device preferences. |
| 9. General Settings | Personal Settings and separate Administration page exist. | Unified module settings, granular permission management, lookup/template/type management, audit and data quality views, backend health. |
| 10. Equipment rates | Equipment leases can store one rate. | Lease/maintenance rate terms, currency/unit/effective/expiry dates, contract/customer link, history, reporting. |

Cross-cutting: personal saved searches now work on the current device. Team-shared views, cross-device sync, archive controls and archived filters, record tags, and a complete related-record audit remain. Global keyboard search exists.
