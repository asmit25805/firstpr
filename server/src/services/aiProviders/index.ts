import { AppError } from '../../utils/AppError';
import { anthropicProvider } from './anthropic';
import { openaiProvider } from './openai';
import { geminiProvider } from './gemini';
import { ollamaProvider } from './ollama';
import type { AIProvider, ProviderName } from './types';

export function getProvider(name: ProviderName): AIProvider {
  switch (name) {
    case 'anthropic':
      return anthropicProvider;
    case 'openai':
      return openaiProvider;
    case 'gemini':
      return geminiProvider;
    case 'ollama':
      return ollamaProvider;
    default:
      throw new AppError(400, `Unknown AI provider: ${name}. Adding support for a new provider is a great first issue!`);
  }
}

export * from './types';

