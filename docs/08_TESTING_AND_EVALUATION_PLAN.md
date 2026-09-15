# 08 — Testing and Evaluation Plan

## 1. Purpose

This document defines how the AI Request Triage Assistant prototype will be tested and evaluated before demonstration.

The Node Solutions challenge requires the solution to handle all six supplied mock requests and accept new written requests. The evaluation focuses on:

- Functionality
- AI judgment
- Problem solving
- User experience
- Communication

The testing approach therefore prioritizes reliable end-to-end behavior, sensible classifications, clear output, and practical handling of edge cases.

This is a prototype testing plan. It is not a production quality-assurance strategy.

---

## 2. Source Requirements Covered by Testing

The prototype must:

1. Accept a written request.
2. Return a short summary.
3. Assign exactly one category:
   - Sales
   - Support
   - Billing
   - Technical
   - Other
4. Assign one priority:
   - Low
   - Medium
   - High
   - Urgent
5. Provide a brief reason for the priority.
6. Route the request to one owner:
   - Sales Team
   - Client Success
   - Finance
   - Engineering
7. Draft a professional first response suitable for human review.
8. Present the result in a clear interface or workflow.
9. Handle all six supplied examples.
10. Accept new requests that are not in the examples.

These requirements are taken directly from the challenge brief.

---

## 3. Testing Strategy

Testing should be performed at four levels:

```text
Schema Tests
    ↓
Service Tests
    ↓
API Tests
    ↓
End-to-End UI Tests
```

### Level 1: Schema Tests

Verify that request and response data conforms to the defined contracts.

### Level 2: Service Tests

Verify that the triage service correctly handles AI responses, parsing, validation, and provider failures.

### Level 3: API Tests

Verify that the endpoint accepts valid input and returns appropriate responses for invalid input and service failures.

### Level 4: End-to-End UI Tests

Verify that a user can enter a request, submit it, understand the result, and submit another request.

---

## 4. Golden Test Dataset

The six examples from the challenge must be included as fixed test fixtures.

### Test Case 01 — Automation Request

Input:

> Our team has 40 employees entering the same customer details into three systems. Could you show us how this might be automated? We would like to speak next week.

Recommended expected result:

- Category: Technical
- Priority: Medium
- Owner: Engineering

Reasoning for expected result:

The request concerns process automation and system integration. It has a future discussion timeframe but no immediate operational failure.

### Test Case 02 — Portal Outage

Input:

> The client portal has been unavailable since this morning and our staff cannot access active customer records. Please help as soon as possible.

Recommended expected result:

- Category: Technical
- Priority: Urgent
- Owner: Engineering

Reasoning for expected result:

The portal is unavailable and staff cannot access active records. This is an active operational blocker requiring immediate attention.

### Test Case 03 — Duplicate Invoice Charge

Input:

> Invoice NS-1048 appears to include the same implementation charge twice. Can someone review it before payment is processed Friday?

Recommended expected result:

- Category: Billing
- Priority: Medium
- Owner: Finance

Reasoning for expected result:

The request concerns a possible duplicate charge and includes a review deadline before payment.

### Test Case 04 — Future UI Idea

Input:

> Can you add dark mode and change the dashboard font? There is no deadline. I am collecting ideas for a future update.

Recommended expected result:

- Category: Other
- Priority: Low
- Owner: Client Success

Reasoning for expected result:

This is a future product suggestion without an immediate deadline or operational impact.

### Test Case 05 — Wrong Workspace Upload

Input:

> We accidentally uploaded a spreadsheet containing customer contact information to the wrong workspace. We need immediate help removing access.

Recommended expected result:

- Category: Technical
- Priority: Urgent
- Owner: Engineering

Reasoning for expected result:

The request involves potentially exposed customer information and an immediate access-control concern.

The prototype must classify and route this simulated request only. It must not actually remove access or interact with a workspace.

### Test Case 06 — Custom AI Reporting Inquiry

Input:

> I saw your company online and am interested in a custom AI reporting system. What would pricing and a typical timeline look like?

Recommended expected result:

- Category: Sales
- Priority: Medium
- Owner: Sales Team

Reasoning for expected result:

The requester is exploring a potential service purchase and asks about pricing and timeline.

---

## 5. Important Evaluation Rule

The recommended expected classifications above are test expectations for sensible prototype behavior. They are not additional explicit classifications stated by the challenge PDF.

