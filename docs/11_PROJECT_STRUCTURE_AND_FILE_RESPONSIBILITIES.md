# 11 — Project Structure and File Responsibilities

## 1. Purpose

This document defines the recommended repository structure for the AI Request Triage Assistant.

The objective is to keep the prototype:

- Simple.
- Easy to understand.
- Easy to test.
- Easy for GitHub Copilot to modify safely.
- Consistent with the approved product and technical requirements.
- Free from unnecessary infrastructure and abstractions.

This structure supports the required workflow:

```text
User enters request
        ↓
Frontend form
        ↓
POST /api/triage
        ↓
Request validation
        ↓
Triage service
        ↓
AI provider adapter
        ↓
Output validation
        ↓
Consistency checks
        ↓
Validated result
        ↓
Frontend result display
```

---

## 2. Recommended Repository Structure

```text
ai-request-triage-assistant/
│
├── app/
│   ├── api/
│   │   └── triage/
│   │       └── route.ts
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── triage-form.tsx
│   ├── triage-result.tsx
│   ├── error-message.tsx
│   ├── loading-state.tsx
│   └── ui/
│       └── ...
│
├── lib/
│   ├── ai/
│   │   ├── provider.ts
│   │   ├── provider-errors.ts
│   │   └── prompts.ts
│   │
│   ├── triage/
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   ├── service.ts
│   │   ├── consistency.ts
│   │   └── scope.ts
│   │
│   ├── errors/
│   │   ├── codes.ts
│   │   ├── application-error.ts
│   │   └── error-response.ts
│   │
│   └── config.ts
│
├── tests/
│   ├── fixtures/
│   │   ├── challenge-requests.ts
│   │   ├── valid-requests.ts
│   │   ├── invalid-requests.ts
│   │   └── out-of-scope-requests.ts
│   │
│   ├── unit/
│   │   ├── schemas.test.ts
│   │   ├── consistency.test.ts
│   │   ├── scope.test.ts
│   │   └── service.test.ts
│   │
│   ├── integration/
│   │   └── triage-api.test.ts
│   │
│   └── e2e/
│       └── triage-flow.spec.ts
│
├── public/
│   └── ...
│
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
└── ...
```

The exact filenames may be adjusted to match the selected framework conventions, but responsibilities must remain separated.

---

## 3. Application Layer

### 3.1 `app/page.tsx`

Responsibility:

- Render the main triage page.
- Compose the form and result components.
- Manage page-level state if necessary.

Must not contain:

- AI provider calls.
- Prompt construction.
- Category logic.
- Priority logic.
- Owner routing.
- Schema validation.
- Error normalization.

The page should remain a composition layer.

---

### 3.2 `app/layout.tsx`

Responsibility:

- Define application metadata.
- Provide the global page layout.
- Load global styles or fonts if required.

Do not add:

- Authentication providers.
- Database providers.
- Analytics platforms.
- Global state libraries unless clearly necessary.

---

### 3.3 `app/globals.css`

Responsibility:

- Define global styles.
- Set basic typography.
- Define layout defaults.
- Provide accessible focus styles.
- Support responsive presentation.

Keep styling lightweight. The challenge requires a clear interface, not a design system.

---

## 4. API Layer

### 4.1 `app/api/triage/route.ts`

Responsibility:

- Accept `POST /api/triage`.
- Parse the incoming request body.
- Validate the request using the request schema.
- Call the triage service.
- Return a validated success response.
- Convert application errors into the approved API error format.
- Prevent raw exceptions from reaching the client.

The route should be thin.

Conceptual flow:

```text
HTTP request
    ↓
Parse body
    ↓
Validate request
    ↓
Call triageService
    ↓
Return success or mapped error
```

The route must not contain:

- The full system prompt.
- Business classification rules.
- Provider SDK calls.
- UI formatting logic.
- Database operations.
- Long conditional logic for categories or priorities.

---

## 5. Component Layer

### 5.1 `components/triage-form.tsx`

Responsibility:

