import { CheckCircle2, XCircle, FileCode2, Lightbulb, RefreshCw } from 'lucide-react';
import type { ScopeBrief } from '../types';
import { DifficultyBadge } from './DifficultyBadge';

interface Props {
  brief: ScopeBrief;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function ScopeBriefCard({ brief, onRegenerate, regenerating }: Props) {
  return (
    <div className="rounded-xl border border-violet/25 bg-violet-dim/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-violet">Scope brief</p>
          <p className="mt-1 text-[15px] leading-snug text-text">{brief.goal}</p>
        </div>
        <DifficultyBadge level={brief.difficulty} />
      </div>

      {brief.acceptanceCriteria.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[12px] font-medium text-text-muted">Done means</p>
          <ul className="space-y-1">
            {brief.acceptanceCriteria.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[13px] text-text">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-diff-add" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.outOfScope.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[12px] font-medium text-text-muted">Out of scope for this PR</p>
          <ul className="space-y-1">
            {brief.outOfScope.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[13px] text-text-muted">
                <XCircle size={14} className="mt-0.5 shrink-0 text-diff-danger" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.likelyFiles.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
            <FileCode2 size={13} /> Likely files
          </p>
          <div className="flex flex-wrap gap-1.5">
            {brief.likelyFiles.map((f) => (
              <code key={f} className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11.5px] text-text-muted">
                {f}
              </code>
            ))}
          </div>
        </div>
      )}

      {brief.concepts.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
            <Lightbulb size={13} /> Concepts worth knowing
          </p>
          <div className="flex flex-wrap gap-1.5">
            {brief.concepts.map((c) => (
              <span key={c} className="rounded-full bg-surface-3 px-2 py-0.5 text-[11.5px] text-text-muted">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="mt-4 flex items-center gap-1.5 text-[12px] text-text-faint hover:text-violet disabled:opacity-50"
        >
          <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
          {regenerating ? 'Regenerating…' : 'Regenerate brief'}
        </button>
      )}
    </div>
  );
}
