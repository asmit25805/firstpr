import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ExternalLink, LoaderCircle, Sparkles, TriangleAlert, ArrowRight } from 'lucide-react';
import { getIssue, forkUrl, cloneCommand, branchCommand } from '../lib/github';
import { generateScopeBrief } from '../lib/ai';
import type { Issue } from '../types';
import { LabelChip } from '../components/LabelChip';
import { ScopeBriefCard } from '../components/ScopeBriefCard';
import { useSettings } from '../context/SettingsContext';
import { useWorkspace } from '../context/WorkspaceContext';

function CopyButton({ text }: { text: string }) {
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
      title="Copy"
    >
      {copied ? <Check size={13} className="text-diff-add" /> : <Copy size={13} />}
    </button>
  );
}

export default function IssueDetail() {
  const { owner, repo, number } = useParams();
  const navigate = useNavigate();
  const { settings, isConfigured } = useSettings();
  const workspace = useWorkspace();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !repo || !number) return;
    setLoading(true);
    setError(null);
    getIssue(owner, repo, number, settings.githubToken || undefined)
      .then((data) => {
        setIssue(data);
        workspace.setIssue(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo, number]);

  async function handleGenerateBrief() {
    if (!issue) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const brief = await generateScopeBrief(issue, settings.provider);
      workspace.setScopeBrief(brief);
    } catch (err) {
      setBriefError((err as Error).message);
    } finally {
      setBriefLoading(false);
    }
  }

  function goToWorkspace() {
    navigate('/workspace');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-text-faint">
        <LoaderCircle size={20} className="animate-spin" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <TriangleAlert size={20} className="mx-auto text-diff-danger" />
        <p className="mt-2 text-[13.5px] text-diff-danger">{error || 'Issue not found.'}</p>
        <Link to="/explore" className="mt-4 inline-block text-[13px] text-violet hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  const showingBrief = workspace.issue?.number === issue.number && workspace.issue?.repo === issue.repo ? workspace.scopeBrief : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="font-mono text-[12.5px] text-text-faint">
        {issue.owner}/{issue.repo} #{issue.number}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold leading-snug text-text">{issue.title}</h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {issue.labels.map((l) => (
          <LabelChip key={l.name} label={l} />
        ))}
      </div>
      <a
        href={issue.htmlUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-text-faint hover:text-violet"
      >
        View on GitHub <ExternalLink size={11} />
      </a>

      <div className="prose prose-invert prose-sm mt-6 max-w-none rounded-xl border border-line bg-surface p-5 prose-headings:text-text prose-a:text-violet prose-code:rounded prose-code:bg-surface-3 prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.body || '*No description provided.*'}</ReactMarkdown>
      </div>

      {/* Fork / clone / branch instructions */}
      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <p className="font-mono text-[11px] uppercase tracking-wide text-text-faint">Get the code</p>
        <div className="mt-3 space-y-2.5">
          <a
            href={forkUrl(issue.owner, issue.repo)}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-1.5 rounded-lg bg-violet px-3.5 py-1.5 text-[13px] font-semibold text-ink hover:opacity-90"
          >
            1. Fork on GitHub <ExternalLink size={13} />
          </a>
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-text-muted">
              {cloneCommand(issue.repo, settings.githubUsername)}
            </code>
            <CopyButton text={cloneCommand(issue.repo, settings.githubUsername)} />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-text-muted">
              {branchCommand(issue.number, issue.title)}
            </code>
            <CopyButton text={branchCommand(issue.number, issue.title)} />
          </div>
          {!settings.githubUsername && (
            <p className="text-[11.5px] text-text-faint">
              Tip: add your GitHub username in Settings and this clone command will fill it in for you.
            </p>
          )}
        </div>
      </div>

      {/* Scope brief */}
      <div className="mt-6">
        {showingBrief ? (
          <ScopeBriefCard brief={showingBrief} onRegenerate={handleGenerateBrief} regenerating={briefLoading} />
        ) : (
          <div className="rounded-xl border border-dashed border-line-soft p-5 text-center">
            <Sparkles size={18} className="mx-auto text-violet" />
            <p className="mt-2 text-[13.5px] text-text-muted">
              Turn this issue into a clear, scoped brief before you start coding.
            </p>
            {!isConfigured && (
              <p className="mt-1 text-[12px] text-diff-attn">
                Set up an AI provider in <Link to="/settings" className="underline">Settings</Link> first.
              </p>
            )}
            {briefError && <p className="mt-2 text-[12px] text-diff-danger">{briefError}</p>}
            <button
              type="button"
              onClick={handleGenerateBrief}
              disabled={!isConfigured || briefLoading}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet px-4 py-2 text-[13px] font-semibold text-ink hover:opacity-90 disabled:opacity-40"
            >
              {briefLoading ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {briefLoading ? 'Reading the issue…' : 'Generate scope brief'}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={goToWorkspace}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-[14px] font-semibold text-text hover:border-violet/40 hover:text-violet"
      >
        Open Workspace <ArrowRight size={15} />
      </button>
    </div>
  );
}
