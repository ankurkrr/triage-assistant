import { z } from 'zod';

const ServerConfigSchema = z
  .object({
    AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
    AI_MODEL: z.string().default('gemini-3.5-flash-lite'),
    AI_API_KEY: z.string().optional().default(''),
    GEMINI_API_KEY: z.string().optional().default(''),
    GEMINI_API_KEY1: z.string().optional().default(''),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    AI_MAX_RETRIES: z.coerce.number().int().min(0).default(1),
  })
  .strict();

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export function getServerConfig(): ServerConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
  const geminiApiKey1 = process.env.GEMINI_API_KEY1 || '';

  const parsed = ServerConfigSchema.safeParse({
    AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
    AI_MODEL: process.env.AI_MODEL || 'gemini-3.5-flash-lite',
    AI_API_KEY: process.env.AI_API_KEY || '',
    GEMINI_API_KEY: geminiApiKey,
    GEMINI_API_KEY1: geminiApiKey1,
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS || '30000',
    AI_MAX_RETRIES: process.env.AI_MAX_RETRIES || '1',
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server configuration: ${parsed.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  return parsed.data;
}
