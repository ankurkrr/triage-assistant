# AI Request Triage Assistant

## Product Requirements & Scope Lock

**Document ID:** PRD-001\
**Version:** 1.1\
**Status:** Approved for implementation planning\
**Product:** AI Request Triage Assistant

------------------------------------------------------------------------

## 1. Purpose

This document defines the product scope, functional requirements,
boundaries, and success criteria for the AI Request Triage Assistant.

It is intended to provide a stable foundation for architecture
decisions, implementation planning, and GitHub Copilot instructions.

The document distinguishes between:

-   Requirements stated in the technical challenge.
-   Product decisions made for this prototype.
-   Scope boundaries intended to prevent unnecessary complexity.

------------------------------------------------------------------------

## 2. Product Objective

Build a lightweight AI-powered assistant that transforms an unstructured
business request into a clear, actionable next step for an internal team
member.

The tool should reduce the manual effort involved in:

1.  Understanding an incoming request.
2.  Summarizing the request.
3.  Determining its category.
4.  Assessing its priority.
5.  Identifying the responsible owner.
6.  Drafting an initial professional response.

The prototype must focus on a reliable and understandable workflow
rather than a large, unfinished system.

------------------------------------------------------------------------

## 3. Source Requirements

The technical challenge requires the solution to:

-   Accept a written request as input.
-   Return a short summary.
-   Assign one category: Sales, Support, Billing, Technical, or Other.
-   Assign one priority: Low, Medium, High, or Urgent, with a brief
    reason.
-   Route the request to one owner: Sales Team, Client Success, Finance,
    or Engineering.
-   Draft a professional first response that a team member could review
    and send.
-   Present the results in a clear interface or workflow.

The solution must also handle the six supplied mock requests and accept
new requests that are not listed in the challenge.

------------------------------------------------------------------------

## 4. Target User

### Primary User

An internal professional-services team member who receives, reviews, or
responds to incoming business requests.

### User Goals

The user should be able to:

1.  Enter or paste a business request.
2.  Submit the request for analysis.
3.  Review the generated triage result.
4.  Understand the assigned priority and its reason.
5.  Identify the responsible owner.
6.  Review and, where practical, edit the drafted response.

------------------------------------------------------------------------

## 5. Core User Workflow

``` text
User enters a business request
            |
            v
Input validation
            |
            v
AI triage analysis
            |
            v
Structured output validation
            |
            v
Display triage result
            |
            v
Human reviews the result
            |
            v
Human may edit the drafted response
```

### Workflow Principles

-   The application controls the input and output contract.
-   The AI produces recommendations within predefined constraints.
-   The application validates the AI response before displaying it.
-   The user remains responsible for reviewing the result.
-   The prototype does not automatically send messages or execute
    external actions.

------------------------------------------------------------------------

## 6. Functional Requirements

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-01                   Accept a written        Must
                          business request as     
                          input.                  

  FR-02                   Generate a short        Must
                          summary of the request. 

  FR-03                   Assign exactly one      Must
                          permitted category.     

  FR-04                   Assign exactly one      Must
                          permitted priority.     

  FR-05                   Provide a brief,        Must
                          understandable reason   
                          for the assigned        
                          priority.               

  FR-06                   Route the request to    Must
                          exactly one permitted   
                          owner.                  

  FR-07                   Draft a professional    Must
                          first response.         

  FR-08                   Present the result in a Must
                          clear interface or      
                          workflow.               

  FR-09                   Present the drafted     Should
                          response in a way that  
                          allows the team member  
                          to review it and, where 
                          practical, edit it      
                          before sending.         

  FR-10                   Accept requests beyond  Must
                          the six supplied        
                          examples.               

  FR-11                   Handle invalid,         Must
                          incomplete, or failed   
                          AI responses            
                          gracefully.             

  FR-12                   Use only mock requests  Must
                          and user-entered test   
                          data; do not require    
                          real client or          
                          confidential            
                          information.            
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 7. Allowed Categories

The system must assign exactly one of the following categories:

``` text
Sales
Support
Billing
Technical
Other
```

### Category Constraints

-   The AI must not invent new categories.
-   The application must validate the category against this fixed list.
-   The category should represent the primary intent of the request.
-   If the request does not clearly fit the first four categories, use
    `Other`.

------------------------------------------------------------------------

## 8. Allowed Priorities

The system must assign exactly one of the following priorities:

``` text
Low
Medium
High
Urgent
```

Every priority must include a short reason.

### Priority Constraints

-   The AI must not invent additional priority levels such as
    `Critical`, `P0`, or `Emergency`.
-   The priority should be based on urgency, business impact,
    operational disruption, deadlines, and risk expressed in the
    request.
-   The reason must be grounded in the request.
-   The system must not claim facts that are not present in the input.

### Example

``` text
Priority: High

Reason:
The client portal has been unavailable since this morning,
preventing staff from accessing active customer records.
```

The exact priority rules will be defined in the AI Decision
Specification document.

------------------------------------------------------------------------

## 9. Allowed Owners

The system must route each request to exactly one of the following
owners:

``` text
Sales Team
Client Success
Finance
Engineering
```

### Owner Constraints

-   The AI must not invent new owner names.
-   The application must validate the owner against this fixed list.
-   Routing should be based on the primary business responsibility
    implied by the request.
-   The system should select one owner even when the request could
    involve multiple teams.

The detailed routing rules will be defined in the AI Decision
Specification document.

------------------------------------------------------------------------

## 10. Output Requirements

Each successful triage result must contain the following six fields:

1.  `summary`
2.  `category`
3.  `priority`
4.  `priority_reason`
5.  `owner`
6.  `draft_response`

