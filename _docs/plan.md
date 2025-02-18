# Implementation Plan

## Updated Project Structure

my-monorepo/
├── apps/
│   ├── frontend/              # React + Vite (built with Bun)
│   └── backend/              # Hono + Bun
├── packages/
│   └── shared/               # Types & schemas
└── package.json              # Bun workspaces config

## 1. Project & Monorepo Initialization

- [ ] **Step 1: Create Monorepo Structure and Initialize Packages**
  - **Task**: Set up the `my-monorepo` with the `apps/frontend`, `apps/backend`, and `packages/shared` directories. Add basic `package.json` files for each, plus a root `package.json` for workspace management. Ensure TypeScript configs in place (including the existing `tsconfig.json` if desired) and a `.gitignore`.
  - **Files**:
    - `my-monorepo/package.json`: Define top-level workspace structure
    - `my-monorepo/apps/frontend/package.json`: Basic dependencies for React + Vite
    - `my-monorepo/apps/backend/package.json`: Basic dependencies for Hono + Node/Bun
    - `my-monorepo/packages/shared/package.json`: Basic TypeScript library for shared types/schemas
    - `my-monorepo/tsconfig.json`: Root config references subprojects
    - `.gitignore`: Ignore node_modules, dist, etc.
  - **Step Dependencies**: None
  - **User Instructions**: 
    1. Create folders manually or via shell commands.
    2. Copy/paste these `package.json` scaffolds into each directory.
    3. Run your package manager (e.g., Yarn or PNPM) to install dependencies.

- [ ] **Step 2: Add Basic Scripts & Configurations**
  - **Task**: Add minimal build/start scripts. For instance, in `apps/frontend/package.json`, a `dev` script that runs `vite`, and in `apps/backend/package.json`, a `dev` script that runs the Hono server. Also add references to `packages/shared` for shared dependencies.
  - **Files**:
    - `apps/frontend/package.json`: Add `"scripts": { "dev": "vite" }`
    - `apps/backend/package.json`: Add `"scripts": { "dev": "bun run src/index.ts" }` or Node-based script
    - `packages/shared/tsconfig.json`: Basic config extending root
  - **Step Dependencies**: Step 1
  - **User Instructions**: 
    1. Validate scripts by running `yarn workspace @my-org/frontend dev` or similar.

## 2. Database Schema & Migrations

- [ ] **Step 3: Create Database & Migrations Setup**
  - **Task**: We'll add a migration setup (e.g., using a simple script or a library) for our SQLite database in `apps/backend/src/db`. Then define the schema for `users`, `sessions`, `reports`, `citations`, and `facts`.
  - **Files**:
    - `apps/backend/src/db/migrations/001_create_schema.sql`: Contains CREATE TABLE statements
    - `apps/backend/src/db/index.ts`: Exports a DB client (SQLite).
    - `apps/backend/package.json`: Add a migration script if using a library
  - **Step Dependencies**: Steps 1, 2
  - **User Instructions**:
    1. Run the SQL script to create tables. For instance, `sqlite3 mydatabase.db < 001_create_schema.sql`.

- [ ] **Step 4: Implement Database Repositories**
  - **Task**: Write repository classes or functions in `apps/backend/src/repositories/` to handle CRUD for each table (sessions, reports, citations, facts, etc.). 
  - **Files**:
    - `apps/backend/src/repositories/SessionRepo.ts`: CRUD for `sessions`
    - `apps/backend/src/repositories/ReportRepo.ts`: CRUD for `reports`
    - `apps/backend/src/repositories/CitationRepo.ts`: CRUD for `citations`
    - `apps/backend/src/repositories/FactRepo.ts`: CRUD for `facts`
  - **Step Dependencies**: Step 3
  - **User Instructions**:
    1. No extra instructions. Once done, we can reference these repos in our routes.

## 3. Backend Server & Routes (Hono)

- [ ] **Step 5: Initialize Hono Server**
  - **Task**: Create `apps/backend/src/index.ts` as the Hono entry point with a basic route for health check. Integrate the DB client so we can verify connectivity.
  - **Files**:
    - `apps/backend/src/index.ts`: Basic Hono setup, e.g.:
      ```ts
      import { Hono } from 'hono';
      import { db } from './db';

      const app = new Hono();
      app.get('/', (c) => c.text('OK'));
      export default app;
      ```
    - `apps/backend/src/routes.ts`: If desired, we create separate route definitions.
  - **Step Dependencies**: Steps 1, 2
  - **User Instructions**:
    1. Run `yarn workspace @my-org/backend dev` or equivalent. Visit `localhost:3000` to confirm.

- [ ] **Step 6: Sessions & Reports API**
  - **Task**: Add routes for:
    - `POST /api/sessions` → create a new session
    - `GET /api/sessions` → list sessions
    - `GET /api/reports/:reportId` → retrieve a single report by ID
  - **Files**:
    - `apps/backend/src/controllers/SessionController.ts`
    - `apps/backend/src/controllers/ReportController.ts`
    - `apps/backend/src/routes.ts`: Register these routes with Hono
  - **Step Dependencies**: Step 5, Step 4 (we need repositories)
  - **User Instructions**:
    1. Test the endpoints via Postman or cURL.

