export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ProviderName = 'anthropic' | 'openai' | 'gemini' | 'ollama';

export interface ProviderConfig {
  name: ProviderName;
  apiKey?: string;
  model: string;
  baseUrl?: string; // only used by ollama
}

export interface StreamChatArgs {
  systemPrompt: string;
  messages: ChatMessage[];
  config: ProviderConfig;
  onToken: (token: string) => void;
}

export interface CompleteArgs {
  systemPrompt: string;
  userPrompt: string;
  config: ProviderConfig;
}

/** Every AI provider (Anthropic, OpenAI, Gemini, Ollama) implements this same shape. */
export interface AIProvider {
  /** Streaming chat, used for the mentor conversation. */
  streamChat(args: StreamChatArgs): Promise<void>;
  /** Non-streaming single completion, used for the scope brief and PR description. */
  complete(args: CompleteArgs): Promise<string>;
}
