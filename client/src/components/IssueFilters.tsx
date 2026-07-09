import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { IssueSearchParams } from '../lib/github';

const LABEL_OPTIONS = [
  { value: 'good first issue', display: 'Good first issue' },
  { value: 'help wanted', display: 'Help wanted' },
  { value: 'bug', display: 'Bug' },
  { value: 'documentation', display: 'Documentation' },
  { value: 'security', display: 'Security' },
  { value: 'enhancement', display: 'Enhancement' },
];

interface Props {
  value: IssueSearchParams;
  onChange: (next: IssueSearchParams) => void;
  onSearch: () => void;
  loading: boolean;
}

export function IssueFilters({ value, onChange, onSearch, loading }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(value.repo || value.org));

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        {LABEL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...value, label: opt.value })}
            className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
              value.label === opt.value
                ? 'border-violet bg-violet-dim text-violet'
                : 'border-line text-text-muted hover:border-line-soft hover:text-text'
            }`}
          >
            {opt.display}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-text-faint">Language</label>
          <input
            value={value.language || ''}
            onChange={(e) => onChange({ ...value, language: e.target.value })}
            placeholder="e.g. TypeScript"
            className="w-40 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-text-faint">Sort by</label>
          <select
            value={value.sort || 'updated'}
            onChange={(e) => onChange({ ...value, sort: e.target.value as IssueSearchParams['sort'] })}
            className="rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-text focus:border-violet focus:outline-none"
          >
            <option value="updated">Recently updated</option>
            <option value="created">Recently created</option>
            <option value="comments">Most discussed</option>
          </select>
        </div>

        <label className="flex items-center gap-2 pb-1.5 text-[13px] text-text-muted">
          <input
            type="checkbox"
            checked={value.unassignedOnly ?? true}
            onChange={(e) => onChange({ ...value, unassignedOnly: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-line accent-violet"
          />
          Unassigned only
        </label>

        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-md bg-violet px-4 py-1.5 text-[13px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Search size={14} />
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        className="mt-3 flex items-center gap-1 text-[12px] text-text-faint hover:text-text-muted"
      >
        <ChevronDown size={13} className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        Advanced: focus on one repo or org
      </button>

      {advancedOpen && (
        <div className="mt-2 flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-text-faint">Repo (owner/name)</label>
            <input
              value={value.repo || ''}
              onChange={(e) => onChange({ ...value, repo: e.target.value, org: undefined })}
              placeholder="e.g. facebook/react"
              className="w-48 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-text-faint">Organization</label>
            <input
              value={value.org || ''}
              onChange={(e) => onChange({ ...value, org: e.target.value, repo: undefined })}
              placeholder="e.g. microsoft"
              className="w-48 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