- Render the multiline request input.
- Track the entered text.
- Submit the request to the API.
- Display client-side validation where appropriate.
- Manage loading state.
- Preserve input after errors.
- Trigger retry behavior.

Must not contain:

- AI prompts.
- Provider credentials.
- Category-to-owner mappings.
- AI output validation.
- Server-side business decisions.

---

### 5.2 `components/triage-result.tsx`

Responsibility:

- Display the validated triage result.
- Present the six required output fields clearly:
  - Summary
  - Category
  - Priority
  - Priority reason
  - Assigned team
  - Draft response

The component should assume that the backend has already validated the result.

It may apply presentation formatting, but it must not alter business values.

For example, it must not convert `"Critical"` into `"Urgent"`.

---

### 5.3 `components/error-message.tsx`

Responsibility:

- Display user-friendly error messages.
- Handle known application error codes.
- Avoid exposing raw technical details.

Example mapping:

```text
INVALID_REQUEST
→ Please enter a business request to analyze.

OUT_OF_SCOPE
→ This assistant only triages business requests.

AI_TIMEOUT
→ The analysis took too long. Please try again.

AI_SERVICE_UNAVAILABLE
→ The analysis service is temporarily unavailable.

AI_INVALID_OUTPUT
→ The analysis could not be completed. Please try again.
```

The component should not contain server-side error handling.

---

### 5.4 `components/loading-state.tsx`

Responsibility:

- Display a clear loading indicator.
- Communicate that the request is being analyzed.
- Avoid implying that an external action is being performed.

Suggested message:

> Analyzing request…

---

## 6. AI Layer

### 6.1 `lib/ai/provider.ts`

Responsibility:

- Define the provider abstraction.
- Encapsulate provider-specific SDK usage.
- Call the configured model.
- Apply timeout behavior.
- Return the raw model output or a provider-neutral result.
- Convert provider-specific failures into application-level errors.

The rest of the application should not import the provider SDK directly.

Suggested conceptual interface:

```ts
interface AiProvider {
  generateTriageOutput(input: {
    systemPrompt: string;
    userRequest: string;
  }): Promise<unknown>;
}
```

The interface may be adjusted based on the selected SDK.

---

### 6.2 `lib/ai/provider-errors.ts`

Responsibility:

- Identify provider timeout errors.
- Identify rate-limit errors.
- Identify temporary service failures.
- Identify authentication/configuration failures.
- Map provider-specific errors to stable application errors.

Do not expose raw provider messages to the frontend.

---

### 6.3 `lib/ai/prompts.ts`

Responsibility:

- Store the versioned system prompt.
- Define the approved categories.
- Define the approved priorities.
- Define the approved owners.
- Define output requirements.
- Define no-fabrication rules.
- Define out-of-scope behavior.
- Define prompt-injection resistance.

Prompt construction must be centralized.

Do not duplicate prompt text in:

- API routes.
- React components.
- Test files.
- Multiple service functions.

---

## 7. Triage Domain Layer

### 7.1 `lib/triage/types.ts`

Responsibility:

- Define TypeScript types for the triage domain.
- Define category, priority, and owner types.
- Define the validated triage result.
- Define application-facing request types.

Example conceptual types:

```ts
type Category =
  | "Sales"
  | "Support"
  | "Billing"
  | "Technical"
  | "Other";

type Priority =
  | "Low"
  | "Medium"
  | "High"
  | "Urgent";

type AssignedTeam =
  | "Sales Team"
  | "Client Success"
  | "Finance"
  | "Engineering";
```

These values must remain synchronized with the runtime schemas.

---

### 7.2 `lib/triage/schemas.ts`

Responsibility:

- Define Zod schemas for:
  - API request.
  - AI output.
  - Successful API response.
  - Error response, if appropriate.

The schemas must enforce:

- Required fields.
- Allowed enum values.
- String constraints.
- Non-empty values.
- No unsupported structure.

Runtime validation is mandatory because TypeScript types alone do not validate external input or model output.

---

### 7.3 `lib/triage/service.ts`

