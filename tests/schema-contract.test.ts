import { expect, test } from "vitest";
import { schemaContract } from "../scripts/schema-contract.mjs";

const schema = (row: string, insert = "id?: string") =>
  `export type Database = {public:{Tables:{example:{Row:{${row}},Insert:{${insert}},Update:{id?:string},Relationships:[]}}}};`;

test("schema check detects changed foreign-key targets", () => {
  const original = schema("id:string");
  const related = original.replace(
    "Relationships:[]",
    'Relationships:[{foreignKeyName:"self_fk";columns:["id"];referencedRelation:"example";referencedColumns:["id"]}]',
  );
  expect(schemaContract(original)).not.toEqual(schemaContract(related));
});

test("schema check ignores formatting while detecting missing columns and nullability", () => {
  const original = schema("id:string; note:string|null");
  expect(schemaContract(original)).toEqual(
    schemaContract(schema("note: null | string; id: string")),
  );
  expect(schemaContract(original)).not.toEqual(schemaContract(schema("id:string")));
  expect(schemaContract(original)).not.toEqual(schemaContract(schema("id:string;note:string")));
  expect(schemaContract(original)).not.toEqual(
    schemaContract(schema("id:string;note:string|null", "id:string")),
  );
});

test("only database-confirmed generated write columns are ignored", () => {
  const original = schema("id:string;computed:string|null");
  const hosted = schema("id:string;computed:string|null", "id?:string;computed?:string|null");
  expect(schemaContract(original)).not.toEqual(schemaContract(hosted));
  expect(schemaContract(original, ["example.computed"])).toEqual(
    schemaContract(hosted, ["example.computed"]),
  );
});
