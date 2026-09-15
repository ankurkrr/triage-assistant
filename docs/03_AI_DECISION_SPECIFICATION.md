# AI Request Triage Assistant
## AI Decision Specification

**Document:** 03_AI_DECISION_SPECIFICATION.md  
**Version:** 1.0  
**Status:** Draft for implementation  
**Source basis:** Node Solutions AI Technical Challenge PDF

---

## 1. Purpose

This document defines how the AI Request Triage Assistant should interpret an unstructured business request and produce a consistent, reviewable triage result.

It is the behavioral contract between the product, the AI model, and the application validation layer.

The AI must transform a written request into:

1. A short summary
2. Exactly one category
3. Exactly one priority
4. A brief priority reason
5. Exactly one owner
6. A professional first-response draft

The challenge explicitly requires the tool to accept a written request, summarize it, assign one category, assign a priority with a brief reason, route it to one owner, draft a professional first response, and present the result clearly. The challenge also requires support for all six supplied mock requests and new requests not included in the examples.

---

## 2. Source Requirements Versus Design Decisions

### 2.1 Requirements directly stated in the challenge

The challenge defines the following required output values:

#### Categories

- Sales
- Support
- Billing
- Technical
- Other

#### Priorities

- Low
- Medium
- High
- Urgent

#### Owners

- Sales Team
- Client Success
- Finance
- Engineering

#### Required result information

- Short summary
- One category
- One priority
- Brief priority reason
- One owner
- Professional first response suitable for review and sending

The challenge does **not** prescribe exact classification results for the six examples. Therefore, the expected classifications in this document are implementation recommendations intended to make the prototype consistent and explainable.

### 2.2 Product design decisions

The following decisions are not explicitly prescribed by the challenge but are necessary to make the prototype reliable:

- Use a structured JSON output contract.
- Validate the model response in application code.
- Use constrained AI judgment rather than unrestricted free-form classification.
- Assign one primary category and one first-action owner.
- Treat the generated response as a draft for human review.
- Do not automatically send messages or perform external actions.
- Do not invent a Security or Compliance owner because those values are not included in the challenge’s allowed owner list.
- Route the wrong-workspace customer-data example to Engineering as the first-action owner when access removal or workspace permissions are required.
- Keep uncertainty visible through cautious wording rather than inventing facts.

---

## 3. Core Decision Principle

The AI should reason about the request in the following order:

```text
Unstructured Request
        ↓
Understand the requester’s intent
        ↓
Identify the main problem or opportunity
        ↓
Identify impact, urgency, deadline, and risk
        ↓
Determine the primary category
        ↓
Determine the priority
        ↓
Determine the first-action owner
        ↓
Write a brief factual reason
        ↓
Draft a professional first response
        ↓
Return structured output
```

The AI must not make decisions solely from isolated keywords.

For example:

- “ASAP” is an urgency signal, but it is not sufficient by itself to assign Urgent.
- “Technical” language does not automatically mean the request is Urgent.
- A request containing both commercial and technical language may still belong to Sales if its primary intent is to explore a purchase.
- A request containing customer data does not automatically prove that a data breach occurred.

---

## 4. Input Contract

### 4.1 Input format

The application sends one written business request as plain text.

Example:

```text
The client portal has been unavailable since this morning and our staff
cannot access active customer records. Please help as soon as possible.
```

### 4.2 Input characteristics

The request may contain:

- A support question
- A technical issue
- A billing concern
- A sales opportunity
- A feature request
- A complaint
- A security or privacy concern
- A deadline
- A statement of business impact
- Multiple signals in the same message

### 4.3 Input handling rules

The AI should:

- Read the entire request before deciding.
- Preserve the meaning of the request.
- Distinguish facts from assumptions.
- Identify explicit deadlines when present.
- Identify operational impact when present.
- Identify whether the request is current, future-oriented, or hypothetical.
- Avoid asking the application user to manually provide category, priority, or owner before analysis.

The application should reject empty or whitespace-only input before calling the model.

---

## 5. Output Contract

The AI must return exactly one object matching the following conceptual schema:

```json
{
  "summary": "Short factual summary of the request.",
  "category": "Technical",
  "priority": "Urgent",
  "priority_reason": "The portal is unavailable and staff cannot access active customer records, indicating an active operational blockage.",
  "owner": "Engineering",
  "draft_response": "Thank you for reporting this issue. We understand that the client portal has been unavailable since this morning and that staff cannot access active customer records. The request should be reviewed promptly by the Engineering team."
}
```

