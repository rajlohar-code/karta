# Software Requirements Specification

## Collaborative AI Workspace for Database Schemas and Flowcharts

**Version:** 1.1 · **Date:** 31 October 2026

## 1. Purpose

## 1. Purpose

This document defines the complete requirements for a browser-based collaborative workspace for designing database schemas and flowcharts with AI assistance. It covers all features agreed in v1.0 plus five additions confirmed in October 2026: per-object visual customization, layout algorithms, payment integration, an admin panel, and a two-tier AI routing system. "Must" means required for the complete product. "Proposed" means a default that still needs confirmation before coding.

## 2. Product Definition

## 2. Product Definition

A browser-based collaborative visual workspace for planning software systems. A project can contain multiple database schema diagrams and flowcharts. Users can draw manually, use AI to create or change diagrams, import supported SQL, export deterministic SQL, collaborate live, inspect change history, and ask natural-language questions across their permitted diagrams and history.

The product is AI-powered via Groq (fast path) and Gemini (deep path). It does not train its own model. Engineering value comes from a coherent editor, dependable storage, controlled collaboration, permissions, deterministic schema conversion, cost-efficient AI routing, and evidence-backed AI answers.

**Intended users:** individual developers, small development teams, students, and reviewers.

**Initial deployment:** \~10 users; portfolio-grade, real-work-ready; not a commercial SaaS at launch.

## 3. Product Boundaries

## 3. Product Boundaries

**In scope:** accounts; projects and diagrams; database schema and flowchart editors; per-object color customization; layout algorithm presets; SQL import/export; teams and sharing; granular permissions; real-time collaboration; comments; activity records; version history and recovery; AI generation, explanation and modification via Groq–Gemini cascade; RAG-powered search; usage limits; subscription plans; payment integration (Razorpay); admin panel; production deployment and monitoring.

**Out of scope for initial release:** voice/video calls; LLM training; executing SQL against live databases; production DB migrations; full Lucidchart feature parity; Redis, Kubernetes, or microservices; enterprise SSO; offline CRDT editing; cross-links between flowchart nodes and schema tables (future extension).

## 4. Workspace Structure

## 4. Workspace Structure

| Term | Meaning |
| --- | --- |
| Account | An authenticated person |
| Workspace | An access and collaboration boundary containing members and projects |
| Project | A named collection of related diagrams |
| Diagram | One database schema or one flowchart |
| Schema | Structured definitions of tables, columns, constraints and relationships |
| Layout | Positions, sizes, colors and other visual presentation settings |
| Style | Per-object color overrides: background, border, header, text, relation stroke |
| Command | A validated operation such as rename column or add node |
| Revision | A monotonically increasing version of a diagram's accepted state |
| Activity record | A durable record of an accepted action and its actor |
| Snapshot | A saved diagram state for inspection and recovery |
| Plan | A subscription tier that determines feature access and AI quotas |
| RAG | Retrieve relevant permitted data, then provide it to the model to answer |
| Embedding | A numeric representation used to retrieve semantically related content |

Each user starts with a personal workspace and can create or join a shared workspace. Diagrams belong to projects; projects belong to one workspace. Shared workspace content is not automatically visible to every member: effective permissions determine access.

## 5. Main User Experience

## 5. Main User Experience

**First use:** visitor sees a landing page, signs in with Google, opens a dashboard of accessible projects, creates a project, picks diagram type, edits manually or requests an AI draft. Accepted changes are saved with clear saving/saved/error states.

**Editor structure:** central canvas; project/diagram navigation; properties panel for selected objects (including style/color controls); AI assistant panel; activity/comments panel. Database mode adds a SQL panel. Panels are collapsible. The UI shows current collaborators, connection state, and effective editing/AI permissions.

**Diagram types:**

- Database schema: tables, columns, data types, constraints, foreign-key relationships
- Flowchart: nodes (start, end, process, decision, data), directed edges, labels

## 6. Visual Customization

## 6. Visual Customization

Every object on the canvas has a system-default color palette. Users can override any color attribute per object; overrides are stored in the `style` field within the diagram's `layout` JSONB and travel with the diagram through history and exports.

**Customizable attributes per object type:**

| Object | Customizable attributes |
| --- | --- |
| Table header | Background color, text color |
| Table body | Background color, text color |
| Table border | Border color, border width |
| Individual column row | Background color, text color |
| Relationship / foreign key edge | Stroke color, stroke width |
| Flowchart node | Background color, border color, text color |
| Flowchart edge | Stroke color, stroke width |

**Implementation:** a color-picker panel appears in the properties sidebar when an object is selected. Changes apply immediately as a preview; saving commits them as a revision command. Bulk-select allows applying the same style to multiple objects at once. A "Reset to defaults" button per object clears all overrides. Style data stored as:

