# Project Structure & LLD System Design
## Collaborative AI Workspace — 10/10 Architecture

---

## Why This Structure?

This follows **Feature-first + Clean Architecture** on the frontend and **Domain-Driven Design** on the backend.

- **Each feature is self-contained.** Auth doesn't know about billing. Canvas doesn't know about admin. You can delete a feature folder and nothing else breaks.
- **Open/Closed Principle (OCP) everywhere.** You add new AI providers, layout algorithms, payment providers, diagram commands, and permission capabilities by *adding* new files — not editing existing ones.
- **Dependency direction is always inward.** Routes call services. Services call repositories. Repositories touch the DB. Nothing leaks the other way.
- **Infra is isolated.** If you swap Neon for RDS, or Razorpay for Stripe, you change exactly one file each.

---

## File Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── main.py                        # App factory, register routers
│   │   ├── config.py                      # Pydantic Settings (env vars)
│   │   ├── dependencies.py                # get_db, get_current_user, require_plan
│   │   │
│   │   ├── core/                          # Pure domain logic — zero framework imports
│   │   │   ├── commands/
│   │   │   │   ├── base.py                # DiagramCommand (abstract)
│   │   │   │   ├── schema_commands.py     # AddTable, RenameColumn, AddFK ...
│   │   │   │   └── flow_commands.py       # AddNode, AddEdge, MoveNode ...
│   │   │   ├── permissions.py             # PermissionChecker — deny-first logic
│   │   │   ├── capabilities.py            # Capability registry (OCP: add new caps here)
│   │   │   └── revision.py                # Conflict detection, idempotency
│   │   │
│   │   ├── domains/                       # One folder per bounded context
│   │   │   ├── users/
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── service.py
│   │   │   │   └── router.py
│   │   │   ├── workspaces/
│   │   │   │   └── (same pattern)
│   │   │   ├── projects/
│   │   │   │   └── (same pattern)
│   │   │   ├── diagrams/
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── service.py             # Apply command → revision → broadcast
│   │   │   │   ├── style_service.py       # Color/style overrides
│   │   │   │   └── router.py
│   │   │   ├── comments/
│   │   │   └── history/
│   │   │
│   │   ├── ai/                            # Fully pluggable AI subsystem
│   │   │   ├── base.py                    # AIProvider (abstract)
│   │   │   ├── router.py                  # AIRouter — Groq→Gemini cascade
│   │   │   ├── providers/
│   │   │   │   ├── groq_provider.py       # implements AIProvider
│   │   │   │   └── gemini_provider.py     # implements AIProvider
│   │   │   ├── tools/                     # LangChain tools for RAG
│   │   │   │   ├── base.py                # DiagramTool (abstract)
│   │   │   │   ├── diagram_tool.py
│   │   │   │   ├── history_tool.py
│   │   │   │   └── search_tool.py
│   │   │   ├── embeddings.py              # Embedding generation + pgvector upsert
│   │   │   ├── usage_logger.py            # Log tokens + cost per call
│   │   │   └── quota.py                   # Enforce per-user AI quota
│   │   │
│   │   ├── billing/
│   │   │   ├── base.py                    # PaymentProvider (abstract) ← OCP
│   │   │   ├── providers/
│   │   │   │   └── razorpay_provider.py   # implements PaymentProvider
│   │   │   ├── plans.py                   # Plan feature gates
│   │   │   ├── quotas.py                  # check_ai_quota()
│   │   │   ├── webhooks.py                # Razorpay webhook → update subscription
│   │   │   └── router.py
│   │   │
│   │   ├── admin/
│   │   │   ├── dependencies.py            # require_admin
│   │   │   ├── service.py                 # User mgmt, plan mgmt, promo codes
│   │   │   └── router.py                  # /admin/* routes
│   │   │
│   │   ├── realtime/
│   │   │   ├── manager.py                 # ConnectionRegistry (in-memory)
│   │   │   ├── handlers.py                # on_command, on_cursor, on_disconnect
│   │   │   └── broadcaster.py             # broadcast_to_diagram()
│   │   │
│   │   ├── sql/
│   │   │   ├── parser.py                  # SQLGlot wrapper → internal schema model
│   │   │   ├── generator.py               # Internal schema model → PostgreSQL DDL
│   │   │   └── validator.py               # Supported DDL subset checker
│   │   │
│   │   ├── layout/                        # Layout algorithm subsystem
│   │   │   ├── base.py                    # LayoutProvider (abstract) ← OCP
│   │   │   └── elk_provider.py            # ELK HTTP/WASM bridge (called from FE)
│   │   │
│   │   └── infra/
│   │       ├── database.py                # SQLAlchemy async engine + session
│   │       └── queue.py                   # PG-backed job queue for embeddings
│   │
│   ├── migrations/
│   │   └── versions/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── pyproject.toml
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── router.tsx                     # All routes incl. /admin (guarded)
│   │   │
│   │   ├── features/                      # Feature-first — self-contained
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   └── GoogleSignIn.tsx
│   │   │   │   ├── hooks/useAuth.ts
│   │   │   │   └── api.ts
│   │   │   │
│   │   │   ├── canvas/
│   │   │   │   ├── components/
│   │   │   │   │   ├── SchemaCanvas.tsx
│   │   │   │   │   ├── FlowCanvas.tsx
│   │   │   │   │   ├── nodes/
│   │   │   │   │   │   ├── TableNode.tsx
│   │   │   │   │   │   ├── FlowNode.tsx
│   │   │   │   │   │   └── nodeRegistry.ts  # OCP: register new node types here
│   │   │   │   │   └── edges/
│   │   │   │   │       ├── RelationEdge.tsx
│   │   │   │   │       └── edgeRegistry.ts  # OCP: register new edge types here
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useLayout.ts         # ELK.js — all 5 algorithms
│   │   │   │   │   ├── useCollaboration.ts  # WebSocket sync
│   │   │   │   │   └── useHistory.ts
│   │   │   │   └── canvasStore.ts           # Zustand slice
│   │   │   │
│   │   │   ├── styling/                     # Color customization feature
│   │   │   │   ├── StylePanel.tsx           # Properties sidebar section
│   │   │   │   ├── ColorPicker.tsx          # react-colorful wrapper
│   │   │   │   ├── styleStore.ts            # Zustand slice for style overrides
│   │   │   │   └── styleUtils.ts            # Merge system default + user override
│   │   │   │
│   │   │   ├── sql/
│   │   │   │   ├── SqlPanel.tsx
│   │   │   │   ├── ImportPreview.tsx
│   │   │   │   └── hooks/useSql.ts
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── AiPanel.tsx
│   │   │   │   ├── ProposalReview.tsx
│   │   │   │   └── hooks/useAi.ts
│   │   │   │
│   │   │   ├── collaboration/
│   │   │   │   ├── CollaboratorList.tsx
│   │   │   │   └── hooks/usePresence.ts
│   │   │   │
│   │   │   ├── billing/
│   │   │   │   ├── PlanSelector.tsx
│   │   │   │   ├── CheckoutModal.tsx       # Razorpay JS SDK integration
│   │   │   │   └── PromoCodeInput.tsx
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── pages/
│   │   │   │   │   ├── UsersPage.tsx
│   │   │   │   │   ├── PlansPage.tsx
│   │   │   │   │   ├── PromoCodesPage.tsx
│   │   │   │   │   └── CostDashboardPage.tsx
│   │   │   │   └── hooks/useAdmin.ts
│   │   │   │
│   │   │   └── search/
│   │   │       ├── SearchPanel.tsx
│   │   │       └── hooks/useSearch.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePermission.ts        # Check current user's capabilities
│   │   │   │   └── usePlan.ts              # Check feature gates client-side
│   │   │   ├── api/
│   │   │   │   └── client.ts               # Axios instance + interceptors
│   │   │   └── types/
│   │   │       ├── diagram.ts
│   │   │       ├── permissions.ts
│   │   │       └── billing.ts
│   │   │
│   │   └── lib/
│   │       ├── elk.ts                      # ELK.js wrapper + algo configs
│   │       ├── styleDefaults.ts            # System default color palette
│   │       └── permissions.ts              # Client-side capability helpers
│   │
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
└── README.md
```

---

## LLD System Design — Open/Closed Principle

> **Rule:** Every extension point below lets you add a new variant by creating one new file and registering it. You do not touch the existing logic.

---

### 1. AI Provider — Pluggable Cascade

```python
# app/ai/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class AIResponse:
    content: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    escalate: bool = False          # Groq sets this True when it can't handle

class AIProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str, system: str = "") -> AIResponse:
        ...
```

```python
# app/ai/providers/groq_provider.py
class GroqProvider(AIProvider):
    ESCALATION_TOOL = {
        "name": "escalate_to_gemini",
        "description": "Call this when the query needs deeper reasoning or long output"
    }

    async def complete(self, prompt: str, system: str = "") -> AIResponse:
        response = await groq_client.chat(
            messages=[{"role": "user", "content": prompt}],
            tools=[self.ESCALATION_TOOL]
        )
        if response.tool_calls:
            return AIResponse(..., escalate=True)
        return AIResponse(..., escalate=False)
```

```python
# app/ai/router.py  ← never changes when you add a new provider
class AIRouter:
    def __init__(self, fast: AIProvider, deep: AIProvider):
        self.fast = fast
        self.deep = deep

    async def complete(self, prompt: str, user_id: int) -> AIResponse:
        await quota.check(user_id)              # raises if exhausted
        result = await self.fast.complete(prompt)
        if result.escalate:
            result = await self.deep.complete(prompt)
        await usage_logger.log(user_id, result)
        return result

# Wire up in main.py — swap providers here, never in AIRouter
ai_router = AIRouter(
    fast=GroqProvider(),
    deep=GeminiProvider()
)
# To add OpenAI later: OpenAIProvider() — AIRouter doesn't change
```

---

### 2. Diagram Commands — Extensible Command Pattern

```python
# app/core/commands/base.py
from abc import ABC, abstractmethod
from pydantic import BaseModel

