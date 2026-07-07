import { AppError } from '../../utils/AppError';
import { parseSSEStream } from '../../utils/sseParser';
import type { AIProvider, CompleteArgs, ProviderConfig, StreamChatArgs } from './types';

const API_URL = 'https://api.openai.com/v1/chat/completions';

async function callOpenAI(body: Record<string, unknown>, apiKey: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppError(502, 'Could not reach the OpenAI API. Check your internet connection.');
  }
  if (!res.ok) {
    const isAuth = res.status === 401 || res.status === 403;
    throw new AppError(
      isAuth ? 401 : 502,
      `OpenAI API error (${res.status}). ${isAuth ? 'Check your API key in Settings.' : 'Please try again in a moment.'}`
    );
  }
  return res;
}

function requireKey(config: ProviderConfig): string {
  if (!config.apiKey) throw new AppError(400, 'Missing OpenAI API key. Add one in Settings.');
  return config.apiKey;
}

export const openaiProvider: AIProvider = {
  async streamChat({ systemPrompt, messages, config, onToken }: StreamChatArgs) {
    const apiKey = requireKey(config);
    const res = await callOpenAI(
      {
        model: config.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
      },
      apiKey
    );
    if (!res.body) throw new AppError(502, 'No response stream from OpenAI.');

    await parseSSEStream(res.body, (data) => {
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) onToken(token as string);
      } catch {
        // Ignore malformed chunks.
      }
    });
  },

  async complete({ systemPrompt, userPrompt, config }: CompleteArgs) {
    const apiKey = requireKey(config);
    const res = await callOpenAI(
      {
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      apiKey
    );
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || '';
  },
};
