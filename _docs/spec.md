# Open Deep Research Assistant Technical Specification

## 1. System Overview

### 1.1 Core Purpose
Transform the existing CLI-based iterative research tool into a modern, web-based research assistant with persistence, multi-provider search, fact-checking, knowledge-base building, and a chat-based UI for retrieval-augmented generation (RAG).

### 1.2 Key Workflows
1. **Research Report Generation**  
   - Users enter queries via a web UI → The system spawns a multi-step “deep research” process → Summaries and citations are stored in SQLite → The user sees final output in the UI.
2. **Fact-Checking & Knowledge Base**  
   - The system parses final report data → Extracts key claims → Verifies with a second LLM pass or additional search → Stores verified facts in a knowledge base table.
3. **Chat-based RAG**  
   - Users can continue the conversation after initial report generation → The system references stored facts plus new searches → LLM outputs factual expansions with citations.
4. **Authentication & Payments** (if applicable)
   - Users can sign up / log in via Clerk → Subscribed or premium users have extended features → Stripe integration for subscription or usage-based billing.
5. **Analytics**  
   - PostHog tracks usage events, funnel steps, and custom properties (e.g. user tiers).

### 1.3 System Architecture

      ┌────────────────────┐
      │   React Frontend   │
      │ (Vite + shadcn/ui) │
      └─────────┬──────────┘
                │
                │  REST/HTTP
                ▼
       ┌──────────────────┐
       │   Node/Bun API   │
       │  (Hono Server)   │
       └─────────┬────────┘
                 │
                 │
    ┌────────────┴───────────┐
    │ SQLite DB (Persistence)│
    └─────────────────────────┘

     Multi-Provider
        Search
         + LLM
     (Vercel AI SDK)

  Fact-Checker / RAG

- **Frontend**: React + TailwindCSS (shadcn/ui), using React Router for navigation.  
- **Backend**: Hono-based Node (or Bun) server with routes.  
- **Database**: Local SQLite for storing sessions, reports, facts, citations, etc.  
- **Integrations**: Firecrawl, tavily, exa, OpenAI or other LLM endpoints, Clerk (auth), Stripe (payments), PostHog (analytics).

---

## 2. Project Structure

my-monorepo/
├── apps/
│   ├── frontend/              # React + Vite + Tailwind + shadcn/ui + React Router
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── public/
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── App.tsx
│   │       └── main.tsx
│   └── backend/               # Hono server + Bun/Node
│       ├── package.json
│       ├── tsconfig.json
│       ├── bunfig.toml
│       └── src/
│           ├── index.ts       # Hono server entry
│           ├── routes.ts
│           ├── controllers/   # Hono route handlers
│           ├── services/      # Business logic (fact-checking, orchestration, search integrations)
│           ├── repositories/  # DB queries
│           └── db/            # DB config/migrations
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── schemas.ts     # Zod schemas
│           └── types.ts       # Shared TS types
├── package.json
└── bun.lockb

- **apps/frontend**: All UI code.  
- **apps/backend**: Contains the Hono server, controllers, service layer, DB logic.  
- **packages/shared**: Shared TypeScript types and Zod schemas.

---

## 3. Feature Specification

### 3.1 Web UI for Report Generation (Phase 1)
- **User Story**: Researchers want to input queries via a modern web UI to generate a comprehensive markdown report with citations.  
- **Requirements**:
  - Text input for query, optional breadth/depth settings.  
  - Real-time progress updates or streaming LLM output.  
  - Display final markdown.  
  - Store final result in DB (with references).
- **Implementation Steps**:
  1. **Frontend**:  
     - Create a `ReportGenerationPage` with a form for query, breadth, depth.  
     - Invoke an API endpoint (`POST /api/research`) that triggers a deep research pipeline.  
     - Poll or use server-sent events (if available) for progress updates.  
     - Render final markdown in a viewer.  
  2. **Backend**:
     - `POST /api/research` calls a service (e.g., `ResearchService`) that:
       - Creates a new session record in DB.
       - Calls multi-search + LLM summarization (the iterative flow).
       - Stores final results in `reports`.
     - Return the final report ID.
  3. **Error Handling & Edge Cases**:
     - Invalid user input or empty queries → return 400 with error message.  
     - Timeout or search API errors → partial results or fallback.

