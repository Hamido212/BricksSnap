import { mkdir, writeFile } from "node:fs/promises";

// Refresh the compact native control registry from Bricks' published schema.
// No credentials, website connection, or runtime network dependency required.
const origin = "https://academy.bricksbuilder.io";
const index = await (await fetch(`${origin}/developer/schema/`)).text();
const paths = [...new Set([...index.matchAll(/href="(\/developer\/schema\/elements\/[^"#]+)"/g)].map(m => m[1]))].filter(p => !p.includes("/common/"));
if (paths.length < 100) throw new Error("Bricks schema index changed; refusing an incomplete registry.");
const elements = {};
const versions = new Set();
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < paths.length) {
    const path = paths[next++];
    const page = await (await fetch(origin + path)).text();
    const match = page.match(/href="([^" ]*schema-resolved[^" ]+\.json)"/);
    if (!match) throw new Error(`No published JSON schema at ${path}`);
    const url = new URL(match[1], origin);
    if (url.origin !== origin) throw new Error("Unexpected schema origin");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Schema request failed: ${path}`);
    const schema = await response.json();
    if (!schema.metadata?.name || !schema.settings) throw new Error(`Unexpected schema structure: ${path}`);
    versions.add(schema.schemaVersion);
    elements[schema.metadata.name] = { label: schema.title, category: schema.metadata.category, controls: Object.keys(schema.settings).sort() };
  }
}));
const common = elements.div.controls.filter(key => Object.values(elements).every(element => element.controls.includes(key)));
for (const element of Object.values(elements)) element.controls = element.controls.filter(key => !common.includes(key));
await mkdir("src/data", { recursive: true });
await writeFile("src/data/bricks-schema.json", JSON.stringify({ source: `${origin}/developer/schema/`, schemaVersions: [...versions].sort(), checkedAt: new Date().toISOString().slice(0, 10), commonControls: common, elements: Object.fromEntries(Object.entries(elements).sort(([a], [b]) => a.localeCompare(b))) }, null, 2) + "\n");
console.log(`Synced ${Object.keys(elements).length} native elements; schema ${[...versions].join(", ")}.`);