```json
{
  "style": {
    "bg": "#1e293b",
    "border": "#6366f1",
    "header_bg": "#312e81",
    "text": "#f8fafc",
    "stroke": "#94a3b8",
    "stroke_width": 2
  }
}
```

## 7. Layout Algorithms

## 7. Layout Algorithms

Users can auto-arrange diagram objects by selecting a layout preset. The canvas animates from current positions to the new positions. Layout is non-destructive: the user can undo to return to the previous arrangement. Layout does not modify schema structure, only `x`, `y`, `width`, `height` in the `layout` store.

ELK.js (already in the stack) provides all required algorithms:

| Preset name (UI) | ELK algorithm | Best for |
| --- | --- | --- |
| Pipeline | `layered` | Linear flows, top-to-bottom schema |
| Organic | `force` | Loosely related tables, exploratory |
| Radial | `radial` | Hub table with many relations |
| Grid | `rectpacking` | Dense schemas, equal-weight tables |
| Tree | `mrtree` | Hierarchical / parent-child schemas |

**Implementation:** a toolbar button opens a layout picker. On selection, ELK receives the current nodes and edges with their sizes; it returns new `x,y` coordinates. The canvas transitions smoothly using React Flow's `fitView` and position update API. The resulting positions are saved as a revision command attributed to the user.

## 8. AI Routing — Groq to Gemini Cascade

## 8. AI Routing — Groq to Gemini Cascade

All AI requests pass through a single `AIRouter` class. Groq (Llama 3.1 / Mixtral) handles every request first because it is fast and low-cost. Groq decides whether it can answer adequately or must escalate; if it escalates, the backend calls Gemini with the same prompt and returns Gemini's response.

**Routing flow:**

1. User sends prompt → backend calls Groq.
2. Groq either returns a final answer OR returns a structured tool call: `{"tool": "escalate_to_gemini", "reason": "<why>"}`.
3. If escalation: backend calls Gemini with the original prompt and returns the result.
4. Either path logs model used, tokens consumed, and cost to the user's usage ledger.

**Routing signal:** Groq itself decides via a tool definition — this avoids brittle word-count thresholds and lets the model judge query complexity. A fallback threshold (e.g. estimated output > 300 tokens) can be added as a secondary guard.

**Models:**

- Fast path: `llama-3.1-70b-versatile` or `mixtral-8x7b-32768` via Groq API
- Deep path: configurable Gemini model via Google AI / Vertex AI

**Cost accounting:** each call records `{user_id, model, prompt_tokens, completion_tokens, usd_cost, timestamp}` in a `ai_usage_log` table. This feeds the admin cost dashboard and per-user quota enforcement.

## 9. Plans, Payments and Billing

## 9. Plans, Payments and Billing

AI features are gated by subscription plan. Manual editing, SQL import/export, and collaboration are available on all plans including free. Payment provider: **Razorpay** (INR billing, UPI support).

**Plan structure (proposed — confirm prices before launch):**

| Plan | AI actions/day | Collaborators | Price (INR/mo) |
| --- | --- | --- | --- |
| Free | 0 | 2 | 0 |
| Starter | 10 | 5 | TBD |
| Pro | 50 | 20 | TBD |
| Team | 200 shared | Unlimited | TBD |

Plan features and prices are managed entirely from the admin panel; no code change is required to adjust them.

**Promo codes:** an admin creates a code with a percentage or flat discount, an optional expiry date, and a usage cap. Codes are applied at checkout and validated server-side.

**Billing flow:** user selects plan → Razorpay order created server-side → user pays → webhook confirms payment → subscription row updated → feature gates re-evaluated immediately.

**Tables:** `plans`, `plan_features`, `subscriptions`, `promo_codes`, `promo_redemptions`, `payment_events`.

## 10. Admin Panel

## 10. Admin Panel

The admin panel is part of the same React application, accessible at `/admin`, route-guarded by `role = admin`. No separate deployment. Admins are designated in the database; the first admin is seeded at deployment.

**Sections:**

| Section | What admins can do |
| --- | --- |
| Users | View all accounts, see plan and usage, suspend/unsuspend, reset AI quota |
| Plans | Create/edit plans, set feature flags per plan, set prices |
| Promo codes | Create codes (% or flat discount, expiry, usage cap), view redemptions |
| AI cost dashboard | Token usage and USD spend per user and per model, daily/monthly view |
| Payments | View payment events, handle failed webhook replays |

All admin actions are logged to an `admin_audit_log` table with actor, action, target, and timestamp. Admin routes and data endpoints are separately permission-checked server-side; the frontend guard alone is not sufficient.

## 11. Permissions and Security

## 11. Permissions and Security

