# Concept Ladder

**Concept Ladder** is an AI-powered learning application that breaks down any topic into three progressive difficulty levels—**Kid**, **Beginner**, and **Advanced**—complete with a context-aware **AI Tutor** chat. 

Built with **React 19**, **Google Gemini 2.5 Flash**, **Clerk Authentication**, and **Supabase (PostgreSQL)**.

---

## 🏗️ How It Works (Architecture)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                       │
│                                                                      │
│   ┌──────────────────┐   ┌────────────────────┐   ┌──────────────┐   │
│   │  Clerk Auth UI   │   │    DataContext     │   │   AI Tutor   │   │
│   │ (SignIn/Profile) │   │ (Topics & Progress)│   │  (ChatBot)   │   │
│   └────────┬─────────┘   └─────────┬──────────┘   └──────┬───────┘   │
└────────────┼───────────────────────┼─────────────────────┼───────────┘
             │ 1. Issues Session     │ 2. Queries DB with  │ 3. Generates
             │    JWT ('supabase')   │    Clerk Bearer JWT │    Content
             ▼                       ▼                     ▼
┌──────────────────────┐   ┌────────────────────┐   ┌──────────────────┐
│      Clerk Auth      │   │      Supabase      │   │ Gemini 2.5 Flash │
│                      │   │   (PostgreSQL)     │   │  (@google/genai) │
│ • User Management    │   │ • profiles table   │   │ • 3-Level JSON   │
│ • Session & OAuth    │   │ • topics table     │   │   Generation     │
│ • Custom JWT Signing │   │ • RLS Policies     │   │ • Contextual     │
└──────────────────────┘   └────────────────────┘   │   Tutor Chat     │
                                                    └──────────────────┘
