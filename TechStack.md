☕

**BrewBoard**

**Tech Stack & Dependency Manifest**

Prepared as input for Claude Code · Version 1.0 · June 2026

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  ⚠️ All versions in this document are pinned to exact releases verified as of June 2026. Claude Code must use these exact versions --- do not upgrade or use caret/tilde ranges. All packages meet the criteria: ≥ 1 year of public availability and ≥ 10,000 GitHub stars (or no well-established alternative exists).
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**1. Dependency Selection Principles**

Every package in this manifest was selected against the following
criteria before inclusion:

-   Minimum 1 year of public availability (npm publish date pre-June
    2025).

-   Minimum 10,000 GitHub stars, unless no well-established alternative
    exists.

-   Actively maintained with commits in the last 6 months.

-   Maximum Claude Code compatibility --- established, widely documented
    APIs that the model knows well.

-   No caret (\^) or tilde (\~) ranges --- every version is pinned to an
    exact release for reproducible builds.

-   No deprecated packages (e.g. \@supabase/auth-helpers-nextjs is
    replaced by \@supabase/ssr).

**2. Platform Summary**

  --------------------- ---------------------------------------------------------------------
  **Framework**         Next.js 15 (App Router, TypeScript, Turbopack dev server)
  **Language**          TypeScript --- strict mode enabled
  **Database**          Supabase --- PostgreSQL, Row-Level Security, Realtime subscriptions
  **Auth**              Supabase Auth --- Google OAuth provider via \@supabase/ssr
  **Hosting**           Vercel --- zero-config Next.js deployment, edge network
  **AI / Gemini**       \@google/genai v2.x --- official Google GenAI SDK (GA May 2025)
  **Styling**           Tailwind CSS v4 + shadcn/ui component library
  **Real-time**         Supabase Realtime (built-in) --- no additional library required
  **Runtime**           Node.js 20 LTS (minimum required by Next.js 15)
  **Package manager**   npm --- lockfile: package-lock.json (committed to repo)
  --------------------- ---------------------------------------------------------------------

**3. Core Production Dependencies**

**3.1 Framework & Runtime**

  ---------------- ---------------------------- ------------------- --------------------------------------------------------------------
  **Package**      **Purpose**                  **Exact Version**   **Notes**
  **next**         Full-stack React framework   **15.2.4**          *App Router. Use with TypeScript. Turbopack enabled for dev only.*
  **react**        UI rendering library         **19.1.0**          *Required peer of Next.js 15. Use React 19 across the board.*
  **react-dom**    React DOM renderer           **19.1.0**          *Must match react version exactly.*
  **typescript**   Static typing                **5.8.3**           *Strict mode. tsconfig target: ES2017. Include: next-env.d.ts.*
  ---------------- ---------------------------- ------------------- --------------------------------------------------------------------

**3.2 Supabase --- Database, Auth & Realtime**

