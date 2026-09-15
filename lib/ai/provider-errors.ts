import type { ErrorCode } from '../triage/types';

export class ProviderError extends Error {
  public readonly code: ErrorCode;

  constructor(message: string, code: ErrorCode = 'AI_SERVICE_UNAVAILABLE') {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(message = 'The AI analysis request timed out.') {
    super(message, 'AI_TIMEOUT');
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderConfigurationError extends ProviderError {
  constructor(message = 'Invalid AI provider configuration.') {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ProviderConfigurationError';
  }
}

export function mapProviderErrorToCode(error: unknown): ErrorCode {
  if (error instanceof ProviderError) {
    return error.code;
  }
  return 'INTERNAL_ERROR';
}
