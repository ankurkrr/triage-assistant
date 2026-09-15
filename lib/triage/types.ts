import type {
  CATEGORIES,
  PRIORITIES,
  OWNERS,
  ERROR_CODES,
} from './constants';

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Owner = (typeof OWNERS)[number];
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface TriageRequest {
  request: string;
}

export interface TriageResult {
  summary: string;
  category: Category;
  priority: Priority;
  priorityReason: string;
  owner: Owner;
  draftResponse: string;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}
