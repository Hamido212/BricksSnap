import { request as httpsRequest } from "node:https";
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { RequestError } from "./api-request";
import { allowPrivateWordPress, wordpressEndpointProblem, type WordPressCredentials } from "./wordpress-contract";

export function assertLocalWordPress(request: Request) {
  if (process.env.BRICKSSNAP_LOCAL_WORDPRESS !== "true") throw new RequestError("WordPress connections run locally. Start BricksSnap with npm run dev:local.", 403);
  const host = request.headers.get("host") || new URL(request.url).host;
  if (!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host)) throw new RequestError("WordPress access is restricted to this computer.", 403);
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && !forwarded.split(",").every(ip => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip.trim()))) throw new RequestError("Remote clients are not allowed.", 403);
  if (request.headers.get("origin") && request.headers.get("origin") !== `http://${host}`) throw new RequestError("Cross-origin access is not allowed.", 403);
  if (request.headers.get("x-brickssnap-local") !== "1") throw new RequestError("Local client header required.", 403);
}

export function wordpressEndpoint(value: string): URL {
  const problem = wordpressEndpointProblem(value);
  if (problem) throw new RequestError(problem);
  return new URL(value);
}

export function isPublicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === "unicast"; } catch { return false; }
}

/**
 * HTTPS only, pinned DNS address (public unless BRICKSSNAP_ALLOW_PRIVATE_WORDPRESS=true), bounded
 * response, and no credential-bearing redirects. POST carries MCP messages; DELETE ends the session.
 */
export function wordpressFetch(credentials: WordPressCredentials, signal: AbortSignal) {
  const endpoint = wordpressEndpoint(credentials.endpoint);
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (String(input) !== endpoint.href) throw new RequestError("The MCP client attempted an unexpected endpoint.", 502);
    // Request/response MCP only: no standalone server event stream (GET).
    if (!init || (init.method !== "POST" && init.method !== "DELETE")) return new Response(null, { status: 405 });
    const method = init.method;
    let addresses;
    try { addresses = await lookup(endpoint.hostname.replace(/^\[|\]$/g, ""), { all: true }); }
    catch { throw new RequestError("Could not resolve the WordPress hostname.", 502); }
    if (!addresses.length || (!allowPrivateWordPress() && addresses.some(item => !isPublicAddress(item.address)))) throw new RequestError("WordPress must resolve to public internet addresses. For a local/staging site, start BricksSnap with BRICKSSNAP_ALLOW_PRIVATE_WORDPRESS=true.", 400);
    const selected = addresses[0];
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000), ...(init.signal ? [init.signal] : [])]);
    return new Promise<Response>((resolve, reject) => {
      const headers = Object.fromEntries(new Headers(init.headers).entries());
      headers.authorization = `Basic ${Buffer.from(`${credentials.username}:${credentials.password.replace(/\s/g, "")}`).toString("base64")}`;
      headers["accept-encoding"] = "identity";
      const req = httpsRequest(endpoint, {
        method, headers, agent: false, rejectUnauthorized: true, signal: requestSignal,
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [selected]);
          else callback(null, selected.address, selected.family);
        },
      }, response => {
        const status = response.statusCode ?? 502;
        if (status >= 300 && status < 400) { response.resume(); reject(new RequestError("WordPress redirected the request. Use its final HTTPS MCP endpoint; credentials were not forwarded.", 502)); return; }
        if (status === 401 || status === 403) { response.resume(); reject(new RequestError("WordPress rejected access. Check the application password, user permissions and enabled abilities.", status)); return; }
        if (status === 404) { response.resume(); reject(new RequestError("MCP endpoint not found. Install/activate WordPress MCP Adapter and check the URL in Bricks → AI.", 502)); return; }
        if (status >= 400) { response.resume(); reject(new RequestError(`WordPress returned HTTP ${status}. Retry or check the site configuration.`, 502)); return; }
        const responseHeaders = new Headers();
        for (const key of ["content-type", "mcp-session-id", "mcp-protocol-version"]) if (typeof response.headers[key] === "string") responseHeaders.set(key, response.headers[key]);
        if ([202, 204].includes(status)) { response.resume(); resolve(new Response(null, { status, headers: responseHeaders })); return; }
        let bytes = 0;
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            response.on("data", (chunk: Buffer) => {
              bytes += chunk.length;
              if (bytes > 3_000_000) { response.destroy(new Error("Response too large")); return; }
              controller.enqueue(new Uint8Array(chunk));
            });
            response.on("end", () => controller.close());
            response.on("error", () => controller.error(new RequestError("WordPress response was interrupted or exceeded 3 MB.", 502)));
          },
          cancel() { response.destroy(); req.destroy(); },
        });
        resolve(new Response(body, { status, headers: responseHeaders }));
      });
      req.on("error", () => reject(new RequestError(requestSignal.aborted ? "WordPress request timed out or was cancelled." : "Could not establish a verified HTTPS connection to WordPress.", requestSignal.aborted ? 504 : 502)));
      if (method === "DELETE") { req.end(); return; }
      if (typeof init.body !== "string") { req.destroy(); reject(new RequestError("Invalid MCP request.", 500)); return; }
      req.end(init.body);
    });
  };
}
