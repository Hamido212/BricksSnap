import { expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";

function structured<T>(result: unknown): T {
  if (!result || typeof result !== "object" || !("structuredContent" in result)) {
    throw new Error("Expected MCP result with structuredContent");
  }

  const content = (result as { structuredContent?: unknown }).structuredContent;

  if (content === undefined) {
    throw new Error("MCP result did not contain structuredContent");
  }

  return content as T;
}

it("runs the built CLI with real stdio discovery, generation, merge, diff and errors", async () => {
  const client = new Client({
    name: "integration-test",
    version: "1",
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve("dist/mcp-server.mjs")],
    stderr: "pipe",
  });

  try {
    await client.connect(transport);

    expect((await client.listTools()).tools).toHaveLength(8);

    const page = await client.callTool({
      name: "bricks_assemble_page",
      arguments: {
        prompt: "Studio",
        sections: ["hero", "footer"],
      },
    });

    expect(page.isError).not.toBe(true);

    const pageData = structured<{ template: unknown }>(page);
    const original = pageData.template;

    const section = await client.callTool({
      name: "bricks_generate_section",
      arguments: {
        prompt: "Studio",
        section: "features",
      },
    });

    expect(section.isError).not.toBe(true);

    const sectionData = structured<{ template: unknown }>(section);

    const merged = await client.callTool({
      name: "bricks_merge_templates",
      arguments: {
        baseline: JSON.stringify(original),
        addition: JSON.stringify(sectionData.template),
        position: "prepend",
      },
    });

    expect(merged.isError).not.toBe(true);

    const mergedData = structured<{
      template: unknown;
      diff: {
        counts: {
          added: number;
          removed: number;
          changed: number;
          moved: number;
          unchanged: number;
        };
      };
    }>(merged);

    expect(mergedData.diff).toMatchObject({
      counts: {
        removed: 0,
        changed: 0,
        moved: 0,
      },
    });

    const compared = await client.callTool({
      name: "bricks_compare_templates",
      arguments: {
        baseline: JSON.stringify(original),
        proposal: JSON.stringify(mergedData.template),
      },
    });

    expect(compared.isError).not.toBe(true);

    const comparedData = structured<typeof mergedData.diff>(compared);

    expect(comparedData).toEqual(mergedData.diff);

    const invalid = await client.callTool({
      name: "bricks_merge_templates",
      arguments: {
        baseline: "[]",
        addition: "not-json",
      },
    });

    expect(invalid.isError).toBe(true);

    expect((await client.listTools()).tools).toHaveLength(8);
  } finally {
    await client.close();
  }
}, 20_000);