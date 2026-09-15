export const CATEGORIES = [
  'Sales',
  'Support',
  'Billing',
  'Technical',
  'Other',
] as const;

export const PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Urgent',
] as const;

export const OWNERS = [
  'Sales Team',
  'Client Success',
  'Finance',
  'Engineering',
] as const;

export const ERROR_CODES = [
  'INVALID_REQUEST',
  'OUT_OF_SCOPE',
  'AI_TIMEOUT',
  'AI_RATE_LIMITED',
  'AI_SERVICE_UNAVAILABLE',
  'AI_INVALID_OUTPUT',
  'CONFIGURATION_ERROR',
  'INTERNAL_ERROR',
] as const;

export const MIN_REQUEST_LENGTH = 1;
export const MAX_REQUEST_LENGTH = 10000;

export const DEFAULT_OWNER_BY_CATEGORY = {
  Sales: 'Sales Team',
  Support: 'Client Success',
  Billing: 'Finance',
  Technical: 'Engineering',
  Other: 'Client Success',
} as const;
