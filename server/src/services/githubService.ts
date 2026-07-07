import { AppError } from '../utils/AppError';
import { TTLCache } from './cache';

const GITHUB_API = 'https://api.github.com';
const searchCache = new TTLCache<SearchIssuesResult>(2 * 60 * 1000); // 2 minutes
const issueCache = new TTLCache<NormalizedIssue>(5 * 60 * 1000); // 5 minutes

export interface NormalizedIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  htmlUrl: string;
  state: string;
  owner: string;
  repo: string;
  labels: { name: string; color: string }[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  author?: string;
  assignee?: string | null;
}

export interface IssueSearchParams {
  label?: string;
  language?: string;
  repo?: string; // "owner/repo"
  org?: string;
  unassignedOnly?: boolean;
  sort?: 'updated' | 'created' | 'comments';
  page?: number;
  perPage?: number;
  githubToken?: string;
}

export interface SearchIssuesResult {
  items: NormalizedIssue[];
  totalCount: number;
  page: number;
  perPage: number;
}

function buildQuery(params: IssueSearchParams): string {
  const parts: string[] = ['is:issue', 'is:open'];
  parts.push(`label:"${params.label || 'good first issue'}"`);
  if (params.language) parts.push(`language:${params.language}`);
  if (params.repo) parts.push(`repo:${params.repo}`);
  if (params.org) parts.push(`org:${params.org}`);
  if (params.unassignedOnly) parts.push('no:assignee');
  return parts.join(' ');
}

async function githubFetch(url: string, token?: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'firstpr-app',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    throw new AppError(502, 'Could not reach GitHub. Check your internet connection and try again.');
  }

  if (!res.ok) {
    if (res.status === 403) {
      throw new AppError(
        429,
        'GitHub API rate limit reached. Add a personal access token in Settings for a much higher limit, or wait a minute and try again.'
      );
    }
    if (res.status === 404) {
      throw new AppError(404, 'That issue, repo, or org was not found on GitHub.');
    }
    throw new AppError(res.status, `GitHub API error (${res.status}).`);
  }
  return res.json();
}

function normalizeIssue(raw: Record<string, any>): NormalizedIssue {
  const repoUrl: string = raw.repository_url || '';
  const match = repoUrl.match(/repos\/([^/]+)\/([^/]+)$/);
  const owner = match?.[1] || raw.__owner || '';
  const repo = match?.[2] || raw.__repo || '';
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    body: raw.body || '',
    htmlUrl: raw.html_url,
    state: raw.state,
    owner,
    repo,
    labels: (raw.labels || []).map((l: any) => ({ name: l.name, color: l.color })),
    comments: raw.comments ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    author: raw.user?.login,
    assignee: raw.assignee?.login || null,
  };
}

export async function searchIssues(params: IssueSearchParams): Promise<SearchIssuesResult> {
  const query = buildQuery(params);
  const sort = params.sort || 'updated';
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.perPage && params.perPage > 0 ? Math.min(params.perPage, 50) : 20;
  const cacheKey = JSON.stringify({ query, sort, page, perPage, hasToken: Boolean(params.githubToken) });

  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const url = `${GITHUB_API}/search/issues?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=${perPage}&page=${page}`;
  const data = (await githubFetch(url, params.githubToken || process.env.GITHUB_TOKEN)) as {
    items: Record<string, any>[];
    total_count: number;
  };

  const result: SearchIssuesResult = {
    items: (data.items || []).map(normalizeIssue),
    totalCount: data.total_count || 0,
    page,
    perPage,
  };
  searchCache.set(cacheKey, result);
  return result;
}

export async function getIssue(
  owner: string,
  repo: string,
  number: string | number,
  githubToken?: string
): Promise<NormalizedIssue> {
  const cacheKey = `${owner}/${repo}#${number}`;
  const cached = issueCache.get(cacheKey);
  if (cached) return cached;

  const url = `${GITHUB_API}/repos/${owner}/${repo}/issues/${number}`;
  const data = (await githubFetch(url, githubToken || process.env.GITHUB_TOKEN)) as Record<string, any>;
  const result = normalizeIssue({ ...data, __owner: owner, __repo: repo });
  issueCache.set(cacheKey, result);
  return result;
}