### 3.2 Database Persistence & Past Reports (Phase 1)
- **User Story**: Researchers want to revisit older sessions and view or export their results.  
- **Requirements**:
  - `sessions` table tracks each session’s initial query and timestamps.  
  - `reports` table stores the final output, references, creation date.  
  - A UI page for history (list of session entries).
- **Implementation Steps**:
  1. **Frontend**:
     - `HistoryPage` displaying a list of past sessions, sorted by date.  
     - Clicking an entry loads a detail view with the stored markdown.
  2. **Backend**:
     - `GET /api/sessions` returns all sessions.  
     - `GET /api/reports/:reportId` returns the final markdown and citations.  
  3. **Edge Cases**:
     - No sessions exist → display empty state.

### 3.3 Additional Search Providers (Phase 2)
- **User Story**: Gather info from multiple providers (Firecrawl, tavily, exa) in parallel for better coverage.  
- **Requirements**:
  - Pluggable search provider architecture with fallback or parallel calls.  
  - If one fails, partial results from others are still used.  
- **Implementation Steps**:
  1. **Backend**:
     - `SearchService` that calls each provider in parallel (Promise.all or p-limit).
     - Consolidate or deduplicate results, pass them to the summarizer.  
  2. **Edge Cases**:
     - All providers fail → return an error or partial result with no external content.  
     - Timeout handling → partial results from whichever providers responded.

### 3.4 Fact-Checking & Knowledge Base (Phase 2)
- **User Story**: The system flags suspicious statements for verification, stores verified facts with sources.  
- **Requirements**:
  - After generating a final report, a “fact-check” pass identifies key claims.  
  - LLM or special pipeline to confirm or refute these statements → store in `facts` table.  
- **Implementation Steps**:
  1. **Backend**:
     - `POST /api/fact-check` or an internal flow after report generation.  
     - Parse statements from the report, call a second LLM check or additional searches.  
     - Insert verified facts in `facts` table with `sourceId` references to `citations`.  
  2. **Frontend**:
     - Possibly a UI showing flagged statements vs. verified facts.  
  3. **Edge Cases**:
     - Highly ambiguous statements → store them as “inconclusive.”  
     - Fact-check may fail or time out → partial updates to knowledge base.

### 3.5 Chat UI with RAG (Phase 2)
- **User Story**: Researchers can ask follow-up questions in chat, referencing the knowledge base and new searches.  
- **Requirements**:
  - A chat interface where each user message triggers a RAG pipeline.  
  - The system retrieves relevant facts from the DB + optionally does new searches.  
  - The LLM merges these sources to produce an answer with citations.  
- **Implementation Steps**:
  1. **Frontend**:
     - `ChatPage` with a chat window.  
     - On user message, call `POST /api/chat` with the text.  
     - Stream or poll the system’s response.  
  2. **Backend**:
     - `POST /api/chat` handles:
       1. Searching `facts` table for relevant entries.  
       2. Possibly calling external search if the query is novel.  
       3. Composing a final LLM prompt with context from both the knowledge base and new data.  
       4. Returning a response with citations.  
  3. **Edge Cases**:
     - User asks about something irrelevant → system returns “No relevant facts found. Searching externally…”  
     - DB or search failures → partial result or a fallback statement.

---

## 4. Database Schema

### 4.1 Tables

#### `users` (optional if using Clerk)
| Field      | Type      | Constraints                 | Description                                           |
|------------|----------|-----------------------------|-------------------------------------------------------|
| `id`       | TEXT      | PK                          | Unique user ID (UUID or Clerk ID)                     |
| `email`    | TEXT      | UNIQUE                      | User email                                            |
| `plan`     | TEXT      | DEFAULT 'free'             | Subscription plan (free, pro, etc.)                   |
| `createdAt`| DATETIME  | DEFAULT CURRENT_TIMESTAMP   | Creation timestamp                                    |

#### `sessions`
| Field         | Type     | Constraints                  | Description                                           |
|---------------|----------|------------------------------|-------------------------------------------------------|
| `id`          | INTEGER  | PK AUTOINCREMENT            | Session primary key                                  |
| `userId`      | TEXT     | FK → `users.id`             | Owning user (nullable if anonymous)                  |
| `initialQuery`| TEXT     | NOT NULL                    | The user’s main query                                |
| `createdAt`   | DATETIME | DEFAULT CURRENT_TIMESTAMP   | Creation time                                        |

