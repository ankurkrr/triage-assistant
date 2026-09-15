# 07 — API Contract and Backend Flow

## 1. Purpose

This document defines the minimum backend contract and processing flow for the AI Request Triage Assistant prototype.

The Node Solutions challenge requires the tool to accept a written request and return:
- A short summary
- Exactly one category
- A priority with a brief reason
- One owner
- A professional first-response draft
- A clear interface or workflow

The API is intentionally small. It is not a production enterprise platform.

## 2. Scope

### Included
- One API endpoint
- JSON request and response contracts
- Input validation
- AI service invocation
- Structured AI output parsing
- Output schema validation
- Basic consistency checks
- Predictable error responses
- Bounded timeout and failure handling

### Excluded
- Authentication and user accounts
- Database persistence
- Multi-tenancy
- External CRM, ticketing, email, or messaging integrations
- Background queues and microservices
- Enterprise observability and rate limiting
- Real access removal, billing review, or ticket creation

## 3. Processing Flow

```text
User enters written request
        ↓
POST /api/triage
        ↓
Validate request body
        ↓
Invoke AI triage service
        ↓
Parse structured AI response
        ↓
Validate response schema
        ↓
Run basic consistency checks
        ↓
Return validated result
        ↓
Frontend displays result
```

The backend must never return an unvalidated AI response directly to the frontend.

## 4. API Endpoint

```http
POST /api/triage
Content-Type: application/json
```

No authentication or persistence is required for this prototype.

## 5. Request Contract

```typescript
type TriageRequest = {
  request: string;
};
```

Example:

```json
{
  "request": "The client portal has been unavailable since this morning and our staff cannot access active customer records. Please help as soon as possible."
}
```

### Input validation

The backend must:
1. Require a JSON body.
2. Require the `request` field.
3. Require it to be a string.
4. Reject empty or whitespace-only input.
5. Trim surrounding whitespace.
6. Enforce a reasonable maximum length.

Recommended prototype limits:
- Minimum: 1 non-whitespace character
- Maximum: 10,000 characters

These limits are implementation safeguards, not explicit PDF requirements.

## 6. Response Contract

```typescript
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

type Owner =
  | "Sales Team"
  | "Client Success"
  | "Finance"
  | "Engineering";

type TriageResult = {
  summary: string;
  category: Category;
  priority: Priority;
  priorityReason: string;
  owner: Owner;
  draftResponse: string;
};
```

Example:

```json
{
  "summary": "The client portal is unavailable, preventing staff from accessing active customer records.",
  "category": "Technical",
  "priority": "Urgent",
  "priorityReason": "The issue is actively blocking access to customer records and requires immediate attention.",
  "owner": "Engineering",
  "draftResponse": "Thank you for reporting this issue. We understand that your team is currently unable to access active customer records. We have routed this request to Engineering for investigation and follow-up."
}
```

The response must contain the six required fields and no unnecessary top-level fields.

## 7. Response Field Rules

### summary
- One or two concise sentences.
- Factual and based only on the request.
- Must not invent details.

### category
Exactly one of:
- Sales
- Support
- Billing
- Technical
- Other

### priority
Exactly one of:
- Low
- Medium
- High
- Urgent

### priorityReason
- Required and brief.
- Must explain urgency, impact, deadline, risk, or lack of urgency.
- Must not expose hidden reasoning or chain-of-thought.

### owner
Exactly one of:
- Sales Team
- Client Success
- Finance
- Engineering

### draftResponse
- Professional and suitable for human review.
- Acknowledge the request.
- Reflect the issue or goal accurately.
- Do not promise an exact resolution time unless explicitly provided.
- Do not claim an action has already been completed.
- Do not invent prices, timelines, policies, or technical details.

## 8. Backend Processing Stages

1. Parse the JSON body.
2. Validate it using a runtime schema library such as Zod.
3. Trim the request without changing its meaning.
4. Pass it to a dedicated triage service.
5. Invoke the AI provider through an adapter.
6. Parse the structured AI response.
7. Validate the result against `TriageResult`.
8. Run lightweight consistency checks.
9. Return the validated result.

