# 06 — Data Contracts, Schemas and Validation Specification

## 1. Purpose

This document defines the exact data contracts between the frontend, backend API, AI service, validation layer, and user interface.

The source challenge requires the prototype to:

- Accept a written request.
- Return a short summary.
- Assign one category.
- Assign one priority with a brief reason.
- Route the request to one owner.
- Draft a professional first response.
- Present the result in a clear interface or workflow.

The challenge does not prescribe a programming language, framework, JSON schema, API format, or validation library. Those details are implementation decisions for this prototype.

This document defines those implementation decisions so GitHub Copilot does not invent inconsistent contracts.

---

## 2. Source Requirements vs Implementation Decisions

### Explicitly required by the challenge

The PDF explicitly requires:

- Written request input.
- Short summary.
- Exactly one category from five named categories.
- One priority from four named priorities.
- Brief priority reason.
- One owner from four named owners.
- Professional first response for review and sending.
- Clear interface or workflow.
- Support for all six mock requests.
- Support for new requests not listed in the examples.

### Not explicitly prescribed by the challenge

The PDF does not prescribe:

- JSON as the transport format.
- TypeScript.
- Zod.
- REST.
- A specific API endpoint.
- A specific AI provider.
- Native structured model output.
- A database.
- Authentication.
- A particular frontend framework.

The choices in this document are practical implementation decisions intended to make the prototype reliable and easy to review. They must not be presented as requirements directly stated in the PDF.

---

## 3. Contract Design Principles

1. Use one canonical domain model for a triage result.
2. Use exact field names throughout the application.
3. Use exact enum values from the challenge.
4. Validate all external input at runtime.
5. Treat AI output as untrusted data.
6. Do not allow the frontend to define or alter classification enums.
7. Do not return malformed model output to the frontend.
8. Keep API errors predictable.
9. Do not add fields that are not needed by the product.
10. Keep the contract simple enough for a focused prototype.

---

## 4. Domain Enums

### 4.1 Category

The category must be exactly one of:

```ts
export const CATEGORIES = [
  "Sales",
  "Support",
  "Billing",
  "Technical",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
```

### 4.2 Priority

The priority must be exactly one of:

```ts
export const PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Urgent",
] as const;

export type Priority = (typeof PRIORITIES)[number];
```

### 4.3 Owner

The owner must be exactly one of:

```ts
export const OWNERS = [
  "Sales Team",
  "Client Success",
  "Finance",
  "Engineering",
] as const;

export type Owner = (typeof OWNERS)[number];
```

### Contract rules

- Preserve capitalization exactly.
- Do not use lowercase alternatives.
- Do not use internal codes such as `sales_team` in the public response.
- Do not add `Security`, `Operations`, `Legal`, or any other owner.
- Do not return multiple values for any classification field.

---

## 5. Request Contract

### 5.1 Canonical request type

```ts
export interface TriageRequest {
  request: string;
}
```

### 5.2 Example request payload

```json
{
  "request": "The client portal has been unavailable since this morning."
}
```

### 5.3 Request validation rules

The request must:

- Be a JSON object.
- Contain a `request` field.
- Have a string value for `request`.
- Contain at least one non-whitespace character.
- Be trimmed before processing.
- Remain below the configured maximum length.

The request must not contain required classification fields. The user supplies only the unstructured request.

### 5.4 Recommended Zod schema

```ts
import { z } from "zod";

export const TriageRequestSchema = z.object({
  request: z
    .string()
    .trim()
    .min(1, "Request cannot be empty")
    .max(10_000, "Request is too long"),
});

export type TriageRequest = z.infer<typeof TriageRequestSchema>;
```

The maximum length is an implementation default. It should be stored as a named configuration value rather than duplicated throughout the code.

---

## 6. AI Result Contract

### 6.1 Canonical domain type

```ts
export interface TriageResult {
  summary: string;
  category: Category;
  priority: Priority;
  priority_reason: string;
  owner: Owner;
  draft_response: string;
}
```

### 6.2 Example successful result

```json
{
  "summary": "The client portal has been unavailable since this morning, preventing staff from accessing active customer records.",
  "category": "Technical",
  "priority": "Urgent",
  "priority_reason": "The portal is unavailable and staff cannot access active customer records, creating an immediate operational blockage.",
  "owner": "Engineering",
  "draft_response": "Thank you for reporting this. We understand that the client portal has been unavailable since this morning and that staff cannot access active customer records. The issue should be reviewed promptly by the Engineering team, and an update can be provided once the impact and cause are understood."
}
```