Use \@supabase/ssr exclusively for server-side auth. Do NOT use the
deprecated \@supabase/auth-helpers-nextjs package.

  ---------------------------- ------------------------------ ------------------- --------------------------------------------------------------------------------
  **Package**                  **Purpose**                    **Exact Version**   **Notes**
  **\@supabase/supabase-js**   Supabase JS client             **2.106.2**         *Core client for DB queries, storage, auth. Use createClient() server-side.*
  **\@supabase/ssr**           SSR auth helpers for Next.js   **0.10.3**          *Replaces deprecated auth-helpers-nextjs. Required for App Router middleware.*
  ---------------------------- ------------------------------ ------------------- --------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  🔑 Supabase Keys: Use the new publishable (sb_publishable_xxx) keys, not the legacy anon key. Supabase is deprecating legacy keys end-of-2026. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  📡 Realtime: Use the built-in Supabase Realtime client (supabase.channel().on(\'postgres_changes\', \...) or .on(\'broadcast\', \...)). No additional package needed. This powers live order feeds and love messages for BrewBoard.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**3.3 AI --- Google Gemini**

The \@google/generative-ai package is deprecated and archived as of Dec
2025. Use \@google/genai exclusively.

  -------------------- ----------------------------------------- ------------------- ---------------------------------------------------------------------------------------------------------------------
  **Package**          **Purpose**                               **Exact Version**   **Notes**
  **\@google/genai**   Official Google GenAI SDK (Gemini 2.0+)   **2.7.0**           *GA since May 2025. Supports Gemini 2.5 Pro, Flash, Nano. Use server-side only --- never expose API key to client.*
  -------------------- ----------------------------------------- ------------------- ---------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  🤖 Gemini Models for BrewBoard: • Menu extraction (dual-pass): gemini-2.5-flash --- fast, cost-effective for image OCR. • Dish visualisation (Google Nano equivalent): Use gemini-2.0-flash-exp with image output modality for on-demand dish images. Call the API from Next.js Route Handlers only (server-side). Never import \@google/genai in client components.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**3.4 Styling --- Tailwind CSS v4 + shadcn/ui**

Tailwind v4 ships as a PostCSS plugin. Config moves to CSS (\@theme in
globals.css) --- no tailwind.config.js needed. shadcn/ui components are
code-generated into /components/ui and are NOT an npm dependency.

  --------------------------- ------------------------------------- ------------------- -------------------------------------------------------------------
  **Package**                 **Purpose**                           **Exact Version**   **Notes**
  **tailwindcss**             Utility-first CSS framework           **4.3.0**           *v4 architecture --- CSS-first config, no tailwind.config.js.*
  **\@tailwindcss/postcss**   PostCSS plugin for Tailwind v4        **4.3.0**           *Required for v4. Add to postcss.config.mjs.*
  **tw-animate-css**          Animation utilities for Tailwind v4   **1.2.9**           *Replaces deprecated tailwindcss-animate. Import in globals.css.*
  --------------------------- ------------------------------------- ------------------- -------------------------------------------------------------------

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  📦 shadcn/ui: NOT an npm dependency. Run: npx shadcn\@latest init then npx shadcn\@latest add \<component\>. Components are copied into /components/ui and owned by the project. Use the New York style. This is how Claude Code should add components.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**3.5 State Management**

  ------------- ------------------------------- ------------------- -------------------------------------------------------------------------------------------------------------
  **Package**   **Purpose**                     **Exact Version**   **Notes**
  **zustand**   Lightweight client-side state   **5.0.14**          *For UI state (cart, active table, menu selections). Do NOT store server data here --- use TanStack Query.*
  ------------- ------------------------------- ------------------- -------------------------------------------------------------------------------------------------------------

**3.6 Data Fetching & Server State**

  ------------------------------------- ---------------------------------- ------------------- -------------------------------------------------------------------------------------------------------------------------------
  **Package**                           **Purpose**                        **Exact Version**   **Notes**
  **\@tanstack/react-query**            Server state, caching, mutations   **5.100.14**        *Wrap Supabase client calls in useQuery/useMutation for client components. Use Next.js server actions for server components.*
  **\@tanstack/react-query-devtools**   React Query devtools (dev only)    **5.100.14**        *Add to layout.tsx conditionally: process.env.NODE_ENV === \'development\'. Never ships to production.*
  ------------------------------------- ---------------------------------- ------------------- -------------------------------------------------------------------------------------------------------------------------------

**3.7 Forms & Validation**

  -------------------------- --------------------------------- ------------------- --------------------------------------------------------------------------------------------------------------------------------
  **Package**                **Purpose**                       **Exact Version**   **Notes**
  **react-hook-form**        Form state & validation           **7.76.0**          *Use with Controller for shadcn inputs. Register + handleSubmit pattern throughout.*
  **\@hookform/resolvers**   Zod adapter for react-hook-form   **5.4.0**           *Use zodResolver(schema) as the resolver prop.*
  **zod**                    Schema validation (TS-first)      **4.4.3**           *v4 API. Use for all form schemas, API input validation, and Supabase response typing. Import from \'zod/v4\' for new v4 API.*
  -------------------------- --------------------------------- ------------------- --------------------------------------------------------------------------------------------------------------------------------

**3.8 UI Utilities**

  -------------------- ------------------------- ------------------- -------------------------------------------------------------------------------------------------------------
  **Package**          **Purpose**               **Exact Version**   **Notes**
  **lucide-react**     Icon library              **1.17.0**          *Tree-shaken SVG icons. 5,000+ icons. Import individually: import { Coffee } from \'lucide-react\'.*
  **date-fns**         Date manipulation         **4.4.0**           *For timestamp formatting in order feeds and message timestamps. Tree-shaken --- import only what you use.*
  **clsx**             Conditional class names   **2.1.1**           *Use with tailwind-merge for dynamic Tailwind class composition.*
  **tailwind-merge**   Merge Tailwind classes    **2.6.0**           *Combine with clsx into a cn() utility in lib/utils.ts (standard shadcn/ui pattern).*
  -------------------- ------------------------- ------------------- -------------------------------------------------------------------------------------------------------------

**4. Development Dependencies**

  --------------------------------- ---------------------------------- ------------------- ------------------------------------------------------------------------------------
  **Package**                       **Purpose**                        **Exact Version**   **Notes**
  **\@types/node**                  Node.js type definitions           **22.15.3**         *Must match your Node.js 20 LTS runtime. Use \@types/node\@22.x for latest types.*
  **\@types/react**                 React type definitions             **19.1.5**          *Must match react\@19.x.*
  **\@types/react-dom**             React DOM type definitions         **19.1.5**          *Must match react-dom\@19.x.*
  **eslint**                        JavaScript linter                  **9.28.0**          *Flat config format (eslint.config.mjs). Required for Next.js 15.*
  **eslint-config-next**            Next.js ESLint ruleset             **15.2.4**          *Must match next version. Includes React hooks and accessibility rules.*
  **prettier**                      Code formatter                     **3.5.3**           *Add .prettierrc. Use with Tailwind plugin for class sorting.*
  **prettier-plugin-tailwindcss**   Tailwind class sorting             **0.6.12**          *Auto-sorts Tailwind utility classes in JSX/TSX. Add to prettier plugins.*
  **supabase**                      Supabase CLI (local dev + types)   **2.22.6**          *Run: supabase gen types typescript \--local \> src/types/database.types.ts*
  --------------------------------- ---------------------------------- ------------------- ------------------------------------------------------------------------------------

**5. Canonical package.json**

Claude Code must generate this exact package.json. All versions use
exact pins (no \^ or \~). Copy verbatim.

+----------------------------------------------------------------------+
| {                                                                    |
|                                                                      |
| \"name\": \"brewboard\",                                             |
|                                                                      |
| \"version\": \"1.0.0\",                                              |
|                                                                      |
| \"private\": true,                                                   |
|                                                                      |
| \"scripts\": {                                                       |
|                                                                      |
| \"dev\": \"next dev \--turbopack\",                                  |
|                                                                      |
| \"build\": \"next build\",                                           |
|                                                                      |
| \"start\": \"next start\",                                           |
|                                                                      |
| \"types\": \"supabase gen types typescript \--local \>               |
| src/types/database.types.ts\"                                        |
|                                                                      |
| },                                                                   |
|                                                                      |
| \"dependencies\": {                                                  |
|                                                                      |
| \"\@google/genai\": \"2.7.0\",                                       |
|                                                                      |
| \"\@hookform/resolvers\": \"5.4.0\",                                 |
|                                                                      |
| \"\@supabase/ssr\": \"0.10.3\",                                      |
|                                                                      |
| \"\@supabase/supabase-js\": \"2.106.2\",                             |
|                                                                      |
| \"\@tailwindcss/postcss\": \"4.3.0\",                                |
|                                                                      |
| \"\@tanstack/react-query\": \"5.100.14\",                            |
|                                                                      |
| \"clsx\": \"2.1.1\",                                                 |
|                                                                      |
| \"date-fns\": \"4.4.0\",                                             |
|                                                                      |
| \"lucide-react\": \"1.17.0\",                                        |
|                                                                      |
| \"next\": \"15.2.4\",                                                |
|                                                                      |
| \"react\": \"19.1.0\",                                               |
|                                                                      |
| \"react-dom\": \"19.1.0\",                                           |
|                                                                      |
| \"react-hook-form\": \"7.76.0\",                                     |
|                                                                      |
| \"tailwind-merge\": \"2.6.0\",                                       |
|                                                                      |
| \"tailwindcss\": \"4.3.0\",                                          |
|                                                                      |
| \"tw-animate-css\": \"1.2.9\",                                       |
|                                                                      |
| \"zod\": \"4.4.3\",                                                  |
|                                                                      |
| \"zustand\": \"5.0.14\"                                              |
|                                                                      |
| },                                                                   |
|                                                                      |
| \"devDependencies\": {                                               |
|                                                                      |
| \"\@tanstack/react-query-devtools\": \"5.100.14\",                   |
|                                                                      |
| \"\@types/node\": \"22.15.3\",                                       |
|                                                                      |
| \"\@types/react\": \"19.1.5\",                                       |
|                                                                      |
| \"\@types/react-dom\": \"19.1.5\",                                   |
|                                                                      |
| \"eslint\": \"9.28.0\",                                              |
|                                                                      |
| \"eslint-config-next\": \"15.2.4\",                                  |
|                                                                      |
| \"prettier\": \"3.5.3\",                                             |
|                                                                      |
| \"prettier-plugin-tailwindcss\": \"0.6.12\",                         |
|                                                                      |
| \"supabase\": \"2.22.6\"                                             |
|                                                                      |
| },                                                                   |
|                                                                      |
| \"engines\": {                                                       |
|                                                                      |
| \"node\": \"\>=20.0.0\"                                              |
|                                                                      |
| }                                                                    |
|                                                                      |
| }                                                                    |
+----------------------------------------------------------------------+

