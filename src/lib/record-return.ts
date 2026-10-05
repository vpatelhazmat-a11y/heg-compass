import type { SearchSchemaInput } from "@tanstack/react-router";
export function parseRecordReturn(search: Record<string, unknown> & SearchSchemaInput) {
  return {
    returnTo:
      typeof search["returnTo"] === "string" && search["returnTo"].length <= 2000
        ? search["returnTo"]
        : undefined,
  };
}
