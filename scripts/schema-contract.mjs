import ts from "typescript";

// Lovable regenerates types.ts with Supabase's formatter and helper types.
// Compare the actual table contract, not the generator's spelling or whitespace.
export function schemaContract(source, generatedColumns = []) {
  const file = ts.createSourceFile("contract.ts", source, ts.ScriptTarget.Latest, true);
  const host = ts.createCompilerHost({ strictNullChecks: true });
  host.getSourceFile = (name) => (name === "contract.ts" ? file : undefined);
  host.writeFile = () => {};
  const program = ts.createProgram(["contract.ts"], { strictNullChecks: true, noLib: true }, host);
  const checker = program.getTypeChecker();
  const declaration = file.statements.find(
    (s) => ts.isTypeAliasDeclaration(s) && s.name.text === "Database",
  );
  if (!declaration) throw new Error("Database type is missing");
  const member = (type, name) => {
    const symbol = type.getProperty(name);
    if (!symbol) throw new Error(`Missing schema member: ${name}`);
    return checker.getTypeOfSymbolAtLocation(symbol, file);
  };
  const publicSchema = member(checker.getTypeAtLocation(declaration), "public");
  const tableTypes = member(publicSchema, "Tables");
  const tableNames = new Set(tableTypes.getProperties().map((t) => t.name));
  const normalize = (type) =>
    type.isUnion() ? type.types.map(normalize).sort().join("|") : checker.typeToString(type);
  const result = {};
  for (const table of tableTypes.getProperties().sort((a, b) => a.name.localeCompare(b.name))) {
    const record = member(tableTypes, table.name);
    result[table.name] = {};
    const relations = member(record, "Relationships");
    result[table.name].Relationships = checker
      .getTypeArguments(relations)
      .map((relation) => ({
        name: member(relation, "foreignKeyName").value,
        columns: checker.getTypeArguments(member(relation, "columns")).map((t) => t.value),
        target: member(relation, "referencedRelation").value,
        targetColumns: checker
          .getTypeArguments(member(relation, "referencedColumns"))
          .map((t) => t.value),
      }))
      // Hosted types omit auth-schema FKs and add derived view relationships.
      .filter((relation) => tableNames.has(relation.target))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    for (const mode of ["Row", "Insert", "Update"]) {
      const shape = member(record, mode);
      result[table.name][mode] = Object.fromEntries(
        shape
          .getProperties()
          .sort((a, b) => a.name.localeCompare(b.name))
          .flatMap((column) => {
            // Supabase's hosted generator currently exposes stored generated
            // columns in writes; PostgreSQL still forbids them. Validate their
            // read types, but ignore write shapes only for DB-confirmed columns.
            if (mode !== "Row" && generatedColumns.includes(`${table.name}.${column.name}`))
              return [];
            const type = member(shape, column.name);
            const normalized = normalize(type);
            // Generated columns are either omitted or represented as optional never.
            if (mode !== "Row" && (normalized === "undefined" || normalized === "never")) return [];
            return [
              [
                column.name,
                { type: normalized, optional: !!(column.flags & ts.SymbolFlags.Optional) },
              ],
            ];
          }),
      );
    }
  }
  return result;
}
