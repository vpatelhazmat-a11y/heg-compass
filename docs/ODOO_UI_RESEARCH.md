# Odoo interface study for HEG Compass

The reference is Odoo 19's documented web client and the existing HEG workflow, not a copy of Odoo code or artwork. Odoo's form, list, and search views are distinct views of the same records. A form has a sheet with a title and grouped fields; its `button_box` contains related-record statistics. A search view supplies field search, filters, grouping, and favorites. The web client separates the navigation bar, search/control panel, and record views.

Official references:

- [Form, list, search, button box, and title architecture](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html)
- [Web client structure](https://www.odoo.com/documentation/19.0/developer/reference/frontend/framework_overview.html)
- [Search, filters, grouping, and favorites](https://www.odoo.com/documentation/19.0/applications/essentials/search.html)
- [Keyboard shortcuts](https://www.odoo.com/documentation/19.0/applications/essentials/keyboard_shortcuts.html)

## Interaction map

| Odoo pattern                              | HEG application                                                                                                                                 | Current status                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| App launcher opens a module               | Custom app icons and module routes                                                                                                              | Implemented                                                                                 |
| Module navigation and list view           | Plum top bar, module menu, record tables                                                                                                        | Implemented                                                                                 |
| Form title and grouped fields             | Record header and compact grouped form                                                                                                          | Implemented for supporting records; master records retain their focused tabs                |
| Related statistics near the form title    | Smart buttons centered in the record header                                                                                                     | Implemented                                                                                 |
| Breadcrumb navigation                     | Linked crumbs and explicit back control                                                                                                         | Implemented                                                                                 |
| Edit the form directly                    | Supporting records and the primary tab of customer, site, and equipment records accept input on opening; Save and Discard appear after a change | Implemented for these record forms                                                          |
| Search from the current context           | Typing on the page opens a combined app and record search; Ctrl/Command+K remains available                                                     | Implemented for application labels and primary record labels across the registered entities |
| Search filters, grouping, saved favorites | Module-specific search views and persistent saved views                                                                                         | Pending                                                                                     |
| Inline related lists and chatter          | Existing related tabs and tables; shared conversation/activity model                                                                            | Pending broader plan                                                                        |

## HEG-specific rules

- Changing a rate still requires a fresh reason and uses the versioned `revise_rate` operation. Opening a form, typing, and discarding never writes a rate.
- Read-only roles see record values and navigation but no editable fields.
- Search queries remain under existing row-level security; the search UI does not grant access to hidden records.
- A record is saved only when the user selects Save changes. Automatic save on navigation is deferred until there is a reliable unsaved-changes flow for rates and other guarded records.
- Keyboard search ignores input fields, dialog controls, links, buttons, and modifier shortcuts so typing into a form stays in that form.

## Next UX work

Build shared module search views with field filters, group-by, and saved favorites; extend direct editing to the remaining master-record tabs; consolidate duplicate related panels; and make keyboard results searchable by more than each entity's primary label. Follow the completion ledger for the separate functional phases such as chatter, documents, imports, and reports.
