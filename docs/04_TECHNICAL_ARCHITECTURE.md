# 04 — Technical Architecture

## 1. Purpose

This document translates the Product Requirements and AI Decision Specification into a practical implementation architecture for the AI Request Triage Assistant.

The architecture is intentionally small and focused on the challenge requirements:

- Accept an unstructured written business request.
- Analyze the request using an AI model.
- Return a short summary.
- Assign exactly one category.
- Assign exactly one priority with a brief reason.
- Route the request to exactly one owner.
- Draft a professional first response for review.
- Display the result clearly in a simple interface.

This document defines the system boundaries, component responsibilities, request flow, validation strategy, error handling, and implementation constraints that GitHub Copilot must follow.

---

## 2. Architectural Principles

### 2.1 Keep the prototype simple

The prototype should use one deployable application with clear logical layers rather than multiple independently deployed services.

Recommended default:

- One TypeScript application.
- One frontend interface.
- One server-side API endpoint.
- One AI service abstraction.
- One validation layer.
- No database.
- No authentication system.
- No external business-system integrations.

The architecture should be easy to run locally, easy to demonstrate, and easy to extend later.

### 2.2 Keep AI decisions structured

The AI must not return free-form prose as the primary result.

The AI response must be converted into a strict object containing only the six required fields:

1. `summary`
2. `category`
3. `priority`
4. `priority_reason`
5. `owner`
6. `draft_response`

### 2.3 Treat model output as untrusted input

Even if the model is instructed to return valid JSON, the application must assume that the output may be:

- Malformed.
- Missing fields.
- Using an invalid enum value.
- Returning multiple categories or owners.
- Containing invented claims.
- Returning excessively long text.
- Wrapped in Markdown or explanatory text.

The backend must validate the model output before returning it to the frontend.

### 2.4 Keep business rules outside the UI

The frontend must not determine category, priority, or owner.

The frontend is responsible only for:

- Collecting the request.
- Sending the request to the backend.
- Showing loading and error states.
- Rendering the validated result.
- Allowing the reviewer to edit the draft response locally.

The backend owns the decision contract and validation rules.

### 2.5 Do not perform external actions

The prototype only recommends a routing owner.

It must not:

- Send emails.
- Create tickets.
- Notify teams.
- Modify customer records.
- Remove access.
- Upload or download files.
- Call CRM, helpdesk, billing, or internal systems.

The draft response is for human review only.

---

## 3. Recommended Application Structure

Use a single full-stack TypeScript application.

A practical default is:

- Next.js for the web interface and server-side API route.
- TypeScript for end-to-end type safety.
- Zod for runtime validation.
- A provider SDK or HTTP client for the selected AI model.
- No database for the prototype.

The frontend and backend remain logically separated even though they are deployed together.

```text
Browser
  |
  | POST /api/triage
  v
Next.js Server Route
  |
  v
Request Validation
  |
  v
AI Triage Service
  |
  v
AI Provider Adapter
  |
  v
Structured Model Output
  |
  v
Schema Validation
  |
  v
Business Consistency Validation
  |
  v
Validated Triage Result
  |
  v
Browser Result UI
```

### Why this architecture

A single full-stack application is preferred because:

- The challenge does not require independent frontend and backend scaling.
- It avoids unnecessary CORS configuration.
- AI credentials remain on the server.
- The implementation is easier to run and demonstrate.
- The code can still be separated into clear modules.
- The architecture can later be split into services if required.

A separate frontend and backend may be introduced only if there is a strong implementation reason. Copilot must not create a distributed architecture by default.

---

## 4. High-Level Components

### 4.1 Frontend Interface

Responsibilities:

- Render the request input.
- Validate that the input is not empty.
- Submit the request to the backend.
- Display an analyzing state.
- Display the six returned fields.
- Allow the reviewer to edit the draft response.
- Display recoverable errors.
- Allow the reviewer to analyze another request.

The frontend must not:

- Call the AI provider directly.
- Store AI API keys.
- Implement routing logic.
- Reclassify the AI result.
- Silently modify the returned category, priority, or owner.
- Automatically send the draft response.

### 4.2 API Route

Recommended endpoint:

```text
POST /api/triage
```

Responsibilities:

1. Parse the incoming HTTP request.
2. Validate the request body.
3. Reject empty or oversized input.
4. Call the AI Triage Service.
5. Validate the AI result.
6. Return a stable API response.
7. Convert internal failures into safe user-facing errors.
8. Avoid exposing provider-specific error details or secrets.

The API route should remain thin. It should coordinate the workflow rather than contain the entire prompt or business logic.