- [ ] **Step 7: Research Endpoint & Summarization**
  - **Task**: Implement the `POST /api/research` route. It calls a `ResearchService` that:
    1. Creates a session record if needed
    2. Calls multi-search (stub for now)
    3. Summarizes results via LLM (stub for now)
    4. Stores final markdown in `reports`
    5. Returns the report ID
  - **Files**:
    - `apps/backend/src/controllers/ResearchController.ts`
    - `apps/backend/src/services/ResearchService.ts`
    - `apps/backend/src/routes.ts`: Add route
  - **Step Dependencies**: Step 6
  - **User Instructions**:
    1. We will connect actual search providers in a later step. For now, just return a placeholder summary.

## 4. Search Integrations & Fact Checking

- [ ] **Step 8: Multi-Search Service**
  - **Task**: Implement `SearchService` that queries multiple providers (`firecrawl`, `tavily`, `exa`) in parallel. For now, we can mock them or set placeholders. 
  - **Files**:
    - `apps/backend/src/services/SearchService.ts`
  - **Step Dependencies**: Step 7 (since we call it in `ResearchService`)
  - **User Instructions**:
    1. Provide environment variables or config for these providers if needed.

- [ ] **Step 9: Fact-Checking Endpoint & Knowledge Base**
  - **Task**: Create `POST /api/fact-check` that takes a `reportId`, extracts statements, calls a mock verification LLM or logic, then inserts verified statements into `facts`. 
  - **Files**:
    - `apps/backend/src/controllers/FactCheckController.ts`
    - `apps/backend/src/services/FactCheckService.ts`
    - `apps/backend/src/routes.ts`: Add route
  - **Step Dependencies**: Step 7 (we need a report to fact-check)
  - **User Instructions**:
    1. This can be tested with a sample `reportId`. For real usage, we might do a second LLM pass or external search to confirm statements.

## 5. Frontend Implementation

- [ ] **Step 10: Frontend Setup with Vite + Tailwind + shadcn/ui**
  - **Task**: Configure `apps/frontend/`. Install React, Tailwind, shadcn/ui. Create basic `App.tsx` and a `main.tsx` that renders `<App />` to the DOM. 
  - **Files**:
    - `apps/frontend/vite.config.ts`
    - `apps/frontend/src/main.tsx`
    - `apps/frontend/src/App.tsx`
    - `apps/frontend/tailwind.config.js`
    - `apps/frontend/postcss.config.js`
  - **Step Dependencies**: Step 1
  - **User Instructions**:
    1. Run `yarn workspace @my-org/frontend dev`.
    2. Confirm you see a "Hello World" or similar.

- [ ] **Step 11: Basic Layout & Navigation**
  - **Task**: Implement a layout with a top navigation and placeholders for pages. Use React Router for routing (or a similar library if preferred).
  - **Files**:
    - `apps/frontend/src/App.tsx`: Wrap with `<BrowserRouter>`, define routes
    - `apps/frontend/src/components/Layout.tsx`: Layout with header/nav
    - `apps/frontend/src/pages/HomePage.tsx`
    - `apps/frontend/src/pages/NotFoundPage.tsx`
  - **Step Dependencies**: Step 10
  - **User Instructions**:
    1. Verify that you can navigate to `/` (Home) and see a 404 page for unknown routes.

- [ ] **Step 12: Report Generation Page**
  - **Task**: A page (`ReportGenerationPage.tsx`) with a form for entering query/breadth/depth. On submit, calls `POST /api/research`. Poll or wait for final result, then display the markdown. 
  - **Files**:
    - `apps/frontend/src/pages/ReportGenerationPage.tsx`
    - `apps/frontend/src/services/ResearchApi.ts`: Helper with `createResearchRequest()`
    - `apps/frontend/src/components/MarkdownViewer.tsx`: Renders final markdown
  - **Step Dependencies**: Step 11 (we need routing)
  - **User Instructions**:
    1. Test by entering a sample query, confirm the placeholder summary from the backend appears.

- [ ] **Step 13: Past Sessions & Report View**
  - **Task**: Implement a "History" page listing sessions. User can click on an entry to see the stored report. 
  - **Files**:
    - `apps/frontend/src/pages/HistoryPage.tsx`
    - `apps/frontend/src/pages/ReportDetailPage.tsx`
    - `apps/frontend/src/services/SessionApi.ts`: `fetchSessions()`, etc.
  - **Step Dependencies**: Step 12
  - **User Instructions**:
    1. Confirm you see a list of sessions. Click on one to see the markdown.

## 6. Chat UI with RAG