**6. Environment Variables**

Create .env.local in project root. Never commit this file. Add to
.gitignore.

  -------------------------------------- ---------------- ------------------------------------------------------------------------
  **Variable**                           **Required**     **Description**
  NEXT_PUBLIC_SUPABASE_URL               Yes --- public   Supabase project URL. Safe to expose to browser.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   Yes --- public   New-format publishable key (sb_publishable_xxx). Replaces anon key.
  SUPABASE_SECRET_KEY                    Yes --- server   Secret key. Server-side only. Never prefix with NEXT_PUBLIC\_.
  GOOGLE_GENAI_API_KEY                   Yes --- server   Gemini API key. Server-side only. Set in Vercel env dashboard.
  NEXT_PUBLIC_APP_URL                    Yes --- public   Deployed URL. Used for OAuth redirect URIs. e.g. https://brewboard.app
  -------------------------------------- ---------------- ------------------------------------------------------------------------

**7. Project Structure**

Standard Next.js 15 App Router layout. Claude Code must follow this
structure exactly.

+--------------------------------------------------------------+
| brewboard/                                                   |
|                                                              |
| ├── src/                                                     |
|                                                              |
| │ ├── app/ \# Next.js App Router                             |
|                                                              |
| │ │ ├── (customer)/ \# Customer-facing routes                |
|                                                              |
| │ │ │ ├── menu/page.tsx                                      |
|                                                              |
| │ │ │ ├── table/page.tsx                                     |
|                                                              |
| │ │ │ └── orders/page.tsx                                    |
|                                                              |
| │ │ ├── (admin)/ \# Café admin routes                        |
|                                                              |
| │ │ │ ├── dashboard/page.tsx                                 |
|                                                              |
| │ │ │ └── menu-builder/page.tsx                              |
|                                                              |
| │ │ ├── api/ \# Route Handlers (server-side only)            |
|                                                              |
| │ │ │ ├── gemini/extract/route.ts                            |
|                                                              |
| │ │ │ └── gemini/visualise/route.ts                          |
|                                                              |
| │ │ ├── layout.tsx                                           |
|                                                              |
| │ │ └── globals.css \# Tailwind v4 \@theme config lives here |
|                                                              |
| │ ├── components/                                            |
|                                                              |
| │ │ └── ui/ \# shadcn/ui generated components                |
|                                                              |
| │ ├── lib/                                                   |
|                                                              |
| │ │ ├── supabase/                                            |
|                                                              |
| │ │ │ ├── client.ts \# createBrowserClient()                 |
|                                                              |
| │ │ │ └── server.ts \# createServerClient()                  |
|                                                              |
| │ │ ├── gemini.ts \# \@google/genai wrapper                  |
|                                                              |
| │ │ └── utils.ts \# cn() helper (clsx + tailwind-merge)      |
|                                                              |
| │ ├── stores/ \# Zustand stores                              |
|                                                              |
| │ │ ├── cart.store.ts                                        |
|                                                              |
| │ │ └── table.store.ts                                       |
|                                                              |
| │ ├── types/                                                 |
|                                                              |
| │ │ └── database.types.ts \# Generated by: npm run types     |
|                                                              |
| │ └── middleware.ts \# Supabase session refresh              |
|                                                              |
| ├── public/                                                  |
|                                                              |
| ├── .env.local \# Never commit                               |
|                                                              |
| ├── .gitignore                                               |
|                                                              |
| ├── next.config.ts                                           |
|                                                              |
| ├── postcss.config.mjs                                       |
|                                                              |
| ├── tsconfig.json                                            |
|                                                              |
| └── package.json                                             |
+--------------------------------------------------------------+