class DiagramCommand(BaseModel, ABC):
    command_id: str          # UUID — idempotency key
    diagram_id: int
    actor_id: int

    @abstractmethod
    def apply(self, state: DiagramState) -> DiagramState:
        """Pure function — takes state in, returns new state. No DB calls."""
        ...

    @abstractmethod
    def validate(self, state: DiagramState) -> None:
        """Raise CommandError if preconditions fail."""
        ...
```

```python
# app/core/commands/schema_commands.py
class AddTableCommand(DiagramCommand):
    table_name: str
    columns: list[ColumnDef]

    def validate(self, state):
        if self.table_name in state.tables:
            raise CommandError("Table already exists")

    def apply(self, state):
        return state.with_table(self.table_name, self.columns)

class RenameColumnCommand(DiagramCommand):
    table_name: str
    old_name: str
    new_name: str
    # ... preserves ID, relationships, history

# Add AddIndexCommand, AddCheckConstraintCommand → new file, zero changes above
```

```python
# app/domains/diagrams/service.py  ← command processor never changes
class DiagramService:
    COMMAND_REGISTRY: dict[str, type[DiagramCommand]] = {
        "add_table": AddTableCommand,
        "rename_column": RenameColumnCommand,
        "add_fk": AddForeignKeyCommand,
        # Register new command types here only
    }

    async def apply_command(self, raw: dict, actor_id: int):
        cmd_class = self.COMMAND_REGISTRY[raw["type"]]
        cmd = cmd_class(**raw, actor_id=actor_id)
        state = await self.repo.get_current_state(cmd.diagram_id)
        cmd.validate(state)
        new_state = cmd.apply(state)
        revision = await self.repo.save_revision(cmd, new_state)
        await self.broadcaster.broadcast(cmd.diagram_id, revision)
        return revision
```

---

### 3. Permission Capabilities — Extensible Without Touching Checker

```python
# app/core/capabilities.py
from enum import StrEnum

class Capability(StrEnum):
    VIEW_DIAGRAM    = "view_diagram"
    EDIT_DIAGRAM    = "edit_diagram"
    EXPORT_SQL      = "export_sql"
    VIEW_HISTORY    = "view_history"
    RESTORE_VERSION = "restore_version"
    INVITE_MEMBERS  = "invite_members"
    USE_AI          = "use_ai"
    VIEW_COMMENTS   = "view_comments"
    ADD_COMMENTS    = "add_comments"
    # Add new capabilities here — checker below never changes

ROLE_CAPABILITIES: dict[str, set[Capability]] = {
    "viewer":    {Capability.VIEW_DIAGRAM, Capability.VIEW_COMMENTS},
    "editor":    {Capability.VIEW_DIAGRAM, Capability.EDIT_DIAGRAM,
                  Capability.EXPORT_SQL, Capability.VIEW_HISTORY,
                  Capability.VIEW_COMMENTS, Capability.ADD_COMMENTS},
    "owner":     set(Capability),  # all
}
```

```python
# app/core/permissions.py  ← never changes when you add a capability
class PermissionChecker:
    def __init__(self, repo: PermissionRepository):
        self.repo = repo

    async def require(self, user_id: int, diagram_id: int, cap: Capability):
        grant = await self.repo.get_effective_grant(user_id, diagram_id)
        if cap not in ROLE_CAPABILITIES.get(grant.role, set()):
            raise PermissionDenied(f"{cap} denied for user {user_id}")
```

---

### 4. Layout Algorithms — Add New Algo = Add One Config

```typescript
// frontend/src/lib/elk.ts

