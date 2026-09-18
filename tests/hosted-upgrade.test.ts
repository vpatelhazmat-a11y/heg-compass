import { expect, test } from "vitest";
import { createDatabase } from "./database.mjs";

test("follow-up upgrade removes unused reasons without inventing rate history", async () => {
  const db = await createDatabase({
    beforeMigration: async (db, name) => {
      if (name !== "20260918130000_stabilization_followup.sql") return;
      await db.exec(
        "insert into rates(amount,effective_date) values(100,current_date); update rates set change_reason='Left by old trigger'",
      );
      expect((await db.query("select change_reason from rates")).rows[0].change_reason).toBe(
        "Left by old trigger",
      );
    },
  });
  try {
    expect((await db.query("select amount,change_reason from rates")).rows).toEqual([
      { amount: "100", change_reason: null },
    ]);
    expect((await db.query("select * from rate_history")).rows).toHaveLength(0);
  } finally {
    await db.close();
  }
});

test("follow-up upgrade rejects existing cross-customer commercial links", async () => {
  await expect(
    createDatabase({
      beforeMigration: async (db, name) => {
        if (name !== "20260918130000_stabilization_followup.sql") return;
        await db.exec(`
        insert into customers(id,legal_name) values
        ('10000000-0000-0000-0000-000000000001','First'),
        ('10000000-0000-0000-0000-000000000002','Second');
        insert into bids(id,customer_id,bid_name) values
        ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Bid');
        insert into refused_loads(customer_id,bid_id) values
        ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001');
      `);
      },
    }),
  ).rejects.toThrow(/refused_loads_bid_id_customer_fk/);
});

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