**8. Critical Implementation Rules for Claude Code**

**8.1 Supabase Auth**

-   Use createServerClient() from \@supabase/ssr in middleware.ts,
    Server Components, and Route Handlers.

-   Use createBrowserClient() from \@supabase/ssr in Client Components
    only.

-   Always call supabase.auth.getUser() for authorization checks ---
    never trust getSession() for security decisions.

-   Middleware must refresh the session before page render --- follow
    the official Supabase Next.js middleware pattern exactly.

**8.2 Gemini API**

-   Import from \'\@google/genai\' --- NEVER from deprecated
    \'\@google/generative-ai\'.

-   All Gemini calls must be in src/app/api/ Route Handlers --- never in
    client components.

-   For menu extraction: call the API twice with the same prompt and
    image, then reconcile results in server logic.

-   For dish visualisation: use gemini-2.0-flash-exp with
    responseModalities: \[\'IMAGE\', \'TEXT\'\].

-   Store the API key only in GOOGLE_GENAI_API_KEY (server-side). Never
    reference it in any file starting with NEXT_PUBLIC\_.

**8.3 Realtime**

-   Use the Supabase Realtime client ---
    supabase.channel(\'room\').on(\'postgres_changes\',
    \...).subscribe().

-   Subscribe to realtime in useEffect() inside Client Components.
    Always call channel.unsubscribe() in the cleanup.

-   Database tables needing realtime: orders, love_messages,
    table_sessions.

-   Enable realtime on these tables in Supabase dashboard under
    Database \> Replication.

**8.4 TypeScript**

-   Run npm run types after any Supabase schema change to regenerate
    database.types.ts.

-   Import Database type from src/types/database.types.ts and use in all
    Supabase query typings.

-   Strict mode is on --- no \'any\' types allowed. Use unknown and
    type-narrow where needed.

**8.5 Tailwind v4 / shadcn/ui**

-   The tailwind.config.js file does NOT exist in v4. All theme config
    goes in globals.css under \@theme {}.

-   Import tw-animate-css in globals.css: \@import \'tw-animate-css\';

-   Add shadcn components with: npx shadcn\@latest add \<component\> ---
    do not write shadcn components by hand.

-   Use the cn() utility (clsx + tailwind-merge) for all conditional
    className props.

**8.6 Package Installation**

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  🚨 When installing packages, Claude Code must use exact version flags: npm install package-name\@x.y.z \--save-exact Do NOT run npm install package-name (this installs the latest, which may differ from this manifest).
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**9. Explicitly Excluded Packages**

The following packages must NOT be used in this project:

  -------------------------------- ----------------------------------------------------------------------------------------------------------
  **Package**                      **Reason for Exclusion**
  \@supabase/auth-helpers-nextjs   Deprecated. Replaced by \@supabase/ssr.
  \@google/generative-ai           Deprecated Dec 2025. Use \@google/genai instead.
  axios                            Unnecessary. Use native fetch() --- Next.js extends it with caching. TanStack Query handles retry/cache.
  redux / \@reduxjs/toolkit        Unnecessary weight. Zustand handles all UI state needs.
  socket.io                        Unnecessary. Supabase Realtime handles all WebSocket needs.
  next-auth                        Not needed. Using Supabase Auth with Google OAuth provider directly.
  tailwindcss-animate              Deprecated in Tailwind v4. Replaced by tw-animate-css.
  \@supabase/auth-helpers-react    Deprecated. Replaced by \@supabase/ssr.
  -------------------------------- ----------------------------------------------------------------------------------------------------------

**10. Vercel Deployment Configuration**

  ----------------------- -------------------------------------------------------------------------------------------------------------------
  **Framework preset**    Next.js (auto-detected)
  **Node.js version**     20.x
  **Build command**       next build
  **Output directory**    .next (auto)
  **Install command**     npm ci (NOT npm install --- ensures exact lockfile versions)
  **Env vars (Vercel)**   Set GOOGLE_GENAI_API_KEY and SUPABASE_SECRET_KEY as encrypted env vars in Vercel dashboard. Never in vercel.json.
  **Region**              bom1 (Mumbai) --- closest to Maharashtra, India
  ----------------------- -------------------------------------------------------------------------------------------------------------------

*End of Tech Stack Document --- Design system details to follow in a
separate document.*
