/** Escape untrusted JSON before adding our own syntax markup. */
export function syntaxHighlight(json: string): string {
  const escaped = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/("(?:\\.|[^"\\])*"\s*:?)|\b(true|false|null)\b|(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
    const cls = match.startsWith('"') ? (match.endsWith(":") ? "key" : "string") : match === "null" ? "null" : /true|false/.test(match) ? "boolean" : "number";
    return `<span class="json-${cls}">${match}</span>`;
  });
}
