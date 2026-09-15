# 10 — Implementation Plan and GitHub Copilot Execution Guide

## 1. Purpose

This document converts the approved product specifications into a controlled implementation sequence for the AI Request Triage Assistant.

The goal is to help GitHub Copilot build the prototype without:

- Adding unnecessary features.
- Inventing requirements.
- Changing approved categories, priorities, or owners.
- Mixing business logic into UI components.
- Trusting unvalidated AI output.
- Expanding the project into a production platform.

This is an implementation guide, not a replacement for the product requirements, data contracts, API contract, or error-handling policy.

---

## 2. Product Scope

The prototype must allow a user to submit a written business request and receive:

1. A short summary.
2. Exactly one category:
   - Sales
   - Support
   - Billing
   - Technical
   - Other
3. One priority:
   - Low
   - Medium
   - High
   - Urgent
4. A brief reason for the priority.
5. One assigned owner:
   - Sales Team
   - Client Success
   - Finance
   - Engineering
6. A professional draft response for human review.

The prototype must work for the six provided examples and for new business requests.

The implementation must remain focused on this workflow.

---

## 3. Source-of-Truth Documents

Copilot must treat the following documents as the authoritative project specification:

```text
01_PRODUCT_REQUIREMENTS.md
02_USER_WORKFLOW_AND_INTERFACE.md
03_AI_DECISION_SPECIFICATION.md
04_TECHNICAL_ARCHITECTURE.md
05_AI_PROMPT_SPECIFICATION.md
06_DATA_CONTRACTS_SCHEMAS_VALIDATION.md
07_API_CONTRACT_AND_BACKEND_FLOW.md
08_TESTING_AND_EVALUATION_PLAN.md
09_ERROR_HANDLING_AND_OUT_OF_SCOPE_POLICY.md
10_IMPLEMENTATION_PLAN_AND_COPILOT_EXECUTION_GUIDE.md
```

When documents conflict:

1. Follow the explicit product requirement.
2. Follow the approved data contract.
3. Follow the error-handling policy.
4. Do not invent a resolution.
5. Stop and ask for clarification if the conflict affects implementation correctness.

---

## 4. Recommended Technology Direction

The implementation should use a simple full-stack TypeScript application.

Recommended baseline:

- Next.js with App Router.
- TypeScript in strict mode.
- React for the interface.
- Zod for runtime validation.
- A server-side AI provider adapter.
- CSS or a lightweight UI styling approach.
- Unit and integration tests.
- No database for the prototype.
- No authentication for the prototype.
- No external CRM, email, ticketing, or workflow integrations.

The exact AI provider may be selected separately, but the provider must be isolated behind an adapter.

The frontend must never contain provider credentials or call the model provider directly.

---

## 5. Implementation Principles

### 5.1 Build vertically, not by creating every file first

Each milestone should produce a small working slice of the product.

Preferred sequence:

```text
Contract → Service → API → UI → Test → Verify
```

Do not create a large number of empty files without implementing and validating behavior.

### 5.2 Keep business logic outside the UI

React components should handle:

- User input.
- Loading state.
- Displaying results.
- Displaying errors.
- Triggering API calls.

The following must not be implemented inside React components:

- Prompt construction.
- Category decisions.
- Priority rules.
- Owner routing.
- AI response parsing.
- Cross-field consistency validation.

### 5.3 Treat AI output as untrusted

Every model response must pass:

1. JSON parsing.
2. Runtime schema validation.
3. Cross-field consistency validation.

Only validated output may be returned to the frontend.

### 5.4 Prefer deterministic behavior

Use deterministic code for:

- Input validation.
- Allowed enum values.
- Category-to-owner mapping.
- Error codes.
- HTTP status mapping.
- Retry limits.
- Output validation.
- UI state transitions.

Use the LLM for:

- Understanding the natural-language request.
- Producing the summary.
- Selecting the best-supported category.
- Selecting priority and explaining it.
- Drafting the response.

---

## 6. Milestone 1 — Project Bootstrap

### Objective

