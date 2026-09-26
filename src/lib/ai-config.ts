export const PROVIDERS = ["openai", "anthropic", "azure", "openrouter"] as const;
export type AIProvider = typeof PROVIDERS[number];
export const DEFAULT_MODELS = {
  openai: "gpt-4.1",
  anthropic: "claude-sonnet-4-6",
  azure: "",
  openrouter: "openai/gpt-4.1",
};

/** Only Azure resource origins are allowed; never send keys to arbitrary URLs. */
export function azureOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash ||
      url.pathname !== "/" || !/^[a-z0-9-]+\.(openai\.azure\.com|services\.ai\.azure\.com)$/.test(url.hostname)) {
    throw new Error("Use an HTTPS Azure resource URL, e.g. https://your-resource.openai.azure.com");
  }
  return url.origin;
}