### 5.1 Allowed category values

```text
Sales
Support
Billing
Technical
Other
```

### 5.2 Allowed priority values

```text
Low
Medium
High
Urgent
```

### 5.3 Allowed owner values

```text
Sales Team
Client Success
Finance
Engineering
```

### 5.4 Field requirements

| Field | Requirement |
|---|---|
| `summary` | Short, factual, non-empty summary |
| `category` | Exactly one allowed category |
| `priority` | Exactly one allowed priority |
| `priority_reason` | Brief explanation grounded in the request |
| `owner` | Exactly one allowed owner |
| `draft_response` | Professional response suitable for human review |

The model must not return multiple categories, multiple priorities, or multiple owners.

---

## 6. Category Decision Specification

Category represents the primary nature of the request.

The AI should identify the main requested action rather than classify based only on individual words.

### 6.1 Sales

Assign `Sales` when the primary intent is commercial exploration or a potential new engagement.

Typical signals:

- Asking about pricing
- Asking about a proposal
- Asking about a typical timeline before purchase
- Expressing interest in a product or service
- Requesting a demonstration
- Exploring a custom solution
- Discussing a possible new engagement

Typical owner:

```text
Sales Team
```

Example:

```text
I am interested in a custom AI reporting system. What would pricing and
a typical timeline look like?
```

Expected category:

```text
Sales
```

### 6.2 Support

Assign `Support` when the requester needs help using an existing service or needs general assistance that does not primarily require technical investigation or billing review.

Typical signals:

- How-to questions
- General product guidance
- Existing-service assistance
- Process clarification
- Coordination or follow-up
- Non-technical operational questions

Typical owner:

```text
Client Success
```

### 6.3 Billing

Assign `Billing` when the primary issue concerns financial records, charges, invoices, payments, refunds, or billing discrepancies.

Typical signals:

- Duplicate charge
- Incorrect invoice
- Payment question
- Refund request
- Billing discrepancy
- Charge review
- Payment processing concern

Typical owner:

```text
Finance
```

Example:

```text
Invoice NS-1048 appears to include the same implementation charge twice.
Can someone review it before payment is processed Friday?
```

Expected category:

```text
Billing
```

### 6.4 Technical

Assign `Technical` when the primary issue requires technical investigation, system intervention, implementation, integration work, automation, access-control changes, or defect resolution.

Typical signals:

- System outage
- Portal unavailable
- Error or failure
- Integration issue
- Automation request
- Technical implementation
- Product defect
- Performance issue
- Infrastructure issue
- Workspace permission or access-removal action

Typical owner:

```text
Engineering
```

Examples:

- Portal unavailable and users cannot access records
- Automating data entry across multiple systems
- Removing access from an incorrectly configured workspace

### 6.5 Other

Assign `Other` when the request does not clearly fit Sales, Support, Billing, or Technical.

Typical signals:

- General feedback
- Future ideas without a concrete implementation request
- Administrative matters outside the defined routing groups
- Insufficient information to confidently select another category

Typical owner:

```text
Client Success
```

`Other` is a fallback category. The AI should not use it merely because the request is unusual if the primary intent clearly fits another category.

---

## 7. Category Conflict Resolution

A request may contain more than one type of signal. The AI must still assign exactly one category.

Use the following order of reasoning:

1. Identify the primary requested action.
2. Identify the main business problem or objective.
3. Determine whether secondary information changes the primary intent.
4. Assign one category only.

### Example: Sales plus Technical language

```text
We are interested in a custom AI reporting system and would like to know
whether it can integrate with our existing platform.
```

Recommended category:

```text
Sales
```

Reason:

The primary intent is to explore a potential commercial engagement. Integration is a secondary requirement.

### Example: Technical issue plus Support language

```text
We already use the portal, but it is failing and staff cannot access records.
```

Recommended category:

```text
Technical
```

Reason:

The primary action is technical investigation and restoration of service.

### Example: Billing issue plus deadline

```text
Please review this duplicate charge before Friday’s payment.
```

Recommended category:

```text
Billing
```

Reason:

The primary issue is a billing discrepancy. The deadline affects priority, not category.

---

## 8. Priority Decision Specification