The evaluator should focus on whether the result is reasonable, explainable, and consistent with the request.

A result should not be judged only by exact string matching if the category, priority, owner, and explanation are logically defensible.

---

## 6. Functional Test Cases

### FT-01 — Submit a Valid Request

Given a valid written request:

- The request can be submitted.
- A loading state is displayed.
- A result is returned.
- The result is displayed in the interface.

### FT-02 — Display All Required Fields

The result must visibly contain:

- Summary
- Category
- Priority
- Priority reason
- Owner
- Draft response

### FT-03 — Submit a New Request

A request not included in the six examples must also be accepted and processed.

Example:

> We need help understanding how to export our monthly reports.

The system should return a valid structured result without relying on a hardcoded list of examples.

### FT-04 — Submit Multiple Requests Sequentially

The user must be able to:

1. Submit one request.
2. View its result.
3. Enter another request.
4. Submit it.
5. View the new result.

The previous result must not incorrectly appear as the result for the new request.

### FT-05 — Handle Empty Input

Submitting an empty or whitespace-only request must show a clear validation message and must not call the AI provider.

### FT-06 — Handle Provider Failure

If the AI provider fails, the interface must show a safe error message and allow the user to try again.

### FT-07 — Handle Invalid AI Output

If the AI provider returns malformed or invalid structured output, the backend must reject it rather than display an incomplete or invalid result.

---

## 7. Schema Test Cases

### Request Schema

Test that the request schema:

- Accepts a non-empty string.
- Rejects a missing field.
- Rejects non-string values.
- Rejects whitespace-only strings.
- Rejects values above the configured maximum length.

### Response Schema

Test that the response schema:

- Accepts all six required fields.
- Rejects missing fields.
- Rejects invalid categories.
- Rejects invalid priorities.
- Rejects invalid owners.
- Rejects empty summary text.
- Rejects empty priority reasons.
- Rejects empty draft responses.

---

## 8. AI Judgment Evaluation

For each mock request, review the following questions:

1. Is the summary faithful to the original request?
2. Is exactly one category selected?
3. Is the category sensible?
4. Is the priority supported by the request?
5. Is the priority reason brief and understandable?
6. Is the owner appropriate?
7. Does the draft response accurately acknowledge the request?
8. Does the draft response avoid unsupported promises?
9. Does the response avoid claiming that an action has already happened?
10. Is the result consistent with the overall triage logic?

### Common Judgment Failures

Flag results that:

- Mark every request as Urgent.
- Route every request to Engineering.
- Treat a future idea as an active incident.
- Treat a sales inquiry as a technical issue.
- Treat a billing discrepancy as a sales request.
- Invent a deadline not present in the input.
- Promise a resolution time without evidence.
- Claim that access has already been removed.
- Include multiple categories or owners.
- Return vague or generic priority reasons.

---

## 9. Draft Response Evaluation

The draft response should be evaluated for:

### Accuracy

Does it reflect what the requester actually said?

### Professionalism

Is the language suitable for a business team member?

### Reviewability

Can a human team member review and send it with minimal editing?

### Safety

Does it avoid:

- Unsupported guarantees
- Invented policies
- Invented pricing
- Invented timelines
- False claims of completed actions
- Unnecessary disclosure of sensitive information

### Appropriate Routing Language

The draft may say that the request has been routed for review, but it must not imply that the real team has actually received or completed the request unless the prototype performs such an action.

A safe phrasing is:

> This request has been identified as appropriate for review by the Engineering team.

Rather than:

> Engineering has fixed the issue.

---

## 10. User Interface Evaluation

The interface should be reviewed using the following checklist:

- Is the purpose of the tool clear immediately?
- Is there one obvious place to enter the request?
- Is the submit action easy to find?
- Is the loading state understandable?
- Are the six result fields visually distinct?
- Is the priority easy to identify?
- Is the owner easy to identify?
- Is the draft response readable?
- Can the user copy or review the draft response?
- Are errors understandable?
- Can the user submit another request without refreshing the page?
- Does the interface avoid unnecessary controls?

The interface should be simple and focused on the triage workflow.

---

## 11. Error and Edge-Case Tests

Test the following inputs:

### Very Short Request

> Help.

Expected behavior:

The system may produce a valid result, but the summary and draft should not invent missing context.

### Ambiguous Request

> Something is wrong with the system.

Expected behavior:

The system should provide a cautious classification and avoid inventing a specific failure.

