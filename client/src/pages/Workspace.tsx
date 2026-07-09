import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, TriangleAlert, Link2, LoaderCircle, ChevronDown, ChevronUp,
  Terminal, FileText, Copy, Check, Eye,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSettings } from '../context/SettingsContext';
import { FileTree } from '../components/FileTree';
import { CodeEditor } from '../components/CodeEditor';
import { AIChatSidebar } from '../components/AIChatSidebar';
import { ScopeBriefCard } from '../components/ScopeBriefCard';
import {
  supportsFileSystemAccess, openLocalFolder, readFileNode, writeFileNode,
  buildTreeFromFileList, flattenFilePaths,
} from '../lib/fsAccess';
import { detectLanguage } from '../lib/languageDetect';
import { getIssue, parseIssueUrl, branchName } from '../lib/github';
import { generatePRDescription } from '../lib/ai';
import type { FSNode, OpenFile } from '../types';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded p-1.5 text-text-faint hover:bg-surface-3 hover:text-text"
    >
      {copied ? <Check size={13} className="text-diff-add" /> : <Copy size={13} />}
    </button>
  );
}

function NoIssueState() {
  const workspace = useWorkspace();
  const { settings } = useSettings();
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseIssueUrl(urlInput);
    if (!parsed) {
      setError('That doesn\u2019t look like a GitHub issue URL (e.g. https://github.com/owner/repo/issues/123)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const issue = await getIssue(parsed.owner, parsed.repo, parsed.number, settings.githubToken || undefined);
      workspace.setIssue(issue);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <h1 className="font-display text-xl font-semibold text-text">No issue selected yet</h1>
      <p className="mt-2 text-[13.5px] text-text-muted">
        Find an issue first, or paste one you already have.
      </p>
      <Link
        to="/explore"
        className="mt-5 rounded-lg bg-violet px-4 py-2 text-[13px] font-semibold text-ink hover:opacity-90"
      >
        Browse issues
      </Link>
      <div className="my-5 flex w-full items-center gap-3 text-text-faint">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px]">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a GitHub issue URL"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg border border-line px-3 text-[13px] font-medium text-text-muted hover:border-line-soft hover:text-text disabled:opacity-50"
        >
          {loading ? <LoaderCircle size={14} className="animate-spin" /> : 'Go'}
        </button>
      </form>
      {error && <p className="mt-2 text-[12px] text-diff-danger">{error}</p>}
    </div>
  );
}

