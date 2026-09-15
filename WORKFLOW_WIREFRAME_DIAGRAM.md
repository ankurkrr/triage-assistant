# AI Request Triage Assistant
## Low-Fidelity Workflow Wireframe

## 1. Detailed Vertical Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AI REQUEST TRIAGE ASSISTANT                               │
│                         END-TO-END WORKFLOW                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│ 1. USER INPUT        │
├──────────────────────┤
│ Enter business       │
│ request              │
│                      │
│ ┌──────────────────┐ │
│ │ Request text...  │ │
│ └──────────────────┘ │
│                      │
│ [Analyze Request]    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. API VALIDATION    │
├──────────────────────┤
│ Next.js API Route    │
│                      │
│ • Validate input     │
│ • Check request size │
│ • Prepare payload    │
│ • Apply system rules│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. AI PROVIDER       │
├──────────────────────┤
│ Provider abstraction │
│                      │
│ ┌──────────────────┐ │
│ │ Gemini Provider  │ │
│ └──────────────────┘ │
│          OR          │
│ ┌──────────────────┐ │
│ │ Mock Provider    │ │
│ └──────────────────┘ │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. AI CLASSIFICATION │
├──────────────────────┤
│ Apply classification │
│ policy               │
│                      │
│ • Generate summary   │
│ • Select category    │
│ • Select priority    │
│ • Explain priority   │
│ • Identify owner     │
│ • Draft response     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 5. OUTPUT VALIDATION │
├──────────────────────┤
│ Validate AI response │
│ using Zod schema     │
│                      │
│ • Required fields    │
│ • Valid category     │
│ • Valid priority     │
│ • Valid owner        │
│ • Correct structure  │
│                      │
│ Invalid? → Error     │
│ Valid?   → Continue  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 6. RESULT IN UI      │
├──────────────────────┤
│ Summary              │
│ Category             │
│ Priority             │
│ Priority reason      │
│ Recommended owner    │
│ Draft response       │
│                      │
│ [Edit Response]      │
│ [Copy Response]      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 7. HUMAN REVIEW      │
├──────────────────────┤
│ User reviews result  │
│                      │
│ • Confirm decision   │
│ • Edit draft         │
│ • Use final response │
└──────────────────────┘
```

## 2. Simplified Presentation Version

```text
┌──────────────┐
│ USER INPUT   │
│ Business     │
│ request      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ API LAYER    │
│ Validate     │
│ request      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AI PROVIDER  │
│ Gemini /     │
│ Mock         │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ CLASSIFY     │
│ Category     │
│ Priority     │
│ Owner        │
│ Draft        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ VALIDATE     │
│ Zod schema   │
│ Check output │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ RESULT UI    │
│ Structured   │
│ triage card  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ HUMAN REVIEW │
│ Edit and use │
│ response     │
└──────────────┘
```

## 3. Recommended Slide Layout

```text
                         AI REQUEST TRIAGE ASSISTANT
                              WORKFLOW

┌───────────┐     ┌───────────┐     ┌───────────┐
│   USER    │────▶│    API    │────▶│    AI     │
│  REQUEST  │     │ VALIDATE  │     │ PROVIDER  │
└───────────┘     └───────────┘     └─────┬─────┘
                                         │
                                         ▼
                                  ┌───────────┐
                                  │ CLASSIFY  │
                                  │           │
                                  │ Category  │
                                  │ Priority  │
                                  │ Owner     │
                                  │ Response  │
                                  └─────┬─────┘
                                        │
                                        ▼
                                  ┌───────────┐
                                  │  OUTPUT   │
                                  │ VALIDATE  │
                                  └─────┬─────┘
                                        │
                                        ▼
                                  ┌───────────┐
                                  │ RESULT UI │
                                  └─────┬─────┘
                                        │
                                        ▼
                                  ┌───────────┐
                                  │  HUMAN    │
                                  │  REVIEW   │
                                  └───────────┘
```

## 4. Supporting Notes

### API Layer

- Validates the incoming request.
- Checks the request format and size.
- Prepares the request for the AI provider.
- Applies the system prompt and classification policy.

### AI Provider

- Gemini is used for real language understanding and classification.
- The mock provider is used for deterministic development and testing.
- Provider abstraction allows the implementation to be changed or extended later.

### Classification

The AI produces:

- Summary
- Category
- Priority
- Priority reason
- Recommended owner
- Draft response

### Output Validation

The response is validated using the Zod schema to ensure:

- All required fields are present.
- Category is an allowed value.
- Priority is an allowed value.
- Owner is an allowed value.
- The response follows the required structure.

### Human Review

- The user reviews the result.
- The user can edit the draft response.
- The user can copy the response into an existing workflow.
- The system does not automatically send the response.

## 5. One-Line Workflow

```text
User Request
    ↓
API Validation
    ↓
AI Provider
    ↓
Classification Policy
    ↓
Structured Output
    ↓
Zod Validation
    ↓
Result in UI
    ↓
Human Review
```
