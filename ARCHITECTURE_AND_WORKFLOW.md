# AI Request Triage Assistant — Architecture & Workflow Specification

This document provides a comprehensive technical architecture and end-to-end operational workflow breakdown for the **AI Request Triage Assistant**.

---

## 1. System Architecture Overview

The system follows a clean, layered architecture separating the **Presentation Layer (UI)**, **API Route Handler**, **Configuration & Provider Factory**, **AI Provider Engine**, and **Schema Validation Layer**.

```mermaid
graph TD
    subgraph Client ["Client Layer (Browser)"]
        UI["Next.js React Client (app/page.tsx)"]
        CSS["Custom CSS Design System (app/globals.css)"]
        SampleButtons["Mock Sample Scenario Buttons"]
        DraftEditor["Editable Draft Response & 1-Click Copy"]
    end

    subgraph API ["Backend API Layer (Next.js App Router)"]
        RouteHandler["POST /api/triage (app/api/triage/route.ts)"]
        ReqValidator["Input Request Validator (TriageRequestSchema)"]
        ErrHandler["Standardized Error Handler & HTTP Status Mapper"]
    end

    subgraph Config ["Configuration & Factory Layer"]
        ConfigModule["Server Config (lib/config.ts)"]
        EnvLocal[".env.local Environment Variables"]
        Factory["Provider Factory (lib/ai/factory.ts)"]
    end

    subgraph Providers ["AI Provider Abstraction Layer (lib/ai/)"]
        ProviderInterface["AiProvider Interface (lib/ai/provider.ts)"]
        MockProvider["MockAiProvider (lib/ai/mock-provider.ts)"]
        GeminiProvider["GeminiAiProvider (lib/ai/gemini-provider.ts)"]
        PromptEngine["System Prompt & Policies (lib/ai/prompts.ts)"]
    end

    subgraph Resilience ["Resilience & Multi-Key Cascade"]
        PrimaryClient["Primary Client (GEMINI_API_KEY)"]
        FallbackClient["Fallback Client (GEMINI_API_KEY1)"]
        ModelCascade["Model Candidate Cascade (Flash-Lite -> Flash)"]
        RetryEngine["Transient Error Retry & Timeout Race"]
    end

    subgraph Validation ["Schema Validation & Data Model (lib/triage/)"]
        RespValidator["Result Validator (TriageResultSchema)"]
        Constants["Enums: CATEGORIES, PRIORITIES, OWNERS"]
    end

    %% Connections
    UI -->|JSON Payload: request| RouteHandler
    RouteHandler --> ReqValidator
    ReqValidator --> Factory
    ConfigModule --> EnvLocal
    Factory --> ConfigModule
    Factory -->|AI_PROVIDER=mock| MockProvider
    Factory -->|AI_PROVIDER=gemini| GeminiProvider
    GeminiProvider --> PromptEngine
    GeminiProvider --> PrimaryClient
    PrimaryClient -.->|On 429 Quota / 503 Capacity| FallbackClient
    PrimaryClient --> ModelCascade
    FallbackClient --> ModelCascade
    GeminiProvider --> RetryEngine
    GeminiProvider --> RespValidator
    MockProvider --> RespValidator
    RespValidator --> Constants
    RespValidator -->|Validated TriageResult| RouteHandler
    RouteHandler -->|HTTP 200 JSON| UI
```

---

## 2. End-to-End Operational Workflow

The following sequence diagram details the lifecycle of an incoming business request from user entry to the rendered triage cards and editable draft response:

