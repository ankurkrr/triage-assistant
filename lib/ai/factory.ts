import type { AiProvider } from './provider';
import { MockAiProvider } from './mock-provider';
import { GeminiAiProvider } from './gemini-provider';
import { ProviderConfigurationError } from './provider-errors';
import { getServerConfig } from '../config';

export function createAiProvider(): AiProvider {
  const config = getServerConfig();

  switch (config.AI_PROVIDER) {
    case 'mock':
      return new MockAiProvider();

    case 'gemini':
      if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY.trim() === '') {
        throw new ProviderConfigurationError(
          'GEMINI_API_KEY is required when AI_PROVIDER=gemini.'
        );
      }
      return new GeminiAiProvider(config);

    default:
      throw new ProviderConfigurationError(
        `Unsupported AI provider: "${config.AI_PROVIDER}". Supported providers are "mock" and "gemini".`
      );
  }
}