```

---

## ⚙️ Key Technical Implementations

### 1. Serverless Auth & Database Security (Clerk + Supabase RLS)
Instead of building a custom backend just to verify users, the frontend connects **Clerk** directly to **Supabase**:
* **JWT Token Forwarding**: [`src/lib/supabase.js`](./src/lib/supabase.js) attaches the active Clerk session token (`session.getToken({ template: "supabase" })`) as a `Bearer` token alongside the Supabase `apikey` header on every request.
* **Singleton Client Caching**: To prevent Supabase from creating duplicate `GoTrueClient` instances on React re-renders, the client is cached by session ID with `persistSession: false` so Clerk remains the single source of truth for auth.
* **Row-Level Security (RLS)**: In [`supabase/schema.sql`](./supabase/schema.sql), every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operation on `profiles` and `topics` is locked down by comparing `user_id` against the JWT `sub` claim:

```sql
CREATE POLICY "Users can read own topics"
ON public.topics
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
);
```
*(Wrapping `auth.jwt() ->> 'sub'` in a `(SELECT ...)` subquery allows PostgreSQL to cache the user ID lookup once per query instead of re-evaluating it for every row).*

---

### 2. Reliable LLM Output Parsing & System Instructions
Working with LLM outputs in JSON format can fail when the model includes Markdown code fences or unescaped LaTeX/math backslashes (such as `\alpha` or `\times`), which crash `JSON.parse()`.

In [`src/lib/ai.js`](./src/lib/ai.js), we handle this cleanly:
* **System Instruction Separation**: Uses the `@google/genai` SDK's `config.systemInstruction` parameter to separate the curriculum formatting rules (for Ladder generation) and the Tutor persona/context (for Chat) from the user's input prompt.
* **Safe JSON Extraction (`parseGeminiJSON`)**:
  1. Strips Markdown code wrappers (` ```json ... ``` `) and extracts the outermost `{ ... }` object.
  2. Runs a regex sanitizer (`sanitizeJSONEscapes`) to escape invalid backslashes before calling `JSON.parse()`.
* **Automatic Retry**: Includes a 1.5-second retry fallback if the initial Gemini request hits a temporary network hiccup or rate limit, plus clear fallback messaging in the UI.

---

### 3. Progressive Learning UI & Context-Aware AI Tutor
* **Step-by-Step Unlocking**: Topics start at the **Kid** level and progressively unlock **Beginner** and **Advanced** levels as the user advances, syncing progress timestamps (`last_accessed`) and favorites directly to Supabase.
* **Route-Aware ChatBot**: [`src/components/ui/ChatBot.jsx`](./src/components/ui/ChatBot.jsx) detects which topic and difficulty level the user is currently viewing and passes that context into the Gemini `systemInstruction`, so the AI Tutor answers questions at the right depth.

---

## 🛠️ Tech Stack

| Category | Technology | Usage in Project |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 5, React Router 7 | Component UI, routing, and state management via React Context |
| **Authentication** | Clerk (`@clerk/clerk-react`) | Modal sign-in/sign-up, user profile management, and Supabase JWT generation |
| **Database** | Supabase (`@supabase/supabase-js`) | PostgreSQL database (`profiles` and `topics` tables), B-tree indexes, and RLS policies |
| **AI Integration** | Google Gemini 2.5 Flash (`@google/genai`) | Structured 3-level topic generation and multi-turn AI Tutor chat |
| **Styling & Motion** | Tailwind CSS 3, Framer Motion | Responsive layout, Dark/Light mode toggle, and smooth card animations |

---

## 📂 Project Structure

```
concept-ladder/
├── src/
│   ├── components/
│   │   ├── layout/            # Header, Sidebar, and main page Layout
│   │   ├── ui/                # Reusable UI components (Button, Card, Input, ChatBot)
│   │   └── theme-provider.jsx # Light / Dark theme toggle provider
│   ├── context/
│   │   └── DataContext.jsx    # Syncs user profile & topics with Supabase
│   ├── lib/
│   │   ├── ai.js              # Gemini API calls, system instructions & JSON sanitizer
│   │   ├── generator.js       # Topic object builder & fallback handling
│   │   ├── supabase.js        # Singleton Supabase client with Clerk token headers
│   │   └── utils.js           # Tailwind class merging utility
│   ├── pages/
│   │   ├── Home.jsx           # Welcome screen, search bar & recent topics
│   │   ├── TopicInput.jsx     # New topic prompt screen & trending topic shortcuts
│   │   ├── Ladder.jsx         # 3-level interactive learning view
│   │   ├── Dashboard.jsx      # Learning progress overview & stats
│   │   ├── MyTopics.jsx       # All saved user topics
│   │   ├── Favorites.jsx      # Bookmarked topics
│   │   └── Settings.jsx       # Account details, theme switcher & clear topics action
│   ├── App.jsx                # Application routes
│   └── main.jsx               # Entry point with ClerkProvider
├── supabase/
│   └── schema.sql             # SQL script for profiles/topics tables, indexes & RLS
└── package.json
```

---

## 🚀 Getting Started Locally

### Prerequisites
* **Node.js** (v18 or higher)
* A [Clerk](https://clerk.com) account
* A [Supabase](https://supabase.com) project
* A [Google AI Studio](https://aistudio.google.com) API Key (Gemini)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Nasif284/Concept_ladder.ai.git
cd Concept_ladder.ai
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
```

### 3. Set Up the Supabase Database
1. Open your **Supabase Dashboard** and go to the **SQL Editor**.
2. Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
   *(This creates the `profiles` and `topics` tables, indexes, and Row-Level Security policies).*

### 4. Connect Clerk to Supabase (JWT Template)
1. In your **Clerk Dashboard**, go to **Configure** &rarr; **JWT Templates**.
2. Click **New template** and choose **Supabase**.
3. Name it `supabase`.
4. Paste your **Supabase JWT Secret** (found in Supabase Dashboard &rarr; *Project Settings* &rarr; *API* &rarr; *JWT Settings*).
5. Click **Save**.

### 5. Run the App
```bash
npm run dev
```