Priority represents how urgently the request should receive attention.

The AI should consider:

- Current operational impact
- Whether work is blocked
- Number or breadth of people affected
- Security or privacy exposure
- Explicit deadlines
- Business or financial consequences
- Whether the request is informational, exploratory, or actionable
- Whether the issue is ongoing
- Whether immediate containment may be required

Priority must be based on the underlying situation, not only the requester’s wording.

### 8.1 Low

Use `Low` when:

- The request is informational or exploratory.
- No immediate operational impact is described.
- No meaningful deadline is present.
- The request concerns a future idea.
- The requester can continue working without assistance.
- The issue is a minor improvement or suggestion.

Example:

```text
Can you add dark mode and change the dashboard font? There is no deadline.
I am collecting ideas for a future update.
```

Recommended priority:

```text
Low
```

### 8.2 Medium

Use `Medium` when:

- The request needs attention but does not block current work.
- The request has a normal business deadline.
- The issue affects a limited process.
- The requester needs review or guidance but no immediate intervention is described.
- The request is important but not severely disruptive.

Example:

```text
An invoice appears to contain a duplicate charge. Please review it before
payment is processed Friday.
```

Recommended priority:

```text
Medium
```

The exact priority may be raised if the request includes material financial impact or a very short deadline, but the AI must not invent either.

### 8.3 High

Use `High` when:

- The request has meaningful business impact.
- A deadline is approaching and failure to act may cause a material consequence.
- A business process is materially affected.
- The issue requires timely intervention but is not clearly an active critical outage or immediate security exposure.
- The request may cause significant operational or financial disruption if ignored.

Examples:

- A business-critical workflow is failing for a department.
- A billing discrepancy may delay an important payment.
- A major implementation dependency requires prompt review.

### 8.4 Urgent

Use `Urgent` when:

- A live system or essential workflow is unavailable.
- Staff cannot access required records or perform critical work.
- There is an active security or privacy exposure requiring immediate containment.
- Immediate action is needed to prevent ongoing harm.
- The request explicitly describes severe and active operational impact.

Examples:

- The portal has been unavailable since morning and staff cannot access active customer records.
- Customer contact information was uploaded to the wrong workspace and immediate access removal is required.

Important rule:

> `Urgent` means the situation requires immediate attention based on impact, exposure, or active blockage. It does not mean only that the requester used words such as “ASAP” or “immediately.”

---

## 9. Security and Privacy-Related Requests

The challenge includes a request involving customer contact information uploaded to the wrong workspace.

The AI should recognize the potential risk without overstating the facts.

### 9.1 Correct interpretation

The AI may state:

> Customer contact information may be accessible from an unintended workspace, creating a potential access-control or privacy exposure.

The AI must not state:

- A data breach definitely occurred.
- Unauthorized users definitely accessed the data.
- A legal violation occurred.
- The data has already been removed.
- The incident has already been escalated.

### 9.2 Recommended category

```text
Technical
```

Reason:

The immediate requested action is removing access from the wrong workspace, which requires access-control or workspace-level intervention.

### 9.3 Recommended owner

```text
Engineering
```

This is a prototype design decision based on the available owner list. The challenge does not provide a Security or Compliance owner. Engineering is therefore the closest first-action owner for access removal or permission changes.

The draft response may acknowledge the potential exposure and state that the request requires prompt review. It must not claim that access has already been removed.

---

## 10. Owner Routing Specification

Owner assignment should reflect the team responsible for the first actionable step.

| Primary work required | Owner |
|---|---|
| New commercial opportunity, pricing, proposal, potential engagement | Sales Team |
| Existing-service guidance, general assistance, coordination | Client Success |
| Invoice, charge, payment, refund, billing discrepancy | Finance |
| Outage, defect, integration, automation, technical implementation, access-control change | Engineering |
| Unclear or non-standard request | Client Success |

### 10.1 One-owner rule

The AI must assign exactly one owner.

Invalid output:

```text
Engineering and Client Success
```

Valid output:

```text
Engineering
```

If another team may need to coordinate later, the AI should still select the team responsible for the first actionable step.

### 10.2 Owner examples

#### Automation request

```text
Our team enters the same customer details into three systems. Could this
be automated?
```

Owner:

```text
Engineering
```

#### Pricing and timeline request

```text
I am interested in a custom AI reporting system. What would pricing and a
typical timeline look like?
```

