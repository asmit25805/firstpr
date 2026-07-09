import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, File } from 'lucide-react';
import type { FSNode } from '../types';
import { isLikelyBinary } from '../lib/languageDetect';

interface Props {
  root: FSNode;
  activePath?: string;
  onOpenFile: (node: FSNode) => void;
}

export function FileTree({ root, activePath, onOpenFile }: Props) {
  return (
    <div className="select-none py-1 text-[13px]">
      {(root.children || []).map((child) => (
        <TreeNode key={child.path} node={child} depth={0} activePath={activePath} onOpenFile={onOpenFile} />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  activePath,
  onOpenFile,
}: {
  node: FSNode;
  depth: number;
  activePath?: string;
  onOpenFile: (node: FSNode) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isActive = node.path === activePath;
  const binary = node.kind === 'file' && isLikelyBinary(node.path);

  if (node.kind === 'directory') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-text-muted hover:bg-surface-2 hover:text-text"
          style={{ paddingLeft: 8 + depth * 14 }}
        >
          <ChevronRight size={12} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          {open ? <FolderOpen size={13} className="shrink-0 text-violet" /> : <Folder size={13} className="shrink-0 text-text-faint" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && (node.children || []).map((child) => (
          <TreeNode key={child.path} node={child} depth={depth + 1} activePath={activePath} onOpenFile={onOpenFile} />
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !binary && onOpenFile(node)}
      disabled={binary}
      title={binary ? 'Binary file — open it in a regular editor' : node.path}
      className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left transition-colors ${
        isActive ? 'bg-violet-dim text-violet' : 'text-text-muted hover:bg-surface-2 hover:text-text'
      } ${binary ? 'opacity-40' : ''}`}
      style={{ paddingLeft: 8 + depth * 14 + 15 }}
    >
      <File size={13} className="shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
