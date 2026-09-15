import { expect, test } from "vitest";
import { createDatabase } from "./database.mjs";

test("hosted Refused Loads upgrade preserves legacy fields and matches fresh schema", async () => {
  const fresh = await createDatabase();
  const hosted = await createDatabase({
    hostedRefusedLoads: true,
    beforeStabilization: async (db) => {
      await db.exec(`
        insert into customers(id,legal_name) values ('10000000-0000-0000-0000-000000000001','Upgrade fixture');
        insert into refused_loads(customer_id,load_count,internal_notes,estimated_lost_revenue,currency,record_status)
        values ('10000000-0000-0000-0000-000000000001',2,'Preserve me',750,'USD','Closed');
      `);
    },
  });
  try {
    const columns = `select table_name,column_name,data_type,is_nullable,column_default
      from information_schema.columns where table_schema='public' order by table_name,column_name`;
    expect((await hosted.query(columns)).rows).toEqual((await fresh.query(columns)).rows);
    expect(
      (
        await hosted.query(
          `select load_count,internal_notes,estimated_lost_revenue,currency,record_status from refused_loads`,
        )
      ).rows,
    ).toEqual([
      {
        load_count: 2,
        internal_notes: "Preserve me",
        estimated_lost_revenue: "750",
        currency: "USD",
        record_status: "Closed",
      },
    ]);
  } finally {
    await fresh.close();
    await hosted.close();
  }
});

test("hosted upgrade refuses fractional loads instead of rounding existing records", async () => {
  await expect(
    createDatabase({
      hostedRefusedLoads: true,
      beforeStabilization: async (db) => {
        await db.exec(`
        insert into customers(id,legal_name) values ('10000000-0000-0000-0000-000000000002','Upgrade fixture');
        insert into refused_loads(customer_id,load_count) values ('10000000-0000-0000-0000-000000000002',1.5);
      `);
      },
    }),
  ).rejects.toThrow(/refused_load_count_valid/);
});