- [ ] **Step 14: Chat Page & RAG Integration**
  - **Task**: Create a `ChatPage.tsx` with an input box. Each user message calls `POST /api/chat`. The backend retrieves relevant facts, maybe new search results, and responds with a final LLM answer. For now, mock the logic, but set up the UI for conversation.
  - **Files**:
    - `apps/frontend/src/pages/ChatPage.tsx`
    - `apps/frontend/src/services/ChatApi.ts`
    - `apps/backend/src/controllers/ChatController.ts`
    - `apps/backend/src/services/ChatService.ts`
  - **Step Dependencies**: Step 9 (fact-check data) and Step 11 (navigation)
  - **User Instructions**:
    1. Test in the UI. Expect a stubbed response until you fill in real LLM calls.

## 7. Authentication (Clerk) & Stripe, PostHog

- [ ] **Step 15: Clerk Integration for Auth**
  - **Task**: Integrate Clerk. In the frontend, wrap `<App />` with `<ClerkProvider>`. Protect certain routes (history, chat) with `<SignedIn>` wrappers. In the backend, verify the user token on protected endpoints.
  - **Files**:
    - `apps/frontend/src/main.tsx`: Add `<ClerkProvider>`
    - `apps/frontend/src/App.tsx`: Use `<SignedIn>` or `<SignedOut>` checks
    - `apps/backend/src/middleware/auth.ts`: Validate Clerk tokens
  - **Step Dependencies**: Step 14
  - **User Instructions**:
    1. Configure your Clerk app with the appropriate domain and keys.

- [ ] **Step 16: Stripe Payment and Plan Upgrades**
  - **Task**: Add a purchase or upgrade page. Hook up a route to create a Stripe Checkout session. Then handle Stripe webhook in the backend to update the user's plan in DB. 
  - **Files**:
    - `apps/frontend/src/pages/UpgradePage.tsx`
    - `apps/backend/src/controllers/StripeController.ts`
    - `apps/backend/src/routes.ts`: Add `POST /api/stripe-webhook`
  - **Step Dependencies**: Step 15
  - **User Instructions**:
    1. Create products/prices in Stripe dashboard. Put their IDs in environment variables.

- [ ] **Step 17: PostHog Analytics**
  - **Task**: Add calls to `posthog.capture()` in the frontend for user actions, and possibly in the backend. 
  - **Files**:
    - `apps/frontend/src/services/analytics/PostHogClient.ts`
    - `apps/backend/src/middleware/analytics.ts`
  - **Step Dependencies**: Step 14 (chat integration) 
  - **User Instructions**:
    1. Set PostHog project keys in environment variables. Confirm events appear in PostHog.

## 8. Testing Setup

- [ ] **Step 18: Unit Tests (Jest)**
  - **Task**: Configure Jest in the backend. Write sample tests for repositories, service logic, etc. 
  - **Files**:
    - `apps/backend/jest.config.js`
    - `apps/backend/src/repositories/SessionRepo.test.ts`
    - `apps/backend/src/services/ResearchService.test.ts`
  - **Step Dependencies**: Steps 4, 7
  - **User Instructions**:
    1. Run `yarn workspace @my-org/backend test`.

- [ ] **Step 19: e2e Tests (Playwright or Cypress)**
  - **Task**: Add end-to-end tests to confirm the research flow, chat flow, login, etc. 
  - **Files**:
    - `apps/frontend/cypress.config.js` or `playwright.config.ts`
    - `apps/frontend/cypress/e2e/research.spec.ts`
    - `apps/frontend/cypress/e2e/chat.spec.ts`
  - **Step Dependencies**: Steps 12, 13, 14
  - **User Instructions**:
    1. Run `yarn workspace @my-org/frontend cypress open` (or `playwright test`).

## 9. Final Review & Deployment

- [ ] **Step 20: Final Cleanup & Deployment Configuration**
  - **Task**: Ensure environment variables are set (Clerk, Stripe, PostHog, LLM providers). Optimize build scripts for production (e.g., `vite build`, etc.). Document how to run migrations and start the server in production.
  - **Files**:
    - `my-monorepo/README.md`: Provide final documentation
    - `apps/backend/bunfig.toml` (or Node-based Dockerfile)
    - `apps/frontend/Dockerfile` (if containerizing)
  - **Step Dependencies**: All prior steps
  - **User Instructions**:
    1. Provide production environment secrets. 
    2. Deploy to your chosen platform (e.g. Docker, AWS, etc.).

---

## Summary

This step-by-step plan systematically builds out the entire web application:
1. We initialize the monorepo structure and basic config.  
2. We set up the SQLite database schema and repository layers.  
3. We incrementally add Hono server routes for sessions, reports, research, fact-checking, and chat.  
4. We implement the frontend with React, Tailwind, shadcn/ui, and React Router, adding pages for generating reports, browsing history, and using the chat.  
5. We integrate authentication via Clerk, payments with Stripe, and analytics with PostHog.  
6. We add a testing strategy (unit + e2e) to ensure reliability.  
7. Finally, we configure production deployment details.

By following this plan in order, we keep each step self-contained, with clear file changes, minimal external dependencies, and a logical progression toward the final feature-rich web application.