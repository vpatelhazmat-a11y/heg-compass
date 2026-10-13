import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
const directory = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(directory, "../../src");
const fixtureData = path.resolve(directory, "fixture/data.ts");
export default defineConfig({
  root: path.resolve(directory, "fixture"),
  plugins: [
    {
      name: "offline-ui-data",
      enforce: "pre",
      resolveId(id, importer) {
        const normalized = id.replaceAll("\\", "/").replace(/\.tsx?$/, "");
        const sourcePath = source.replaceAll("\\", "/");
        if (
          id === "@/lib/data" ||
          id === "@/integrations/supabase/client" ||
          normalized === `${sourcePath}/lib/data` ||
          normalized === `${sourcePath}/integrations/supabase/client` ||
          (id === "./data" && importer?.replaceAll("\\", "/").includes("/src/lib/"))
        )
          return fixtureData;
        return null;
      },
    },
    react(),
    tailwind(),
  ],
  resolve: { alias: { "@": source } },
  server: { host: "127.0.0.1", port: 4177, strictPort: true },
  build: { outDir: path.resolve(directory, "../../.cloud-ui-build"), emptyOutDir: true },
});
