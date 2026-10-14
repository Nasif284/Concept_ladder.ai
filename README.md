# Concept Ladder

> **Adaptive conceptual decomposition engine.** Concept Ladder deconstructs complex, high-entropy topics into structured, progressive cognitive tiers (*Kid* &rarr; *Beginner* &rarr; *Advanced*) powered by **Google Gemini 2.5 Flash**, backed by an audited **Supabase (PostgreSQL)** database with cryptographic **Clerk** identity federation and Row-Level Security (RLS).

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client Layer (React 19)                       │
│                                                                        │
│   ┌────────────────────┐    ┌───────────────────┐   ┌──────────────┐   │
│   │   Clerk Provider   │    │    Data Context   │   │ Framer Motion│   │
│   │  (JWT Lifecycle)   │    │  (State Engine)   │   │  (UI Trees)  │   │
│   └─────────┬──────────┘    └─────────┬─────────┘   └──────────────┘   │
└─────────────┼─────────────────────────┼────────────────────────────────┘
              │ 1. Signs Session        │ 2. Queries with Clerk Bearer JWT
              ▼                         ▼
┌─────────────────────────┐   ┌──────────────────────────────────────────┐
│   Clerk Auth Cluster    │   │         Supabase Data Layer              │
│                         │   │                                          │
│ • EdDSA/RSA JWT Signing │   │ ┌──────────────────────────────────────┐ │
│ • Multi-tenant Identity │   │ │ PostgREST Gateway (API Key + Bearer) │ │
│ • OAuth / MFA Lifecycles│   │ └──────────────────┬───────────────────┘ │
└─────────────────────────┘   │                    ▼                     │
                              │ ┌──────────────────────────────────────┐ │
                              │ │ PostgreSQL 16 (Engine)               │ │
                              │ │ • InitPlan-Optimized RLS             │ │
                              │ │ • B-Tree Compound Indices            │ │
                              │ │ • Automated Timestamp Triggers       │ │
                              │ └──────────────────────────────────────┘ │
                              └──────────────────────────────────────────┘
                                                   ▲
                                                   │ 3. Asynchronous
                                                   │    Content Synthesis
                                                   ▼
                              ┌──────────────────────────────────────────┐
                              │       Inference Engine (Gemini 2.5)      │
                              │                                          │
                              │ • Dedicated System Instruction Channel   │
                              │ • JSON Schema Structured Outputs         │
                              │ • Self-Healing Regex Escape Sanitizer    │
                              │ • Exponential Backoff Retry Pipeline     │
                              └──────────────────────────────────────────┘
```

---

## 🚀 Key Engineering Pillars

### 1. Cryptographic Identity Federation & Zero-Trust Persistence
Instead of coupling identity directly to the operational database, authentication and persistence are partitioned:
* **Identity Provider (Clerk)**: Handles user credentials, OAuth handshakes, multi-factor authentication, and short-lived session revocation. Upon authentication, Clerk signs a JWT containing the user identity within the `sub` claim.
* **Database Gateway (Supabase PostgREST)**: Configured to verify Clerk's signature via shared JWT secrets without touching an intermediate backend proxy.
* **GoTrue Isolation**: Client initialization explicitly disables Supabase’s internal authentication storage (`persistSession: false`, `autoRefreshToken: false`), eliminating client race conditions and memory leaks across multiple browser tabs.

### 2. High-Performance PostgreSQL Schema & Row-Level Security (RLS)
The database enforces strict tenant isolation at the kernel level using PostgreSQL Row-Level Security:

```sql
-- Optimized RLS Policy: InitPlan Caching
CREATE POLICY "Users can query own topics"
ON public.topics
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
);
```

#### Why `(SELECT auth.jwt() ->> 'sub')` Matters
> **Postgres Performance Rule**: Writing `user_id = auth.jwt() ->> 'sub'` forces PostgreSQL to execute a function call for **every single row** during a table scan ($O(N)$ execution overhead). Wrapping it in a scalar subquery `(SELECT auth.jwt() ->> 'sub')` instructs the PostgreSQL query planner to compute the value **once per query** as an `InitPlan` ($O(1)$ constant time), radically improving index efficiency and query latency.

#### Database Indexing Strategy
* **`idx_topics_user_id`**: B-tree index on `user_id` guaranteeing index-only scans for user-scoped queries.
* **`idx_topics_last_accessed`**: Compound index on `(user_id, last_accessed DESC)` enabling zero-sort paginated retrieval for dashboard and recent topics feeds.

### 3. Defensive LLM Engineering & Fault-Tolerant Serialization
Large Language Models exhibit non-deterministic failure modes when asked to generate complex, multi-tiered JSON payloads. This project rejects naive API wrappers in favor of an **industrial parsing pipeline**:

```
[Raw Gemini Response]
         │
         ▼