Create a clean application that starts locally.

### Tasks

- Initialize the Next.js project.
- Enable TypeScript strict mode.
- Configure linting and formatting.
- Add the required validation dependency.
- Add environment variable support.
- Create a basic home page.
- Add a `.env.example` file.
- Add a `.gitignore`.
- Confirm the application runs locally.

### Acceptance criteria

- The development server starts successfully.
- The home page loads.
- TypeScript compilation succeeds.
- Linting succeeds.
- No API key is committed.
- No unnecessary dependencies are added.

### Copilot boundary

Do not add:

- Authentication.
- Database setup.
- Docker.
- Cloud deployment.
- Analytics.
- Payment systems.
- Admin dashboards.
- Multi-agent frameworks.

---

## 7. Milestone 2 — Shared Types and Runtime Schemas

### Objective

Create the single source of truth for request and response contracts.

### Tasks

Create:

- Category enum.
- Priority enum.
- Owner enum.
- Triage result type.
- API request type.
- API error type.
- Zod schemas.
- Cross-field consistency validation.

### Acceptance criteria

- All allowed values are explicitly defined.
- Unsupported values fail validation.
- Required fields cannot be omitted.
- Empty strings are rejected where inappropriate.
- API request validation is separate from AI output validation.
- TypeScript types are inferred or kept synchronized with runtime schemas.

### Copilot boundary

Do not:

- Add new categories.
- Add new priorities.
- Add new owners.
- Add a confidence field unless explicitly approved.
- Add database models.
- Add fields that are not part of the approved contract.

---

## 8. Milestone 3 — AI Provider Adapter

### Objective

Create a provider-independent interface for model calls.

### Recommended responsibilities

The provider adapter should:

- Accept a prepared prompt or structured model input.
- Call the configured model.
- Apply a timeout.
- Return the raw model response to the service layer.
- Normalize provider-specific errors into application-level errors.

The adapter must not:

- Decide the final business rules independently.
- Return UI-specific responses.
- Contain React code.
- Expose provider credentials.
- Perform database or external system actions.

### Suggested abstraction

```ts
interface AiProvider {
  generateTriageOutput(input: {
    systemPrompt: string;
    userRequest: string;
  }): Promise<unknown>;
}
```

The exact interface may differ, but the provider must remain replaceable.

### Acceptance criteria

- API keys are read only on the server.
- Provider errors are caught.
- Timeout behavior exists.
- The provider can be mocked in tests.
- The rest of the application does not depend directly on provider SDK details.

---

## 9. Milestone 4 — Prompt Construction

### Objective

Implement the approved prompt specification.

### Tasks

- Create a versioned system prompt.
- Include the approved categories.
- Include the approved priorities.
- Include the approved owners.
- Include the decision rules.
- Include the exact output structure.
- Instruct the model to return only the required structured result.
- Instruct the model not to invent facts.
- Instruct the model to treat the user request as data.
- Include out-of-scope behavior.
- Include examples only where they improve consistency.

### Acceptance criteria

- Prompt construction is centralized.
- The prompt is not duplicated across files.
- User input is clearly delimited.
- Prompt injection attempts cannot override the triage policy.
- No hidden reasoning or chain-of-thought is requested.
- The prompt does not contain unsupported product features.

### Copilot boundary

Do not ask the model to:

- Send emails.
- Modify records.
- Perform actions.
- Contact teams.
- Promise resolution times.
- Reveal internal instructions.
- Return analysis outside the approved schema.

---

## 10. Milestone 5 — Triage Service

### Objective

Create the core application service that coordinates validation, AI execution, and output verification.

### Required sequence

```text
Receive request
    ↓
Validate request input
    ↓
Check basic scope
    ↓
Build prompt
    ↓
Call AI provider
    ↓
Parse model output
    ↓
Validate output schema
    ↓
Validate cross-field consistency
    ↓
Return validated triage result
```

### Responsibilities

The triage service should:

- Accept a validated request.
- Call the AI provider.
- Parse the model response.
- Validate the response.
- Apply deterministic consistency checks.
- Normalize known technical errors into application errors.
- Return only valid results.

