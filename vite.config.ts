// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Public Supabase connection values only (project URL + publishable/anon key).
// These are safe in the client bundle by design; no service-role secret is referenced here.
const PUBLIC_FALLBACK = {
  url: "https://jbhnpcjqhyhtwesbkasb.supabase.co",
  publishableKey: "sb_publishable_1b-MtKAkdXEseFxs0a8jxg_qXANiLL7",
};

function fromDotEnv(key: string): string | undefined {
  for (const file of [".env", ".env.production", ".env.local"]) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && match[1] === key) return match[2].replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

function resolvePublic(viteKey: string, plainKey: string, fallback: string): string {
  return (
    process.env[viteKey] ||
    process.env[plainKey] ||
    fromDotEnv(viteKey) ||
    fromDotEnv(plainKey) ||
    fallback
  );
}

const SUPABASE_URL = resolvePublic("VITE_SUPABASE_URL", "SUPABASE_URL", PUBLIC_FALLBACK.url);
const SUPABASE_PUBLISHABLE_KEY = resolvePublic(
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  PUBLIC_FALLBACK.publishableKey,
);

export default defineConfig({
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