#### `reports`
| Field         | Type     | Constraints                   | Description                                            |
|---------------|----------|-------------------------------|--------------------------------------------------------|
| `id`          | INTEGER  | PK AUTOINCREMENT             | Report primary key                                     |
| `sessionId`   | INTEGER  | FK → `sessions.id`           | Which session it belongs to                           |
| `content`     | TEXT     |                               | The final Markdown report text                        |
| `createdAt`   | DATETIME | DEFAULT CURRENT_TIMESTAMP     | Creation time                                         |

#### `citations`
| Field         | Type     | Constraints                   | Description                                            |
|---------------|----------|-------------------------------|--------------------------------------------------------|
| `id`          | INTEGER  | PK AUTOINCREMENT             | Citation PK                                           |
| `reportId`    | INTEGER  | FK → `reports.id`            | The associated report                                 |
| `url`         | TEXT     |                               | Source URL                                            |
| `sourceText`  | TEXT     |                               | Optional snippet or metadata                          |

#### `facts` (knowledge base)
| Field         | Type     | Constraints                   | Description                                            |
|---------------|----------|-------------------------------|--------------------------------------------------------|
| `id`          | INTEGER  | PK AUTOINCREMENT             | Fact PK                                               |
| `statement`   | TEXT     | NOT NULL                     | Verified statement                                    |
| `sourceId`    | INTEGER  | FK → `citations.id` (nullable) | Optionally reference specific citation                |
| `verifiedAt`  | DATETIME | DEFAULT CURRENT_TIMESTAMP     | Verification timestamp                                |
| `notes`       | TEXT     |                               | Additional context or disclaimers                     |

Indexes and relationships:
- `sessions(id)` primary key, `reports(sessionId)` referencing it.  
- `reports(id)`, `citations(reportId)` referencing it.  
- `citations(id)`, `facts(sourceId)` referencing it.  
- Potential additional index on `facts(statement)` for text search if needed.

---

## 5. Server Actions

### 5.1 Database Actions
1. **Create Session**  
   - **Description**: Insert a row into `sessions` with `initialQuery`, optional `userId`.  
   - **Inputs**: `{ userId?: string, query: string }`  
   - **Outputs**: The newly created session record.
   - **SQL** (example):
     ```sql
     INSERT INTO sessions (userId, initialQuery)
     VALUES (?, ?);
     ```
2. **Create Report**  
   - **Description**: Insert final markdown text into `reports`.  
   - **Inputs**: `{ sessionId: number, content: string }`  
   - **Outputs**: The new report ID.
3. **List Sessions**  
   - **Description**: Returns all sessions (maybe filtered by user).  
   - **Outputs**: `Array<{ id, userId, initialQuery, createdAt }>`
4. **Get Report**  
   - **Description**: Retrieve report content by ID.  
   - **Outputs**: `content, citations[]`
5. **Insert Fact**  
   - **Description**: Store a verified fact after fact-checking.  
   - **Inputs**: `{ statement, sourceId?, notes? }`  
   - **Outputs**: Fact record.

### 5.2 Other Actions
1. **Search Provider Integrations**  
   - `POST /api/search` (internal usage) that calls multiple providers in parallel:
     ```typescript
     async function multiSearch(query: string) {
       const results = await Promise.allSettled([
         firecrawl.search(query),
         tavily.search(query),
         exa.search(query),
       ]);
       // merge or deduplicate
       return mergedResults;
     }
     ```
2. **Fact-Checking**  
   - `POST /api/fact-check`:
     - Input: `{ reportId }`
     - Logic: Parse key statements → LLM verification → store in `facts`.
3. **Chat RAG**  
   - `POST /api/chat`:
     - Input: `{ sessionId, message }`
     - Logic: Retrieve facts from DB → possibly call multiSearch → compile final text → return LLM response.
4. **File Handling**  
   - If needed, no large file upload is currently specified, but we might store attachments or PDF exports.
5. **Stripe Payment**  
   - `POST /api/stripe-webhook`: handles subscription or payment events → updates `users.plan`.
6. **PostHog Analytics**  
   - Called from the backend or the frontend to record user actions (e.g. “Research started,” “Chat message,” etc.).

---

## 6. Design System

### 6.1 Visual Style
- **Color Palette**:  
  - Primary: `#3B82F6` (blue-500)  
  - Secondary: `#10B981` (green-500)  
  - Background: `#F9FAFB` (gray-50)  
  - Text: `#111827` (gray-900)
- **Typography**:  
  - Font Family: `Inter, sans-serif`  
  - Headings: bold (700)  
  - Body text: normal (400)