The output must be structured and validated before being presented to
the user.

### Conceptual Output Example

``` text
Summary:
The client is interested in a custom AI reporting system and wants
pricing and an estimated implementation timeline.

Category:
Sales

Priority:
Medium

Priority Reason:
The request represents a potential business opportunity, but no
immediate deadline or operational impact is stated.

Owner:
Sales Team

Draft Response:
Thank you for reaching out. We would be happy to learn more about
your reporting requirements and discuss potential approaches,
pricing, and implementation timelines. Could we schedule an
introductory conversation to understand your goals and scope?
```

This example illustrates the output structure only. The final
classification rules will be specified separately.

------------------------------------------------------------------------

## 11. Non-Functional Requirements

  -----------------------------------------------------------------------
  Requirement                         Product Decision
  ----------------------------------- -----------------------------------
  Reliability                         Invalid AI output must not crash
                                      the interface.

  Explainability                      Every priority must include a
                                      human-readable reason.

  Consistency                         Similar requests should generally
                                      receive similar classifications.

  Usability                           Results should be understandable to
                                      a non-technical reviewer.

  Privacy                             Use only supplied mock requests and
                                      user-entered test data.

  Cost                                Prefer free or already-available
                                      tools; no paid infrastructure is
                                      required.

  Scope control                       Prioritize a focused working
                                      prototype over additional features.

  Maintainability                     Keep AI logic, validation, and
                                      interface responsibilities
                                      separate.

  Testability                         The core triage behavior should be
                                      testable using fixed mock requests
                                      and additional examples.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 12. Product Design Decisions

### 12.1 Human Review

The prototype generates a recommendation and a draft response for human
review.

The user should be able to inspect the result before taking any action.

### 12.2 No Automatic External Actions

The prototype will not:

-   Send emails automatically.
-   Modify customer records.
-   Change access permissions.
-   Create tickets in external systems.
-   Execute business workflows.

These actions may be considered future integrations but are not part of
the first prototype.

### 12.3 Fixed Controlled Vocabulary

Categories, priorities, and owners are controlled values.

The AI may reason about the request, but it must return values from the
application-defined lists.

### 12.4 Structured AI Output

The AI should return a structured result rather than unrestricted prose.

The application is responsible for validating the structure and handling
failures.

### 12.5 Single-Request Workflow

The first version will process one request at a time.

A batch-processing workflow, inbox integration, or queue-based
architecture is not required for the initial prototype.

------------------------------------------------------------------------

## 13. Explicitly Out of Scope

The following capabilities are not part of the first version:

-   Email inbox integration.
-   Website form integration.
-   Chat-platform integration.
-   Automatic email sending.
-   CRM or ticketing-system integration.
-   User authentication and role management.
-   Persistent customer database.
-   Fine-tuning a model.
-   Retrieval-augmented generation.
-   Vector databases.
-   Multi-agent orchestration.
-   Autonomous business actions.
-   Complex analytics dashboards.
-   Production-grade deployment infrastructure.
-   Automatic escalation workflows.
-   Custom category or owner creation.
-   Training a proprietary machine-learning model.

### Scope Rationale

The challenge requires a focused working prototype. These capabilities
would increase implementation complexity, latency, and failure points
without being necessary to demonstrate the core triage workflow.

------------------------------------------------------------------------

## 14. Success Criteria

The prototype is successful when:

1.  A user can enter a written business request.
2.  The system returns a complete triage result.
3.  The result contains:
    -   A short summary.
    -   One permitted category.
    -   One permitted priority.
    -   A brief priority reason.
    -   One permitted owner.
    -   A professional draft response.
4.  The system accepts requests beyond the six supplied examples.
5.  The six supplied mock requests can be processed and reviewed.
6.  Request 05 is handled with sensible judgment regarding its immediate
    access-removal requirement.
7.  The system does not crash when the AI returns malformed or
    incomplete output.
8.  The interface is understandable without requiring knowledge of the
    implementation.
9.  The architecture and AI logic can be explained clearly.
10. The prototype remains focused on triage and response drafting.

------------------------------------------------------------------------

## 15. Foundational Architecture Principle

The prototype follows this separation of responsibilities:

``` text
AI:
Understand the request and produce a recommendation.

Application:
Validate, constrain, normalize, and present the result.

Human:
Review the recommendation and decide what action to take.
```

### Principle

> The AI makes the recommendation. The application controls the
> contract. The human remains responsible for the final action.

This principle should guide the architecture, prompts, validation layer,
and user interface.

------------------------------------------------------------------------

## 16. Implementation Boundary for GitHub Copilot

When implementing this product, GitHub Copilot must follow these
constraints:

1.  Build only the functionality defined in this document.
2.  Do not add integrations unless explicitly requested in a later
    document.
3.  Do not introduce multi-agent orchestration.
4.  Do not introduce RAG, vector databases, or fine-tuning.
5.  Do not invent categories, priorities, or owners.
6.  Do not allow malformed AI output to reach the user interface
    unchecked.
7.  Do not automatically send messages or execute external actions.
8.  Keep the implementation simple, modular, typed, and testable.
9.  Prefer deterministic validation and controlled application logic
    over unnecessary AI complexity.
10. Do not expand the product scope based on assumptions.

------------------------------------------------------------------------

## 17. Document Status

This document defines the product boundary for the initial prototype.

The following documents will define the remaining details:

-   User Workflow & Interface Specification.
-   AI Decision Specification.
-   System Architecture & Technology Decisions.
-   Data Contracts & Validation Specification.
-   Copilot Engineering Rules.
-   Implementation Plan.
-   Evaluation & Test Cases.
-   Demo and Submission Plan.
