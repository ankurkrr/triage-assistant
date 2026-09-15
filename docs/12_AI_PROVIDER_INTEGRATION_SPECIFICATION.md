# Document 12 — AI Provider Integration Specification

## 1. Purpose

This document defines how the AI Request Triage Assistant communicates with an AI model.

The integration must remain:

- Small and understandable
- Provider-independent at the application level
- Strictly validated
- Easy to test
- Suitable for the Node Solutions prototype
- Free from unnecessary production infrastructure

The Node Solutions challenge does not mandate a specific AI provider, SDK, model, or framework. It requires a working AI-powered workflow that accepts a written request and returns a summary, category, priority with reason, owner, and professional draft response.

Therefore, all provider decisions in this document are implementation choices rather than direct challenge requirements.

---

## 2. Challenge Alignment

The provider integration must support the following required behavior:

1. Accept a written business request.
2. Produce a short summary.
3. Assign exactly one category:
   - Sales
   - Support
   - Billing
   - Technical
   - Other
4. Assign exactly one priority:
   - Low
   - Medium
   - High
   - Urgent
5. Provide a brief priority reason.
6. Route to exactly one owner:
   - Sales Team
   - Client Success
   - Finance
   - Engineering
7. Draft a professional first response that a team member could review and send.
8. Work for the six supplied mock requests and new requests.

The challenge also emphasizes a focused working prototype rather than a large unfinished system. The integration must therefore avoid unnecessary AI infrastructure.

---

## 3. Recommended Integration Decision

### Recommendation

Use one hosted LLM through a small internal provider adapter.

The application should not call the provider SDK directly from UI components or business logic.

Recommended logical flow:

```text
Triage API
    ↓
Triage Service
    ↓
AI Provider Adapter
    ↓
Selected LLM
    ↓
Structured Model Output
    ↓
Zod Schema Validation
    ↓
Business Validation
    ↓
Validated Triage Result
    ↓
UI
```

### Why this approach is appropriate

- A single model is sufficient for the task.
- The task is classification and drafting, not complex agent orchestration.
- A provider adapter prevents vendor-specific code from spreading through the application.
- Structured output reduces formatting errors.
- Zod validation provides a deterministic boundary after the model call.
- A mock provider allows reliable automated tests.
- The design leaves room to replace the provider later without rewriting the application.

---

## 4. Provider Selection Criteria

The selected provider should be evaluated against these criteria:

| Criterion | Requirement |
|---|---|
| Structured output | Prefer native structured-output or JSON-schema support |
| Node.js support | Must have a supported Node.js SDK or HTTP API |
| Reliability | Suitable for repeated prototype demonstrations |
| Cost | Must support low-cost or free development where possible |
| Latency | Should normally return within approximately 20–30 seconds |
| Model quality | Must handle classification, urgency judgment, routing, and professional drafting |
| Configuration | API key and model must be configurable through environment variables |
| Replaceability | Provider-specific code must be isolated in one adapter |

The challenge does not require a specific provider. The final provider should be selected based on availability, cost, response quality, and ease of integration.

---

## 5. Recommended Technical Boundary

Create a provider-neutral interface.

```ts
export interface AiProvider {
  generateTriageResult(input: {
    systemPrompt: string;
    userRequest: string;
  }): Promise<unknown>;
}
```

### Important design rule

The provider returns `unknown` or an equivalent untrusted result.

The provider adapter must not be treated as the final source of truth. All model output must pass through application-level validation.

The Triage Service is responsible for:

- Supplying the prompt
- Calling the provider
- Receiving the raw result
- Validating the result
- Applying business-level checks
- Returning only a valid `TriageResult`

---

## 6. Suggested Provider Implementations

The application should support two implementations:

### 6.1 Real provider

Used for:

- Manual demonstrations
- Real AI behavior
- Testing prompt quality
- Evaluating new requests

Responsibilities:

- Call the selected LLM
- Pass the system and user instructions
- Request structured output where supported
- Convert provider-specific failures into application errors
- Return the raw model result for validation

### 6.2 Mock provider

Used for:

- Unit tests
- API tests
- Offline development
- Deterministic failure testing
- Testing UI behavior without API costs

The mock provider must implement the same `AiProvider` interface.

It must not require the rest of the application to know whether the real or mock provider is being used.

---

## 7. Configuration

Use environment variables for provider configuration.

Example:

```env
AI_PROVIDER=openai
AI_MODEL=<selected-model>
AI_API_KEY=<server-side-api-key>
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=1
```

For local deterministic testing:

```env
AI_PROVIDER=mock
```

### Configuration rules

- Never hardcode API keys.
- Never expose API keys to browser code.
- Never prefix server-only secrets with a client-exposed environment variable convention.
- Do not commit `.env` files containing secrets.
- Provide `.env.example` with placeholder values only.
- Validate required configuration at server startup or before the first provider call.
- Use safe defaults for timeout and retry count.
- Do not make temperature a required application setting unless the selected provider requires it.

