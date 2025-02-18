1. Understand the Problem
We have an existing open-source codebase (“Open Deep Research”) that:
Performs iterative research on a user’s query and summarizes findings into a comprehensive final report with citations.
But it currently runs as a CLI tool with no dedicated database, web interface, and a simple architecture still prone to hallucinations and veering off topic
Goal: Transform this into a modern, web-based research assistant with persistence, multi-provider search, fact-checking and knowledge-base building.

2. Current State → Future State
Current State
CLI-Driven Workflow
A single process that prompts the user and produces a final Markdown report.
In-Memory Data
All intermediate research data is lost after each session, except for the final output.md.
Simple Architecture for Search & Analysis
Relies on one search provider and one LLM with no analysis loops or verification
Future State
User-Friendly Web Interface
A user-friendly for entering queries, seeing reports, and refining knowledge
Knowledge Creation
Instead of just producing one-off reports, the system maintains a database and a fact-checked knowledge base to build on past research.
Interactive Learning via Chat
A conversation-based UI that allows ongoing Q&A, refining or expanding the knowledge base, and re-checking facts using RAG (retrieval-augmented generation).

3. Key Components & Architecture
Frontend (React + Vite + Vercel AI SDK)
User Interaction: Chat-based input for research queries.
Real-Time Progress: Displays search/summarization progress and final outputs.
History Browser: Allows viewing previous reports, citations, and additional clarifications.
Backend Services (Node + Additional Endpoints)
API Layer:
Endpoint to trigger new research sessions.
Endpoint to fetch or re-run past sessions from the database.
Search Provider Integration: Pluggable design for calling multiple providers in parallel or fallback mode.
Fact-Checking & Knowledge Base:
A module that handles fact extraction, storage, and verification
RAG pipeline to deliver relevant facts in real-time to the chat UI
Database (SQLite)
Entities:
Conversations / Sessions (tracks user prompts, clarifications).
Reports (final text, date, associated references).
Facts / KnowledgeBaseEntries (vetted statements, their sources).
Citations (URLs, source details).
AI Orchestration
LLM Summaries: Use existing or newly introduced LLM calls to generate partial or final summaries.
Fact-Checker / Verification: Second-pass LLM or specialized prompts to check the accuracy of key statements.
Retrieval-Augmented Generation (RAG): Combines the stored knowledge base with real-time user queries in the chat UI.

4. User Experience Overview
Phase 1: Report Generation
New Research: User visits the web app, enters a query, and optionally sets depth/breadth.
Progress View: App shows concurrent searching, partial notes, and summarization status.
Final Report: Displays a multi-page markdown summary with citations, stored in the DB.
History & Viewing: Users can browse or re-open old research sessions.
Phase 2: Fact Checking, Knowledge Base, and Chat
Expanded Search: Additional providers are used automatically or when the user requests more detail.
Fact-Checking: As new content arrives, the system flags key claims for verification.
Knowledge Base: Verified facts are stored, accessible during future searches or user queries.
Chat Interaction: The user can ask follow-up questions about existing facts, refine the report, or prompt further searches. The system references the knowledge base plus new search results (RAG).

5. User Stories & Acceptance Criteria
Epic 1 (Phase 1)
User Story 1.1: Web UI for Report Generation and Viewing
As a researcher, I want to interact with the system through a modern web UI, so that I can easily submit queries and see final reports without using a CLI.
Acceptance Criteria:
A React + Vite app allows the user to input a query and see progress updates.
The final markdown report (with citations) is displayed on the same page.
Uses Vercel AI SDK for handling AI-driven responses or streaming output.
User Story 1.2: Database Persistence & Viewing of Past Reports
As a researcher, I want the system to save my past research sessions and let me revisit them, so that I can track or reuse old findings.
Acceptance Criteria:
SQLite stores each research session’s query, final report, and citations.
The web UI provides a “History” or “Past Reports” page.
Clicking on a past report displays the stored text and associated sources.
Epic 2 (Phase 2)
User Story 2.1: Additional Search Providers
As a power user, I want the system to gather information from multiple sources in parallel, so that I get more comprehensive coverage and less single-source bias.
Acceptance Criteria:
The backend can call multiple providers (e.g., Firecrawl, tavily, exa).
If one provider fails or times out, the system still proceeds with available results.
The final summary references data from all sources that returned content.
User Story 2.2: Fact-Checking & Knowledge Base
As a user, I want suspicious or important statements to be fact-checked, so that I can trust the final report.
Acceptance Criteria:
A new “fact-checker” step or LLM pass identifies and verifies key claims.
Verified claims get stored in a local knowledge base with source references.
Re-checking a claim uses the stored knowledge base and new searches as needed.
User Story 2.3: Chat UI with RAG
As a researcher, I want to refine my final report or ask follow-up questions in a chat interface, so that I can interactively explore the data and expand the knowledge base.
Acceptance Criteria:
A chat-based UI allows the user to reference existing facts in the knowledge base.
The system can issue additional searches or expansions if user queries go beyond current knowledge.
The user can see exactly which “facts” or references the system used when generating an answer (RAG approach).

6. Developer Resources & Next Steps
Existing Codebase
Refer to deep-research.ts for the main iterative research flow logic.
providers.ts for hooking in additional search providers.
prompt.ts for system-level instructions or LLM calls.
Implementation Steps
Phase 1:
Implement Node-based server + React + Vite frontend.
Introduce SQLite for storing sessions and final reports.
Provide basic progress tracking in the UI.
Phase 2:
Expand search providers (tavily, exa).
Integrate fact-checking pipeline and local knowledge base.
Implement chat interface (RAG) referencing stored facts + new searches.
Useful Links
Vercel AI SDK Documentation
SQLite Docs
Potential Fact-Checking LLM References (e.g., pipeline designs or plugin-based approaches).

