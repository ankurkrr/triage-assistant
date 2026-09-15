import { z } from 'zod';
import {
  CATEGORIES,
  PRIORITIES,
  OWNERS,
  ERROR_CODES,
  MIN_REQUEST_LENGTH,
  MAX_REQUEST_LENGTH,
} from './constants';

export const CategorySchema = z.enum(CATEGORIES);

export const PrioritySchema = z.enum(PRIORITIES);

export const OwnerSchema = z.enum(OWNERS);

export const ErrorCodeSchema = z.enum(ERROR_CODES);

export const TriageRequestSchema = z
  .object({
    request: z
      .string({
        required_error: 'Request is required',
        invalid_type_error: 'Request must be a string',
      })
      .trim()
      .min(MIN_REQUEST_LENGTH, 'Request cannot be empty')
      .max(MAX_REQUEST_LENGTH, 'Request is too long'),
  })
  .strict();

export const TriageResultSchema = z
  .object({
    summary: z
      .string({
        required_error: 'Summary is required',
        invalid_type_error: 'Summary must be a string',
      })
      .trim()
      .min(1, 'Summary cannot be empty'),
    category: CategorySchema,
    priority: PrioritySchema,
    priorityReason: z
      .string({
        required_error: 'Priority reason is required',
        invalid_type_error: 'Priority reason must be a string',
      })
      .trim()
      .min(1, 'Priority reason cannot be empty'),
    owner: OwnerSchema,
    draftResponse: z
      .string({
        required_error: 'Draft response is required',
        invalid_type_error: 'Draft response must be a string',
      })
      .trim()
      .min(1, 'Draft response cannot be empty'),
  })
  .strict();

export const ApiErrorSchema = z
  .object({
    code: ErrorCodeSchema,
    message: z
      .string({
        required_error: 'Error message is required',
        invalid_type_error: 'Error message must be a string',
      })
      .min(1, 'Error message cannot be empty'),
    requestId: z.string().optional(),
  })
  .strict();

export const ApiErrorResponseSchema = z
  .object({
    error: ApiErrorSchema,
  })
  .strict();