This is an illustrative result. It is not a fixed response that should be hardcoded for the example request.

---

## 7. Result Field Specifications

### 7.1 `summary`

Purpose:

- Explain the primary request briefly.

Rules:

- Must be a non-empty string.
- Should normally be one or two sentences.
- Must reflect the primary intent.
- Must not introduce unsupported facts.
- Must not contain internal chain-of-thought.
- Must not include classification labels unless useful.

### 7.2 `category`

Purpose:

- Identify the primary business category.

Rules:

- Must be exactly one allowed category.
- Must reflect the primary intent.
- Must not contain multiple categories.
- Must not use a new category.

### 7.3 `priority`

Purpose:

- Identify the urgency and business impact.

Rules:

- Must be exactly one allowed priority.
- Must reflect evidence in the request.
- Must not be selected solely because the requester uses emotional language.
- Must not be automatically set to Urgent for every request containing “ASAP.”

### 7.4 `priority_reason`

Purpose:

- Explain the selected priority briefly.

Rules:

- Must be a non-empty string.
- Must be grounded in the request.
- Should normally be one sentence.
- Must explain impact, urgency, deadline, or risk.
- Must not repeat only the priority label.
- Must not invent facts.

### 7.5 `owner`

Purpose:

- Identify the single team that should review the request.

Rules:

- Must be exactly one allowed owner.
- Must follow the routing rules in the AI Decision Specification.
- Must not contain multiple teams.
- Must not introduce a new owner.

### 7.6 `draft_response`

Purpose:

- Provide a professional first response that a team member can review and send.

Rules:

- Must be a non-empty string.
- Must acknowledge the request.
- Must reflect the relevant concern.
- Must suggest an appropriate next step.
- Must not claim that an action has already occurred.
- Must not invent pricing, timelines, resolutions, ticket numbers, names, or commitments.
- Must not automatically be sent by the application.

---

## 8. Recommended Zod Result Schema

```ts
import { z } from "zod";

export const CategorySchema = z.enum([
  "Sales",
  "Support",
  "Billing",
  "Technical",
  "Other",
]);

export const PrioritySchema = z.enum([
  "Low",
  "Medium",
  "High",
  "Urgent",
]);

export const OwnerSchema = z.enum([
  "Sales Team",
  "Client Success",
  "Finance",
  "Engineering",
]);

export const TriageResultSchema = z
  .object({
    summary: z.string().trim().min(1),
    category: CategorySchema,
    priority: PrioritySchema,
    priority_reason: z.string().trim().min(1),
    owner: OwnerSchema,
    draft_response: z.string().trim().min(1),
  })
  .strict();

export type TriageResult = z.infer<typeof TriageResultSchema>;
```

The `.strict()` behavior is recommended because the product requires a focused six-field result. Unexpected fields should not become part of the application contract.

---

## 9. AI Provider Boundary

The AI provider must return an untrusted value.

Recommended interface:

```ts
export interface AIProvider {
  generateTriageResult(input: string): Promise<unknown>;
}
```

The return type should be `unknown`, not `TriageResult`, because the provider has not yet passed application validation.

Incorrect approach:

```ts
async function generateTriageResult(input: string): Promise<TriageResult> {
  // Unsafe if the provider response has not been validated.
}
```

Correct approach:

```ts
async function generateTriageResult(input: string): Promise<unknown> {
  // Provider response remains untrusted.
}
```

The conversion from `unknown` to `TriageResult` must happen only after parsing and schema validation.

---

## 10. Parsing and Validation Pipeline

The backend should use this sequence:

```text
Incoming HTTP Body
    ↓
Parse JSON
    ↓
Validate TriageRequestSchema
    ↓
Call AI Provider
    ↓
Receive unknown model output
    ↓
Parse structured response
    ↓
Validate TriageResultSchema
    ↓
Run business consistency checks
    ↓
Return TriageResult
```

### Important rule

Do not skip schema validation because:

- The prompt requests JSON.
- The provider claims to support structured output.
- The SDK returns a typed object.
- The model worked correctly in previous tests.

