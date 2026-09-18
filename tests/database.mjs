import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";

export async function createDatabase({
  hostedRefusedLoads = false,
  beforeStabilization,
  beforeMigration,
} = {}) {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to authenticated,anon,service_role;
    grant execute on function auth.uid() to authenticated,anon,service_role;
  `);
  for (const name of (await readdir("supabase/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    if (hostedRefusedLoads && name === "20260909202500_refused_loads.sql") continue;
    try {
      await beforeMigration?.(db, name);
      if (name === "20260914160000_architecture_stabilization.sql") await beforeStabilization?.(db);
      await db.exec(await readFile(`supabase/migrations/${name}`, "utf8"));
    } catch (error) {
      await db.close();
      throw new Error(`${name}: ${error.message}`, { cause: error });
    }
  }
  return db;
}