Permissions follow a deny-first policy: access is denied unless explicitly granted. Permissions are checked server-side on every request including REST, WebSocket, AI tool calls, and RAG retrieval.

**Permission levels:** owner, workspace-edit, shared-view, own-only. Granular capabilities include: view diagram, edit diagram, export SQL, view history, restore version, invite members, use AI on diagram, view comments, add comments.

**Security requirements:** all endpoints authenticate via server-side session; direct URL access, REST, sockets, AI tools, and search cannot expose another user's private content. Access revocation and deletion must immediately prevent disclosure even when embeddings or prior AI conversations exist. Admin routes carry a separate server-side role check.

## 12. Real-Time Collaboration

## 12. Real-Time Collaboration

WebSocket connections are managed by a single backend worker with an in-memory connection registry. All accepted commands broadcast to connected permitted clients in revision order. Conflicts (stale revision, deleted object) produce explicit rejection and resync messages; no silent data loss. Repeated command IDs apply exactly once (idempotency). Safe undo either compensates the user's change or explains the conflict without overwriting teammates' later work.

## 13. Version History and Recovery

## 13. Version History and Recovery

Every accepted command produces a revision with an activity record (actor, timestamp, command type, diff). Users with permission can inspect any past revision, diff two revisions, and restore an earlier state as a new revision (not a destructive overwrite). Snapshots can be saved manually or on a configured schedule. An authorized restore creates a new revision and an audit record. Backup frequency, retention, recovery point and recovery time targets must be chosen and tested within the hosting budget before launch.

## 14. RAG-Powered Search

## 14. RAG-Powered Search

Users can ask natural-language questions across all diagrams and history they are permitted to access. The system retrieves relevant content using PostgreSQL full-text search combined with pgvector semantic search (Gemini embeddings), then provides context to the model to answer. All retrieval is permission-scoped. Access revocation immediately prevents disclosure even when embeddings exist. Verified object and diagram links are included in answers. An absent diagram or unknown historical action produces an honest limitation rather than a fabricated answer.

## 15. Technical Stack

## 15. Technical Stack

| Area | Choice | Notes |
| --- | --- | --- |
| **Frontend** | React 18, TypeScript, Vite | SPA, strict mode |
| Canvas | React Flow | Node/edge rendering, selection, drag |
| Layout algorithms | ELK.js | Layered, force, radial, rectpacking, mrtree |
| Color picker | react-colorful or Radix + input | Lightweight, no dependencies |
| UI components | Tailwind CSS, Radix UI | Accessible primitives |
| SQL editor | Monaco Editor | Syntax highlighting for PostgreSQL DDL |
| Client state | Zustand | Diagram state, selection, style overrides |
| Server state | TanStack Query | API cache, background refetch |
| Forms | React Hook Form + Zod | Plan selection, auth, admin forms |
| **Backend** | Python, FastAPI, Pydantic, Uvicorn | Async; single worker |
| ORM / migrations | SQLAlchemy, Alembic, Psycopg |  |
| Database | PostgreSQL + JSONB + pgvector | Schema, layout, embeddings |
| Full-text search | PostgreSQL tsvector | Keyword diagram search |
| Semantic search | pgvector + Gemini embeddings | RAG retrieval |
| AI orchestration | LangChain + Groq API + Gemini API | AIRouter cascade |
| Fast AI path | Groq (Llama 3.1 / Mixtral) | Low-latency, low-cost |
| Deep AI path | Gemini (configurable model) | Complex generation and RAG |
| SQL parsing | SQLGlot (validate first) | PostgreSQL DDL import |
| Authentication | Google OpenID Connect, Authlib | Server-side sessions |
| Collaboration | Native WebSockets | In-memory connection registry |
| Durable jobs | PostgreSQL-backed queue | Embedding indexing; no Redis |
| Payments | Razorpay | INR, UPI, webhook-confirmed |
| **Testing** | pytest, HTTPX, Vitest, React Testing Library, Playwright |  |
| Code quality | Ruff, mypy, ESLint, Prettier |  |
| Packaging | uv, pnpm, Docker, Docker Compose |  |
| Hosting | Cloudflare Pages (frontend), Render (backend), Neon PostgreSQL |  |
| CI/CD | GitHub Actions, Sentry, structured logs |  |
| Dependency audits | Dependabot, pip-audit |  |
| API docs | OpenAPI / Swagger UI |  |

## 16. Acceptance Scenarios

## 16. Acceptance Scenarios