Runtime validation is still required.

---

## 11. Handling Model Output Formats

### Preferred case

The provider returns a native structured object.

The application should validate it directly.

### JSON string case

If the provider returns a JSON string:

1. Parse the string.
2. Catch JSON parsing errors.
3. Validate the parsed value against `TriageResultSchema`.

### Markdown-wrapped JSON

If the provider returns:

```text
```json
{ ... }
```
```

The initial implementation should prefer rejecting this response unless a safe, narrowly scoped parser is implemented.

Do not use broad text extraction that could accidentally accept unrelated prose as valid data.

### Free-form prose

If the model returns prose instead of the required object:

- Mark the result invalid.
- Do not display it as a successful triage result.
- Return a safe processing error.
- Log only non-sensitive diagnostic metadata.

---

## 12. Business Consistency Validation

Schema validation checks structure. Business validation checks whether the result is usable.

Recommended checks:

### 12.1 Priority reason alignment

The priority reason should provide evidence consistent with the selected priority.

Examples of suspicious combinations:

- `Low` priority with a reason describing an active outage.
- `Urgent` priority with a reason describing only a future enhancement.
- `Medium` priority with a reason claiming that the entire business is down when the request does not say that.

### 12.2 Draft response safety

The draft response must not contain unsupported claims such as:

- “We have fixed the issue.”
- “Your access has been removed.”
- “Your refund has been approved.”
- “The Engineering team has been notified.”
- “We guarantee a response within one hour.”

Unless the request itself provides the relevant fact, the model must use cautious wording.

### 12.3 Owner validity

The owner must be one of the permitted owners.

The validator must not silently replace the owner with a new team.

### 12.4 Classification consistency

The result should not contain contradictory signals, such as:

- Category `Other` for a clear invoice discrepancy.
- Owner `Finance` for a clear technical outage.
- Category `Sales` for a request whose primary issue is an active system outage.

Business validation should reject clearly unusable results. It should not become an uncontrolled second AI classifier.

---

## 13. API Success Contract

Recommended endpoint:

```text
POST /api/triage
```

Successful response:

```http
200 OK
Content-Type: application/json
```

```json
{
  "summary": "Short summary",
  "category": "Technical",
  "priority": "High",
  "priority_reason": "The issue is disrupting an important workflow.",
  "owner": "Engineering",
  "draft_response": "Professional response for review."
}
```

The API should return the validated `TriageResult` directly unless a consistent response envelope is needed by the application.

For this focused prototype, returning the six fields directly is acceptable and keeps the contract simple.

---

## 14. API Error Contract

Recommended error structure:

```ts
export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
```

### Example: invalid request

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Please enter a request before analyzing."
  }
}
```

### Example: provider failure

```json
{
  "error": {
    "code": "AI_PROVIDER_ERROR",
    "message": "The request could not be analyzed right now. Please try again."
  }
}
```

### Example: invalid model output

```json
{
  "error": {
    "code": "INVALID_AI_OUTPUT",
    "message": "The AI returned an invalid result. Please try again."
  }
}
```

### Example: unexpected server error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong while analyzing the request."
  }
}
```

### Error rules

- Do not expose stack traces.
- Do not expose API keys.
- Do not expose provider request headers.
- Do not expose raw model output by default.
- Do not expose internal file paths.
- Keep error codes stable.
- Keep user-facing messages understandable.

---

## 15. HTTP Status Mapping

Recommended mapping:

| Situation | Status |
|---|---:|
| Invalid JSON or request body | 400 |
| Empty request | 400 |
| Request too long | 400 |
| Rate limit from provider | 429 |
| Provider timeout or temporary outage | 503 |
| Invalid AI output | 502 |
| Unexpected server failure | 500 |
| Successful triage | 200 |

These are implementation recommendations, not requirements explicitly specified by the challenge PDF.

---

## 16. Frontend Contract Boundary

The frontend may:

- Send `{ request: string }`.
- Render the six result fields.
- Render errors.
- Edit `draft_response` locally.
- Clear the result.
- Submit another request.

The frontend must not:

- Send category, priority, or owner as user-controlled classification inputs.
- Reclassify the result.
- Replace an invalid enum with a guessed value.
- Assume missing fields are valid.
- Display an unvalidated AI result.
- Automatically send the draft response.
- Perform external actions.

