import { useCallback, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { X, Circle, Save } from 'lucide-react';
import type { OpenFile } from '../types';

interface Props {
  openFiles: OpenFile[];
  activePath: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onChange: (path: string, content: string) => void;
  onSave: (path: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  readOnly: boolean;
}

export function CodeEditor({
  openFiles,
  activePath,
  onSelectTab,
  onCloseTab,
  onChange,
  onSave,
  onSelectionChange,
  readOnly,
}: Props) {
  const activeFile = openFiles.find((f) => f.path === activePath) || null;
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (activePath) onSave(activePath);
      });
      editor.onDidChangeCursorSelection(() => {
        const selection = editor.getSelection();
        const model = editor.getModel();
        if (selection && model && onSelectionChange) {
          onSelectionChange(model.getValueInRange(selection));
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePath]
  );

  if (openFiles.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-text-faint">
        <p className="text-[13px]">No file open yet</p>
        <p className="text-[12px]">Pick a file from the tree on the left to start editing.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 overflow-x-auto border-b border-line bg-surface">
        {openFiles.map((f) => {
          const dirty = f.content !== f.originalContent;
          const isActive = f.path === activePath;
          return (
            <div
              key={f.path}
              className={`group flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-line px-3 py-2 text-[12.5px] ${
                isActive ? 'bg-surface-2 text-text' : 'text-text-faint hover:text-text-muted'
              }`}
              onClick={() => onSelectTab(f.path)}
            >
              {dirty ? <Circle size={7} className="fill-diff-attn text-diff-attn" /> : null}
              <span className="max-w-[160px] truncate font-mono">{f.path.split('/').pop()}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(f.path);
                }}
                className="rounded opacity-0 hover:bg-surface-3 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {activeFile && (
        <div className="flex items-center justify-between border-b border-line-soft bg-surface px-3 py-1">
          <span className="truncate font-mono text-[11px] text-text-faint">{activeFile.path}</span>
          <button
            type="button"
            onClick={() => onSave(activeFile.path)}
            disabled={readOnly || activeFile.content === activeFile.originalContent}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30"
            title={readOnly ? 'Read-only mode — see the banner above' : 'Save (Ctrl/Cmd+S)'}
          >
            <Save size={12} /> Save
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1">
        {activeFile && (
          <Editor
            key={activeFile.path}
            path={activeFile.path}
            language={activeFile.language}
            value={activeFile.content}
            theme="vs-dark"
            onMount={handleMount}
            onChange={(value) => onChange(activeFile.path, value ?? '')}
            options={{
              readOnly,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12 },
              renderLineHighlight: 'gutter',
            }}
          />
        )}
      </div>
    </div>
  );
}
