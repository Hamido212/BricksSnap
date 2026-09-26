import { build } from "esbuild";

await build({
  entryPoints: ["src/cli/mcp.ts"],
  outfile: "dist/mcp-server.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  logLevel: "warning",
});