The frontend should treat the API response as valid only after the backend has completed validation.

---

## 17. Testing Matrix

### 17.1 Request schema tests

| Test | Expected result |
|---|---|
| Valid non-empty request | Accepted |
| Empty string | Rejected |
| Whitespace-only string | Rejected |
| Missing `request` field | Rejected |
| Numeric `request` field | Rejected |
| Array `request` field | Rejected |
| Oversized request | Rejected |
| Extra unrelated fields | Ignored or rejected according to chosen request-schema policy |

### 17.2 Result schema tests

| Test | Expected result |
|---|---|
| Valid six-field object | Accepted |
| Missing `summary` | Rejected |
| Missing `category` | Rejected |
| Missing `priority` | Rejected |
| Missing `priority_reason` | Rejected |
| Missing `owner` | Rejected |
| Missing `draft_response` | Rejected |
| Invalid category | Rejected |
| Invalid priority | Rejected |
| Invalid owner | Rejected |
| Empty text field | Rejected |
| Array instead of string | Rejected |
| Additional field | Rejected if strict schema is used |
| Multiple category values | Rejected |
| Markdown-wrapped JSON | Rejected unless safely parsed |
| Free-form prose | Rejected |

### 17.3 Representative challenge tests

The six challenge examples should be used as behavioral test inputs:

1. Automation across three systems.
2. Unavailable client portal.
3. Duplicate invoice charge.
4. Future dark-mode and font ideas.
5. Customer contact information in the wrong workspace.
6. Custom AI reporting system pricing and timeline.

The application must accept new requests as well. These examples must not be hardcoded as special cases.

---

## 18. Expected Classification Test Targets

These are recommended test targets based on the AI Decision Specification. They are not additional requirements stated directly by the PDF.

| Example | Category | Priority | Owner |
|---|---|---|---|
| Automation across three systems | Technical | Medium | Engineering |
| Portal unavailable and records inaccessible | Technical | Urgent | Engineering |
| Duplicate implementation charge | Billing | Medium | Finance |
| Future dark mode and font ideas | Other | Low | Client Success |
| Wrong workspace with immediate access removal | Technical | Urgent | Engineering |
| Custom AI reporting system pricing/timeline | Sales | Medium | Sales Team |

The tests should evaluate the classification and contract, not require the model to produce identical wording for the summary or draft response.

---

## 19. Contract Versioning

The contract should be versioned when its behavior changes.

A contract change includes:

- Renaming a field.
- Adding or removing a field.
- Changing an enum.
- Changing required/optional status.
- Changing validation limits.
- Changing API error codes.
- Changing the meaning of a field.

For the initial prototype, the contract should remain at version `1`.

Example:

```ts
export const TRIAGE_CONTRACT_VERSION = "1";
```

Do not add version fields to the public response unless the frontend actually needs them. A source-level constant is sufficient for the prototype.

---

## 20. GitHub Copilot Implementation Boundary

GitHub Copilot must follow these rules:

1. Use the exact six result field names.
2. Use the exact category, priority, and owner values.
3. Define shared types in one canonical domain module.
4. Use runtime validation for request and model output.
5. Treat provider output as `unknown` until validated.
6. Do not type-cast raw model output directly to `TriageResult`.
7. Do not allow the frontend to classify requests.
8. Do not add extra required fields.
9. Do not silently repair invalid classifications.
10. Do not expose raw model output to the user by default.
11. Keep API error responses consistent.
12. Do not hardcode the six mock requests.
13. Do not introduce a database for these contracts.
14. Do not add authentication or external integrations.
15. Do not change the contract without updating the specification and tests.
16. If a requirement is ambiguous, ask for clarification instead of inventing a field or enum.

---

## 21. Definition of Done

This document is correctly implemented when:

- The request payload has one canonical schema.
- The AI result has one canonical six-field schema.
- Categories, priorities, and owners use exact allowed values.
- Invalid request payloads are rejected.
- Invalid AI outputs are rejected.
- API success responses are predictable.
- API errors are predictable and safe.
- The frontend uses the backend contract without reclassifying results.
- Business consistency checks are applied after schema validation.
- The six challenge examples can be tested.
- New requests are accepted without hardcoded special cases.
- Contract changes are documented and tested.