export default function Workspace() {
  const workspace = useWorkspace();
  const { settings, isConfigured } = useSettings();

  const [root, setRoot] = useState<FSNode | null>(null);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [selection, setSelection] = useState('');
  const [folderError, setFolderError] = useState<string | null>(null);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [prSummary, setPrSummary] = useState('');
  const [prResult, setPrResult] = useState('');
  const [prLoading, setPrLoading] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);

  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const fsaSupported = useMemo(() => supportsFileSystemAccess(), []);

  if (!workspace.issue) {
    return <NoIssueState />;
  }
  const issue = workspace.issue;

  async function handleOpenFolder() {
    try {
      setFolderError(null);
      const node = await openLocalFolder();
      setRoot(node);
      setReadOnly(false);
      setOpenFiles([]);
      setActivePath(null);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setFolderError((err as Error).message);
    }
  }

  function handleFallbackFiles(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const node = buildTreeFromFileList(e.target.files);
    setRoot(node);
    setReadOnly(true);
    setOpenFiles([]);
    setActivePath(null);
  }

  async function handleOpenFile(node: FSNode) {
    const existing = openFiles.find((f) => f.path === node.path);
    if (existing) {
      setActivePath(node.path);
      return;
    }
    try {
      const content = await readFileNode(node);
      const language = detectLanguage(node.path);
      setOpenFiles((prev) => [...prev, { path: node.path, content, originalContent: content, language, node }]);
      setActivePath(node.path);
    } catch (err) {
      setFolderError((err as Error).message);
    }
  }

  function handleChange(path: string, content: string) {
    setOpenFiles((prev) => prev.map((f) => (f.path === path ? { ...f, content } : f)));
  }

  async function handleSave(path: string) {
    const file = openFiles.find((f) => f.path === path);
    if (!file) return;
    try {
      await writeFileNode(file.node, file.content);
      setOpenFiles((prev) => prev.map((f) => (f.path === path ? { ...f, originalContent: f.content } : f)));
    } catch (err) {
      setFolderError((err as Error).message);
    }
  }

  function handleCloseTab(path: string) {
    const remaining = openFiles.filter((f) => f.path !== path);
    setOpenFiles(remaining);
    if (activePath === path) {
      setActivePath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  }

  async function handleGeneratePr() {
    setPrLoading(true);
    setPrError(null);
    try {
      const desc = await generatePRDescription(issue, workspace.scopeBrief, prSummary, settings.provider);
      setPrResult(desc);
    } catch (err) {
      setPrError((err as Error).message);
    } finally {
      setPrLoading(false);
    }
  }

  const activeFile = openFiles.find((f) => f.path === activePath) || null;
  const codeContext = activeFile
    ? {
        activeFile: activeFile.path,
        activeFileContent: activeFile.content,
        language: activeFile.language,
        selection: selection || undefined,
        otherFiles: root ? flattenFilePaths(root).filter((p) => p !== activeFile.path) : [],
      }
    : null;

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-2">
        <Link to={`/issue/${issue.owner}/${issue.repo}/${issue.number}`} className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] text-text-faint">
            {issue.owner}/{issue.repo} #{issue.number}
          </p>
          <p className="truncate text-[13px] font-medium text-text">{issue.title}</p>
        </Link>

        {workspace.scopeBrief && (
          <button
            type="button"
            onClick={() => setScopeOpen((o) => !o)}
            className="flex shrink-0 items-center gap-1 rounded-md border border-line px-2.5 py-1 text-[12px] text-text-muted hover:text-text"
          >
            <Eye size={12} /> Scope
            {scopeOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}

        {!fsaSupported && root && (
          <span className="shrink-0 rounded-full bg-diff-attn-dim px-2.5 py-0.5 text-[11px] text-diff-attn">
            Read-only mode
          </span>
        )}

        <button
          type="button"
          onClick={fsaSupported ? handleOpenFolder : () => fallbackInputRef.current?.click()}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-surface-3 px-3 py-1.5 text-[12.5px] font-medium text-text hover:bg-line"
        >
          <FolderOpen size={14} />
          {root ? 'Open different folder' : 'Open local folder'}
        </button>
        <input
          ref={fallbackInputRef}
          type="file"
          // @ts-expect-error -- webkitdirectory is a non-standard attribute not in React's types
          webkitdirectory="true"
          multiple
          className="hidden"
          onChange={handleFallbackFiles}
        />

        <button
          type="button"
          onClick={() => setWrapUpOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] font-medium text-text-muted hover:border-line-soft hover:text-text"
        >
          <Terminal size={13} /> Wrap up
        </button>
      </div>

      {scopeOpen && workspace.scopeBrief && (
        <div className="shrink-0 border-b border-line px-4 py-3">
          <ScopeBriefCard brief={workspace.scopeBrief} />
        </div>
      )}

      {!fsaSupported && (
        <div className="shrink-0 border-b border-line bg-diff-attn-dim px-4 py-1.5 text-center text-[11.5px] text-diff-attn">
          Your browser can't save files directly (Chrome or Edge can). You can still browse and get AI help — just copy changes back to your own editor.
        </div>
      )}
      {folderError && (
        <div className="shrink-0 border-b border-line bg-diff-danger-dim px-4 py-1.5 text-center text-[11.5px] text-diff-danger">
          {folderError}
        </div>
      )}

      {/* Main 3-pane area */}
      <div className="flex min-h-0 flex-1">
        {/* File tree */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-line bg-ink">
          {root ? (
            <FileTree root={root} activePath={activePath || undefined} onOpenFile={handleOpenFile} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <FolderOpen size={20} className="text-text-faint" />
              <p className="text-[12px] text-text-faint">Open the folder you cloned to start browsing files.</p>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="min-w-0 flex-1 border-r border-line">
          <CodeEditor
            openFiles={openFiles}
            activePath={activePath}
            onSelectTab={setActivePath}
            onCloseTab={handleCloseTab}
            onChange={handleChange}
            onSave={handleSave}
            onSelectionChange={setSelection}
            readOnly={readOnly}
          />
        </div>

        {/* AI chat */}
        <div className="w-[360px] shrink-0">
          <AIChatSidebar
            issue={issue}
            scopeBrief={workspace.scopeBrief}
            codeContext={codeContext}
            provider={settings.provider}
            isConfigured={isConfigured}
          />
        </div>
      </div>

      {/* Wrap-up drawer */}
      {wrapUpOpen && (
        <div className="max-h-[45vh] shrink-0 overflow-y-auto border-t border-line bg-surface px-5 py-4">
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-text-faint">
                <Terminal size={12} /> Next steps in your terminal
              </p>
              <div className="space-y-2">
                {[
                  'git add .',
                  `git commit -m "Fix #${issue.number}: ${issue.title.slice(0, 50)}"`,
                  `git push origin ${branchName(issue.number, issue.title)}`,
                ].map((cmd) => (
                  <div key={cmd} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
                    <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-text-muted">{cmd}</code>
                    <CopyBtn text={cmd} />
                  </div>
                ))}
                <p className="text-[11.5px] text-text-faint">
                  Then open a pull request from your fork on GitHub — reference{' '}
                  <code className="rounded bg-surface-3 px-1">#{issue.number}</code> so it links automatically.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-text-faint">
                <FileText size={12} /> Draft your PR description
              </p>
              <textarea
                value={prSummary}
                onChange={(e) => setPrSummary(e.target.value)}
                placeholder="In your own words, what did you change?"
                rows={2}
                className="w-full resize-none rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12.5px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGeneratePr}
                disabled={!isConfigured || prLoading}
                className="mt-2 flex items-center gap-1.5 rounded-md bg-violet px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:opacity-90 disabled:opacity-40"
              >
                {prLoading && <LoaderCircle size={12} className="animate-spin" />}
                Generate description
              </button>
              {prError && <p className="mt-1.5 text-[11.5px] text-diff-danger">{prError}</p>}
              {prResult && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-surface-2 p-3">
                  <pre className="flex-1 whitespace-pre-wrap font-body text-[12px] text-text-muted">{prResult}</pre>
                  <CopyBtn text={prResult} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {folderError && !root && (
        <div className="flex items-center gap-2 px-4 py-2 text-[12px] text-diff-danger">
          <TriangleAlert size={13} /> {folderError}
        </div>
      )}
    </div>
  );
}
