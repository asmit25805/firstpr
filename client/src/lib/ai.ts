import type { ChatMessage, Issue, ProviderConfig, ScopeBrief } from '../types';

const BASE = '/api/ai';

export interface CodeContextPayload {
  activeFile?: string;
  activeFileContent?: string;
  language?: string;
  selection?: string;
  otherFiles?: string[];
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function generateScopeBrief(issue: Issue, provider: ProviderConfig): Promise<ScopeBrief> {
  const res = await fetch(`${BASE}/scope-brief`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ issue, provider }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function testConnection(provider: ProviderConfig): Promise<{ ok: boolean; reply: string }> {
  const res = await fetch(`${BASE}/test-connection`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function generatePRDescription(
  issue: Issue,
  scopeBrief: ScopeBrief | null,
  summary: string,
  provider: ProviderConfig
): Promise<string> {
  const res = await fetch(`${BASE}/pr-description`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ issue, scopeBrief, summary, provider }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.description as string;
}

export async function streamChat(
  args: {
    issue: Issue;
    scopeBrief: ScopeBrief | null;
    codeContext: CodeContextPayload | null;
    messages: ChatMessage[];
    provider: ProviderConfig;
  },
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      issue: args.issue,
      scopeBrief: args.scopeBrief,
      codeContext: args.codeContext,
      messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
      provider: args.provider,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(await readError(res));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value, { stream: true }));
  }
}