The API route should remain thin. Prompt and decision logic belong in the AI triage service, not inside the route handler.

## 9. Consistency Checks

The prototype may flag suspicious combinations, such as:
- Billing request routed somewhere other than Finance.
- Sales or pricing request routed somewhere other than Sales Team.
- Portal outage routed somewhere other than Engineering.
- A future idea marked Urgent without supporting evidence.

Do not build a complex correction engine. Do not silently rewrite AI output without an explicit rule. Logging a development warning is sufficient for questionable but structurally valid results.

## 10. HTTP Status Codes

- `200 OK`: Valid triage result returned.
- `400 Bad Request`: Malformed or invalid user input.
- `422 Unprocessable Entity`: AI output cannot satisfy the response schema.
- `502 Bad Gateway`: AI provider failure.
- `504 Gateway Timeout`: AI provider timeout.
- `500 Internal Server Error`: Unexpected server error.

## 11. Error Contract

```typescript
type ApiError = {
  error: {
    code: string;
    message: string;
  };
};
```

Example:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Please provide a non-empty written request."
  }
}
```

Other example codes:
- `AI_PROVIDER_ERROR`
- `INVALID_TRIAGE_RESULT`
- `INTERNAL_ERROR`

Do not expose stack traces, API keys, raw prompts, or provider internals.

## 12. Timeout and Retry Policy

- Use a bounded, configurable AI timeout.
- Never allow the request to wait indefinitely.
- Do not retry invalid input.
- Do not retry schema-validation failures.
- At most one retry may be used for a transient provider failure.
- If the provider remains unavailable, return a safe error response.

The exact timeout value is an implementation decision and should be configurable through environment variables.

## 13. Security Boundaries

- Use only the six supplied mock requests and newly entered fictional requests.
- Keep provider credentials server-side.
- Never expose API keys to the frontend.
- Avoid logging full request content unnecessarily.
- Do not claim to perform real access removal, billing changes, ticket creation, or system updates.
- Treat the customer-information example as a simulated classification scenario only.

## 14. Frontend Integration

The frontend should:
1. Collect the written request.
2. Show a loading state.
3. Call `POST /api/triage`.
4. Display the six returned fields.
5. Show a clear error on failure.
6. Allow another request.
7. Present the draft response as reviewable content.

The frontend must not:
- Call the AI provider directly.
- Store API keys.
- Invent classifications.
- Silently change priority or owner.
- Pretend an action was completed.

## 15. Testing Requirements

### Input tests
- Valid request
- Empty request
- Whitespace-only request
- Missing field
- Non-string field
- Excessively long request
- Malformed JSON

### AI-output tests
- Complete valid result
- Missing field
- Invalid category
- Invalid priority
- Invalid owner
- Empty draft response
- Malformed JSON
- Provider timeout
- Provider failure

### Functional tests
Verify all six mock requests:
- Return a result.
- Produce exactly one category.
- Produce exactly one priority.
- Produce exactly one owner.
- Include a priority reason.
- Include a professional draft response.

Also verify that new, unlisted requests can be processed.

## 16. GitHub Copilot Boundaries

Copilot must:
1. Implement only this API contract.
2. Reuse the shared schemas and enums.
3. Use runtime validation, not TypeScript types alone.
4. Keep the API route thin.
5. Put AI logic in a dedicated service or provider adapter.
6. Validate both input and AI output.
7. Never return raw model text as a successful result.
8. Never expose provider credentials.
9. Avoid adding a database, authentication, microservices, or external integrations.
10. Avoid inventing additional response fields.
11. Avoid silently correcting invalid AI values.
12. Add focused endpoint and schema tests.
13. Keep the implementation simple and prototype-focused.

## 17. Definition of Done

This document is implemented when:
- `POST /api/triage` accepts a written request.
- Invalid input is rejected cleanly.
- The AI service is called through a separate service layer.
- AI output is parsed and validated.
- The response contains the six required fields.
- Invalid AI output cannot reach the frontend as a successful result.
- Provider failures produce safe errors.
- The frontend can display the result without its own AI logic.
- All six mock requests work.
- New written requests also work.
- No unnecessary production infrastructure is added.
