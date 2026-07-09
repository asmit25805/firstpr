// Shared types for the FirstPR client. These intentionally mirror the
// shapes the server sends back (see server/src/services/githubService.ts
// and server/src/services/systemPrompt.ts) so the two stay easy to keep in
// sync if you change one side.

export interface IssueLabel {
  name: string;
  color: string; // hex, no leading '#', as GitHub returns it
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  htmlUrl: string;
  state: string;
  owner: string;
  repo: string;
  labels: IssueLabel[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  author?: string;
  assignee?: string | null;
}

export interface SearchResult {
  items: Issue[];
  totalCount: number;
  page: number;
  perPage: number;
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

export type ProviderName = 'anthropic' | 'openai' | 'gemini' | 'ollama';

export interface ProviderConfig {
  name: ProviderName;
  apiKey?: string;
  model: string;
  baseUrl?: string; // only used by ollama
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

export interface FSNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  children?: FSNode[];
  handle?: FileSystemFileHandle;
  file?: File;
}

export interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  language: string;
  node: FSNode;
}
