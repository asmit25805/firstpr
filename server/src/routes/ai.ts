import { Router, type Request } from 'express';
import { generateScopeBrief, type RawIssueInput } from '../services/scopeBrief';
import { buildTutorSystemPrompt, type CodeContext, type IssueContext, type ScopeBrief } from '../services/systemPrompt';
import { getProvider } from '../services/aiProviders';
import type { ChatMessage, ProviderConfig } from '../services/aiProviders/types';
import { AppError } from '../utils/AppError';

export const aiRouter = Router();

function parseProviderConfig(body: Request['body']): ProviderConfig {
  const provider = body?.provider;
  if (!provider?.name || !provider?.model) {
    throw new AppError(400, 'No AI provider is configured yet. Set one up in Settings first.');
  }
  if (!['anthropic', 'openai', 'gemini', 'ollama'].includes(provider.name)) {
    throw new AppError(400, `Unknown AI provider: ${provider.name}`);
  }
  return {
    name: provider.name,
    apiKey: provider.apiKey,
    model: provider.model,
    baseUrl: provider.baseUrl,
  };
}

aiRouter.post('/scope-brief', async (req, res, next) => {
  try {
    const config = parseProviderConfig(req.body);
    const issue = req.body?.issue as RawIssueInput | undefined;
    if (!issue) throw new AppError(400, 'Missing issue.');
    const brief = await generateScopeBrief(issue, config);
    res.json(brief);
  } catch (err) {
    next(err);
  }
});

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const config = parseProviderConfig(req.body);
    const issue = req.body?.issue as IssueContext | undefined;
    const scopeBrief = (req.body?.scopeBrief as ScopeBrief | null) ?? null;
    const codeContext = (req.body?.codeContext as CodeContext | null) ?? null;
    const messages = req.body?.messages as ChatMessage[] | undefined;

    if (!issue) throw new AppError(400, 'Missing issue.');
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new AppError(400, 'Missing chat messages.');
    }

    const systemPrompt = buildTutorSystemPrompt(issue, scopeBrief, codeContext);
    const provider = getProvider(config.name);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    let streamedAny = false;
    try {
      await provider.streamChat({
        systemPrompt,
        messages,
        config,
        onToken: (token) => {
          streamedAny = true;
          res.write(token);
        },
      });
    } catch (streamErr) {
      const message = streamErr instanceof AppError ? streamErr.publicMessage : 'The connection to the AI provider was interrupted.';
      if (!streamedAny) {
        // Nothing sent to the client yet, so a normal JSON error response is still possible.
        next(streamErr);
        return;
      }
      // Already streaming plain text — finish with a visible inline note instead.
      res.write(`\n\n_[${message}]_`);
    }
    res.end();
  } catch (err) {
    next(err);
  }
});

aiRouter.post('/pr-description', async (req, res, next) => {
  try {
    const config = parseProviderConfig(req.body);
    const issue = req.body?.issue as IssueContext | undefined;
    const scopeBrief = req.body?.scopeBrief as ScopeBrief | null | undefined;
    const summary = typeof req.body?.summary === 'string' ? req.body.summary : '';
    if (!issue) throw new AppError(400, 'Missing issue.');

    const provider = getProvider(config.name);
    const system = `You write concise, well-formatted GitHub pull request descriptions in Markdown for first-time contributors. Follow common open-source conventions: a short summary, a "Closes #<number>" line, and a brief "What I changed" list based only on what the contributor actually tells you they changed. Do not invent changes they haven't described. Keep it under 150 words.`;
    const userPrompt = `Repository: ${issue.owner}/${issue.repo}
Issue #${issue.number}: ${issue.title}
Scope goal: ${scopeBrief?.goal || issue.title}
The contributor's own summary of what they changed: """${summary || '(not provided \u2014 write a short generic placeholder they can fill in)'}"""`;

    const text = await provider.complete({ systemPrompt: system, userPrompt, config });
    res.json({ description: text });
  } catch (err) {
    next(err);
  }
});

aiRouter.post('/test-connection', async (req, res, next) => {
  try {
    const config = parseProviderConfig(req.body);
    const provider = getProvider(config.name);
    const text = await provider.complete({
      systemPrompt: 'Reply with exactly one word: OK',
      userPrompt: 'ping',
      config,
    });
    res.json({ ok: true, reply: text.trim().slice(0, 100) });
  } catch (err) {
    next(err);
  }
});