---

## 8. Model Request Contract

The provider adapter should receive only the information needed for triage.

```ts
type ProviderInput = {
  systemPrompt: string;
  userRequest: string;
};
```

The provider request must not include:

- Private customer records
- External database contents
- CRM information
- Email history
- Authentication tokens
- Unrelated application state
- Hidden internal implementation details

For this challenge, the only expected input is the written mock request entered by the user.

---

## 9. Structured Output Requirements

The model should be instructed to return a single JSON object matching the application schema.

Expected structure:

```json
{
  "summary": "Short summary of the request.",
  "category": "Technical",
  "priority": "Urgent",
  "priorityReason": "The client portal has been unavailable since this morning and staff cannot access active customer records.",
  "owner": "Engineering",
  "draftResponse": "Thank you for reporting this. We understand that the portal is currently unavailable..."
}
```

### Required fields

- `summary`
- `category`
- `priority`
- `priorityReason`
- `owner`
- `draftResponse`

### Validation rules

After receiving the model response:

1. Parse the provider response.
2. Validate it with the shared Zod schema.
3. Reject missing fields.
4. Reject invalid enum values.
5. Reject empty strings.
6. Reject unexpected structure.
7. Apply business validation.
8. Return the validated result only.

The model response must never be rendered directly without validation.

---

## 10. Native Structured Output and Fallback

### Preferred behavior

If the selected provider supports structured output or JSON schema enforcement, use it.

This reduces:

- Markdown-wrapped JSON
- Extra commentary
- Missing fields
- Invalid enum values
- Inconsistent formatting

### Fallback behavior

If native structured output is not available:

1. Explicitly instruct the model to return JSON only.
2. Parse the response as JSON.
3. Validate it with Zod.
4. If parsing or validation fails, return a controlled `AI_INVALID_OUTPUT` error.
5. Do not attempt complex heuristic extraction from arbitrary prose.

A failed structured response should be treated as a model integration failure, not silently repaired into a potentially incorrect result.

---

## 11. Timeout Policy

The provider call should have a bounded timeout.

Recommended prototype default:

```text
30 seconds
```

The timeout must be configurable through `AI_TIMEOUT_MS`.

### Timeout behavior

If the provider exceeds the timeout:

- Abort the request if the SDK supports cancellation.
- Return a stable application error.
- Show a clear message in the UI.
- Allow the user to retry.
- Do not display partial or fabricated results.

Suggested error code:

```ts
AI_TIMEOUT
```

---

## 12. Retry Policy

Use a minimal retry policy.

Recommended default:

```text
Maximum retries: 1
```

Retry only temporary failures such as:

- Network interruption
- Provider rate limiting
- Temporary provider availability errors
- Gateway or server errors

Do not retry:

- Invalid API key
- Invalid request payload
- Invalid model name
- Malformed provider configuration
- Invalid model output
- User input validation failures

Every retry must remain bounded so that the UI does not appear frozen.

---

## 13. Provider Error Mapping

Provider-specific errors must be converted into stable internal errors.

Suggested mapping:

| Provider condition | Internal error |
|---|---|
| Missing API key | `AI_CONFIGURATION_ERROR` |
| Invalid model configuration | `AI_CONFIGURATION_ERROR` |
| Authentication failure | `AI_AUTHENTICATION_ERROR` |
| Rate limit | `AI_RATE_LIMITED` |
| Timeout | `AI_TIMEOUT` |
| Temporary provider outage | `AI_PROVIDER_UNAVAILABLE` |
| Malformed model output | `AI_INVALID_OUTPUT` |
| Unknown provider failure | `AI_PROVIDER_ERROR` |

The UI should not expose raw provider stack traces, API keys, request headers, or internal SDK details.

---

## 14. Triage Service Responsibilities

The Triage Service should:

1. Validate the incoming user request.
2. Load the versioned system prompt.
3. Call the configured provider.
4. Parse the raw provider result.
5. Validate it with the shared schema.
6. Apply business validation.
7. Return a typed `TriageResult`.
8. Convert failures into stable application errors.

The Triage Service should not:

- Render UI
- Read directly from browser state
- Contain provider-specific SDK calls
- Persist data
- Send emails
- Call CRM systems
- Route requests to real teams
- Make external business commitments

---

## 15. Mock Provider Design

The mock provider should support deterministic behavior.

Example interface:

```ts
export class MockAiProvider implements AiProvider {
  async generateTriageResult(input: {
    systemPrompt: string;
    userRequest: string;
  }): Promise<unknown> {
    // Return deterministic test output.
  }
}
```

The mock provider should support:

- Valid successful output
- Invalid category
- Missing field
- Malformed JSON
- Provider timeout simulation
- Provider failure simulation

