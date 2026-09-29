/** Browser-side call to the local WordPress route; errors carry the HTTP status. */
export async function postWordPress<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/wordpress", { method: "POST", headers: { "Content-Type": "application/json", "X-BricksSnap-Local": "1" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "WordPress request failed."), { status: res.status });
  return data as T;
}

/** Apply and template creation refuse changes whose global classes are missing on the site. */
export const isMissingClassesError = (message: string) => /global classes that do not exist/.test(message);
