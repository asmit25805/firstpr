import { AppError } from '../../utils/AppError';
import { parseSSEStream } from '../../utils/sseParser';
import type { AIProvider, CompleteArgs, ChatMessage, ProviderConfig, StreamChatArgs } from './types';

function endpointFor(model: string, apiKey: string, stream: boolean): string {
  const method = stream ? 'streamGenerateContent' : 'generateContent';
  const sseParam = stream ? '&alt=sse' : '';
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${apiKey}${sseParam}`;
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

function requireKey(config: ProviderConfig): string {
  if (!config.apiKey) throw new AppError(400, 'Missing Gemini API key. Add one in Settings.');
  return config.apiKey;
}

export const geminiProvider: AIProvider = {
  async streamChat({ systemPrompt, messages, config, onToken }: StreamChatArgs) {
    const apiKey = requireKey(config);
    let res: Response;
    try {
      res = await fetch(endpointFor(config.model, apiKey, true), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: toGeminiContents(messages),
        }),
      });
    } catch {
      throw new AppError(502, 'Could not reach the Gemini API. Check your internet connection.');
    }
    if (!res.ok || !res.body) {
      const isAuth = res.status === 400 || res.status === 401 || res.status === 403;
      throw new AppError(
        isAuth ? 401 : 502,
        `Gemini API error (${res.status}). ${isAuth ? 'Check your API key in Settings.' : 'Please try again in a moment.'}`
      );
    }

    await parseSSEStream(res.body, (data) => {
      try {
        const parsed = JSON.parse(data);
        const token = parsed.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('');
        if (token) onToken(token as string);
      } catch {
        // Ignore malformed chunks.
      }
    });
  },

  async complete({ systemPrompt, userPrompt, config }: CompleteArgs) {
    const apiKey = requireKey(config);
    let res: Response;
    try {
      res = await fetch(endpointFor(config.model, apiKey, false), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        }),
      });
    } catch {
      throw new AppError(502, 'Could not reach the Gemini API. Check your internet connection.');
    }
    if (!res.ok) {
      const isAuth = res.status === 400 || res.status === 401 || res.status === 403;
      throw new AppError(isAuth ? 401 : 502, `Gemini API error (${res.status}).`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  },
};