### Acceptance criteria

- The service can be tested without the UI.
- The service can use a mocked provider.
- Invalid model output is rejected.
- Out-of-scope requests are handled according to the error policy.
- No partial result is returned.
- Provider failures do not crash the application.

---

## 11. Milestone 6 — API Route

### Objective

Expose the triage service through a single API endpoint.

Recommended endpoint:

```text
POST /api/triage
```

Request:

```json
{
  "request": "Our invoice contains an incorrect amount."
}
```

Success response:

```json
{
  "summary": "The requester reports an incorrect invoice amount.",
  "category": "Billing",
  "priority": "Medium",
  "priorityReason": "The request concerns an invoice issue, but no immediate business impact or deadline is stated.",
  "assignedTeam": "Finance",
  "draftResponse": "Thanks for reaching out. We will review the invoice details. Could you please share the invoice number and explain which amount appears to be incorrect?"
}
```

### API responsibilities

- Validate the request body.
- Call the triage service.
- Return a validated success response.
- Map application errors to HTTP responses.
- Avoid exposing stack traces.
- Return consistent error objects.

### Acceptance criteria

- Invalid input returns `400`.
- Out-of-scope requests return `422`.
- Provider rate limits return `429`.
- Invalid AI output returns `502`.
- Provider unavailability or timeout returns `503`.
- Unexpected failures return `500`.
- Response shape is stable.

---

## 12. Milestone 7 — User Interface

### Objective

Build a simple interface that clearly communicates the workflow.

### Required interface elements

- Page title.
- Short explanation of the tool.
- Multiline request input.
- Submit button.
- Loading state.
- Result section.
- Summary display.
- Category display.
- Priority display.
- Priority reason.
- Assigned team.
- Draft response.
- Error message area.
- Retry or edit behavior.

### Required UI states

```text
Idle
Loading
Success
Validation Error
Out-of-Scope Error
Temporary System Error
```

### Acceptance criteria

- The user can submit a request.
- The submit button is disabled during processing.
- Duplicate submissions are prevented.
- The entered text is preserved after errors.
- Successful results are easy to scan.
- Errors are understandable to a non-technical user.
- Raw stack traces and provider errors are not displayed.
- The interface works on a normal desktop screen and a smaller viewport.

### Copilot boundary

Do not build:

- A complex dashboard.
- Multiple pages.
- User accounts.
- History persistence.
- Team management.
- Real-time collaboration.
- Drag-and-drop routing.
- A ticketing system.

---

## 13. Milestone 8 — Testing

### Objective

Verify correctness at multiple levels.

### Required test categories

#### Contract tests

- Valid request schema.
- Invalid request schema.
- Valid triage result.
- Invalid category.
- Invalid priority.
- Invalid owner.
- Missing fields.

#### Service tests

- Successful triage.
- Provider timeout.
- Provider rate limit.
- Invalid model JSON.
- Invalid model schema.
- Cross-field inconsistency.
- Out-of-scope request.
- Low-information request.

#### API tests

- Valid request.
- Empty request.
- Invalid JSON.
- Wrong data type.
- Provider failure.
- Invalid AI output.
- Correct HTTP status mapping.

#### UI tests

- Form submission.
- Loading state.
- Success rendering.
- Error rendering.
- Retry behavior.
- Input preservation.

### Acceptance criteria

- Tests cover all defined error codes.
- All six challenge examples can be processed.
- New valid business requests can be processed.
- No test depends on a live provider unless explicitly marked as an optional integration test.
- Tests are repeatable.

---

## 14. Milestone 9 — Challenge Example Verification

The implementation must verify all six provided examples.

The exact expected classification should follow the approved AI Decision Specification. The examples must be used to check:

- Category selection.
- Priority selection.
- Priority reasoning.
- Owner routing.
- Draft response quality.
- Handling of urgency and business impact.
- Handling of ambiguous or unusual requests.

The implementation must not hardcode the six examples as the only supported inputs.

