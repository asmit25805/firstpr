import { AppError } from '../../utils/AppError';
import { parseNDJSONStream } from '../../utils/ndjsonParser';
import type { AIProvider, CompleteArgs, ProviderConfig, StreamChatArgs } from './types';

function baseUrl(config: ProviderConfig): string {
  return (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
}

async function callOllama(config: ProviderConfig, body: Record<string, unknown>): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl(config)}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppError(
      502,
      `Could not reach Ollama at ${baseUrl(config)}. Is it running? Try \`ollama serve\` in a terminal.`
    );
  }
  if (!res.ok) {
    throw new AppError(
      502,
      `Ollama error (${res.status}). Is the model pulled? Try: ollama pull ${config.model}`
    );
  }
  return res;
}

export const ollamaProvider: AIProvider = {
  async streamChat({ systemPrompt, messages, config, onToken }: StreamChatArgs) {
    const res = await callOllama(config, {
      model: config.model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    });
    if (!res.body) throw new AppError(502, 'No response stream from Ollama.');

    await parseNDJSONStream(res.body, (obj) => {
      const message = obj.message as { content?: string } | undefined;
      if (message?.content) onToken(message.content);
    });
  },

  async complete({ systemPrompt, userPrompt, config }: CompleteArgs) {
    const res = await callOllama(config, {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    });
    const data = (await res.json()) as { message?: { content?: string } };
    return data.message?.content || '';
  },
};