```mermaid
sequenceDiagram
    autonumber
    actor User as Business User / Agent
    participant Browser as Web Browser (UI)
    participant Route as POST /api/triage
    participant Validator as Zod Request Validator
    participant Factory as Provider Factory
    participant Gemini as GeminiAiProvider
    participant Google as Google Gemini API (@google/genai)
    participant RespVal as Zod Result Validator

    User->>Browser: Enters/pastes unstructured request
    User->>Browser: Clicks "Analyze Request"
    Browser->>Browser: Set status="loading", disables inputs, displays spinner
    Browser->>Route: POST /api/triage { request: "..." }
  
    Route->>Validator: TriageRequestSchema.safeParse(body)
    alt Invalid Input (empty, whitespace, non-string, >4000 chars)
        Validator-->>Route: Validation Error
        Route-->>Browser: HTTP 400 { error: { code: "INVALID_REQUEST", message: "..." } }
        Browser-->>User: Display red validation error banner
    else Valid Input
        Validator-->>Route: Validated request text
        Route->>Factory: createAiProvider()
        Factory->>Factory: Inspect config.AI_PROVIDER
      
        alt AI_PROVIDER == "mock"
            Factory-->>Route: MockAiProvider instance
            Route->>MockProvider: generateTriageResult(input)
            MockProvider-->>Route: Deterministic Triage Result
        else AI_PROVIDER == "gemini"
            Factory-->>Route: GeminiAiProvider instance
            Route->>Gemini: generateTriageResult({ systemPrompt, userRequest })
          
            loop Candidate Models & Key Failover
                Gemini->>Google: models.generateContent(candidateModel, schema, prompt)
                alt Success (HTTP 200)
                    Google-->>Gemini: Structured JSON String
                else 429 Quota / 503 Capacity / 404 Deprecated
                    Gemini->>Gemini: Cascade to next candidate model or fallback key (GEMINI_API_KEY1)
                end
            end
          
            Gemini-->>Route: Parsed JSON data
        end

        Route->>RespVal: TriageResultSchema.safeParse(rawResult)
        alt Model Output Schema Violation
            RespVal-->>Route: Validation Error
            Route-->>Browser: HTTP 502 { error: { code: "AI_INVALID_OUTPUT", message: "..." } }
            Browser-->>User: Display error banner
        else Valid Schema
            RespVal-->>Route: Validated TriageResult
            Route-->>Browser: HTTP 200 OK { summary, category, priority, priorityReason, owner, draftResponse }
            Browser->>Browser: Update UI state (status="success")
            Browser-->>User: Render Triage Summary, Category Tag, Priority Badge, Owner, and Editable Draft
        end
    end

    opt User Actions
        User->>Browser: Edits draft response in textarea
        User->>Browser: Clicks "Copy Response"
        Browser->>User: Copies text to clipboard & shows "Copied!" checkmark
    end
```

---

## 3. Detailed Component Breakdown

### 3.1 Presentation Layer (`app/`)

- **`app/page.tsx`**: Single-page application managing reactive states:
  - `status`: `'idle' | 'loading' | 'success' | 'error'`
  - `requestText`: Raw input string with live character counter.
  - `result`: Holds the validated `TriageResult` object.
  - `draftResponse`: Editable response state detached from raw result.
  - `errorMessage`: Sanitized user-facing error message.
  - `copied`: Feedback state for the 1-click clipboard button.
- **`app/globals.css`**: Design tokens adhering to modern dark mode standards:
  - Surface elevation: Background `#0b0f17`, Surface `#111827`, Card `#1a2234`, Border `#2d3748`.
  - Color-coded priority badges:
    - `Urgent`: Red `#ef4444` background with `#dc2626` border.
    - `High`: Amber/Orange `#f59e0b`.
    - `Medium`: Blue `#3b82f6`.
    - `Low`: Slate `#64748b`.
  - Responsive down to 320px mobile viewports.

### 3.2 Route Handler Layer (`app/api/triage/route.ts`)

- Implements strict input parsing before triggering backend resources.
- Centralized HTTP status code mapping:| Error Code                 | HTTP Status   | Meaning                                          |
  | :------------------------- | :------------ | :----------------------------------------------- |
  | `INVALID_REQUEST`        | **400** | Malformed JSON, empty request, or schema failure |
  | `OUT_OF_SCOPE`           | **422** | Non-business requests                            |
  | `AI_RATE_LIMITED`        | **429** | API quota or rate limit exceeded                 |
  | `AI_INVALID_OUTPUT`      | **502** | Model response failed schema parsing             |
  | `AI_SERVICE_UNAVAILABLE` | **503** | Upstream model at capacity or overloaded         |
  | `AI_TIMEOUT`             | **504** | Execution exceeded configured timeout limit      |
  | `INTERNAL_ERROR`         | **500** | Unexpected runtime exception                     |

### 3.3 Configuration & Provider Factory (`lib/config.ts` & `lib/ai/factory.ts`)

- **`getServerConfig()`**: Validates server environment variables using Zod:
  - `AI_PROVIDER`: `'mock' | 'gemini'` (default: `'mock'`).
  - `AI_MODEL`: Primary model (e.g. `'gemini-3.5-flash-lite'`).
  - `GEMINI_API_KEY`: Primary Google API key.
  - `GEMINI_API_KEY1`: Optional fallback Google API key.
  - `AI_TIMEOUT_MS`: Request timeout in ms (default: `45000`).
  - `AI_MAX_RETRIES`: Number of transient retries (default: `1`).
