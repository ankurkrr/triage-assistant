export interface AiProviderInput {
  systemPrompt: string;
  userRequest: string;
}

export interface AiProvider {
  readonly name: string;
  generateTriageResult(input: AiProviderInput): Promise<unknown>;
}
