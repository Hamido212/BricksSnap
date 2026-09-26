import { afterEach, expect, it, vi } from "vitest";
import { storeApiKey, loadApiKey, clearApiKey, getPersistPreference } from "../src/lib/secure-storage";
afterEach(() => vi.unstubAllGlobals());
function memory() {
  const values = new Map<string, string>();
  return { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) };
}
it("round-trips session settings and clears keys when changing persistence", () => {
  const sessionStorage = memory(), localStorage = memory();
  vi.stubGlobal("window", { location: { origin: "http://localhost" }, sessionStorage, localStorage });
  expect(storeApiKey("fake-test-key", "openai", false, "", "", "", "gpt-4.1")).toBe(true);
  expect(loadApiKey()).toMatchObject({ key: "fake-test-key", provider: "openai", model: "gpt-4.1", persistent: false });
  expect(storeApiKey("second-test-key", "anthropic", true)).toBe(true);
  expect(sessionStorage.getItem("bs_k_p")).toBeNull();
  expect(loadApiKey()).toMatchObject({ key: "second-test-key", provider: "anthropic", persistent: true });
  clearApiKey(); expect(loadApiKey().key).toBe("");
});
it("handles denied browser storage without crashing", () => {
  vi.stubGlobal("window", { location: { origin: "http://localhost" }, get localStorage() { throw new Error("denied"); }, get sessionStorage() { throw new Error("denied"); } });
  expect(loadApiKey().key).toBe(""); expect(getPersistPreference()).toBe(false);
  expect(storeApiKey("fake", "openai", false)).toBe(false);
  expect(() => clearApiKey()).not.toThrow();
});