### 4.3 AI Triage Service

Responsibilities:

- Build the system and user prompts.
- Provide the allowed categories, priorities, and owners.
- Request structured output from the model.
- Call the AI provider through an adapter.
- Return the raw structured result to the validation layer.
- Avoid external actions and side effects.

The service should not directly render UI or format HTTP responses.

### 4.4 AI Provider Adapter

Responsibilities:

- Encapsulate the selected model provider SDK or HTTP API.
- Handle provider-specific request and response formats.
- Apply model configuration.
- Apply timeout and retry behavior.
- Return a provider-neutral structured object.

This abstraction prevents the rest of the application from depending on one vendor's SDK.

Suggested interface:

```ts
interface AIProvider {
  generateTriageResult(input: string): Promise<unknown>;
}
```

The return type is intentionally `unknown` at the provider boundary because model output must be validated before being trusted.

### 4.5 Schema Validation Layer

Use runtime schemas for both incoming requests and outgoing results.

The validation layer must verify:

- Required fields exist.
- Fields contain strings.
- Strings are not empty after trimming.
- Enum values are valid.
- No required field is omitted.
- The result has exactly one category, priority, and owner.
- The response does not contain unexpected structure that the application depends on.

Recommended schemas:

- `TriageRequestSchema`
- `TriageResultSchema`
- `CategorySchema`
- `PrioritySchema`
- `OwnerSchema`

### 4.6 Business Consistency Validation

Schema validation confirms structural correctness. Business validation confirms that the result is usable and consistent.

Examples:

- A priority reason must explain the selected priority.
- The draft response must acknowledge the request without inventing a resolution.
- The owner must be one of the four allowed owners.
- A request involving an active outage should not be described as a low-impact future idea.
- A privacy or access-control exposure should not be treated as ordinary product feedback.

Business validation should be conservative.

It may reject clearly invalid output, but it should not silently rewrite every AI decision. If a decision requires changing the model's classification, that should be an explicit, documented rule rather than an arbitrary override.

---

## 5. Request and Response Contracts

### 5.1 Request contract

The frontend sends:

```json
{
  "request": "The user's unstructured business request"
}
```

Rules:

- `request` is required.
- It must be a string.
- Leading and trailing whitespace must be removed.
- Empty input must be rejected.
- A maximum input length must be enforced to prevent abuse and accidental oversized requests.

The exact maximum length should be defined as a named configuration constant rather than repeated throughout the code.

### 5.2 Response contract

The successful API response should be stable and predictable:

```json
{
  "summary": "Short summary of the request",
  "category": "Technical",
  "priority": "High",
  "priority_reason": "The issue is disrupting an important business workflow.",
  "owner": "Engineering",
  "draft_response": "Thank you for reaching out..."
}
```

The six fields must use the exact enum values defined in the AI Decision Specification.

Allowed categories:

```text
Sales
Support
Billing
Technical
Other
```

Allowed priorities:

```text
Low
Medium
High
Urgent
```

Allowed owners:

```text
Sales Team
Client Success
Finance
Engineering
```

The API must not return provider-specific metadata unless it is explicitly needed by the interface.

---

## 6. Detailed Request Flow

### Step 1 — User enters a request

The user enters a written business request in a multiline text field.

The frontend performs basic validation:

- Trim whitespace.
- Reject empty input.
- Prevent duplicate submissions while a request is being analyzed.

### Step 2 — Frontend submits the request

The frontend sends a `POST /api/triage` request containing the request text.

The frontend should not include:

- Category.
- Priority.
- Owner.
- Prompt instructions.
- Model configuration.
- API credentials.

These are controlled by the backend.

### Step 3 — Backend validates the input

The API route validates the request body.

