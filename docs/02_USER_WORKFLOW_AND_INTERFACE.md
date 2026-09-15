# Document 2: User Workflow and Interface

## 1. Overview

The AI Request Triage Assistant is a focused, single-page prototype for turning an unstructured business request into a clear, reviewable triage recommendation.

The interface should present the AI-generated triage result clearly so the person reviewing the request can quickly understand the recommended next step. The reviewer may be an internal employee, a partner, a customer-service representative, or another person responsible for deciding how the request should proceed. The interface must not assume a particular organizational role.

## 2. Interface objective

The interface should allow a person to:

1. Enter or paste a business request in natural language.
2. Ask the assistant to analyze the request.
3. Understand the resulting summary, classification, urgency, rationale, and recommended owner or next step.
4. Review and edit the drafted first response before using it.
5. Correct the input or retry the analysis when necessary.

The complete workflow should remain visible on one page so that the prototype is quick to learn, easy to demonstrate, and simple to implement.

## 3. Page layout

The page should use a clear top-to-bottom structure:

```text
AI Request Triage Assistant

Describe the business request
[ multiline request input                         ]
[ Analyze Request ]

Triage Result
Summary: ...
Category: ...
Priority: ...
Why this priority: ...
Recommended owner / next step: ...

Draft First Response
[ editable response                              ]
[ Analyze Another Request ]
```

The input area and action should appear first. The result area should be visually separated and should not appear as a completed result until analysis has finished. The most decision-relevant fields—priority and recommended next step—should be easy to scan.

## 4. Workflow states

The page should support these states:

### Initial state

- The request field is empty and ready for input.
- The Analyze Request button is available only when useful input has been entered.
- No result panel is shown, or the panel displays a neutral instruction to enter a request.

### Ready-to-analyze state

- The request field contains text that passes basic validation.
- The reviewer can submit the request for analysis.
- The input remains editable before submission.

### Analyzing state

- The Analyze Request button is disabled to prevent duplicate submissions.
- A visible loading indicator and short status message communicate that analysis is in progress.
- The submitted request remains visible.

### Result state

- The complete triage result is displayed in a consistent order.
- The draft first response is editable.
- The reviewer can inspect the result, edit the draft, or analyze another request.

### Error state

- The page explains what failed in plain language.
- The original request remains available for correction or retry.
- The reviewer is given a clear next action.

## 5. Input behavior

- Use a multiline text area because requests may contain context, several questions, or copied correspondence.
- Accept ordinary natural-language business requests without requiring a special format.
- Trim leading and trailing whitespace before analysis.
- Reject empty or whitespace-only input with an inline validation message.
- Provide a reasonable maximum length for the prototype and explain the limit if it is reached.
- Preserve the entered text while analysis is running and when an error occurs.
- Do not silently rewrite, summarize, or discard the request before it is analyzed.
- Allow the reviewer to replace the request and start a new analysis from the same page.

## 6. Result presentation

The result should be presented as labeled fields rather than as an unstructured block of generated text. At minimum, show:

- **Summary:** a concise description of the request.
- **Category:** the most appropriate request type or business area.
- **Priority:** the recommended urgency level.
- **Priority reason:** a short explanation grounded in the request.
- **Recommended owner / next step:** who or what should handle the request next, expressed without assuming the reviewer's role.
- **Draft first response:** a practical response that can be reviewed before use.

Use clear labels, sufficient spacing, and visual emphasis for priority and recommended next step. The result should help the reviewer answer quickly:

> What is this request, how urgent is it, and what should happen next?

If the AI is uncertain, the interface should make that uncertainty visible instead of presenting an unsupported conclusion as fact.

## 7. Review and edit actions

- The draft first response must be editable in place.
- Editing the draft must not change the displayed triage fields unless the reviewer explicitly starts a new analysis.
- The reviewer should be able to analyze another request without navigating to a separate page.
- Starting a new analysis should clear or replace the prior result only after the reviewer chooses the corresponding action.
- The prototype does not need to send the response, assign a real work item, or persist an official decision.

## 8. Errors and recovery

The interface should handle at least these cases:

- **Empty input:** explain that a request is required before analysis.
- **Input too long:** explain the limit and allow the reviewer to shorten the request.
- **Analysis failure:** state that the request could not be analyzed and provide a Retry action.
- **Malformed or incomplete AI output:** show a safe fallback message rather than rendering missing fields as if they were valid.
- **Unavailable service:** explain that analysis is temporarily unavailable and preserve the request for later retry.

Error messages should be specific enough to guide recovery, but should not expose implementation details, credentials, prompts, or raw service errors.

## 9. Non-goals

The prototype does not need to provide:

- A multi-page workflow, dashboard, queue, or request-history view.
- User accounts, permissions, role management, or organization-specific assumptions.
- Automatic sending of responses or automatic assignment to a real team.
- Persistent case management, audit history, notifications, or integrations with business systems.
- Fully autonomous decision-making or a guarantee that the AI classification is correct.
- Advanced customization of taxonomy, priority rules, or routing policies.
- Submission-specific material from the challenge; this document defines the product workflow and interface only.

## 10. Success criteria

The prototype is successful when:

- A reviewer can understand what to do without separate instructions.
- A valid request can be entered and analyzed from one page.
- The loading, result, and error states are distinguishable.
- The result clearly exposes the summary, category, priority, priority reason, and recommended next step.
- The reviewer can quickly identify the recommended next action.
- The draft response can be edited before it is used.
- Failed analysis does not erase the original request and can be retried.
- The interface does not imply that every reviewer is an internal team member.
- The experience is focused enough to demonstrate the complete request-to-triage flow in a short session.

## 11. Copilot implementation boundaries

Copilot may be used to accelerate implementation of the prototype's UI, request handling, result formatting, validation, and error-state behavior. The implementation should remain within the following boundaries:

- Copilot-generated code must implement the workflow described here; it must not introduce additional pages, integrations, or product capabilities without an explicit decision.
- The AI analysis contract should be explicit and validated before its fields are rendered.
- User-entered request text and the editable draft response must remain distinguishable from AI-generated content.
- The interface must not claim that an AI recommendation is a confirmed business decision.
- Client-side validation should provide immediate feedback, while service-side validation should remain authoritative.
- Secrets, credentials, private configuration, and sensitive diagnostic details must not be exposed in the interface or committed to the prototype.
- Generated code should favor simple, readable components and predictable state transitions over speculative abstraction.
- Any fallback or mock analysis used for demonstration must be clearly separated from production behavior and must not be presented as a live determination.
- Human review remains required for the triage recommendation and drafted response.
