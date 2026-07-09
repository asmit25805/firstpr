import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ProviderConfig, ProviderName } from '../types';

const STORAGE_KEY = 'firstpr.settings.v1';

// Kept current as of July 2026 — see README.md > Choosing an AI Provider
// for the reasoning behind each pick and links to verify current pricing.
export const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-5.5',
  gemini: 'gemini-3.5-flash',
  ollama: 'qwen2.5-coder:7b',
};

export const MODEL_CHOICES: Record<ProviderName, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 — balanced, recommended default' },
    { value: 'claude-opus-4-8', label: 'Claude Opus 4.8 — most capable, higher cost' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — fastest, cheapest' },
  ],
  openai: [
    { value: 'gpt-5.5', label: 'GPT-5.5 — flagship reasoning + coding' },
    { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini — cheaper, faster' },
  ],
  gemini: [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash — GA, strong coding, recommended default' },
    { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite — cheapest, high volume' },
  ],
  ollama: [
    { value: 'qwen2.5-coder:7b', label: 'qwen2.5-coder:7b — runs on most laptops (~5GB)' },
    { value: 'qwen3-coder:30b', label: 'qwen3-coder:30b — needs a 24GB+ GPU or 32GB Mac' },
    { value: 'gpt-oss:20b', label: 'gpt-oss:20b — good all-rounder, ~16GB RAM' },
  ],
};

export const PROVIDER_INFO: Record<ProviderName, { label: string; needsKey: boolean; keyUrl: string; blurb: string }> = {
  anthropic: {
    label: 'Anthropic (Claude)',
    needsKey: true,
    keyUrl: 'https://console.anthropic.com/settings/keys',
    blurb: 'Excellent at explaining reasoning, not just producing answers — a good fit for a tool built around teaching.',
  },
  openai: {
    label: 'OpenAI (GPT)',
    needsKey: true,
    keyUrl: 'https://platform.openai.com/api-keys',
    blurb: 'Strong general coding ability and very widely used, with a large community of examples.',
  },
  gemini: {
    label: 'Google (Gemini)',
    needsKey: true,
    keyUrl: 'https://aistudio.google.com/apikey',
    blurb: 'Has the most generous free tier of the three hosted options — a good no-cost starting point.',
  },
  ollama: {
    label: 'Ollama (runs on your PC)',
    needsKey: false,
    keyUrl: 'https://ollama.com/download',
    blurb: 'Completely free and fully private — your code never leaves your machine. Needs decent hardware for larger models.',
  },
};

interface Settings {
  provider: ProviderConfig;
  githubUsername: string;
  githubToken: string;
}

const DEFAULT_SETTINGS: Settings = {
  provider: { name: 'anthropic', apiKey: '', model: DEFAULT_MODELS.anthropic },
  githubUsername: '',
  githubToken: '',
};

interface SettingsContextValue {
  settings: Settings;
  updateProvider: (partial: Partial<ProviderConfig>) => void;
  setProviderName: (name: ProviderName) => void;
  updateGithub: (partial: Partial<{ githubUsername: string; githubToken: string }>) => void;
  isConfigured: boolean;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      provider: { ...DEFAULT_SETTINGS.provider, ...parsed.provider },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateProvider = (partial: Partial<ProviderConfig>) => {
    setSettings((s) => ({ ...s, provider: { ...s.provider, ...partial } }));
  };

  const setProviderName = (name: ProviderName) => {
    setSettings((s) => ({
      ...s,
      provider: {
        name,
        apiKey: name === s.provider.name ? s.provider.apiKey : '',
        model: DEFAULT_MODELS[name],
        baseUrl: name === 'ollama' ? s.provider.baseUrl || 'http://localhost:11434' : undefined,
      },
    }));
  };

  const updateGithub = (partial: Partial<{ githubUsername: string; githubToken: string }>) => {
    setSettings((s) => ({ ...s, ...partial }));
  };

  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  const isConfigured =
    settings.provider.name === 'ollama'
      ? Boolean(settings.provider.model)
      : Boolean(settings.provider.apiKey && settings.provider.model);

  return (
    <SettingsContext.Provider
      value={{ settings, updateProvider, setProviderName, updateGithub, isConfigured, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