Tests must be able to inject the provider rather than depending on environment-specific behavior.

---

## 16. Provider Factory

Use a small factory to select the provider.

```ts
export function createAiProvider(): AiProvider {
  switch (process.env.AI_PROVIDER) {
    case "mock":
      return new MockAiProvider();

    case "openai":
      return new OpenAiProvider();

    default:
      throw new Error("Unsupported AI provider");
  }
}
```

The exact provider name may change based on the final implementation decision.

The factory must be the only location responsible for selecting the concrete provider.

---

## 17. Security Requirements

For this prototype:

- Keep the API key server-side.
- Do not expose provider credentials in client bundles.
- Do not log complete prompts or user requests unnecessarily.
- Do not send real client information.
- Use only the supplied mock requests and newly entered fictional requests.
- Do not store requests permanently.
- Do not add external integrations.
- Do not allow model output to execute code.
- Treat user input as untrusted text.
- Treat model output as untrusted data until validated.
- Do not allow prompt instructions inside the user request to override the system task.

The provider integration must not create any capability to send emails, modify records, or perform external actions.

---

## 18. Observability for the Prototype

Use lightweight logging only.

Useful metadata:

- Request start time
- Request completion time
- Total latency
- Provider name
- Model name, if safe to log
- Success or failure
- Stable internal error code
- Retry count

Avoid logging:

- API keys
- Full confidential content
- Raw provider headers
- Full model prompts in production-like logs
- Unvalidated model output containing user data

For local development, a concise server log is sufficient.

---

## 19. Testing Requirements

### Unit tests

Test:

- Provider factory selection
- Mock provider success
- Mock provider failure
- Provider error mapping
- Timeout handling
- Retry behavior
- Invalid provider configuration

### Triage service tests

Test:

- Valid provider output
- Invalid category
- Invalid priority
- Invalid owner
- Missing field
- Empty field
- Malformed JSON
- Provider timeout
- Provider unavailable
- Prompt injection-like user input

### API tests

Test:

- Valid request
- Empty request
- Missing request field
- Request that is too long
- Successful response
- Structured output failure
- Provider failure
- Stable error response

### Manual tests

Run all six supplied mock requests and verify that the result is:

- Understandable
- Consistent
- Properly categorized
- Sensibly prioritized
- Routed to one owner
- Written in a professional tone

The challenge specifically requires the solution to handle all six examples and accept new requests.

---

## 20. Acceptance Criteria

The provider integration is complete when:

- The application can call a real AI provider through an adapter.
- The UI and Triage Service do not import provider SDK code directly.
- Provider configuration is environment-based.
- API keys remain server-side.
- The model is instructed to return the required six-field structure.
- Model output is validated before reaching the UI.
- Invalid output produces a controlled error.
- Timeout behavior is bounded.
- Retry behavior is limited and predictable.
- A mock provider exists.
- Provider failures can be tested without calling the real model.
- The six mock requests can be processed successfully.
- No unnecessary database, agent framework, RAG, or external integration is introduced.

---

## 21. Copilot Implementation Prompt

Use the following prompt with GitHub Copilot:

> Implement Document 12 — AI Provider Integration Specification for the AI Request Triage Assistant.
>
> Requirements:
>
> 1. Create a provider-neutral `AiProvider` interface.
> 2. Create a real provider adapter using the selected Node.js AI SDK.
> 3. Create a deterministic mock provider implementing the same interface.
> 4. Add a provider factory selected by `AI_PROVIDER`.
> 5. Keep all provider-specific SDK imports inside the provider adapter.
> 6. Use environment variables for provider name, model, API key, timeout, and retry count.
> 7. Never expose the API key to client-side code.
> 8. Request structured JSON output from the model where supported.
> 9. Treat provider output as untrusted and validate it using the shared Zod schema.
> 10. Convert provider-specific failures into stable internal error codes.
> 11. Implement a bounded timeout of approximately 30 seconds.
> 12. Allow at most one retry for transient failures.
> 13. Do not retry configuration errors, authentication errors, invalid input, or invalid model output.
> 14. Do not add a database, authentication, RAG, agents, queues, CRM integration, email integration, or persistent storage.
> 15. Add unit tests for provider selection, mock behavior, invalid output, timeout, retry, and error mapping.
> 16. Keep the implementation small, typed, readable, and consistent with the existing project structure.
>
> Before coding, inspect the existing contracts and service interfaces. Reuse existing types and schemas rather than creating duplicate definitions. Do not invent additional product requirements.

---

## 22. Final Design Principle

The AI provider is an implementation dependency, not the product architecture.

The product should remain understandable even if the model changes:

```text
User Request
    ↓
Triage Service
    ↓
Provider Adapter
    ↓
Validated Triage Result
    ↓
User Interface
```

The model provides judgment and drafting assistance. The application remains responsible for structure, validation, error handling, and predictable behavior.
