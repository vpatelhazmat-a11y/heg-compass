# Architecture Stabilization Sprint

Scope: stabilize the existing HEG Compass repository. No import, deployment, new business module, or production data change is part of this change.

## Domain decisions

- Refused Loads are individual requests HEG could not accept. Lost Business describes broader commercial losses. A lost-business record can link to one refused load; linked records cannot store a second load/revenue estimate. Refused Load revenue is a total for the request, not a per-load amount.
- Customer-owned contacts, products, sites, lanes and related commercial records must agree on the customer. Lane origin/destination sites may belong to different customers because they represent physical pickup/delivery locations; their individual foreign keys still apply.
- Structured Requirements are authoritative. Existing site convenience notes remain as legacy context; reconcile their content before import. Safety staff maintain structured site Safety/PPE/Environmental/Security requirements, rather than editing the entire site master record.
- Equipment assignment history is authoritative. One open Active assignment per unit is allowed. Close an assignment before creating another. Legacy placement fields are preserved for reconciliation and cannot be changed through new writes. Their known values are carried into history only when there is no open assignment; conflicts stop migration.
- Rates retain one current record and immutable full before/after snapshots in rate_history. A database trigger captures every substantive edit, including direct API updates. The revision action additionally locks the row and checks the editor's timestamp. Every change needs an effective date and fresh reason. Historic rows cannot be edited/deleted by application roles, including administrators. Deleting a rate/customer cannot cascade away rate history.
- Requirements, documents and tasks keep their existing entity-type/ID interface. Generated reference columns enforce actual foreign keys. Both halves of an optional link must be supplied together.

## Security

Every public base table has RLS. Database tests execute as authenticated roles, not only as the database owner. Normal signups receive no roles; an approved administrator must assign access. Bootstrap the first administrator through a trusted administrative database session after verifying their identity. Existing roles remain intact.

| Area | Writers | Readers |
| --- | --- | --- |
| Customers, contacts, products, lanes, opportunities, lost business | Admin, Sales | Approved active roles |
| Sites, Refused Loads | Admin, Sales, Operations | Approved active roles |
| Rates, bids, contracts | Admin, Sales | Admin, Sales, Operations, Management |
| Equipment and assignment/compliance/lease/technology records | Admin, Operations | Approved active roles |
| Incidents, corrective actions, assessments | Admin, Safety, Operations | Admin, Safety, Operations, Management |
| Drivers, qualifications, driver safety | Admin, Safety | Admin, Safety, Management |
| Roles, invitations, imports, lookups | Admin | Existing role-specific read policies; operational lookups available to approved users |

Management and Read Only do not write business records. Destructive operations remain admin-only; rate history is stricter. Shared-record permissions additionally depend on the linked domain and document classification. Disabled profiles lose business access and cannot reactivate themselves. Audit entries for critical tables are written by database triggers, not supplied by browsers.

The invitation function checks the administrator's active role through RLS helpers, assigns the approved role server-side, and never trusts editable user metadata for authorization. A failed role assignment leaves the invited user without business access and reports the failure. Email delivery and hosted authentication still require staging verification.

## Validation

Use Node 22 and the packageManager version in package.json:

```sh
pnpm install --frozen-lockfile
pnpm db:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

CI runs these checks. Original direct dependency versions are pinned from the repository's Bun lockfile; pnpm-lock.yaml is authoritative for CI. The original Bun lockfile is retained for the connected editor, but it is not the CI installation contract.

The test database runs every committed migration on PGlite (PostgreSQL in-process) with minimal Supabase auth roles/UID fixtures. Tests cover database constraints, RLS, historical changes, schema/form agreement, archive handling, authentication decisions, Refused Load form submission, and empty/paginated queries. This is not a substitute for PostgREST, hosted Auth/Storage, email delivery, concurrent independent database sessions, or a live-schema comparison.

Generated TypeScript types come from replaying committed migrations (`pnpm db:types`), not from a manually edited approximation. `db:check` fails on drift. The generic multi-table table/form presentation layer retains a documented dynamic Row boundary; critical Refused Load payloads, auth queries and rate RPCs use schema types.

## Deployment gate — still required

1. Export a schema-only snapshot and take a restorable backup of the target database. Keep operational exports outside GitHub. Record the recovery point and responsible administrator.
2. Run `supabase/preflight.sql` against staging/production as a read-only administrative inspection. Compare migration history, columns, constraints, policies and existing conflicts. Check **all** relationships added by the migrations, not only the highlighted examples. No live database was inspected by this sprint.
3. Investigate any orphan IDs, missing customer links, conflicting equipment placements, duplicate open assignments, incompatible polymorphic entity values, or existing undocumented columns. Do not delete rows or fabricate replacements to pass migration. The migrations deliberately abort on conflicts and existing duplicate columns.
4. Restore the backup into an isolated staging database, apply migrations in timestamp order, regenerate hosted Supabase types and compare with the committed contract. Verify PostgREST embedded relationships (including composite-key disambiguation and assignment views) with each role.
5. Exercise Customer/Site/Equipment 360, Refused Load create/edit, rate revision/history, assignment close/reassign, disabled accounts, invitations, and admin deletion using separate real sessions. Verify customer changes cannot leave stale dependent selections.
6. Test backup restoration and export access. Retain the pre-migration backup and read-only schema export through rollout. Roll back application code only if it remains compatible; database rollback is a reviewed restore or corrective migration, never an automatic DROP of history/constraints.
7. Only after staging passes, apply to production in an agreed maintenance window and repeat role smoke checks. Importing real HEG files remains blocked until this gate is complete.

## Deliberately deferred

Global material normalization, new dashboards, new import workflows, new integrations, personnel-management features and navigation redesign. Missing production evidence is not marked as passing. No synthetic HEG business records are created by the migrations; test fixtures live only in disposable databases.