### Request With a Deadline

> Please review this before tomorrow's client meeting.

Expected behavior:

The deadline may influence priority, but the system must not invent the exact meeting time or business impact.

### Request With No Urgency

> This is an idea for a future update. There is no deadline.

Expected behavior:

The system should generally avoid assigning Urgent priority.

### Request Asking for Pricing

> Can you tell me the price and implementation timeline?

Expected behavior:

The request should generally be recognized as a sales or commercial inquiry.

### Request Involving Potential Information Exposure

> A file containing customer information was shared with the wrong workspace.

Expected behavior:

The system should recognize the potential sensitivity and route it appropriately, without claiming that access was removed.

---

## 12. Regression Test Checklist

Run the complete regression checklist after any change to:

- The system prompt
- The response schema
- Category or owner rules
- Priority rules
- Provider adapter
- API route
- Frontend result rendering
- Error handling

Regression checklist:

- [ ] All six mock requests return valid results.
- [ ] All six results contain exactly six required fields.
- [ ] No invalid enum values are returned.
- [ ] Empty input is rejected.
- [ ] Provider failure is handled.
- [ ] Invalid AI output is rejected.
- [ ] New requests still work.
- [ ] Previous results do not leak into new submissions.
- [ ] Draft responses remain professional.
- [ ] No real-world action is falsely claimed.

---

## 13. Demonstration Test Plan

The challenge requires a video demonstration using at least three mock requests, including request 05.

A practical demonstration sequence is:

### Demonstration 1 — Request 02

Show an active technical outage.

Demonstrate:

- Technical category
- Urgent priority
- Engineering owner
- Priority reason
- Draft response

### Demonstration 2 — Request 03

Show a billing issue.

Demonstrate:

- Billing category
- Medium priority
- Finance owner
- Deadline-aware reasoning
- Professional draft response

### Demonstration 3 — Request 05

Show the wrong-workspace upload scenario.

Demonstrate:

- Recognition of potential information exposure
- Urgent handling
- Engineering routing
- Careful draft response
- No claim that access was actually removed

The demonstration should also briefly show that a new, unlisted request can be entered.

---

## 14. Evaluation Against the Challenge Rubric

### Functionality — 30%

Evidence to demonstrate:

- End-to-end request processing works.
- All required fields are returned.
- All six examples are supported.
- New requests are accepted.
- Errors are handled without breaking the interface.

### AI Judgment — 25%

Evidence to demonstrate:

- Categories are sensible.
- Priority is not assigned mechanically.
- Owners match the nature of the request.
- Priority reasons are grounded in the input.
- Draft responses are accurate and professional.

### Problem Solving — 20%

Evidence to demonstrate:

- Structured output is validated.
- The AI is not trusted blindly.
- The architecture is simple and practical.
- The prototype avoids unnecessary infrastructure.
- Limitations are understood and clearly explained.

### User Experience — 15%

Evidence to demonstrate:

- The workflow is easy to understand.
- Results are clearly presented.
- The draft response is reviewable.
- Errors and loading states are handled.

### Communication — 10%

Evidence to demonstrate:

- The solution can be explained clearly.
- Important trade-offs are understood.
- The video shows the product working.
- Limitations and next improvements are stated honestly.

---

## 15. GitHub Copilot Boundaries

Copilot must:

1. Implement tests against the contracts already defined.
2. Use the six challenge examples as fixtures.
3. Avoid hardcoding the six examples as the only supported inputs.
4. Test the complete request-to-response workflow.
5. Test invalid input and invalid AI output.
6. Avoid asserting exact wording for summaries or draft responses.
7. Prefer semantic assertions for category, priority, owner, and required fields.
8. Keep provider calls mockable in tests.
9. Avoid real external integrations.
10. Avoid adding production testing infrastructure.
11. Keep tests readable and focused on the prototype requirements.
12. Do not weaken validation merely to make tests pass.

---

## 16. Definition of Done

Testing is sufficient for the prototype when:

- All six mock requests have been tested.
- At least one new request has been tested.
- Request validation tests pass.
- Response schema tests pass.
- Provider failure handling has been tested.
- Invalid AI output handling has been tested.
- The frontend successfully displays all six required fields.
- The user can submit multiple requests sequentially.
- The interface provides understandable loading and error states.
- The results demonstrate sensible AI judgment.
- The system does not claim to perform real-world actions.
- The test results can be explained during the walkthrough.