export interface LayoutConfig {
  label: string
  elkOptions: Record<string, string>
}

// Add a new algorithm: add one entry here, zero changes in useLayout.ts
export const LAYOUT_PRESETS: Record<string, LayoutConfig> = {
  pipeline: {
    label: "Pipeline",
    elkOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
    },
  },
  organic: {
    label: "Organic",
    elkOptions: { "elk.algorithm": "force" },
  },
  radial: {
    label: "Radial",
    elkOptions: { "elk.algorithm": "radial" },
  },
  grid: {
    label: "Grid",
    elkOptions: { "elk.algorithm": "rectpacking" },
  },
  tree: {
    label: "Tree",
    elkOptions: { "elk.algorithm": "mrtree" },
  },
}
```

```typescript
// frontend/src/features/canvas/hooks/useLayout.ts  ← never changes
import ELK from "elkjs"
import { LAYOUT_PRESETS } from "@/lib/elk"

const elk = new ELK()

export function useLayout() {
  const applyLayout = async (presetKey: string, nodes: Node[], edges: Edge[]) => {
    const preset = LAYOUT_PRESETS[presetKey]
    const graph = {
      id: "root",
      layoutOptions: preset.elkOptions,
      children: nodes.map(n => ({ id: n.id, width: n.width, height: n.height })),
      edges: edges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] })),
    }
    const layout = await elk.layout(graph)
    return nodes.map(n => {
      const pos = layout.children?.find(c => c.id === n.id)
      return { ...n, position: { x: pos?.x ?? n.position.x, y: pos?.y ?? n.position.y } }
    })
  }
  return { applyLayout, presets: Object.entries(LAYOUT_PRESETS) }
}
```

---

### 5. Payment Provider — Swap Razorpay for Stripe Later = One File

```python
# app/billing/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class OrderResult:
    provider_order_id: str
    amount: int
    currency: str
    metadata: dict

class PaymentProvider(ABC):
    @abstractmethod
    async def create_order(self, amount_paise: int, plan_id: str) -> OrderResult:
        ...

    @abstractmethod
    async def verify_webhook(self, payload: bytes, signature: str) -> bool:
        ...

    @abstractmethod
    async def get_payment_status(self, payment_id: str) -> str:
        ...
```

```python
# app/billing/providers/razorpay_provider.py
class RazorpayProvider(PaymentProvider):
    async def create_order(self, amount_paise, plan_id):
        order = razorpay.order.create({"amount": amount_paise, "currency": "INR"})
        return OrderResult(provider_order_id=order["id"], ...)

    async def verify_webhook(self, payload, signature):
        return razorpay.utility.verify_webhook_signature(payload, signature, self.secret)

# To add Stripe: StripeProvider(PaymentProvider) — billing service never changes
```

```python
# app/billing/router.py  ← depends on PaymentProvider interface, not Razorpay
class BillingService:
    def __init__(self, provider: PaymentProvider):
        self.provider = provider

    async def initiate_checkout(self, user_id, plan_id, promo_code=None):
        plan = await plan_repo.get(plan_id)
        discount = await self.apply_promo(promo_code, plan.price_paise)
        order = await self.provider.create_order(plan.price_paise - discount, plan_id)
        return order
```

---

### 6. Style System — Per-Object Color Storage

```python
# app/domains/diagrams/models.py (relevant excerpt)
# layout JSONB stores both positions and styles

# Structure in DB:
# layout = {
#   "nodes": {
#     "table_users": {
#       "x": 100, "y": 200, "width": 280, "height": 400,
#       "style": {                        ← optional, null = use system default
#         "bg": "#1e293b",
#         "border": "#6366f1",
#         "header_bg": "#312e81",
#         "text": "#f8fafc"
#       }
#     }
#   },
#   "edges": {
#     "fk_orders_users": {
#       "style": { "stroke": "#94a3b8", "stroke_width": 2 }
#     }
#   },
#   "columns": {
#     "table_users.id": {
#       "style": { "bg": "#1e3a5f", "text": "#93c5fd" }
#     }
#   }
# }
```

```typescript
// frontend/src/lib/styleDefaults.ts
export const SYSTEM_STYLE = {
  table:  { bg: "#ffffff", border: "#e2e8f0", header_bg: "#f8fafc", text: "#1e293b" },
  column: { bg: "#ffffff", text: "#334155" },
  edge:   { stroke: "#94a3b8", stroke_width: 1.5 },
  node:   { bg: "#ffffff", border: "#e2e8f0", text: "#1e293b" },
}

