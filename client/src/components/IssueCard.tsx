import { Link } from 'react-router-dom';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import type { Issue } from '../types';
import { LabelChip } from './LabelChip';
import { formatRelativeTime } from '../lib/time';

export function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link
      to={`/issue/${issue.owner}/${issue.repo}/${issue.number}`}
      className="group block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-violet/40 hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[12px] text-text-faint">
            {issue.owner}/{issue.repo} <span className="text-text-faint">#{issue.number}</span>
          </p>
          <h3 className="mt-0.5 line-clamp-2 font-display text-[15px] font-medium text-text group-hover:text-violet">
            {issue.title}
          </h3>
        </div>
        <ArrowUpRight
          size={16}
          className="mt-1 shrink-0 text-text-faint opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>

      {issue.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {issue.labels.slice(0, 4).map((label) => (
            <LabelChip key={label.name} label={label} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-[12px] text-text-faint">
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {issue.comments}
        </span>
        <span>Updated {formatRelativeTime(issue.updatedAt)}</span>
        {issue.assignee && <span className="text-diff-attn">Assigned</span>}
      </div>
    </Link>
  );
}