If invalid, it returns a client error such as:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Please enter a request before analyzing."
  }
}
```

No AI call should be made when input validation fails.

### Step 4 — Backend calls the AI Triage Service

The service sends the request to the configured AI provider with:

- A system instruction defining the task.
- The allowed enum values.
- The required six-field output contract.
- Rules for priority and routing.
- Rules against invented claims.
- The user's request as the user message.

### Step 5 — AI provider returns structured output

The provider adapter returns the model output as an untrusted value.

The application must not assume that the provider's successful HTTP response means the content is valid.

### Step 6 — Application validates the result

The result passes through:

1. Runtime schema validation.
2. Required-field validation.
3. Enum validation.
4. Non-empty string validation.
5. Business consistency checks.

### Step 7 — Backend returns the validated result

Only validated data is returned to the frontend.

If validation fails, the backend returns a safe processing error. It must not send malformed model output to the browser as if it were valid.

### Step 8 — Frontend displays the result

The interface displays:

- Summary.
- Category.
- Priority.
- Priority reason.
- Owner.
- Draft response.

The draft response is editable by the reviewer.

Editing the draft does not change the AI-generated category, priority, or owner.

---

## 7. AI Output Reliability Strategy

### 7.1 Use structured output where supported

If the selected provider supports native structured output or JSON schema response formatting, use it.

The schema should define:

- Object type.
- Required fields.
- String fields.
- Enum values.
- No additional fields where supported.

Structured output reduces formatting errors, but it does not replace application-level validation.

### 7.2 Use a strict prompt

The prompt should state:

- Return only the required object.
- Use exactly one value for each enum field.
- Do not create new categories, priorities, or owners.
- Do not invent facts, timelines, resolutions, or policies.
- Base the result only on the supplied request.
- If information is missing, use cautious language.
- Keep the summary and priority reason concise.
- Draft a response that a human can review before sending.

### 7.3 Validate every response

The application must reject:

- Missing fields.
- Invalid enum values.
- Empty strings.
- Arrays where strings are expected.
- Multiple classifications.
- Markdown-wrapped JSON if it cannot be safely parsed.
- Untrusted provider error objects returned as business data.

### 7.4 Avoid blind retries

Retries should not be used to repeatedly ask the model until it produces a desired classification.

Allowed retry cases:

- Temporary network failure.
- Provider timeout.
- Rate limit response, if the provider indicates retry is appropriate.
- Transient provider availability failure.

Do not retry indefinitely.

Do not retry validation failures without a clear correction strategy.

### 7.5 Optional controlled repair

If the provider returns malformed JSON but the underlying content can be safely recovered, a controlled repair step may be considered.

For the initial prototype, the preferred behavior is simpler:

- Request structured output.
- Parse it.
- Validate it.
- Return a clear error if invalid.

A repair model or second AI call should not be added unless the first implementation demonstrates a real need.

---

## 8. Error Handling

The application should distinguish between user errors, AI/provider errors, and internal errors.

### 8.1 Client validation errors

Examples:

- Empty request.
- Request exceeds the maximum length.
- Invalid request body.

Recommended response code:

```text
400 Bad Request
```

### 8.2 Rate limiting or temporary provider failure

Examples:

- Provider rate limit.
- Temporary provider outage.
- Network timeout.

Recommended response behavior:

- Return a user-friendly retry message.
- Do not expose provider internals.
- Log the technical error server-side without secrets.

Recommended response code:

```text
429 or 503
```

### 8.3 Invalid AI output

Examples:

- Missing `owner`.
- Invalid category.
- Empty draft response.
- Model returns explanatory prose instead of the required object.

Recommended response code:

```text
502 Bad Gateway
```

The user-facing message should be:

> The AI returned an invalid result. Please try again.

The raw model output should not be displayed by default.

### 8.4 Unexpected server error

Recommended response code:

```text
500 Internal Server Error
```

The frontend should show:

> Something went wrong while analyzing the request. Please try again.

The response must not expose stack traces, API keys, provider prompts, or internal file paths.

---

## 9. Security and Privacy Boundaries

Although the challenge uses mock requests, the architecture should establish safe defaults.

### Required safeguards

- Keep AI API keys server-side.
- Never expose secrets in frontend code.
- Do not log full request text by default.
- Do not log full model responses by default.
- Do not send requests to external systems.
- Enforce a request size limit.
- Avoid storing request data in a database.
- Avoid putting sensitive request content into analytics tools.
- Do not claim that the prototype performs real access removal, incident response, billing correction, or ticket creation.

The example involving customer contact information in the wrong workspace must be treated as a triage recommendation only. The prototype must not attempt to remove access or modify permissions.

---

## 10. State Management

The frontend should use a small explicit state model.

Recommended states:

```text
idle
editing
analyzing
success
validation_error
processing_error
```

State transitions:

```text
idle → editing
editing → analyzing
analyzing → success
analyzing → processing_error
editing → validation_error
success → editing
processing_error → editing
```

The Analyze button should be disabled while the request is being processed.

The interface should preserve the entered request when an error occurs so that the user can retry without retyping it.

---

## 11. Logging and Observability

The prototype does not require a full observability platform.

Minimum server-side logging should capture:

- Request lifecycle status.
- Request duration.
- AI provider success or failure.
- Validation success or failure.
- Error category.
- A correlation or request ID.

Do not log:

- API keys.
- Authorization headers.
- Full request text by default.
- Full model output by default.
- Sensitive business information.

A useful log structure is:

```json
{
  "request_id": "generated-id",
  "event": "triage_completed",
  "duration_ms": 1820,
  "validation": "passed"
}
```

The exact logging library is less important than keeping logs structured and free of secrets.

---

## 12. Testing Strategy

### 12.1 Schema tests

Test that:

- Valid requests are accepted.
- Empty requests are rejected.
- Invalid categories are rejected.
- Invalid priorities are rejected.
- Invalid owners are rejected.
- Missing fields are rejected.
- Empty output strings are rejected.

### 12.2 AI contract tests

Use the six mock requests from the challenge as representative test inputs.

The tests should verify that the returned result:

- Contains all six fields.
- Uses only allowed enum values.
- Is displayable by the frontend.
- Does not contain additional required business fields.

The exact classification outcomes are implementation expectations documented in the AI Decision Specification. They should be tested as expected behavior after the prompt and model configuration are finalized.

### 12.3 API tests

Test:

- Successful request.
- Empty request.
- Oversized request.
- AI provider timeout.
- AI provider failure.
- Invalid AI output.
- Unexpected internal error.

### 12.4 UI tests

Test:

- Initial empty state.
- User entering a request.
- Loading state.
- Successful result display.
- Editable draft response.
- Error message display.
- Retry behavior.
- Analyze another request behavior.

---

## 13. Configuration

Configuration must be centralized.

Typical environment variables:

```text
AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
AI_REQUEST_TIMEOUT_MS=
MAX_REQUEST_LENGTH=
```

Rules:

- Environment variables must be read only on the server.
- Secrets must not be committed to source control.
- Provide a `.env.example` file with placeholder values.
- Do not hardcode API keys or provider credentials.
- Use safe defaults for timeout and input length.
- Do not make model selection configurable from the public UI.

---

## 14. Suggested Module Boundaries

A possible project structure:

```text
src/
  app/
    page.tsx
    api/
      triage/
        route.ts

  components/
    request-form.tsx
    triage-result.tsx
    error-message.tsx

  domain/
    triage-types.ts
    triage-schemas.ts
    triage-enums.ts
    triage-validation.ts

  services/
    triage-service.ts
    prompt-builder.ts
    response-builder.ts

  providers/
    ai-provider.ts
    selected-ai-provider.ts

  lib/
    config.ts
    errors.ts
    logger.ts