// Merge: user override wins, system default fills gaps
export function resolveStyle(userStyle?: Partial<Style>, type: keyof typeof SYSTEM_STYLE) {
  return { ...SYSTEM_STYLE[type], ...userStyle }
}
// Add a new style attribute (e.g. border_radius): add to SYSTEM_STYLE, add to ColorPicker
// Zero changes anywhere else.
```

---

### 7. Database Schema (Key Tables)

```sql
-- Core
users           (id, email, name, avatar_url, role, created_at)
workspaces      (id, name, owner_id, created_at)
workspace_members (workspace_id, user_id, role)
projects        (id, workspace_id, name, created_at)
diagrams        (id, project_id, type, name, creator_id, created_at)

-- Diagram state
diagram_revisions (
  id, diagram_id, revision_no,   -- monotonically increasing
  command_type, command_data,    -- full command JSON
  schema_snapshot,               -- full schema JSONB at this revision
  layout_snapshot,               -- full layout+style JSONB at this revision
  actor_id, created_at
)

-- Permissions
diagram_grants  (diagram_id, user_id, role, capabilities JSONB)
workspace_grants (workspace_id, user_id, role)

-- AI
ai_usage_log    (id, user_id, model, prompt_tokens, completion_tokens,
                 usd_cost, diagram_id, created_at)
ai_quotas       (user_id, actions_used, quota_limit, reset_at)

-- Billing
plans           (id, name, price_paise, ai_actions_per_day,
                 max_collaborators, features JSONB, active)
subscriptions   (id, user_id, plan_id, status, provider_subscription_id,
                 current_period_end, created_at)
promo_codes     (id, code, discount_type, discount_value,
                 max_uses, uses_count, expires_at, active)
promo_redemptions (id, promo_code_id, user_id, subscription_id, created_at)
payment_events  (id, provider, event_type, payload JSONB,
                 processed, created_at)

-- RAG
diagram_embeddings (id, diagram_id, chunk_text, embedding vector(768),
                    chunk_type, object_id, created_at)

-- Admin audit
admin_audit_log (id, admin_id, action, target_type, target_id,
                 payload JSONB, created_at)
```

---

### 8. WebSocket Message Protocol

```typescript
// All WS messages follow this envelope — add new types, zero changes to manager
type WSMessage =
  | { type: "command";    payload: DiagramCommand }
  | { type: "ack";        payload: { command_id: string; revision: number } }
  | { type: "reject";     payload: { command_id: string; reason: string } }
  | { type: "broadcast";  payload: { revision: number; command: DiagramCommand } }
  | { type: "resync";     payload: { current_revision: number } }
  | { type: "presence";   payload: { user_id: number; cursor?: {x:number,y:number} } }
```

---

### 9. Request Flow — End to End

```
User edits table color
  → StylePanel dispatches style command
  → WS sends { type: "command", payload: UpdateStyleCommand }
  → Backend: DiagramService.apply_command()
      → PermissionChecker.require(EDIT_DIAGRAM)     ← permission gate
      → cmd.validate(current_state)                 ← domain validation
      → new_state = cmd.apply(current_state)        ← pure function
      → repo.save_revision(cmd, new_state)          ← one DB transaction
      → broadcaster.broadcast(diagram_id, revision) ← all connected clients
  → Client receives broadcast → updates Zustand store → React re-renders

User sends AI prompt
  → AiPanel calls POST /ai/complete
      → require_plan(USE_AI)                        ← plan gate
      → quota.check(user_id)                        ← quota gate
      → AIRouter.complete(prompt)
          → GroqProvider.complete()
          → if escalate: GeminiProvider.complete()
      → usage_logger.log(user_id, result)
      → return ProposalResponse
  → ProposalReview shown → user accepts
  → Accepted proposal = batch of DiagramCommands → same flow as above
```

---

## Summary: What OCP Buys You

| Feature to add | Files created | Files changed |
|---|---|---|
| New AI provider (OpenAI) | `openai_provider.py` | `main.py` (wire up) |
| New layout algorithm | None — add entry to `LAYOUT_PRESETS` | `elk.ts` (1 line) |
| New diagram command | `new_command.py` | `COMMAND_REGISTRY` (1 line) |
| New permission capability | None | `capabilities.py` (1 line) |
| New payment provider (Stripe) | `stripe_provider.py` | `main.py` (wire up) |
| New node type on canvas | `NewNode.tsx` | `nodeRegistry.ts` (1 line) |
| New style attribute | None | `styleDefaults.ts` (1 line) |
| New admin page | `NewPage.tsx` | `router.tsx` (1 route) |