| ID | Scenario | Pass condition |
| --- | --- | --- |
| AT-01 | Create and reopen | User makes a diagram, signs out/in, sees same committed structure and layout |
| AT-02 | Visual-to-SQL | Supported schema exports valid PostgreSQL DDL without an AI call |
| AT-03 | SQL-to-visual | Supported DDL imports correctly; invalid input preserves previous state with actionable errors |
| AT-04 | Color customization | Per-object color changes save, persist across sessions, appear in shared view, and undo cleanly |
| AT-05 | Layout algorithm | Clicking a layout preset rearranges the canvas; undo returns the previous layout; schema is unchanged |
| AT-06 | Permission combinations | Own-only, shared-view, workspace-edit, restricted-owner behave exactly as configured |
| AT-07 | Unauthorized access | Direct URLs, REST, sockets, AI tools, and search cannot expose another user's private content |
| AT-08 | Live collaboration | Two browsers see accepted edits in the same revision order without refresh |
| AT-09 | Conflicting edits | Delete-table/add-column and stale revisions produce explicit rejection/resync with no silent loss |
| AT-10 | AI routing — fast path | Short/simple prompt resolved by Groq; Gemini not called; correct answer returned |
| AT-11 | AI routing — escalation | Complex prompt causes Groq to return escalation tool call; Gemini called; answer returned |
| AT-12 | AI proposal | User reviews proposal; rejection changes nothing; acceptance applies valid batch and logs attribution |
| AT-13 | Stale AI output | Intervening edit prevents old proposal from overwriting current work |
| AT-14 | Search and links | Natural-language questions return relevant permitted diagrams with verified links |
| AT-15 | Missing evidence | Absent diagram or unknown action produces honest limitation, not fabricated facts |
| AT-16 | Payment flow | User selects plan, pays via Razorpay, webhook confirms, AI quota activates immediately |
| AT-17 | Promo code | Valid promo code reduces checkout price; expired or capped code is rejected with a clear message |
| AT-18 | Admin user management | Admin suspends a user; that user's sessions invalidate and AI calls are blocked |
| AT-19 | Quota concurrency | Parallel requests cannot bypass limits; AI exhaustion leaves manual editing usable |
| AT-20 | Recovery | Authorized restore creates a new revision and audit record; backup can be restored in a documented exercise |

## 17. Delivery Sequence

## 17. Delivery Sequence

1. **Foundation:** permissions model, repository, migrations, sessions, workspace/project structure, command validation, audit transactions.
2. **Manual editors:** both canvas types with color customization and layout algorithms, save/reopen, SQL subset, import preview, exports, validation, basic history.
3. **Shared work:** invitations, scoped permissions, comments, WebSockets, revision conflicts, reconnects, safe undo, version recovery.
4. **Payments and admin:** Razorpay integration, plan/feature gates, promo codes, admin panel (users, plans, codes, cost dashboard).
5. **Controlled AI editing:** AIRouter (Groq → Gemini cascade), scoped generation/explanation, structured proposals, review/apply, stale-output protection, quotas, cost accounting.
6. **Permission-aware search:** indexing, keyword/semantic search, LangChain tools, graph/history retrieval, verified links, evaluation.
7. **Public release hardening:** load checks, security review, backups/restore, monitoring, deployment, user documentation, small real-user trial.

Each phase must leave a coherent working product. The coding agent implements bounded changes with reviewable diffs.

## 18. Open Decisions

## 18. Open Decisions

| Decision | Current position |
| --- | --- |
| Product name and visual identity | Not chosen |
| Plan prices (INR) | To be set by admin before launch |
| Razorpay account and webhook secret | Must be provisioned |
| Groq model selection | Llama 3.1 70B proposed; confirm against current Groq pricing |
| Gemini model selection | Configurable; confirm via current pricing and acceptance evaluation |
| Escalation threshold | Tool-call approach proposed; confirm or add token-count fallback |
| Color picker library | react-colorful proposed; confirm bundle size vs alternatives |
| Default color palette | System colors not yet defined; design before Phase 2 |
| SQL parser validation | SQLGlot spike against representative PostgreSQL corpus required |
| Snapshot frequency and history retention | Must be specified before launch |
| Backup schedule and recovery objectives | Must be selected and tested within hosting budget |
| Anonymous/public share links | Not agreed; authenticated links proposed initially |
| Cross-links between flowchart steps and schema objects | Future extension, not Phase 1 |

## 19. Definition of Complete

## 19. Definition of Complete

The project is complete when an authenticated user can: create and reliably save either diagram type with custom colors and auto-layout; exchange supported SQL with the schema editor; subscribe to a plan via Razorpay and have AI features activate immediately; share work under enforceable permissions; collaborate without silent overwrites; inspect activity and recover work; use bounded AI proposals routed through the Groq–Gemini cascade within their plan quota; and find and understand permitted diagrams through grounded RAG answers with valid links. Admins can manage users, plans, promo codes, and review AI costs from the built-in panel. The deployed application must demonstrate these flows at the initial user scale with monitored errors, enforced budget limits, and a tested recovery procedure.
