/** Browser convenience storage. XOR obfuscation is not encryption: any same-origin
 * script can read stored keys. Session-only is the default; persistence is opt-in. */

export type Provider = "openai" | "anthropic" | "azure" | "openrouter";

const MODEL_KEY = "bs_k_model";
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
  try { return persistent ? window.localStorage : window.sessionStorage; } catch { return null; }
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
  model?: string,
): boolean {
  if (typeof window === "undefined") return false;
  try {
  // Clear from both stores first so switching persist mode is clean.
  clearApiKey();

  if (!key) return true;

  const iv = randomIv();
  const payload = obfuscate(key, iv);
  const store = getStore(persistent);
  if (!store) return false;

  store.setItem(IV_KEY, iv);
  store.setItem(PAYLOAD_KEY, payload);
  store.setItem(PROVIDER_KEY, provider);
  if (azureEndpoint) store.setItem(AZURE_ENDPOINT_KEY, azureEndpoint);
  if (azureDeployment) store.setItem(AZURE_DEPLOYMENT_KEY, azureDeployment);
  if (model) store.setItem(MODEL_KEY, model);
  if (openrouterModel) store.setItem(OPENROUTER_MODEL_KEY, openrouterModel);
  // Remember the user's choice in localStorage so the UI can show it.
  getStore(true)?.setItem(PERSIST_KEY, persistent ? "1" : "0");
  return true;
  } catch { clearApiKey(); return false; }
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
  model: string;
} {
  if (typeof window === "undefined") {
    return { key: "", provider: "openai", persistent: false, azureEndpoint: "", azureDeployment: "", openrouterModel: "", model: "" };
  }

  for (const persistent of [false, true]) {
    const store = getStore(persistent);
    if (!store) continue;
    try {
    const iv = store.getItem(IV_KEY);
    const payload = store.getItem(PAYLOAD_KEY);
    const saved = store.getItem(PROVIDER_KEY);
    const provider: Provider = saved === "anthropic" || saved === "azure" || saved === "openrouter" ? saved : "openai";
    if (iv && payload) {
      const key = deobfuscate(payload, iv);
      return {
        key,
        provider: provider ?? "openai",
        persistent,
        azureEndpoint: store.getItem(AZURE_ENDPOINT_KEY) ?? "",
        azureDeployment: store.getItem(AZURE_DEPLOYMENT_KEY) ?? "",
        model: store.getItem(MODEL_KEY) ?? "",
        openrouterModel: store.getItem(OPENROUTER_MODEL_KEY) ?? "",
      };
    }
    } catch { /* Try the other storage location. */ }
  }

  return { key: "", provider: "openai", persistent: false, azureEndpoint: "", azureDeployment: "", openrouterModel: "", model: "" };
}

/**
 * Remove the stored API key from both storage locations.
 */
export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  for (const persistent of [false, true]) {
    const store = getStore(persistent);
    if (!store) continue;
    try {
    store.removeItem(MODEL_KEY);
    store.removeItem(IV_KEY);
    store.removeItem(PAYLOAD_KEY);
    store.removeItem(PROVIDER_KEY);
    store.removeItem(AZURE_ENDPOINT_KEY);
    store.removeItem(AZURE_DEPLOYMENT_KEY);
    store.removeItem(OPENROUTER_MODEL_KEY);
    } catch { /* Storage may be denied. */ }
  }
}

/**
 * Read the persist-preference from localStorage (used for initial UI state).
 */
export function getPersistPreference(): boolean {
  if (typeof window === "undefined") return false;
  try { return getStore(true)?.getItem(PERSIST_KEY) === "1"; } catch { return false; }
}
