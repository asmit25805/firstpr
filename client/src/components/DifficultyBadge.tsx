import type { Difficulty } from '../types';

const STYLES: Record<Difficulty, string> = {
  beginner: 'bg-diff-add-dim text-diff-add border-diff-add/30',
  intermediate: 'bg-diff-attn-dim text-diff-attn border-diff-attn/30',
  advanced: 'bg-diff-danger-dim text-diff-danger border-diff-danger/30',
};

const LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner-friendly',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function DifficultyBadge({ level }: { level: Difficulty }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STYLES[level]}`}>
      {LABELS[level]}
    </span>
  );
}
