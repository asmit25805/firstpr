import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, CheckCircle2, XCircle, LoaderCircle, ChevronDown, GitFork, Info } from 'lucide-react';
import { useSettings, PROVIDER_INFO, MODEL_CHOICES } from '../context/SettingsContext';
import type { ProviderName } from '../types';
import { testConnection } from '../lib/ai';

const PROVIDER_ORDER: ProviderName[] = ['anthropic', 'openai', 'gemini', 'ollama'];

export default function Settings() {
  const { settings, updateProvider, setProviderName, updateGithub } = useSettings();
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const info = PROVIDER_INFO[settings.provider.name];
  const modelChoices = MODEL_CHOICES[settings.provider.name];

  async function handleTest() {
    setTestState('loading');
    setTestMessage('');
    try {
      const result = await testConnection(settings.provider);
      setTestState('ok');
      setTestMessage(result.reply || 'Connected.');
    } catch (err) {
      setTestState('error');
      setTestMessage((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-text">Settings</h1>
      <p className="mt-1.5 text-[13.5px] text-text-muted">
        Your API key is stored only in this browser's local storage. It's sent to your own local server
        and from there straight to the provider you pick — never anywhere else.
      </p>

      {/* Provider picker */}
      <div className="mt-8">
        <p className="mb-2 text-[12px] font-medium text-text-faint">AI provider</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROVIDER_ORDER.map((name) => {
            const p = PROVIDER_INFO[name];
            const active = settings.provider.name === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setProviderName(name);
                  setTestState('idle');
                }}
                className={`rounded-xl border p-3.5 text-left transition-colors ${
                  active ? 'border-violet bg-violet-dim/40' : 'border-line bg-surface hover:border-line-soft'
                }`}
              >
                <p className={`text-[13.5px] font-semibold ${active ? 'text-violet' : 'text-text'}`}>{p.label}</p>
                <p className="mt-1 text-[12px] leading-snug text-text-muted">{p.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* API key */}
      {info.needsKey && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-medium text-text-faint">API key</label>
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[12px] text-violet hover:underline"
            >
              Get a key <ExternalLink size={11} />
            </a>
          </div>
          <div className="relative mt-1.5">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.provider.apiKey || ''}
              onChange={(e) => {
                updateProvider({ apiKey: e.target.value });
                setTestState('idle');
              }}
              placeholder="sk-…"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 pr-10 font-mono text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      )}

      {!info.needsKey && (
        <div className="mt-6">
          <label className="text-[12px] font-medium text-text-faint">Ollama server URL</label>
          <input
            value={settings.provider.baseUrl || ''}
            onChange={(e) => {
              updateProvider({ baseUrl: e.target.value });
              setTestState('idle');
            }}
            placeholder="http://localhost:11434"
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
          />
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-text-faint">
            <Info size={13} className="mt-0.5 shrink-0" />
            Install Ollama, then run <code className="rounded bg-surface-3 px-1">ollama pull {settings.provider.model}</code> before your
            first chat.
          </p>
        </div>
      )}

      {/* Model */}
      <div className="mt-5">
        <label className="text-[12px] font-medium text-text-faint">Model</label>
        <select
          value={settings.provider.model}
          onChange={(e) => {
            updateProvider({ model: e.target.value });
            setTestState('idle');
          }}
          className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-text focus:border-violet focus:outline-none"
        >
          {modelChoices.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value={settings.provider.model} hidden={modelChoices.some((m) => m.value === settings.provider.model)}>
            {settings.provider.model} (custom)
          </option>
        </select>
        <button
          type="button"
          onClick={() => {
            const custom = window.prompt('Enter a custom model name', settings.provider.model);
            if (custom) {
              updateProvider({ model: custom });
              setTestState('idle');
            }
          }}
          className="mt-1.5 text-[11.5px] text-text-faint hover:text-violet"
        >
          Use a different model name
        </button>
      </div>

      {/* Test connection */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={testState === 'loading' || (info.needsKey && !settings.provider.apiKey)}
          className="flex items-center gap-1.5 rounded-lg bg-violet px-4 py-2 text-[13px] font-semibold text-ink hover:opacity-90 disabled:opacity-40"
        >
          {testState === 'loading' && <LoaderCircle size={14} className="animate-spin" />}
          Test connection
        </button>
        {testState === 'ok' && (
          <span className="flex items-center gap-1 text-[12.5px] text-diff-add">
            <CheckCircle2 size={14} /> Working
          </span>
        )}
        {testState === 'error' && (
          <span className="flex items-center gap-1 text-[12.5px] text-diff-danger">
            <XCircle size={14} /> {testMessage}
          </span>
        )}
      </div>

      {/* GitHub (advanced) */}
      <div className="mt-10 border-t border-line pt-6">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-text"
        >
          <GitFork size={15} />
          GitHub preferences (optional)
          <ChevronDown size={13} className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        </button>

        {advancedOpen && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[12px] font-medium text-text-faint">Your GitHub username</label>
              <input
                value={settings.githubUsername}
                onChange={(e) => updateGithub({ githubUsername: e.target.value })}
                placeholder="octocat"
                className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
              />
              <p className="mt-1 text-[11.5px] text-text-faint">Used only to pre-fill the git clone command with your fork's URL.</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-text-faint">
                GitHub personal access token{' '}
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet hover:underline"
                >
                  (create one)
                </a>
              </label>
              <input
                type="password"
                value={settings.githubToken}
                onChange={(e) => updateGithub({ githubToken: e.target.value })}
                placeholder="ghp_… (optional)"
                className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
              />
              <p className="mt-1 text-[11.5px] text-text-faint">
                Only raises your GitHub API rate limit for searching issues. No scopes are required — a
                read-only, no-permission token is enough. Never used to write to GitHub on your behalf.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
