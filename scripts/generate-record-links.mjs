import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";
import { schemaContract } from "./schema-contract.mjs";

const schema = schemaContract(await readFile("src/integrations/supabase/types.ts", "utf8"));
const registry = await readFile("src/lib/record-registry.ts", "utf8");
const tables = new Set([...registry.matchAll(/^  (\w+): define\(/gm)].map((match) => match[1]));
const links = {};
for (const table of tables) {
  for (const relation of schema[table].Relationships) {
    if (!tables.has(relation.target)) continue;
    for (let index = 0; index < relation.columns.length; index++) {
      const column = relation.columns[index];
      if (column === "id" || column.startsWith("linked_") || relation.targetColumns[index] !== "id")
        continue;
      const children = (links[relation.target] ??= {});
      const columns = (children[table] ??= []);
      if (!columns.includes(column)) columns.push(column);
    }
  }
}
const output = await format(
  `// Generated from database foreign keys by scripts/generate-record-links.mjs.\nexport const DIRECT_RECORD_LINKS: Record<string, Record<string, string[]>> = ${JSON.stringify(links)};\n`,
  { parser: "typescript" },
);
const path = "src/lib/record-links.generated.ts";
if (process.argv.includes("--check")) {
  if ((await readFile(path, "utf8")).replace(/\r\n/g, "\n") !== output)
    throw new Error("Record links are out of date. Run node scripts/generate-record-links.mjs.");
} else await writeFile(path, output);