- **`createAiProvider()`**: Returns the selected provider conforming to the `AiProvider` interface without exposing vendor-specific details to the API route.

### 3.4 AI Provider Engine (`lib/ai/`)

- **`AiProvider` Interface (`lib/ai/provider.ts`)**:
  ```typescript
  export interface AiProvider {
    readonly name: string;
    generateTriageResult(input: AiProviderInput): Promise<unknown>;
  }
  ```
- **`GeminiAiProvider` (`lib/ai/gemini-provider.ts`)**:
  - Uses `@google/genai` with structured JSON output enforcement (`responseSchema`).
  - **Multi-Key Fallback**: Stores both primary client and fallback client. If the primary key hits quota (`429`), it transparently switches to the fallback key pool.
  - **Candidate Model Cascade**: Gracefully cascades through active models:
    `[config.AI_MODEL, 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash']`.
  - **Transient Error Retry**: Automatically retries `503`, network disconnects (`ECONNRESET`), and timeouts.
- **`MockAiProvider` (`lib/ai/mock-provider.ts`)**:
  - Offline-first deterministic rule engine covering the 6 primary business challenge scenarios and edge cases with zero latency and no external network dependencies.

### 3.5 Schema & Data Contracts (`lib/triage/`)

- **`CATEGORIES`**: `['Sales', 'Support', 'Billing', 'Technical', 'Other']`
- **`PRIORITIES`**: `['Low', 'Medium', 'High', 'Urgent']`
- **`OWNERS`**: `['Sales Team', 'Client Success', 'Finance', 'Engineering']`
- **`TriageResultSchema`**: Validates that all six output fields exist, are non-empty strings, and conform strictly to the allowed enums.

---

## 4. Operational Classification & Routing Rules

The system prompt enforces the following business logic:

---

## 5. Security & Boundary Architecture

1. **Server-Side Secret Isolation**:
   - `GEMINI_API_KEY` and `GEMINI_API_KEY1` are strictly server-side variables.
   - None of the keys are prefixed with `NEXT_PUBLIC_*`, ensuring they are never bundled into client JavaScript.
2. **No Unchecked Free-Form Prompts**:
   - The user cannot supply system instructions; the system prompt is hardcoded and controlled on the server.
3. **No External Autonomous Actions**:
   - The system strictly outputs a draft for human review. It does not automatically send emails, trigger webhooks, update production
   - databases, or mutate ticket systems.
4. **Resilient Offline Mode**:
   - Setting `AI_PROVIDER=mock` allows 100% of the system to run locally during internet drops or API outages.

```mermaid
flowchart TD
    Start["Incoming Request Text"] --> Intent{"Identify Primary Intent"}
  
    Intent -->|"How-to, guidance, onboarding, normal usage"| CatSupport["Category: Support"]
    Intent -->|"Bug, outage, broken feature, API error, data loss"| CatTech["Category: Technical"]
    Intent -->|"Pricing, purchase, demo, upgrade, license expansion"| CatSales["Category: Sales"]
    Intent -->|"Invoice, charge, refund, payment, receipt, tax"| CatBilling["Category: Billing"]
    Intent -->|"Partnership, alliance, non-commercial inquiry"| CatOther["Category: Other"]

    CatSupport --> OwnCS["Owner: Client Success"]
    CatTech --> OwnEng["Owner: Engineering"]
    CatSales --> OwnSales["Owner: Sales Team"]
    CatBilling --> OwnFin["Owner: Finance"]
    CatOther --> OwnOther{"Commercial or General?"}
    OwnOther -->|Commercial| OwnSales
    OwnOther -->|Operational/General| OwnCS

    Intent --> Impact{"Assess Business Impact & Deadline"}
    Impact -->|"Security exposure, full outage, immediate severe blockage"| PrioUrgent["Priority: Urgent"]
    Impact -->|"Multiple users affected, major workflow blocked, near deadline"| PrioHigh["Priority: High"]
    Impact -->|"Standard business issue, normal non-urgent operational task"| PrioMed["Priority: Medium"]
    Impact -->|"Optional improvement, documentation inquiry, non-blocking"| PrioLow["Priority: Low"]
```