Responsibility:

- Coordinate the complete triage workflow.
- Accept validated input.
- Perform scope checks.
- Build the prompt.
- Call the provider adapter.
- Parse model output.
- Validate the output schema.
- Run consistency checks.
- Return the validated result.

The service is the main business application boundary.

Conceptual flow:

```text
Validated input
    ↓
Scope check
    ↓
Prompt construction
    ↓
Provider call
    ↓
Parse output
    ↓
Schema validation
    ↓
Consistency validation
    ↓
Validated triage result
```

The service must not:

- Render UI.
- Return HTTP responses.
- Access browser APIs.
- Send emails.
- Modify external systems.
- Persist data unless explicitly added later.

---

### 7.4 `lib/triage/consistency.ts`

Responsibility:

- Validate cross-field consistency.
- Check category-to-owner compatibility.
- Check priority and priority-reason alignment.
- Check that the draft response does not contradict the classification.

Example default mapping:

```ts
const defaultOwnerByCategory = {
  Sales: "Sales Team",
  Support: "Client Success",
  Billing: "Finance",
  Technical: "Engineering",
  Other: "Client Success",
} as const;
```

This mapping is an implementation rule and must remain consistent with the AI Decision Specification.

---

### 7.5 `lib/triage/scope.ts`

Responsibility:

- Apply basic deterministic scope checks.
- Identify clearly empty or unrelated requests when possible.
- Support the out-of-scope policy.
- Avoid trying to solve general-purpose language understanding with complex hardcoded rules.

The AI may still be needed for nuanced scope interpretation.

The scope module must not become a large collection of arbitrary keyword rules.

---

## 8. Error Layer

### 8.1 `lib/errors/codes.ts`

Responsibility:

Define the approved application error codes:

```ts
type ErrorCode =
  | "INVALID_REQUEST"
  | "OUT_OF_SCOPE"
  | "AI_TIMEOUT"
  | "AI_RATE_LIMITED"
  | "AI_SERVICE_UNAVAILABLE"
  | "AI_INVALID_OUTPUT"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";
```

Do not add new codes without updating the error-handling policy and tests.

---

### 8.2 `lib/errors/application-error.ts`

Responsibility:

- Define a typed application error.
- Store a stable error code.
- Store a safe user-facing message.
- Optionally store an internal cause for server logging.

The internal cause must not be serialized into the frontend response.

---

### 8.3 `lib/errors/error-response.ts`

Responsibility:

- Convert application errors into the approved API error shape.
- Map error codes to HTTP statuses.
- Return safe public messages.
- Prevent stack traces from being exposed.

Example:

```ts
{
  error: {
    code: "AI_TIMEOUT",
    message: "The analysis took too long to complete. Please try again."
  }
}
```

---

## 9. Test Layer

### 9.1 `tests/fixtures/`

Responsibility:

Store reusable test inputs.

Recommended files:

- `challenge-requests.ts`: the six provided examples.
- `valid-requests.ts`: additional valid business requests.
- `invalid-requests.ts`: malformed or invalid inputs.
- `out-of-scope-requests.ts`: unrelated requests.
- `mock-ai-responses.ts`: valid and invalid model outputs.

Fixtures must not contain real client information.

---

### 9.2 `tests/unit/`

Responsibility:

Test isolated logic.

Examples:

- Request schema validation.
- AI output schema validation.
- Category-to-owner consistency.
- Priority consistency.
- Scope checks.
- Error mapping.
- Triage service with a mocked provider.

---

### 9.3 `tests/integration/`

Responsibility:

Test the API route and service together.

Examples:

- Valid request returns six required fields.
- Invalid request returns `400`.
- Out-of-scope request returns `422`.
- Provider timeout returns `503`.
- Invalid model output returns `502`.

---

### 9.4 `tests/e2e/`

Responsibility:

Test the user-facing workflow.

Examples:

- User enters a request.
- User submits the form.
- Loading state appears.
- Result is displayed.
- Validation error is shown.
- Retry works after a temporary failure.