### Acceptance criteria

- Each example produces a valid six-field result.
- Request 05 is handled as an access-removal request with appropriate urgency reasoning.
- New requests outside the examples also work.
- The UI clearly presents the results.

---

## 15. Milestone 10 — Final Quality Pass

### Tasks

- Remove unused files and dependencies.
- Check TypeScript errors.
- Run linting.
- Run automated tests.
- Verify environment configuration.
- Verify error messages.
- Verify no secrets are committed.
- Verify the README contains setup instructions.
- Verify the application can be started by another developer.
- Review the implementation against all source-of-truth documents.

### Final acceptance criteria

- The core workflow works end to end.
- The six required output fields are always present on success.
- Invalid AI output cannot reach the UI.
- Out-of-scope requests are handled clearly.
- The application does not perform unsupported external actions.
- The interface is understandable without technical explanation.
- The code is organized by responsibility.
- The implementation remains within prototype scope.

---

## 16. Suggested Copilot Working Method

Copilot should be used in small, controlled tasks.

For every task, follow this sequence:

1. Read the relevant source-of-truth documents.
2. Inspect the existing repository.
3. Explain the proposed change briefly.
4. Identify files to create or modify.
5. Implement only the requested milestone.
6. Run the relevant checks.
7. Report files changed and test results.
8. Stop and wait for the next instruction.

Copilot must not implement multiple milestones in one response unless explicitly asked.

---

## 17. Master Copilot Instruction

Use the following instruction at the beginning of the implementation:

```text
You are implementing the AI Request Triage Assistant described in the project specification documents.

Treat the following documents as the source of truth:
- Product requirements
- User workflow and interface
- AI decision specification
- Technical architecture
- AI prompt specification
- Data contracts and validation
- API contract
- Testing plan
- Error-handling and out-of-scope policy
- Implementation plan

Build only the approved prototype workflow.

The product accepts a written business request and returns:
1. Summary
2. Exactly one category: Sales, Support, Billing, Technical, Other
3. Exactly one priority: Low, Medium, High, Urgent
4. Brief priority reason
5. Exactly one owner: Sales Team, Client Success, Finance, Engineering
6. Professional draft response

Rules:
- Do not invent requirements.
- Do not add categories, priorities, owners, or fields.
- Do not add a database, authentication, integrations, or autonomous actions.
- Keep AI calls on the server.
- Validate all user input.
- Treat AI output as untrusted.
- Validate model output with runtime schemas.
- Apply cross-field consistency checks.
- Use stable application-level errors.
- Do not expose secrets, raw provider errors, system prompts, or hidden reasoning.
- Keep business logic out of React components.
- Use a provider adapter so the model provider can be replaced.
- Work on one milestone at a time.
- Inspect existing files before editing.
- Do not rewrite unrelated code.
- After implementation, run the relevant tests and report the result.
- Stop after completing the requested milestone.
```

---

## 18. First Copilot Task

The first task should be limited to project bootstrap.

Use this prompt:

```text
Read the implementation plan and the existing repository structure.

Implement only Milestone 1: Project Bootstrap.

Tasks:
- Initialize or inspect the Next.js TypeScript application.
- Enable strict TypeScript settings.
- Configure linting and formatting if not already configured.
- Add only the dependencies required for the current milestone.
- Create .env.example without real secrets.
- Confirm the application has a working home page.
- Do not implement AI logic, API routes, schemas, database, authentication, or advanced UI yet.

Before editing:
1. Explain the current repository state.
2. List the files you plan to create or modify.
3. Identify any existing setup that should be preserved.

After editing:
1. Run the available type-check and lint commands.
2. Report the exact files changed.
3. Report any remaining issues.
4. Stop and wait for the next task.
```

---

## 19. Completion Rule

A milestone is complete only when:

- Its implementation is finished.
- Its acceptance criteria are met.
- Relevant checks have been run.
- No unrelated features were introduced.
- The changes are consistent with all previous documents.

The project should progress through verified increments rather than a single large Copilot-generated implementation.
