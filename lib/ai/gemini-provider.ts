import { GoogleGenAI, Type } from '@google/genai';
import type { AiProvider, AiProviderInput } from './provider';
import {
  ProviderError,
  ProviderTimeoutError,
  ProviderConfigurationError,
} from './provider-errors';
import type { ServerConfig } from '../config';
import { TriageResultSchema } from '../triage/schemas';
import { CATEGORIES, PRIORITIES, OWNERS } from '../triage/constants';

const TRIAGE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'A concise 1-2 sentence summary of the incoming business request.',
    },
    category: {
      type: Type.STRING,
      enum: [...CATEGORIES],
      description: 'Exactly one allowed business category.',
    },
    priority: {
      type: Type.STRING,
      enum: [...PRIORITIES],
      description: 'Exactly one allowed priority rating.',
    },
    priorityReason: {
      type: Type.STRING,
      description: 'A brief, factual justification for the priority based on request evidence.',
    },
    owner: {
      type: Type.STRING,
      enum: [...OWNERS],
      description: 'Exactly one assigned operational owner team.',
    },
    draftResponse: {
      type: Type.STRING,
      description: 'A professional, reviewable first response addressed to the requester.',
    },
  },
  required: [
    'summary',
    'category',
    'priority',
    'priorityReason',
    'owner',
    'draftResponse',
  ],
};

function isTransientError(errorString: string): boolean {
  const lower = errorString.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('network') ||
    lower.includes('socket hang up')
  );
}

function mapToProviderError(err: unknown): ProviderError {
  if (err instanceof ProviderError) {
    return err;
  }

  const errString = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const lower = errString.toLowerCase();

  if (
    lower.includes('timeout') ||
    lower.includes('aborted') ||
    lower.includes('deadline')
  ) {
    return new ProviderTimeoutError('The AI analysis request timed out.');
  }

  if (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('quota')
  ) {
    return new ProviderError(
      'AI rate limit exceeded. Please try again shortly.',
      'AI_RATE_LIMITED'
    );
  }

  if (
    lower.includes('503') ||
    lower.includes('service unavailable') ||
    lower.includes('unavailable') ||
    lower.includes('capacity') ||
    lower.includes('overloaded')
  ) {
    return new ProviderError(
      'AI service is temporarily unavailable or at capacity. Please try again.',
      'AI_SERVICE_UNAVAILABLE'
    );
  }

  if (
    lower.includes('api_key') ||
    lower.includes('api key') ||
    lower.includes('unauthenticated') ||
    lower.includes('invalid_argument')
  ) {
    return new ProviderConfigurationError(
      'Invalid or missing AI provider API key configuration.'
    );
  }

  return new ProviderError(
    'An error occurred during AI analysis. Please try again.',
    'INTERNAL_ERROR'
  );
}

interface ClientInstance {
  name: string;
  client: GoogleGenAI;
}

export class GeminiAiProvider implements AiProvider {
  public readonly name = 'gemini';
  private readonly config: ServerConfig;
  private readonly clients: ClientInstance[];

  constructor(config: ServerConfig) {
    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY.trim() === '') {
      throw new ProviderConfigurationError(
        'GEMINI_API_KEY is required when AI_PROVIDER=gemini.'
      );
    }

    this.config = config;
    const clients: ClientInstance[] = [
      {
        name: 'primary',
        client: new GoogleGenAI({ apiKey: config.GEMINI_API_KEY }),
      },
    ];

    if (config.GEMINI_API_KEY1 && config.GEMINI_API_KEY1.trim() !== '') {
      clients.push({
        name: 'fallback',
        client: new GoogleGenAI({ apiKey: config.GEMINI_API_KEY1.trim() }),
      });
    }

    this.clients = clients;
  }

  async generateTriageResult(input: AiProviderInput): Promise<unknown> {
    const timeoutMs = this.config.AI_TIMEOUT_MS || 30000;
    const modelCandidates = [
      this.config.AI_MODEL,
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
    ].filter(Boolean) as string[];
    const uniqueModels = [...new Set(modelCandidates)];
    const maxRetries = Math.max(0, this.config.AI_MAX_RETRIES ?? 1);

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timeoutId: NodeJS.Timeout | undefined;

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(
              new ProviderTimeoutError(
                `The AI analysis request timed out after ${timeoutMs}ms.`
              )
            );
          }, timeoutMs);
        });

        const executionPromise = (async () => {
          let response: any;
          let lastModelError: unknown;

          for (const { client } of this.clients) {
            for (const candidate of uniqueModels) {
              try {
                response = await client.models.generateContent({
                  model: candidate,
                  contents: input.userRequest,
                  config: {
                    systemInstruction: input.systemPrompt,
                    responseMimeType: 'application/json',
                    responseSchema: TRIAGE_RESPONSE_SCHEMA,
                  },
                });
                if (response?.text) {
                  break;
                }
              } catch (modelErr: unknown) {
                lastModelError = modelErr;
                const errStr = (
                  modelErr instanceof Error ? modelErr.message : String(modelErr)
                ).toLowerCase();
                if (
                  errStr.includes('503') ||
                  errStr.includes('404') ||
                  errStr.includes('429') ||
                  errStr.includes('quota') ||
                  errStr.includes('capacity') ||
                  errStr.includes('unavailable') ||
                  errStr.includes('not_found') ||
                  errStr.includes('resource_exhausted')
                ) {
                  continue;
                }
                throw modelErr;
              }
            }
            if (response?.text) {
              break;
            }
          }

          if (!response) {
            throw (
              lastModelError ||
              new ProviderError(
                'AI service is temporarily unavailable. Please try again.',
                'AI_SERVICE_UNAVAILABLE'
              )
            );
          }

          const rawText = response.text;
          if (!rawText || rawText.trim() === '') {
            throw new ProviderError(
              'The AI model returned an empty response.',
              'AI_INVALID_OUTPUT'
            );
          }

          let parsedJson: unknown;
          try {
            parsedJson = JSON.parse(rawText);
          } catch {
            throw new ProviderError(
              'The AI model returned malformed JSON output.',
              'AI_INVALID_OUTPUT'
            );
          }

          const validation = TriageResultSchema.safeParse(parsedJson);
          if (!validation.success) {
            throw new ProviderError(
              'The AI model returned output that does not match the triage schema.',
              'AI_INVALID_OUTPUT'
            );
          }

          return validation.data;
        })();

        const result = await Promise.race([executionPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
      } catch (err: unknown) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        lastError = err;

        // Never retry validation failures, config errors, rate limits, or timeouts
        if (err instanceof ProviderError) {
          if (
            err.code === 'AI_INVALID_OUTPUT' ||
            err.code === 'CONFIGURATION_ERROR' ||
            err.code === 'AI_RATE_LIMITED' ||
            err.code === 'AI_TIMEOUT'
          ) {
            throw err;
          }
        }

        const errString = String(err);
        const shouldRetry =
          attempt < maxRetries && isTransientError(errString);

        if (!shouldRetry) {
          throw mapToProviderError(err);
        }

        // Brief delay before transient retry
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }

    throw mapToProviderError(lastError);
  }
}