- **Styling**:  
  - Tailwind utility classes + shadcn/ui components (e.g. `<Button>`, `<Card>`).
- **Spacing & Layout**:  
  - Use consistent spacing scale from Tailwind (e.g. `p-4`, `p-6`, etc.).  
  - Two-column or single-column layouts for main content with responsive breakpoints.

### 6.2 Core Components
1. **Layout**  
   - `AppLayout`: Header (logo, nav), main content, footer.  
2. **Navigation**  
   - React Router top-level navigation with nested routes.  
3. **Shared Components**  
   - `Button`, `Input`, `Card`, `Modal`, `Spinner`.  
   - TypeScript `interface Props` for each, e.g. `ButtonProps { label: string; onClick: () => void; }`.
4. **Interactive States**  
   - Hover, focus, active states using Tailwind pseudo-classes.  
   - Disabled states (grayed out or reduced opacity).

---

## 7. Component Architecture

### 7.1 Server Components (If SSR is used)
- If using a purely client-side approach with Vite, we might skip full SSR.  
- If SSR is introduced (e.g. Next.js style), we would define data-fetching in server components.  

### 7.2 Client Components
- **State Management**  
  - Local state for ephemeral UI states (form inputs, toggles).  
  - React Query or custom fetch hooks for asynchronous data from the backend.  
- **Key Components**:
  1. `ResearchInputForm`  
  2. `ProgressDisplay`  
  3. `ReportView`  
  4. `ChatUI`
- **Props & Usage** (example):
  ```tsx
  interface ResearchInputFormProps {
    onSubmit: (query: string, breadth: number, depth: number) => void;
  }
  const ResearchInputForm: React.FC<ResearchInputFormProps> = ({ onSubmit }) => {
    // ...
  };

8. Authentication & Authorization
	•	Implementation:
	•	Clerk:
	•	Insert <ClerkProvider> in root.
	•	Protect routes in React Router with <SignedIn> / <SignedOut> conditions.
	•	Server:
	•	Each request includes user session tokens from Clerk → verify user on backend.
	•	Protected Routes:
	•	Access to knowledge base editing or advanced features requires a signed-in user with a valid plan.
	•	If unsubscribed or not logged in, the system returns 403.

9. Data Flow
	1.	Frontend:
	•	Calls backend endpoints for each user action (start research, chat question, etc.).
	•	React Query caches responses.
	2.	Backend:
	•	Orchestrates multi-search & LLM calls.
	•	Stores intermediate results in DB.
	•	Returns updates or final results to the frontend.

10. Stripe Integration
	•	Payment Flow:
	1.	User chooses a plan → system requests Stripe Checkout session creation.
	2.	User completes purchase → Stripe sends webhook to /api/stripe-webhook.
	3.	The backend updates the user’s plan to the purchased level.
	•	Webhook Handling:
	•	Validate signature → parse event → update DB → handle success or cancellations.
	•	Product/Price Config:
	•	Configured in Stripe dashboard.
	•	The code references these product IDs to create sessions for the user.

11. PostHog Analytics
	•	Analytics Strategy:
	•	Track “ResearchStarted”, “ResearchCompleted”, “FactCheckInitiated”, “ChatMessageSent”, etc.
	•	Event Tracking:
	•	From the frontend, call posthog.capture("eventName", { property: value }).
	•	Possibly from the backend as well for server-only events (like “ProviderTimeout”).
	•	Custom Properties:
	•	plan (user subscription plan), sessionId, reportId can be attached to events for deeper analysis.

12. Testing

12.1 Unit Tests (Jest)
	•	Sample Cases:
	•	SearchService returns expected merged results from multiple providers.
	•	FactChecker identifies statements and verifies them properly.
	•	Database repository tests for CRUD actions.
	•	Implementation:
	•	Each service file has a corresponding test.
	•	Use in-memory SQLite or mock DB for fast tests.

12.2 e2e Tests (Playwright/Cypress)
	•	Key Flows:
	•	Report Generation:
	1.	Sign in (optional)
	2.	Enter query and submit
	3.	Wait for final report
	4.	Confirm output is displayed
	•	History & Revisit:
	1.	Open “History”
	2.	Select past session
	3.	Confirm correct stored report text
	•	Chat RAG:
	1.	Open Chat page
	2.	Enter query
	3.	Check for relevant knowledge base references in response

This ensures that the entire system—from user input, through the backend data orchestration, to final displayed results—behaves as intended.