E2E tests may use a mocked backend or provider to remain deterministic.

---

## 10. Configuration and Environment Files

### 10.1 `.env.example`

Include only placeholder configuration names.

Example:

```env
AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
AI_TIMEOUT_MS=30000
```

The exact variables depend on the selected provider.

Never commit real credentials.

---

### 10.2 `lib/config.ts`

Responsibility:

- Read environment variables on the server.
- Validate required configuration.
- Provide typed configuration to the provider adapter.
- Fail clearly when required configuration is missing.

Do not expose server-only secrets to client components.

---

## 11. README Responsibilities

The README should contain:

- Project purpose.
- Supported workflow.
- Technology stack.
- Local setup steps.
- Environment variable setup.
- Development command.
- Test command.
- Lint and type-check commands.
- API endpoint overview.
- Known limitations.
- Explicit statement that the prototype uses mock business requests and does not perform external actions.

Do not claim production readiness.

---

## 12. Dependency Rules

Add a dependency only when:

- It is required by the approved architecture.
- It removes meaningful complexity.
- It is actively used.
- It does not introduce an unnecessary framework or service.

Avoid adding:

- Multiple AI orchestration frameworks.
- Vector databases.
- Agent frameworks.
- Unused UI libraries.
- Authentication packages.
- Database clients.
- Workflow engines.
- External integrations.

---

## 13. Import and Responsibility Rules

Recommended dependency direction:

```text
UI components
    ↓
API route
    ↓
Triage service
    ↓
AI provider / domain utilities
    ↓
Schemas, types, and error definitions
```

Rules:

- UI components must not import AI provider SDKs.
- UI components must not import server-only configuration.
- API routes must not contain prompt text.
- API routes must not contain business classification rules.
- The AI provider must not import React components.
- Domain logic must not depend on browser APIs.
- Tests may import domain modules and mocked adapters.
- Shared schemas and types must not depend on UI code.

---

## 14. Files That Should Not Be Created Initially

Do not create these unless a later requirement explicitly justifies them:

```text
database/
prisma/
migrations/
auth/
middleware.ts
agents/
workflows/
integrations/
crm/
email/
ticketing/
vector-store/
embeddings/
rag/
admin/
billing/
analytics/
```

A simple triage assistant does not require these components.

---

## 15. Copilot Rules for Repository Changes

Before modifying a file, Copilot must:

1. Inspect the file and its imports.
2. Check the relevant source-of-truth document.
3. Explain why the file needs to change.
4. Avoid rewriting unrelated code.
5. Preserve existing conventions.
6. Add tests for behavior changes.

After modifying files, Copilot must:

1. Run type-checking.
2. Run linting.
3. Run relevant tests.
4. Report changed files.
5. Report unresolved issues.
6. Stop instead of implementing additional milestones.

---

## 16. Recommended Implementation Order by File Group

```text
1. Configuration and project setup
2. lib/triage/types.ts
3. lib/triage/schemas.ts
4. lib/errors/codes.ts
5. lib/errors/application-error.ts
6. lib/errors/error-response.ts
7. lib/ai/provider.ts
8. lib/ai/provider-errors.ts
9. lib/ai/prompts.ts
10. lib/triage/consistency.ts
11. lib/triage/scope.ts
12. lib/triage/service.ts
13. app/api/triage/route.ts
14. components/triage-form.tsx
15. components/triage-result.tsx
16. components/error-message.tsx
17. app/page.tsx
18. Tests and fixtures
19. README and final cleanup
```

This order ensures that the contracts and backend behavior are established before the interface depends on them.

---

## 17. Final Structural Principle

The repository should make the following separation obvious:

```text
React = interaction and presentation
API route = transport boundary
Triage service = application workflow
AI provider = model integration
Schemas = runtime safety
Consistency module = deterministic business validation
Error layer = stable failure behavior
Tests = verification
```

If a new feature cannot be placed cleanly into this structure, the feature should be questioned before implementation rather than forcing additional complexity into the prototype.