```

The exact framework folder structure may vary, but the responsibilities must remain separated.

Copilot must not create a large enterprise folder structure without a concrete need.

---

## 15. Explicit Non-Goals

The following must not be implemented in this prototype unless explicitly requested later:

- User authentication.
- Role-based access control.
- Persistent database storage.
- Conversation history.
- Multi-user workspaces.
- Email sending.
- Ticket creation.
- CRM integration.
- Helpdesk integration.
- Billing-system integration.
- File upload processing.
- Document retrieval.
- RAG.
- Vector database.
- Multi-agent orchestration.
- Background job queues.
- Human approval workflows beyond local draft review.
- Automatic escalation.
- Automatic access removal.
- Production-grade incident management.

---

## 16. GitHub Copilot Implementation Boundary

GitHub Copilot must follow these constraints:

1. Implement the smallest architecture that satisfies the requirements.
2. Use TypeScript throughout the application.
3. Keep AI credentials on the server.
4. Keep the AI provider behind an adapter.
5. Use runtime validation for all external input and model output.
6. Use the exact category, priority, and owner enums.
7. Do not allow the frontend to make classification decisions.
8. Do not add a database or authentication without explicit approval.
9. Do not add integrations or external actions.
10. Do not invent fields beyond the six required result fields.
11. Do not silently override AI classifications without a documented business rule.
12. Do not log sensitive request content or secrets.
13. Add tests for schemas, API behavior, and representative mock requests.
14. Keep components small and readable.
15. Prefer explicit code over unnecessary abstractions.
16. Do not introduce multiple agents, RAG, vector search, or orchestration frameworks.
17. Do not claim that the prototype performs real-world actions.
18. If a requirement is ambiguous, stop and ask for clarification rather than inventing behavior.

---

## 17. Definition of Done for the Architecture

The architecture is considered implemented when:

- The frontend can submit a written request.
- The backend validates the request.
- The backend calls the AI provider securely.
- The AI response is parsed and validated.
- Invalid model output is rejected safely.
- The API returns the six required fields.
- The frontend displays the result clearly.
- The draft response can be edited locally.
- Errors are handled without exposing internal details.
- The six mock requests can be used for testing.
- No external action is performed automatically.
- The code remains small, modular, and understandable.
