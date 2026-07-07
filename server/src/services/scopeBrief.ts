import { AppError } from '../utils/AppError';
import { getProvider } from './aiProviders';
import type { ProviderConfig } from './aiProviders/types';

export interface RawIssueInput {
  title: string;
  body: string;
  owner: string;
  repo: string;
  number: number;
  labels: { name: string }[];
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ScopeBrief {
  goal: string;
  acceptanceCriteria: string[];
  likelyFiles: string[];
  outOfScope: string[];
  difficulty: Difficulty;
  concepts: string[];
}

const SYSTEM = `You convert a raw GitHub issue into a strict JSON "scope brief" for a first-time contributor. Output ONLY valid JSON, no markdown code fences, no prose before or after. Use exactly this shape:
{
  "goal": "one or two plain-language sentences describing what needs to change",
  "acceptanceCriteria": ["short bullet", "short bullet"],
  "likelyFiles": ["paths or areas the issue text itself mentions - leave this an empty array if none are named, never guess a file path that wasn't mentioned"],
  "outOfScope": ["things a well-meaning contributor might be tempted to also do, but should NOT do in this PR"],
  "difficulty": "beginner",
  "concepts": ["relevant programming concepts a newcomer might need to look up"]
}
"difficulty" must be exactly one of: "beginner", "intermediate", "advanced".`;

function extractJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
  return JSON.parse(trimmed);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

export async function generateScopeBrief(issue: RawIssueInput, config: ProviderConfig): Promise<ScopeBrief> {
  const provider = getProvider(config.name);
  const userPrompt = `Repository: ${issue.owner}/${issue.repo}
Issue #${issue.number}: ${issue.title}
Labels: ${issue.labels.map((l) => l.name).join(', ') || 'none'}

Issue body:
"""
${issue.body || '(no description provided)'}
"""`;

  const raw = await provider.complete({ systemPrompt: SYSTEM, userPrompt, config });

  let parsed: Record<string, unknown>;
  try {
    parsed = extractJson(raw) as Record<string, unknown>;
  } catch {
    throw new AppError(
      502,
      'The AI returned something that wasn\u2019t valid JSON while building the scope brief. Try again, or try a different model.'
    );
  }

  return {
    goal: typeof parsed.goal === 'string' && parsed.goal ? parsed.goal : 'Understand and resolve the issue described above.',
    acceptanceCriteria: toStringArray(parsed.acceptanceCriteria),
    likelyFiles: toStringArray(parsed.likelyFiles),
    outOfScope: toStringArray(parsed.outOfScope),
    difficulty: isDifficulty(parsed.difficulty) ? parsed.difficulty : 'beginner',
    concepts: toStringArray(parsed.concepts),
  };
}
