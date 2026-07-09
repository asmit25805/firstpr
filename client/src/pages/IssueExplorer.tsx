import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, TriangleAlert, Link2 } from 'lucide-react';
import { IssueFilters } from '../components/IssueFilters';
import { IssueCard } from '../components/IssueCard';
import { searchIssues, parseIssueUrl, type IssueSearchParams } from '../lib/github';
import type { Issue } from '../types';
import { useSettings } from '../context/SettingsContext';

export default function IssueExplorer() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [params, setParams] = useState<IssueSearchParams>({ label: 'good first issue', unassignedOnly: true, sort: 'updated' });
  const [items, setItems] = useState<Issue[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  async function runSearch(nextPage = 1, append = false) {
    setLoading(true);
    setError(null);
    try {
      const result = await searchIssues({ ...params, page: nextPage }, settings.githubToken || undefined);
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setTotalCount(result.totalCount);
      setPage(nextPage);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseIssueUrl(urlInput);
    if (!parsed) {
      setUrlError('That doesn\u2019t look like a GitHub issue URL (e.g. https://github.com/owner/repo/issues/123)');
      return;
    }
    setUrlError(null);
    navigate(`/issue/${parsed.owner}/${parsed.repo}/${parsed.number}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-text">Find your first issue</h1>
      <p className="mt-1.5 text-[13.5px] text-text-muted">
        Search across all of public GitHub, or jump straight to an issue you already found.
      </p>

      <form onSubmit={handleUrlSubmit} className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Already have an issue? Paste its GitHub URL…"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
          />
        </div>
        <button type="submit" className="rounded-lg border border-line px-4 text-[13px] font-medium text-text-muted hover:border-line-soft hover:text-text">
          Open
        </button>
      </form>
      {urlError && <p className="mt-1.5 text-[12px] text-diff-danger">{urlError}</p>}

      <div className="mt-6">
        <IssueFilters value={params} onChange={setParams} onSearch={() => runSearch(1, false)} loading={loading} />
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-diff-danger/30 bg-diff-danger-dim px-4 py-3 text-[13px] text-diff-danger">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!error && !loading && items.length === 0 && (
        <div className="mt-10 text-center text-[13.5px] text-text-faint">
          No open, unassigned issues matched those filters. Try a different label or language.
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>

      {loading && (
        <div className="mt-8 flex items-center justify-center gap-2 text-[13px] text-text-faint">
          <LoaderCircle size={15} className="animate-spin" /> Searching GitHub…
        </div>
      )}

      {!loading && items.length > 0 && items.length < totalCount && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => runSearch(page + 1, true)}
            className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-text-muted hover:border-line-soft hover:text-text"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
