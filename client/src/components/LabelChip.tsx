import type { IssueLabel } from '../types';

/** Picks readable text color (near-black or near-white) against a given hex background. */
function textColorFor(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#14161c' : '#f5f6fa';
}

export function LabelChip({ label }: { label: IssueLabel }) {
  const bg = `#${label.color}`;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
      style={{ backgroundColor: bg, color: textColorFor(label.color) }}
    >
      {label.name}
    </span>
  );
}
