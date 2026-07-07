import { AppError } from '../../utils/AppError';
import { parseSSEStream } from '../../utils/sseParser';
import type { AIProvider, CompleteArgs, ProviderConfig, StreamChatArgs } from './types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MAX_TOKENS = 2048;

async function callAnthropic(body: Record<string, unknown>, apiKey: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppError(502, 'Could not reach the Anthropic API. Check your internet connection.');
  }
  if (!res.ok) {
    const isAuth = res.status === 401 || res.status === 403;
    throw new AppError(
      isAuth ? 401 : 502,
      `Anthropic API error (${res.status}). ${isAuth ? 'Check your API key in Settings.' : 'Please try again in a moment.'}`
    );
  }
  return res;
}

function requireKey(config: ProviderConfig): string {
  if (!config.apiKey) throw new AppError(400, 'Missing Anthropic API key. Add one in Settings.');
  return config.apiKey;
}

export const anthropicProvider: AIProvider = {
  async streamChat({ systemPrompt, messages, config, onToken }: StreamChatArgs) {
    const apiKey = requireKey(config);
    const res = await callAnthropic(
      {
        model: config.model,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      },
      apiKey
    );
    if (!res.body) throw new AppError(502, 'No response stream from Anthropic.');

    await parseSSEStream(res.body, (data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          onToken(parsed.delta.text as string);
        }
      } catch {
        // Ignore non-JSON keepalive/ping lines.
      }
    });
  },

  async complete({ systemPrompt, userPrompt, config }: CompleteArgs) {
    const apiKey = requireKey(config);
    const res = await callAnthropic(
      {
        model: config.model,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      },
      apiKey
    );
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const textBlock = data.content?.find((b) => b.type === 'text');
    return textBlock?.text || '';
  },
};
