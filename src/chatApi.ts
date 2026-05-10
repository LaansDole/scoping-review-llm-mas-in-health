import OpenAI from "openai";
import type { Paper, Theme, ChatConfig, ChatMessage } from "./types";

const CHAT_CONFIG_KEY = "mas-health-chat-config";

function getEnvDefaults(): ChatConfig {
  return {
    baseUrl: (typeof process !== "undefined" && process.env.CHAT_BASE_URL) || "https://api.deepseek.com",
    apiKey: (typeof process !== "undefined" && process.env.CHAT_API_KEY) || "",
    model: (typeof process !== "undefined" && process.env.CHAT_MODEL) || "deepseek-chat",
  };
}

export function loadChatConfig(): ChatConfig {
  const envDefaults = getEnvDefaults();
  try {
    const saved = localStorage.getItem(CHAT_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        baseUrl: parsed.baseUrl || envDefaults.baseUrl,
        apiKey: parsed.apiKey || envDefaults.apiKey,
        model: parsed.model || envDefaults.model,
      };
    }
  } catch {}
  return envDefaults;
}

export function saveChatConfig(config: ChatConfig): void {
  localStorage.setItem(CHAT_CONFIG_KEY, JSON.stringify(config));
}

export function buildSystemPrompt(
  papers: Paper[],
  themes: Theme[]
): string {
  const themeMap = new Map(themes.map((t) => [t.id, t.name]));
  const catalog = papers
    .map((p) => {
      const themeNames = p.themes
        .map((tid) => themeMap.get(tid) || tid)
        .join(", ");
      const tagStr = p.tags.length > 0 ? ` | Tags: ${p.tags.join(", ")}` : "";
      return `- ID: ${p.id} | Title: ${p.title} | Year: ${p.year} | Themes: ${themeNames}${tagStr}`;
    })
    .join("\n");

  return `You are a research assistant for a scoping review on LLM-based Multi-agent Systems in Healthcare. You have access to a catalog of ${papers.length} research papers.

When you mention or recommend specific papers, reference them using the exact format {{paper:paper-id}} where paper-id is the ID from the catalog. You can reference multiple papers in a single response. Always use the exact ID value.

Example: "I found several relevant papers: {{paper:some-paper-id}} discusses clinical applications, and {{paper:another-paper-id}} covers pharmacology."

Paper Catalog:
${catalog}`;
}

export async function streamChatCompletion(
  config: ChatConfig,
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const client = new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
  });

  try {
    const stream = await client.chat.completions.create({
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        onToken(token);
      }
    }
    onDone();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";
    onError(message);
  }
}
