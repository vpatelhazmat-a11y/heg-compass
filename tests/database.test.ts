import { beforeAll, afterAll, test, expect } from "vitest";
import { createDatabase } from "./database.mjs";
import * as forms from "../src/lib/entities";

let db: Awaited<ReturnType<typeof createDatabase>>;
const users = Object.fromEntries(
  ["admin", "sales", "operations", "safety", "management", "read_only", "unassigned"].map(
    (role, i) => [role, `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`],
  ),
);
let customer: string, other: string, site: string, contact: string, rate: string;
async function asRole(role: string, sql: string, args: unknown[] = []) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [users[role]]);
  await db.exec("set role authenticated");
  try {
    return await db.query(sql, args);
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  db = await createDatabase();
  for (const [role, id] of Object.entries(users)) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${role}@example.test`]);
    if (role !== "unassigned")
      await db.query("insert into public.user_roles(user_id,role) values($1,$2)", [id, role]);
  }
  customer = (
    await db.query("insert into customers(legal_name) values('Test Customer') returning id")
  ).rows[0].id;
  other = (
    await db.query("insert into customers(legal_name) values('Other Customer') returning id")
  ).rows[0].id;
  site = (
    await db.query("insert into sites(customer_id,site_name) values($1,'Test Site') returning id", [
      customer,
    ])
  ).rows[0].id;
  contact = (
    await db.query("insert into contacts(customer_id,first_name) values($1,'Test') returning id", [
      customer,
    ])
  ).rows[0].id;
  rate = (
    await db.query(
      "insert into rates(customer_id,amount,effective_date) values($1,1450,'2026-09-01') returning id",
      [customer],
    )
  ).rows[0].id;
});
afterAll(async () => {
  await db?.close();
});

test("every configured form field exists in the migrated database", async () => {
  const mapping = {
    customerFields: "customers",
    siteFields: "sites",
    contactFields: "contacts",
    productFields: "products",
    laneFields: "lanes",
    rateFields: "rates",
    bidFields: "bids",
    opportunityFields: "opportunities",
    equipmentFields: "equipment",
    incidentFields: "incidents",
    taskFields: "tasks",
    documentFields: "documents",
    contractFields: "contracts",
    assessmentFields: "site_assessments",
    requirementFields: "requirements",
    lostBusinessFields: "lost_business",
    correctiveActionFields: "corrective_actions",
    equipmentAssignmentFields: "equipment_assignments",
    equipmentComplianceFields: "equipment_compliance",
    equipmentTechnologyFields: "equipment_technology",
  };
  for (const [config, table] of Object.entries(mapping)) {
    const columns = (
      await db.query(
        "select column_name from information_schema.columns where table_schema='public' and table_name=$1",
        [table],
      )
    ).rows.map((row) => row.column_name);
    for (const field of forms[config])
      expect(columns, `${table}.${field.name}`).toContain(field.name);
  }
});
test("all public base tables have RLS enabled", async () => {
  expect(
    (
      await db.query(
        "select relname from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relkind='r' and not relrowsecurity",
      )
    ).rows,
  ).toHaveLength(0);
});
test("launcher preferences are private to their owner, including for administrators", async () => {
  await asRole(
    "sales",
    'insert into user_workspace_preferences(user_id,app_order) values($1,\'["tasks","customers"]\'::jsonb)',
    [users.sales],
  );
  expect(
    (
      await asRole("sales", "select app_order from user_workspace_preferences where user_id=$1", [
        users.sales,
      ])
    ).rows[0].app_order,
  ).toEqual(["tasks", "customers"]);
  expect(
    (
      await asRole("admin", "select * from user_workspace_preferences where user_id=$1", [
        users.sales,
      ])
    ).rows,
  ).toHaveLength(0);
  await expect(
    asRole(
      "admin",
      "update user_workspace_preferences set app_order='[]'::jsonb where user_id=$1 returning *",
      [users.sales],
    ),
  ).resolves.toMatchObject({ rows: [] });
  await expect(
    asRole(
      "admin",
      "insert into user_workspace_preferences(user_id,app_order) values($1,'[]'::jsonb)",
      [users.sales],
    ),
  ).rejects.toThrow();
});
test("chatter links and authors are enforced in the database", async () => {
  const posted = await asRole(
    "sales",
    "insert into mail_messages(linked_entity_type,linked_entity_id,kind,body,author_id) values('customer',$1,'note','Internal context',$2) returning author_id",
    [customer, users.admin],
  );
  expect(posted.rows[0].author_id).toBe(users.sales);
  expect(
    (
      await asRole("read_only", "select body from mail_messages where linked_entity_id=$1", [
        customer,
      ])
    ).rows,
  ).toHaveLength(1);
  await expect(
    asRole(
      "read_only",
      "insert into mail_messages(linked_entity_type,linked_entity_id,kind,body) values('customer',$1,'note','Denied')",
      [customer],
    ),
  ).rejects.toThrow();
  await expect(
    asRole(
      "sales",
      "insert into mail_messages(linked_entity_type,linked_entity_id,kind,body) values('customer','11111111-1111-1111-1111-111111111111','note','Orphan')",
    ),
  ).rejects.toThrow();
});
test("record changes appear in chatter and cannot be forged by clients", async () => {
  await asRole("sales", "update customers set industry='Tracked industry' where id=$1", [customer]);
  const entries = (
    await asRole(
      "sales",
      "select field_name,old_value,new_value,author_id from mail_messages where linked_entity_type='customer' and linked_entity_id=$1 and kind='change' and field_name='industry'",
      [customer],
    )
  ).rows;
  expect(entries).toEqual([
    {
      field_name: "industry",
      old_value: null,
      new_value: "Tracked industry",
      author_id: users.sales,
    },
  ]);
  await expect(
    asRole(
      "sales",
      "insert into mail_messages(linked_entity_type,linked_entity_id,kind,body,field_name) values('customer',$1,'change','Fake change','industry')",
      [customer],
    ),
  ).rejects.toThrow();
});
test("shared links reject nonexistent or half-specified entities", async () => {
  await expect(
    asRole(
      "sales",
      "insert into requirements(entity_type,entity_id,requirement) values('site','11111111-1111-1111-1111-111111111111','Invalid')",
    ),
  ).rejects.toThrow();
  await expect(
    asRole("sales", "insert into documents(document_name,linked_entity_id) values('Invalid',$1)", [
      customer,
    ]),
  ).rejects.toThrow();
});
test("sensitive document and task metadata cannot leak to sales", async () => {
  const driver = (
    await db.query(
      "insert into drivers(employee_reference) values('Shared-link test') returning id",
    )
  ).rows[0].id;
  await asRole(
    "safety",
    "insert into documents(document_name,classification,linked_entity_type,linked_entity_id) values('Safety file','Safety','driver',$1)",
    [driver],
  );
  await asRole(
    "safety",
    "insert into tasks(title,linked_entity_type,linked_entity_id) values('Restricted follow-up','driver',$1)",
    [driver],
  );
  expect(
    (await asRole("sales", "select * from documents where document_name='Safety file'")).rows,
  ).toHaveLength(0);
  expect(
    (await asRole("sales", "select * from tasks where title='Restricted follow-up'")).rows,
  ).toHaveLength(0);
  expect(
    (await asRole("safety", "select * from documents where document_name='Safety file'")).rows,
  ).toHaveLength(1);
});
test("rate RPC writes one version and records unit-only changes too", async () => {
  const row = (
    await asRole(
      "sales",
      "insert into rates(customer_id,amount,effective_date,change_reason) values($1,100,'2026-09-01','Must not carry over') returning *",
      [customer],
    )
  ).rows[0];
  await expect(
    asRole("sales", "update rates set amount=110 where id=$1", [row.id]),
  ).rejects.toThrow(/reason/);
  const version = (
    await db.query("select updated_at::text as version from rates where id=$1", [row.id])
  ).rows[0].version;
  const result = await asRole(
    "sales",
    'select * from revise_rate($1,$2,\'{"unit":"Per load","change_reason":"Correct unit"}\')',
    [row.id, version],
  );
  expect(result.rows[0].unit).toBe("Per load");
  expect(
    (await asRole("sales", "select * from rate_history where rate_id=$1", [row.id])).rows,
  ).toHaveLength(1);
});
test("archiving retains history but rejects new child records", async () => {
  const row = (
    await asRole("sales", "insert into customers(legal_name) values('Archive test') returning id")
  ).rows[0];
  await asRole("sales", "update customers set archived_at=now(),status='Archived' where id=$1", [
    row.id,
  ]);
  expect(
    (await asRole("sales", "select * from customers where id=$1", [row.id])).rows,
  ).toHaveLength(1);
  await expect(
    asRole("sales", "insert into sites(site_name,customer_id) values('Blocked',$1)", [row.id]),
  ).rejects.toThrow(/archived/);
});
test("audit records cannot be forged by a client", async () => {
  await expect(
    asRole("sales", "insert into audit_log(user_id,entity_type,action) values($1,'rates','fake')", [
      users.sales,
    ]),
  ).rejects.toThrow();
  expect(
    (await asRole("admin", "select * from audit_log where entity_type='customers'")).rows.length,
  ).toBeGreaterThan(0);
});

test("signup does not bootstrap admin or business access", async () => {
  expect(
    (await db.query("select * from user_roles where user_id=$1", [users.unassigned])).rows,
  ).toHaveLength(0);
  expect((await asRole("unassigned", "select * from customers")).rows).toHaveLength(0);
  expect((await asRole("unassigned", "select * from staff_directory")).rows).toHaveLength(0);
  expect((await asRole("admin", "select * from staff_directory")).rows.length).toBeGreaterThan(0);
});
test("sales creates customers; read-only and management cannot", async () => {
  expect(
    (
      await asRole(
        "sales",
        "insert into customers(legal_name) values('Created by Sales') returning id",
      )
    ).rows,
  ).toHaveLength(1);
  for (const role of ["read_only", "management", "operations", "safety"])
    await expect(
      asRole(role, "insert into customers(legal_name) values('Blocked')"),
    ).rejects.toThrow();
});
test("site foreign key rejects nonexistent customer", async () => {
  await expect(
    asRole(
      "sales",
      "insert into sites(customer_id,site_name) values('11111111-1111-1111-1111-111111111111','Invalid')",
    ),
  ).rejects.toThrow();
});
test("refused loads persist and can be retrieved by customer", async () => {
  const result = await asRole(
    "operations",
    "insert into refused_loads(call_in_date,customer_id,contact_id,site_id,load_count,internal_notes,estimated_lost_revenue) values(current_date,$1,$2,$3,2,'Test',100) returning *",
    [customer, contact, site],
  );
  expect(result.rows[0].created_by).toBe(users.operations);
  expect(
    (await asRole("sales", "select * from refused_loads where customer_id=$1", [customer])).rows,
  ).toHaveLength(1);
});
test("invalid and cross-customer refused relationships are rejected", async () => {
  await expect(
    asRole(
      "sales",
      "insert into refused_loads(call_in_date,customer_id,contact_id) values(current_date,$1,$2)",
      [other, contact],
    ),
  ).rejects.toThrow();
  await expect(
    asRole(
      "sales",
      "insert into refused_loads(call_in_date,customer_id) values(current_date,'11111111-1111-1111-1111-111111111111')",
    ),
  ).rejects.toThrow();
  await expect(
    asRole("sales", "update contacts set customer_id=$1 where id=$2", [other, contact]),
  ).rejects.toThrow();
});
test("read only cannot edit or delete and safety cannot write refused loads", async () => {
  expect(
    (await asRole("read_only", "update refused_loads set load_count=9 returning id")).rows,
  ).toHaveLength(0);
  expect((await asRole("sales", "delete from refused_loads returning id")).rows).toHaveLength(0);
  await expect(
    asRole(
      "safety",
      "insert into refused_loads(call_in_date,customer_id) values(current_date,$1)",
      [customer],
    ),
  ).rejects.toThrow();
});
test("rate edit requires reason and preserves full history atomically", async () => {
  await expect(asRole("sales", "update rates set amount=1600 where id=$1", [rate])).rejects.toThrow(
    /reason/,
  );
  await asRole(
    "sales",
    "update rates set amount=1600,effective_date='2026-09-14',change_reason='Annual review' where id=$1",
    [rate],
  );
  const history = (await asRole("sales", "select * from rate_history where rate_id=$1", [rate]))
    .rows;
  expect(history).toHaveLength(1);
  expect(Number(history[0].previous_amount)).toBe(1450);
  expect(history[0].previous_record.amount).toBe(1450);
  expect(history[0].changed_by).toBe(users.sales);
  await expect(asRole("sales", "update rates set amount=1700 where id=$1", [rate])).rejects.toThrow(
    /reason/,
  );
  await expect(
    asRole("admin", "delete from rate_history where rate_id=$1", [rate]),
  ).rejects.toThrow();
  await expect(asRole("admin", "delete from rates where id=$1", [rate])).rejects.toThrow();
});
test("rate RPC rejects stale editors", async () => {
  await expect(
    asRole(
      "sales",
      'select revise_rate($1,\'2000-01-01\'::timestamptz,\'{"amount":1800,"change_reason":"Review"}\')',
      [rate],
    ),
  ).rejects.toThrow(/Refresh/);
});

test("reason-only rate updates cannot authorize a later silent revision", async () => {
  const row = (
    await asRole(
      "sales",
      "insert into rates(customer_id,amount,effective_date) values($1,100,current_date) returning id",
      [customer],
    )
  ).rows[0];
  await asRole("sales", "update rates set change_reason='Unused reason' where id=$1", [row.id]);
  expect(
    (await asRole("sales", "select change_reason from rates where id=$1", [row.id])).rows[0]
      .change_reason,
  ).toBeNull();
  await expect(
    asRole("sales", "update rates set amount=120 where id=$1", [row.id]),
  ).rejects.toThrow(/reason/);
  expect(
    (await asRole("sales", "select * from rate_history where rate_id=$1", [row.id])).rows,
  ).toHaveLength(0);
});

test("hosted Refused Load commercial links must match the customer in both directions", async () => {
  const opportunity = (
    await db.query(
      "insert into opportunities(customer_id,name) values($1,'Linked opportunity') returning id",
      [customer],
    )
  ).rows[0].id;
  const bid = (
    await db.query("insert into bids(customer_id,bid_name) values($1,'Linked bid') returning id", [
      customer,
    ])
  ).rows[0].id;
  for (const [column, table, id] of [
    ["opportunity_id", "opportunities", opportunity],
    ["bid_id", "bids", bid],
    ["rate_id", "rates", rate],
  ]) {
    await expect(
      asRole("sales", `insert into refused_loads(customer_id,${column}) values($1,$2)`, [
        other,
        id,
      ]),
    ).rejects.toThrow();
    await asRole("sales", `insert into refused_loads(customer_id,${column}) values($1,$2)`, [
      customer,
      id,
    ]);
    await expect(
      db.query(`update ${table} set customer_id=$1 where id=$2`, [other, id]),
    ).rejects.toThrow();
  }
});
test("rates and driver safety are restricted", async () => {
  for (const role of ["safety", "read_only", "unassigned"])
    expect((await asRole(role, "select * from rates")).rows).toHaveLength(0);
  await db.exec(
    "insert into drivers(employee_reference) values('TEST'); insert into incidents(description) values('Restricted incident');",
  );
  for (const role of ["sales", "read_only", "unassigned"]) {
    expect((await asRole(role, "select * from drivers")).rows).toHaveLength(0);
    expect((await asRole(role, "select * from incidents")).rows).toHaveLength(0);
  }
  expect(
    (await asRole("safety", "select * from drivers where employee_reference='TEST'")).rows,
  ).toHaveLength(1);
});

test("rate RPC enforces role access and failed revisions leave no history", async () => {
  const row = (
    await asRole(
      "sales",
      "insert into rates(customer_id,amount,effective_date) values($1,100,current_date) returning *",
      [customer],
    )
  ).rows[0];
  const version = (
    await db.query("select updated_at::text as version from rates where id=$1", [row.id])
  ).rows[0].version;
  for (const role of ["operations", "management", "safety", "read_only", "unassigned"]) {
    await expect(
      asRole(role, "select revise_rate($1,$2,$3::jsonb)", [
        row.id,
        version,
        JSON.stringify({ amount: 120, change_reason: "Not permitted" }),
      ]),
    ).rejects.toThrow(/restricted/);
  }
  await expect(
    asRole("sales", "select revise_rate($1,$2,$3::jsonb)", [
      row.id,
      version,
      JSON.stringify({ amount: -1, change_reason: "Invalid amount" }),
    ]),
  ).rejects.toThrow();
  expect(
    (await asRole("sales", "select amount from rates where id=$1", [row.id])).rows[0].amount,
  ).toBe("100");
  expect(
    (await asRole("sales", "select * from rate_history where rate_id=$1", [row.id])).rows,
  ).toHaveLength(0);
});
test("role management is admin-only; disabled users cannot reactivate", async () => {
  await expect(
    asRole("sales", "insert into user_roles(user_id,role) values($1,'admin')", [users.sales]),
  ).rejects.toThrow();
  await db.query("update profiles set active=false where id=$1", [users.read_only]);
  await expect(
    asRole("read_only", "update profiles set active=true where id=$1", [users.read_only]),
  ).rejects.toThrow();
  expect((await asRole("read_only", "select * from customers")).rows).toHaveLength(0);
});
test("equipment assignment history permits only one open assignment", async () => {
  const unit = (await db.query("insert into equipment(unit_number) values('TEST') returning id"))
    .rows[0].id;
  await asRole(
    "operations",
    "insert into equipment_assignments(equipment_id,customer_id,site_id,start_date) values($1,$2,$3,current_date)",
    [unit, customer, site],
  );
  await expect(
    asRole("operations", "insert into equipment_assignments(equipment_id) values($1)", [unit]),
  ).rejects.toThrow();
  expect(
    (
      await asRole("sales", "select * from current_equipment_assignments where equipment_id=$1", [
        unit,
      ])
    ).rows,
  ).toHaveLength(1);
  await asRole(
    "operations",
    "update equipment_assignments set end_date=current_date,status='Inactive' where equipment_id=$1",
    [unit],
  );
  expect(
    (
      await asRole("sales", "select * from current_equipment_assignments where equipment_id=$1", [
        unit,
      ])
    ).rows,
  ).toHaveLength(0);
});
