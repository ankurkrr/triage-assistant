import { TriageRequestSchema, TriageResultSchema } from '@/lib/triage/schemas';
import type { ErrorCode } from '@/lib/triage/types';
import { createAiProvider } from '@/lib/ai/factory';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { ProviderError } from '@/lib/ai/provider-errors';

function createErrorResponse(code: ErrorCode, message: string, status: number): Response {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

function getStatusForErrorCode(code: ErrorCode): number {
  switch (code) {
    case 'INVALID_REQUEST':
      return 400;
    case 'OUT_OF_SCOPE':
      return 422;
    case 'AI_RATE_LIMITED':
      return 429;
    case 'AI_INVALID_OUTPUT':
      return 502;
    case 'AI_TIMEOUT':
      return 504;
    case 'AI_SERVICE_UNAVAILABLE':
      return 503;
    case 'CONFIGURATION_ERROR':
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createErrorResponse(
      'INVALID_REQUEST',
      'Please enter a valid JSON request body.',
      400
    );
  }

  const requestValidation = TriageRequestSchema.safeParse(body);
  if (!requestValidation.success) {
    const message =
      requestValidation.error.issues[0]?.message ||
      'Please enter a business request to analyze.';
    return createErrorResponse('INVALID_REQUEST', message, 400);
  }

  const { request: userRequest } = requestValidation.data;

  try {
    const provider = createAiProvider();
    const rawResult = await provider.generateTriageResult({
      systemPrompt: SYSTEM_PROMPT,
      userRequest,
    });

    const resultValidation = TriageResultSchema.safeParse(rawResult);
    if (!resultValidation.success) {
      return createErrorResponse(
        'AI_INVALID_OUTPUT',
        'The analysis could not be completed because the AI returned an invalid result. Please try again.',
        502
      );
    }

    return Response.json(resultValidation.data, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ProviderError) {
      const status = getStatusForErrorCode(error.code);
      return createErrorResponse(error.code, error.message, status);
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Something went wrong while analyzing the request. Please try again.',
      500
    );
  }
}
