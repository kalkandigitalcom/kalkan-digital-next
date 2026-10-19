// Bundles operational scripts into self-contained ESM files for the production image.
import { build } from "esbuild";

await build({
  entryPoints: { migrate: "scripts/migrate.ts", "create-admin": "scripts/create-admin.ts" },
  outdir: "dist-scripts",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
  logLevel: "info",
});
