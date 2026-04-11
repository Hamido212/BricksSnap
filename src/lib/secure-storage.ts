/**
 * Secure(-ish) storage wrapper for BYOK API keys.
 *
 * Browser-side BYOK apps inherently cannot offer cryptographic guarantees
 * for API keys – any JavaScript on the page can read them. This module
 * applies defense-in-depth practices so that keys are:
 *
 *   1. NEVER stored as plain text in localStorage/sessionStorage
 *   2. Obfuscated with a site-scoped XOR cipher so casual inspection /
 *      automated scrapers don't recognize the value as an API key
 *   3. Stored in sessionStorage by default (cleared on tab close)
 *   4. Optionally persisted to localStorage when the user explicitly
 *      opts in via the "Remember across sessions" toggle
 *   5. Split across two storage keys (iv + payload) so a pattern scanner
 *      looking for `sk-ant-` or `sk-` won't ever match the stored value
 *
 * This satisfies the security posture of "the key is never sitting
 * plaintext in web storage" while preserving normal BYOK UX.
 */

export type Provider = "openai" | "anthropic" | "azure" | "openrouter";

const IV_KEY = "bs_k_iv";
const PAYLOAD_KEY = "bs_k_p";
const PROVIDER_KEY = "bs_k_pv";
const PERSIST_KEY = "bs_k_persist";
const AZURE_ENDPOINT_KEY = "bs_k_aze";
const AZURE_DEPLOYMENT_KEY = "bs_k_azd";
const OPENROUTER_MODEL_KEY = "bs_k_orm";

// Derive a per-origin salt so the obfuscation is specific to this deployment.
function deriveOriginSalt(): string {
  if (typeof window === "undefined") return "brickssnap-default-salt";
  return `${window.location.origin}::brickssnap::v2`;
}

function randomIv(length = 16): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function xorCipher(text: string, key: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return out;
}

function toBase64(text: string): string {
  if (typeof window === "undefined") return Buffer.from(text, "binary").toString("base64");
  // encodeURIComponent -> unescape pattern handles any unicode safely
  return btoa(unescape(encodeURIComponent(text)));
}

function fromBase64(text: string): string {
  if (typeof window === "undefined") return Buffer.from(text, "base64").toString("binary");
  try {
    return decodeURIComponent(escape(atob(text)));
  } catch {
    return "";
  }
}

function obfuscate(value: string, iv: string): string {
  const salt = deriveOriginSalt();
  const key = `${salt}::${iv}`;
  return toBase64(xorCipher(value, key));
}

function deobfuscate(payload: string, iv: string): string {
  const salt = deriveOriginSalt();
  const key = `${salt}::${iv}`;
  const decoded = fromBase64(payload);
  if (!decoded) return "";
  return xorCipher(decoded, key);
}

function getStore(persistent: boolean): Storage | null {
  if (typeof window === "undefined") return null;
  return persistent ? window.localStorage : window.sessionStorage;
}

/**
 * Persist an API key with obfuscation.
 * @param key The raw API key
 * @param provider The AI provider name
 * @param persistent If true, survive browser restarts.
 * @param azureEndpoint Azure OpenAI endpoint URL (Azure only)
 * @param azureDeployment Azure deployment name (Azure only)
 * @param openrouterModel OpenRouter model ID (OpenRouter only)
 */
export function storeApiKey(
  key: string,
  provider: Provider,
  persistent: boolean,
  azureEndpoint?: string,
  azureDeployment?: string,
  openrouterModel?: string,
): void {
  if (typeof window === "undefined") return;

  // Clear from both stores first so switching persist mode is clean.
  clearApiKey();

  if (!key) return;

  const iv = randomIv();
  const payload = obfuscate(key, iv);
  const store = getStore(persistent);
  if (!store) return;

  store.setItem(IV_KEY, iv);
  store.setItem(PAYLOAD_KEY, payload);
  store.setItem(PROVIDER_KEY, provider);
  if (azureEndpoint) store.setItem(AZURE_ENDPOINT_KEY, azureEndpoint);
  if (azureDeployment) store.setItem(AZURE_DEPLOYMENT_KEY, azureDeployment);
  if (openrouterModel) store.setItem(OPENROUTER_MODEL_KEY, openrouterModel);
  // Remember the user's choice in localStorage so the UI can show it.
  window.localStorage.setItem(PERSIST_KEY, persistent ? "1" : "0");
}

/**
 * Retrieve a previously stored API key (checks sessionStorage then localStorage).
 */
export function loadApiKey(): {
  key: string;
  provider: Provider;
  persistent: boolean;
  azureEndpoint: string;
  azureDeployment: string;
  openrouterModel: string;
} {
  if (typeof window === "undefined") {
    return { key: "", provider: "anthropic", persistent: false, azureEndpoint: "", azureDeployment: "", openrouterModel: "" };
  }

  for (const persistent of [false, true]) {
    const store = getStore(persistent);
    if (!store) continue;
    const iv = store.getItem(IV_KEY);
    const payload = store.getItem(PAYLOAD_KEY);
    const provider = store.getItem(PROVIDER_KEY) as Provider | null;
    if (iv && payload) {
      const key = deobfuscate(payload, iv);
      return {
        key,
        provider: provider ?? "anthropic",
        persistent,
        azureEndpoint: store.getItem(AZURE_ENDPOINT_KEY) ?? "",
        azureDeployment: store.getItem(AZURE_DEPLOYMENT_KEY) ?? "",
        openrouterModel: store.getItem(OPENROUTER_MODEL_KEY) ?? "",
      };
    }
  }

  return { key: "", provider: "anthropic", persistent: false, azureEndpoint: "", azureDeployment: "", openrouterModel: "" };
}

/**
 * Remove the stored API key from both storage locations.
 */
export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  for (const store of [window.sessionStorage, window.localStorage]) {
    store.removeItem(IV_KEY);
    store.removeItem(PAYLOAD_KEY);
    store.removeItem(PROVIDER_KEY);
    store.removeItem(AZURE_ENDPOINT_KEY);
    store.removeItem(AZURE_DEPLOYMENT_KEY);
    store.removeItem(OPENROUTER_MODEL_KEY);
  }
}

/**
 * Read the persist-preference from localStorage (used for initial UI state).
 */
export function getPersistPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PERSIST_KEY) === "1";
}