Owner:

```text
Sales Team
```

#### Invoice discrepancy

```text
The invoice appears to include the same implementation charge twice.
```

Owner:

```text
Finance
```

#### Future design suggestion

```text
Please consider dark mode and a different dashboard font for a future update.
```

Owner:

```text
Client Success
```

#### Wrong workspace access

```text
Customer contact information was uploaded to the wrong workspace and access
needs to be removed immediately.
```

Owner:

```text
Engineering
```

---

## 11. Priority Reason Specification

The `priority_reason` field must be:

- Brief
- Factual
- Directly connected to the selected priority
- Specific enough to justify the decision
- Free from unsupported assumptions

### Weak reason

```text
This is urgent because it is important.
```

### Strong reason

```text
The portal is unavailable and staff cannot access active customer records,
indicating an active operational blockage.
```

### Another strong reason

```text
The request concerns a potential duplicate invoice charge and includes a
payment deadline, so timely Finance review is appropriate.
```

The reason should explain the priority, not repeat the category or owner without justification.

---

## 12. Draft Response Specification

The draft response is a professional first response that a team member could review and send.

### 12.1 Required qualities

The draft should:

- Acknowledge the request.
- Reflect the request accurately.
- Use professional and neutral language.
- Be concise.
- Avoid unsupported promises.
- Avoid claiming that action has already been taken.
- Avoid inventing timelines.
- Avoid inventing ticket numbers.
- Avoid inventing technical root causes.
- Avoid confirming refunds, removals, or resolutions that have not occurred.
- Be suitable for human review before sending.

### 12.2 The draft may

- Confirm that the request has been received.
- Restate the issue briefly.
- Mention that the appropriate team should review it.
- Ask for additional information when necessary.
- Explain the next reasonable review step in neutral language.

### 12.3 The draft must not

- Promise resolution by a specific time unless the request itself provides that commitment.
- Claim that Finance, Engineering, or another team has already been contacted.
- Claim that access has already been removed.
- Confirm a refund or credit.
- State that a security incident definitely occurred.
- Invent a case number or ticket ID.
- Invent customer details.
- State a technical diagnosis that is not present in the request.

### 12.4 Example

Input:

```text
The client portal has been unavailable since this morning and our staff
cannot access active customer records. Please help as soon as possible.
```

Draft response:

```text
Thank you for reporting this issue. We understand that the client portal
has been unavailable since this morning and that staff cannot access active
customer records. The request should be reviewed promptly by the Engineering
team.
```

This wording does not claim that Engineering has already acted or that the issue has been resolved.

---

## 13. Handling Missing or Ambiguous Information

The AI should produce the required result whenever a reasonable interpretation is possible.

If information is missing:

- Do not invent facts.
- Use cautious wording.
- Select the closest valid category.
- Assign a conservative priority unless the available evidence supports a higher one.
- Write a draft response that requests clarification if necessary.

Example:

```text
Please fix the issue.
```

Possible result:

- Category: `Other` or `Support`, depending on available context
- Priority: `Medium` or `Low`
- Owner: `Client Success`
- Draft response asks the requester to provide details about the issue

The AI must not create a new category such as `Unknown` or a new owner such as `Operations`.

---

## 14. Handling Multiple Issues in One Request

The prototype produces one triage result per submitted request.

If the input contains multiple unrelated issues, the AI should:

1. Identify the dominant or primary actionable issue.
2. Mention the presence of multiple issues in the summary if relevant.
3. Assign one category.
4. Assign one priority.
5. Assign one owner.
6. Avoid returning multiple classification values.

If one issue is clearly more consequential than the others, the priority should reflect the most consequential actionable issue.

This is a documented prototype limitation. A future version could split compound requests into separate triage items, but that is outside the current scope.

---

## 15. Expected Results for the Six Mock Requests

These are recommended expected outcomes for consistent prototype behavior. The challenge requires the tool to handle all six examples but does not explicitly prescribe these exact classifications.

### Request 01

**Input**

```text
Our team has 40 employees entering the same customer details into three
systems. Could you show us how this might be automated? We would like to
speak next week.
```

**Recommended result**