[Code Fence Stripping]  ──► Removes ```json and trailing markdown fences
         │
         ▼
[Brace Extraction]      ──► Isolates outermost { ... } substring
         │
         ▼
[Regex Escape Repair]   ──► Escapes illegal LaTeX/Markdown backslashes (\alpha, \text, etc.)
         │
         ▼
[JSON.parse()]          ──► Emits verified type-safe object or triggers backoff retry
```

* **System Instruction Decoupling**: Separation of global cognitive requirements (curriculum constraints, tone guidelines, Markdown requirements) from contextual user input via `@google/genai`'s native `config.systemInstruction`.
* **Self-Healing Escape Repair**: Technical explanations in STEM fields inevitably output unescaped backslashes (e.g., LaTeX `\alpha`, `\approx`, `\times`). A regex lookahead pre-parser sanitizes raw control characters before feeding the string into `JSON.parse()`.
* **Exponential Backoff**: Transient HTTP 429 (`RESOURCE_EXHAUSTED`) or network timeouts automatically trigger a jittered 1,500ms backoff sequence before falling back to transparent state indicators.

---

## 🛠️ Tech Stack

| Layer | Technology | Engineering Rationale |
|---|---|---|
| **Frontend Core** | React 19, Vite 5 | Concurrent rendering, zero-bloat compilation, modern ES module bundling |
| **Authentication** | Clerk Auth (`@clerk/clerk-react`) | Edge session management, JWT templates, fine-grained access control |
| **Database** | Supabase (PostgreSQL 16) | Relational integrity, declarative migrations, declarative RLS policies |
| **AI Inference** | Google Gemini 2.5 Flash (`@google/genai`) | Sub-second latency, structured JSON mode, system instruction separation |
| **Animations** | Framer Motion 12 | Hardware-accelerated layout transitions for progressive ladder discovery |
| **Styling** | Tailwind CSS 3 | Zero-runtime atomic CSS with CSS variable-driven dark/light theming |

---

## 📂 Repository Structure

```
concept-ladder/
├── .agents/skills/            # Supabase Postgres best practices & agent capabilities
├── src/
│   ├── components/
│   │   ├── layout/            # Shell, Navigation, Sidebar & Clerk Auth Button bindings
│   │   ├── ui/                # Accessible primitives (Button, Card, Input, ChatBot)
│   │   └── theme-provider.jsx # Dynamic client-side theme engine (Dark / Light)
│   ├── context/
│   │   └── DataContext.jsx    # Pure Supabase-backed global state machine
│   ├── lib/
│   │   ├── ai.js              # Resilient Gemini API client & escape-sanitizing parser
│   │   ├── generator.js       # Conceptual Ladder orchestration & fallback safety
│   │   ├── supabase.js        # Cached singleton Supabase client with dynamic Clerk Bearer injection
│   │   └── utils.js           # ClassName tailwind-merge utilities
│   ├── pages/
│   │   ├── Home.jsx           # Activity overview & fast-input jump point
│   │   ├── Ladder.jsx         # 3-tier progressive concept decomposition view
│   │   ├── Dashboard.jsx      # Metrics, completed concepts & mastery analytics
│   │   ├── MyTopics.jsx       # Paginated catalog of synthesized topics
│   │   ├── Favorites.jsx      # Bookmarked conceptual ladders
│   │   └── Settings.jsx       # Account lifecycle & cloud data purge tools
│   ├── App.jsx                # Route hierarchy & protected application layout
│   └── main.jsx               # Root entrypoint with ClerkProvider configuration
├── supabase/
│   └── schema.sql             # Audited DDL schema: tables, indexes, triggers & RLS
└── vite.config.js             # Build tooling configuration
```

---

## 🚦 Getting Started

### Prerequisites
* Node.js `>= 20.x`
* A [Clerk](https://clerk.com) account (Publishable Key & Secret Key)
* A [Supabase](https://supabase.com) project (Project URL & Anon Key)
* A [Google AI Studio](https://aistudio.google.com) API Key (Gemini API)


