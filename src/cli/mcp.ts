import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "../lib/mcp-server";

// stdout belongs exclusively to MCP. No web server, credentials or .env loading.
const server = createMcpServer();
await server.connect(new StdioServerTransport());
