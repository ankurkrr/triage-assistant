# AI Request Triage Assistant

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/Validation-Zod%203.23-purple?style=flat)](https://zod.dev/)
[![Google GenAI SDK](https://img.shields.io/badge/AI%20SDK-@google/genai-orange?style=flat&logo=google)](https://github.com/google/generative-ai-js)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-ready AI triage and decision-support tool that transforms unstructured incoming business requests into structured, actionable triage recommendations and reviewable draft responses.

Built with **Next.js App Router**, **TypeScript**, **Zod**, and the official **Google GenAI SDK (`@google/genai`)**, featuring a **Human-in-the-Loop** review workflow, **Multi-Key Quota Resilience**, and a **100% Offline Mock Engine**.

---

## 📌 Table of Contents

- [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
- [Key Capabilities](#-key-capabilities)
- [System Architecture & Workflow](#-system-architecture--workflow)
- [Quick Start Guide](#-quick-start-guide)
- [Environment Configuration & Dual-Mode Engine](#-environment-configuration--dual-mode-engine)
- [API Specification (`POST /api/triage`)](#-api-specification)
- [Classification & Priority Policy Matrix](#-classification--priority-policy-matrix)
- [155 Test Cases Evaluation Benchmark](#-155-test-cases-evaluation-benchmark)
- [Project Directory Structure](#-project-directory-structure)
- [Security & Production Boundaries](#-security--production-boundaries)

---

## 🎯 Executive Summary & Problem Statement

In customer support and operations, triage is traditionally manual: human agents spend 3 to 5 minutes per inquiry reading emails, guessing customer intent, estimating business urgency, hunting down the right internal team, and manually drafting a reply.

The consequences:
- **Misrouted Outages:** Critical system bugs sit in customer success queues while revenue is blocked.
- **Lost Sales Opportunities:** High-value enterprise licensing requests go cold.
- **Inconsistent Priorities:** Different agents assign arbitrary urgency levels.

The **AI Request Triage Assistant** automates this initial triage phase in under **1.5 seconds**, producing five validated operational outputs:

1. **Executive Summary:** A concise 1–2 sentence synopsis of the primary request.
2. **Category:** Exactly one allowed business vertical (`Sales`, `Support`, `Billing`, `Technical`, `Other`).
3. **Priority & Justification:** An objective rating (`Urgent`, `High`, `Medium`, `Low`) backed by a factual justification.
4. **Recommended Owner:** Assigned department (`Engineering`, `Client Success`, `Finance`, `Sales Team`).
5. **Draft First Response:** A context-aware, empathetic reply ready for **Human-in-the-Loop** review and 1-click clipboard dispatch.

---

## ✨ Key Capabilities

- **Human-in-the-Loop Philosophy:** Generates an editable draft response with a 1-click clipboard copy button (`✓ Copied!`) rather than sending unverified autonomous emails into production.
- **Dual-Mode AI Engine:**
  - **Gemini Real AI Mode:** Contextual analysis powered by Google Gemini Flash models via `@google/genai` with native JSON schema enforcement (`responseSchema`).
  - **Offline Mock Mode:** Deterministic, zero-latency rule engine that runs with zero external API keys and zero network dependencies.
- **Multi-Key Quota Resilience:** Automatic dual-key pool (`GEMINI_API_KEY` $\rightarrow$ `GEMINI_API_KEY1`) and candidate model cascading (`gemini-3.5-flash-lite`, `gemini-flash-lite-latest`) to withstand upstream 429 quota exhaustion and 503 capacity spikes.
- **End-to-End Schema Validation:** Every input and output is strictly verified using **Zod** schemas (`TriageRequestSchema` and `TriageResultSchema`).
- **Standardized Error Handling:** Secure HTTP error mapping for `400 Bad Request`, `422 Out of Scope`, `429 Rate Limited`, `502 Invalid AI Output`, `503 Unavailable`, and `504 Timeout` with zero secret or stack-trace leakage.
- **1-Click Preset Scenarios:** 6 pre-loaded business scenarios (Outage Incident, Enterprise Quote, Login Issue, Slow Performance, Disputed Charge, API Guidance) for instant demonstration.

---

## 🏛️ System Architecture & Workflow

For the complete technical specification and interactive diagrams, see:
- 📖 [ARCHITECTURE_AND_WORKFLOW.md](ARCHITECTURE_AND_WORKFLOW.md)
- 🖥️ [WORKFLOW_WIREFRAME_DIAGRAM.md](WORKFLOW_WIREFRAME_DIAGRAM.md)

### Layered Architecture

```text
+-------------------------------------------------------------------------+
|                       1. Client Presentation Layer                      |
|  - Next.js Client (app/page.tsx) & Design Tokens (app/globals.css)      |
|  - 6 One-Click Mock Scenarios & Character Counter (1-10,000 chars)      |
|  - Editable Draft Response Textarea with 1-Click Clipboard Action       |
+-------------------------------------------------------------------------+
                                     |
                                     | POST /api/triage { request: string }
                                     v
+-------------------------------------------------------------------------+
|                        2. Backend Route Handler                         |
|  - Next.js Route Handler (app/api/triage/route.ts)                      |
|  - Input Validation via Zod (TriageRequestSchema)                       |
|  - Centralized Error Classification & HTTP Status Code Mapping          |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                     3. Configuration & Factory Layer                    |
|  - Server Config (lib/config.ts) loaded from .env.local                 |
|  - Factory Instantiation (lib/ai/factory.ts) returning AiProvider       |
+-------------------------------------------------------------------------+
                  |                                     |
        [AI_PROVIDER=mock]                    [AI_PROVIDER=gemini]
                  v                                     v
+-----------------------------------+ +-----------------------------------+
|     4A. Offline Mock Engine       | |   4B. Gemini AI Resilience Engine |
|  - Deterministic Keyword Matcher  | |  - Dual-Key Pool (KEY -> KEY1)    |
|  - Zero Network Dependencies      | |  - Model Cascade (3.5-flash-lite) |
|  - 100% Offline Availability      | |  - Structured JSON Mode (Schema)  |
+-----------------------------------+ +-----------------------------------+
                  |                                     |
                  +------------------+------------------+
                                     | Raw AI Output
                                     v
+-------------------------------------------------------------------------+
|                  5. Schema Validation & Data Contracts                  |
|  - Zod Result Validator (TriageResultSchema in lib/triage/schemas.ts)   |
|  - Strict Enum Enforcement (Categories, Priorities, Owners)             |
+-------------------------------------------------------------------------+
                                     | Validated HTTP 200 JSON
                                     v
+-------------------------------------------------------------------------+
|                         Rendered Triage Cards                           |
|  [Summary] [Category Tag] [Priority Badge + Rationale] [Owner] [Draft]  |
+-------------------------------------------------------------------------+
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.17.0 or newer (v20+ recommended)
- **npm**: v9 or newer

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/ai-request-triage-assistant.git
cd ai-request-triage-assistant

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env.local
```

### Running Locally

```bash
# Start Next.js development server
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

### Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server on `http://localhost:3000` |
| `npm run typecheck` | Runs TypeScript compiler checks without emitting files (`tsc --noEmit`) |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Runs the compiled production server |

---

## ⚙️ Environment Configuration & Dual-Mode Engine

The assistant supports two operational modes via [.env.local](.env.example):

### Mode 1: Offline Mock Engine (Default)
Ideal for local demonstrations, automated tests, or staging environments without internet access:
```env
AI_PROVIDER=mock
```
- Requires **zero API keys**.
- Operates 100% offline with zero external network latency.

### Mode 2: Google Gemini Real AI Engine
Leverages real-time LLM inference with multi-key failover resilience:
```env
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash-lite
GEMINI_API_KEY=your_primary_google_gemini_api_key_here
GEMINI_API_KEY1=your_fallback_google_gemini_api_key_here
AI_TIMEOUT_MS=45000
AI_MAX_RETRIES=1
```

### Environment Variables Reference

| Variable | Type | Default | Purpose |
| :--- | :---: | :---: | :--- |
| `AI_PROVIDER` | `enum` | `mock` | Active provider engine (`mock` or `gemini`) |
| `AI_MODEL` | `string` | `gemini-3.5-flash-lite` | Primary Gemini model tier |
| `GEMINI_API_KEY` | `string` | *(empty)* | Primary Google Gemini API key (strictly server-side) |
| `GEMINI_API_KEY1` | `string` | *(empty)* | Optional secondary API key for automatic failover on 429 quota exhaustion |
| `AI_TIMEOUT_MS` | `number` | `45000` | Execution timeout race in milliseconds |
| `AI_MAX_RETRIES` | `number` | `1` | Retry attempts for transient failures (e.g. 503 capacity) |

---

## 📡 API Specification

### Endpoint: `POST /api/triage`

Analyzes an unstructured customer query and returns a structured triage recommendation.

#### Request Body
```json
{
  "request": "The payment gateway is rejecting every transaction since this morning. Our customers cannot complete checkout!"
}
```

#### Successful Response (`HTTP 200 OK`)
```json
{
  "summary": "The payment gateway is rejecting all transactions, preventing customers from checking out.",
  "category": "Technical",
  "priority": "Urgent",
  "priorityReason": "Core revenue-generating transactions are completely blocked, causing immediate broad business impact.",
  "owner": "Engineering",
  "draftResponse": "Hello,\n\nWe sincerely apologize for the disruption. Our engineering team has identified this payment gateway issue as an urgent incident and is actively investigating the root cause. We will provide another update within 30 minutes.\n\nBest regards,\nEngineering Operations"
}
```

#### Standardized Error Status Codes

| HTTP Status | Error Code | Description |
| :---: | :--- | :--- |
| **400** | `INVALID_REQUEST` | Payload is missing, non-string, whitespace, or $>10,000$ characters. |
| **422** | `OUT_OF_SCOPE` | Non-business requests (e.g., poetry, general chatting). |
| **429** | `AI_RATE_LIMITED` | Upstream Gemini API rate limit or quota exceeded across all keys. |
| **502** | `AI_INVALID_OUTPUT` | Upstream model response failed Zod schema parsing. |
| **503** | `AI_SERVICE_UNAVAILABLE` | Upstream AI capacity overloaded or network connection refused. |
| **504** | `AI_TIMEOUT` | Processing exceeded configured `AI_TIMEOUT_MS`. |
| **500** | `INTERNAL_ERROR` | Unexpected server runtime exception. |

---

## 🧭 Classification & Priority Policy Matrix

Classification is determined by **primary business intent**, not superficial keywords:

| Category | Primary Intent & Scope | Standard Owner | Example Query |
| :--- | :--- | :--- | :--- |
| **Support** | How-to guidance, account administration, configuration, general product usage. | **Client Success** | *"We need help adding new users to our workspace."* |
| **Technical** | Outages, bugs, error codes, broken integrations, failed exports, performance lag. | **Engineering** | *"The dashboard returns a 500 error whenever we export."* |
| **Sales** | Pricing inquiries, enterprise quotations, demos, seat additions, plan upgrades. | **Sales Team** | *"We need a quotation for 200 enterprise licenses."* |
| **Billing** | Invoices, unexpected charges, refunds, receipts, credit card disputes, tax exemption. | **Finance** | *"We were charged twice for our annual subscription."* |
| **Other** | General partnership, media inquiries, sponsorships, non-commercial topics. | **Sales Team / Client Success** | *"We want to explore a co-marketing partnership."* |

### Priority Matrix

- **`Urgent`** (Red): Active security/privacy exposure, total system outage, broad business stoppage.
- **`High`** (Orange): Multiple users blocked from core workflows, or tight critical deadline.
- **`Medium`** (Blue): Standard operational issue, single-user non-critical problem.
- **`Low`** (Slate): How-to question, documentation inquiry, optional cosmetic suggestion.

---

## 🧪 155 Test Cases Evaluation Benchmark

The system has been evaluated against **155 real-world test cases**:

1. **Standard Operational Suite (Tests 26–80):** 55 diverse business inquiries covering password resets, quota increases, enterprise pricing, refunds, blank screens, slow queries, and feature requests.
   - Results: [test_cases_results.md](test_cases_results.md) | [test_cases_results.doc](test_cases_results.doc)
2. **Ambiguity-Focused Stress Suite (Tests 81–180):** 100 edge-case inquiries specifically designed to stress-test weak routing:
   - **Support vs Technical:** Differentiating administrative configuration from software malfunction (e.g. *"The save button does nothing"* $\rightarrow$ Technical / Engineering).
   - **Billing vs Sales:** Differentiating renewal questions from license upgrades.
   - **Mixed Intent Queries:** Resolving requests that contain multiple overlapping intents.
   - Results: [ambiguity_test_cases_results.md](ambiguity_test_cases_results.md) | [ambiguity_test_cases_results.doc](ambiguity_test_cases_results.doc)

### Running Automated Test Suites

```bash
# Run 15-point Mock Mode acceptance regression test
node verify-acceptance.mjs

# Run live Gemini provider verification test
node verify-gemini.mjs
```

---

## 📂 Project Directory Structure

```text
├── app/
│   ├── api/
│   │   └── triage/
│   │       └── route.ts          # POST /api/triage handler with Zod validation
│   ├── globals.css               # Design system & dark-mode token definitions
│   ├── layout.tsx                # Root HTML layout and metadata
│   └── page.tsx                  # Interactive React client with Human-in-the-Loop UI
├── lib/
│   ├── ai/
│   │   ├── factory.ts            # Provider Factory (Mock vs Gemini selection)
│   │   ├── gemini-provider.ts    # Dual-Key Gemini provider with cascading failover
│   │   ├── mock-provider.ts      # Deterministic 100% offline rule engine
│   │   ├── prompts.ts            # System prompt & strict classification policies
│   │   ├── provider-errors.ts    # Normalized ProviderError classes
│   │   └── provider.ts           # AiProvider unified TypeScript interface
│   ├── config.ts                 # Server configuration validated via Zod
│   └── triage/
│       ├── constants.ts          # Enums (Categories, Priorities, Owners, Error Codes)
│       ├── schemas.ts            # Zod validation schemas (Input, Output, Errors)
│       └── types.ts              # Inferred TypeScript type definitions
├── .env.example                  # Safe configuration template (NO SECRETS)
├── .gitignore                    # Production-grade git exclusion rules
├── ARCHITECTURE_AND_WORKFLOW.md  # Detailed architecture & sequence diagrams
├── WORKFLOW_WIREFRAME_DIAGRAM.md # Visual ASCII wireframe screen states
└── package.json                  # Dependencies and execution scripts
```

---

## 🔒 Security & Production Boundaries

1. **Zero Secret Leakage:** `GEMINI_API_KEY` and `GEMINI_API_KEY1` are server-only variables. They are never prefixed with `NEXT_PUBLIC_*` and are never exposed to browser bundles or client network payloads.
2. **Immutable System Instructions:** End-users cannot inject custom system prompts. System policies and schema guards are strictly compiled into the server backend.
3. **No Unsafe Autonomous Execution:** The assistant drafts responses for human review and 1-click copying. It does not autonomously dispatch external emails, mutate live customer tickets, or write to external databases.
4. **Resilient Offline Guard:** Setting `AI_PROVIDER=mock` allows 100% of local demonstrations and continuous integration suites to run without third-party network access.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