```json
{
  "summary": "The team wants to explore automating repeated customer-data entry across three systems and discuss the possibility next week.",
  "category": "Technical",
  "priority": "Medium",
  "priority_reason": "The request concerns a potential automation solution affecting a repeated workflow, with a discussion requested for next week but no immediate outage or blockage.",
  "owner": "Engineering",
  "draft_response": "Thank you for reaching out. We understand that your team is entering the same customer details into three systems and would like to explore automation. The Engineering team can review the workflow requirements and help assess a suitable approach."
}
```

**Reasoning**

- Primary intent: Explore automation.
- Category: Technical because automation implementation is the main requested work.
- Priority: Medium because there is a near-term discussion request but no immediate operational failure.
- Owner: Engineering because the first action is technical feasibility review.

### Request 02

**Input**

```text
The client portal has been unavailable since this morning and our staff
cannot access active customer records. Please help as soon as possible.
```

**Recommended result**

```json
{
  "summary": "The client portal has been unavailable since morning, preventing staff from accessing active customer records.",
  "category": "Technical",
  "priority": "Urgent",
  "priority_reason": "An active system outage is preventing staff from accessing required customer records and is blocking current work.",
  "owner": "Engineering",
  "draft_response": "Thank you for reporting this issue. We understand that the client portal has been unavailable since this morning and that staff cannot access active customer records. The request should be reviewed promptly by the Engineering team."
}
```

**Reasoning**

- Category: Technical.
- Priority: Urgent because there is an active outage and operational blockage.
- Owner: Engineering.

### Request 03

**Input**

```text
Invoice NS-1048 appears to include the same implementation charge twice.
Can someone review it before payment is processed Friday?
```

**Recommended result**

```json
{
  "summary": "The requester believes invoice NS-1048 contains a duplicate implementation charge and wants it reviewed before Friday's payment.",
  "category": "Billing",
  "priority": "Medium",
  "priority_reason": "The request concerns a possible duplicate charge and includes a payment deadline, requiring timely but not clearly emergency review.",
  "owner": "Finance",
  "draft_response": "Thank you for bringing this to our attention. We understand that invoice NS-1048 may include the same implementation charge twice and that you would like it reviewed before payment is processed Friday. The Finance team should review the invoice and confirm the appropriate next step."
}
```

**Reasoning**

- Category: Billing.
- Priority: Medium because a deadline exists but no immediate severe financial impact is stated.
- Owner: Finance.

### Request 04

**Input**

```text
Can you add dark mode and change the dashboard font? There is no deadline.
I am collecting ideas for a future update.
```

**Recommended result**

```json
{
  "summary": "The requester suggests adding dark mode and changing the dashboard font as possible future improvements.",
  "category": "Other",
  "priority": "Low",
  "priority_reason": "The request is a future-oriented product suggestion with no deadline or immediate operational impact.",
  "owner": "Client Success",
  "draft_response": "Thank you for sharing these ideas. We have noted your suggestions for dark mode and a different dashboard font as potential future improvements. The team can consider them as part of future product planning."
}
```

**Reasoning**

- Category: Other because the request is a future idea rather than an active support, billing, sales, or technical implementation request.
- Priority: Low.
- Owner: Client Success for coordination and feedback handling.

### Request 05

**Input**

```text
We accidentally uploaded a spreadsheet containing customer contact
information to the wrong workspace. We need immediate help removing access.
```

**Recommended result**

```json
{
  "summary": "Customer contact information was uploaded to the wrong workspace and immediate access removal is requested.",
  "category": "Technical",
  "priority": "Urgent",
  "priority_reason": "Customer information may be accessible from an unintended workspace, creating a potential access-control or privacy exposure that requires immediate containment.",
  "owner": "Engineering",
  "draft_response": "Thank you for reporting this promptly. We understand that a spreadsheet containing customer contact information was uploaded to the wrong workspace and that access needs to be removed immediately. The request requires urgent review by the Engineering team to assess the workspace access and determine the appropriate containment step."
}
```

**Reasoning**

- Category: Technical because access removal is the immediate requested action.
- Priority: Urgent because potential exposure of customer information requires immediate containment.
- Owner: Engineering because the available owner list has no Security or Compliance team and Engineering is responsible for access-control changes.

### Request 06

**Input**

```text
I saw your company online and am interested in a custom AI reporting system.
What would pricing and a typical timeline look like?
```

**Recommended result**

