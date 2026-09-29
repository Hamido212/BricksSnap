/** The local ChatGPT choice survives a reload. Only the switch and a model name: no account data. */
export type ChatGPTSettings = { enabled: boolean; model: string };

const KEY = "brickssnap_chatgpt";

export function loadChatGPTSettings(): ChatGPTSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<ChatGPTSettings> | null;
    return { enabled: saved?.enabled === true, model: typeof saved?.model === "string" ? saved.model.slice(0, 160) : "" };
  } catch { return { enabled: false, model: "" }; }
}

export function saveChatGPTSettings(settings: ChatGPTSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* Storage can be unavailable in private or restricted browsers. */ }
}