```json
{
  "summary": "A potential customer is interested in a custom AI reporting system and is asking about pricing and a typical timeline.",
  "category": "Sales",
  "priority": "Medium",
  "priority_reason": "The request represents a potential commercial opportunity requiring follow-up, but no immediate deadline or urgent business impact is stated.",
  "owner": "Sales Team",
  "draft_response": "Thank you for your interest in a custom AI reporting system. We would be happy to discuss your requirements and provide an overview of potential pricing and typical timelines. The Sales Team can coordinate the next conversation."
}
```

**Reasoning**

- Category: Sales.
- Priority: Medium because it is an active commercial inquiry but has no urgent deadline.
- Owner: Sales Team.

---

## 16. Application-Level Validation

The AI response must not be trusted solely because it is returned by a model.

The application must validate the result before displaying it.

### Required validation checks

- The response is valid JSON or can be parsed into the expected structured format.
- All six required fields are present.
- Each field is non-empty.
- `category` is one of the five allowed values.
- `priority` is one of the four allowed values.
- `owner` is one of the four allowed values.
- Exactly one category is present.
- Exactly one priority is present.
- Exactly one owner is present.
- No unsupported routing values are accepted.
- The response is not displayed as a successful result if validation fails.

### Recommended processing pipeline

```text
Model Request
     ↓
Structured Model Response
     ↓
JSON Parsing
     ↓
Schema Validation
     ↓
Enum Validation
     ↓
Business-Rule Validation
     ↓
UI Rendering
```

If validation fails, the application should show a clear error and allow the user to retry. It should not silently display malformed or partially valid data.

---

## 17. AI Prompt Boundaries

The eventual system prompt should instruct the model to:

- Act as a business-request triage assistant.
- Analyze the complete request.
- Use only the allowed categories, priorities, and owners.
- Assign exactly one value for each classification field.
- Ground all decisions in the supplied request.
- Avoid inventing facts.
- Provide a brief priority reason.
- Produce a professional draft response.
- Return only the required structured output.
- Treat the draft response as a reviewable draft, not an automatically sent message.

The prompt should not allow the model to:

- Create new categories.
- Create new priorities.
- Create new owners.
- Return multiple owners.
- Perform external actions.
- Claim that another team has already acted.
- Invent ticket numbers, deadlines, customer details, or resolutions.
- Replace the structured output with a long explanation.

---

## 18. Copilot Implementation Boundaries

GitHub Copilot should implement this document without expanding the product scope.

Copilot must not:

- Add new categories, priorities, or owners.
- Hardcode only the six examples.
- Use keyword matching as the sole classification method.
- Put classification logic only in the frontend.
- Allow arbitrary model output to be displayed without validation.
- Add automatic email, ticket, Slack, CRM, or database actions.
- Add authentication, user management, RAG, vector search, fine-tuning, or multi-agent orchestration unless separately requested.
- Invent a Security, Compliance, Operations, or Product owner.
- Add a confidence score unless explicitly requested.
- Change the required output schema without updating this specification.
- Treat the model’s draft response as an action that has already occurred.

The implementation should preserve this separation:

```text
AI interprets and recommends
        ↓
Application validates and controls
        ↓
Human reviews and decides what to send or do
```

---

## 19. Out of Scope for This Document

This document does not define:

- Frontend layout
- API framework
- Model provider
- Prompt versioning infrastructure
- Authentication
- Persistent storage
- External integrations
- Ticket creation
- Email sending
- Monitoring dashboards
- Production deployment
- Multi-request queue management
- Security incident management processes

Those concerns belong in separate technical documents.

---

## 20. Acceptance Criteria

The AI decision implementation is acceptable when:

- It returns all six required fields.
- It uses only the allowed category, priority, and owner values.
- It assigns exactly one category, priority, and owner.
- It produces a short factual summary.
- It provides a brief, evidence-based priority reason.
- It produces a professional draft response.
- It handles all six mock requests.
- It accepts new requests beyond the supplied examples.
- It does not invent facts or claim actions have already occurred.
- It identifies the outage example as a high-impact technical issue.
- It identifies the invoice example as a billing issue.
- It identifies the future idea as low priority.
- It recognizes the wrong-workspace example as a potential access-control or privacy exposure.
- The application validates the model response before rendering it.
- The output remains understandable to the person reviewing the request.

---

## 21. Guiding Principle

> The AI should understand the request and recommend a sensible next step. The application should enforce the allowed structure and validate the result. A human should remain responsible for reviewing and acting on the recommendation.
