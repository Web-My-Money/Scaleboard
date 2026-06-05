# WMM Story Engine — Client Workspace Foundation

**Spec date:** 2026-06-05
**Status:** Approved (brainstorm phase)
**Scope:** Sub-project 1 of the WMM Story Engine roadmap. Phases 3 and 4, and all existing-module ports, are out of scope and will be covered by follow-up specs.

---

## 1. Goals & Non-Goals

### Goals

1. A Next.js 15 app shell at `C:\WMM App 2.0\` running locally via `npm run dev`.
2. Per-client folder system on disk at a configurable path (default `./data/clients/`) with the schema defined in §3.
3. Onboarding flow: paste-first → background AI structuring → user review & approval → `brief.md` is written.
4. Persistent left sidebar (collapsible) listing all clients, with the active client highlighted; switching clients is a single click and rebinds every module's read/write target.
5. Storage abstraction (`ClientRepo`) with a filesystem adapter today, designed for a drop-in Supabase adapter later.
6. AI client abstraction (`AiClient`) with a direct Anthropic adapter today, designed for a drop-in OpenRouter adapter later.
7. Context-injection plumbing: every AI call goes through `AiClient`, which auto-prepends a small core context (profile + brief summary, ~500 tokens) and accepts per-module extras.
8. Bilingual UI toggle (ES/EN) stored in user settings.
9. Glassmorphism design system applied via design tokens generated from `docs/input/DESIGN.md`.
10. Team scaffolding: data model, UI to manage members and roles, permission gating at UI and API layers — all behind interfaces that match Supabase Auth's contract so real authentication is a future adapter swap.

### Non-Goals

- Porting any existing modules (Strategy, Creative Request, Email Flows, Attraction Matrix, Test Lab, Financials). Each becomes its own follow-up spec built on top of this foundation.
- Meta / Google / GHL API integration (roadmap Phase 3).
- Weekly Performance Digest and AI next-iteration loop (roadmap Phase 4).
- Real authentication / password login. v1 is local single-machine; "current user" is a picker in app settings.
- Cloud deployment to Vercel. Runs locally only. Migration to Vercel+Supabase is a future spec.

---

## 2. Tech Stack & High-Level Architecture

### Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS** with design tokens generated from `docs/input/DESIGN.md` (colors, typography, spacing, radii)
- Fonts: **Plus Jakarta Sans** (primary + display) and **JetBrains Mono** (mono) via `next/font`
- **Zustand** for active-client and UI state on the client side; React Server Components for everything that can stay server-side
- **`@anthropic-ai/sdk`** for AI calls (abstracted behind `AiClient`)
- **`fs/promises`** for storage (abstracted behind `ClientRepo`)
- **Zod** for schema validation on every JSON read/write
- **`next-intl`** for ES/EN UI strings
- No database, no auth, no external services in v1

### Layered architecture

```
┌─────────────────────────────────────────────────────┐
│  UI (App Router pages, RSC + client components)    │
│  - Sidebar, workspace shell, onboarding wizard     │
├─────────────────────────────────────────────────────┤
│  Server actions / API routes                       │
│  - /api/clients, /api/clients/[id]/brief, ...      │
├─────────────────────────────────────────────────────┤
│  Services (pure business logic; swappable adapters)│
│  ┌──────────────┐ ┌───────────┐ ┌────────────────┐ │
│  │ ClientRepo   │ │ AiClient  │ │ TeamRepo +     │ │
│  │              │ │           │ │ SessionProvider│ │
│  │ FsClientRepo │ │ Anthropic │ │ FsTeamRepo +   │ │
│  │ Supabase…    │ │ OpenRouter│ │ LocalSession   │ │
│  │ (future)     │ │ (future)  │ │ Supabase…      │ │
│  │              │ │           │ │ (future)       │ │
│  └──────────────┘ └───────────┘ └────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Adapters (only this layer touches the outside)    │
│  fs / Anthropic API                                │
└─────────────────────────────────────────────────────┘
```

**Hard rule:** UI components and services never import `fs`, the Anthropic SDK, or any future Supabase SDK directly. They depend only on the three interfaces above. Adapter selection happens in a single factory file per interface, keyed off environment variables.

### Repo structure

```
C:\WMM App 2.0\
  app/                            Next.js App Router
    layout.tsx                    root layout, sidebar, top bar
    page.tsx                      "/" — client list landing
    clients/
      [slug]/
        layout.tsx                workspace shell (active-client context)
        page.tsx                  redirects to /clients/[slug]/brief
        brief/page.tsx
        settings/page.tsx
        [module]/page.tsx         placeholders for future modules
    onboarding/
      page.tsx                    new client paste-and-review flow
    settings/
      page.tsx                    app-level settings (team, language, AI defaults)
    api/
      clients/route.ts            GET/POST clients
      clients/[id]/route.ts       GET/PATCH/DELETE client
      clients/[id]/brief/route.ts brief draft + commit endpoints
      team/route.ts
  components/                     shared UI components
  lib/
    repo/                         ClientRepo interface + FsClientRepo
    ai/                           AiClient interface + AnthropicAiClient
    team/                         TeamRepo + SessionProvider
    schemas/                      Zod schemas
    context/                      AI context assembly
    permissions/                  role → action map + requirePermission helper
    i18n/                         ES/EN dictionaries (next-intl)
    design-tokens/                generated from docs/input/DESIGN.md
  data/                           gitignored; configurable via WMM_DATA_DIR
    clients/
    team.json
    app-settings.json
  docs/
    superpowers/specs/
    input/                        existing roadmap + design + skill docs
```

---

## 3. On-Disk Folder Schema

This is the contract `FsClientRepo` reads and writes. The future Supabase adapter mirrors it as tables and Storage buckets with identical names.

```
data/clients/<client-slug>/
  client.json                      profile + status + platform IDs + assignments
  brief.md                         committed brief (frontmatter = structured fields, body = prose)
  brief.draft.md                   present only while onboarding awaits approval
  competitors/
    <competitor-slug>.md           one file per competitor
  densification-pack/
    angles.json                    Angle[]
    hooks.json                     Hook[] (indexed by angleId)
    channels.md
    landing-page.md
    user-journey.md
    financials.json                FinancialsModel
  creative-requests/
    <YYYY-MM-DD>-<slug>.md
  email-flows/
    <flow-type>.md                 lead-nurture / pre-call / no-show-recovery / sales-follow-up / reactivation / onboarding
  attraction-matrix/
    <YYYY-MM-DD>-<creative-slug>.json
  test-lab/
    tests.json                     Test[] with ICE scores + status
    learning-log.md
  readiness-checklist.json         Checklist
  context/
    ai-context.md                  auto-generated; never hand-edited
    uploads/                       arbitrary user files (PDFs, screenshots, brand docs)
  .usage.jsonl                     AI call log: { ts, module, model, inputTokens, outputTokens, durationMs }
```

### `client.json` schema (Zod)

```ts
const ClientSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1),
  vertical: z.string(),
  status: z.enum(["onboarding", "active", "paused", "archived"]),
  language: z.enum(["es", "en"]),
  platforms: z.object({
    metaBusinessId: z.string().optional(),
    googleAdsAccountId: z.string().optional(),
    ghlLocationId: z.string().optional(),
  }),
  owners: z.array(z.string().uuid()),          // member IDs
  assignments: z.object({
    strategy: z.string().uuid().optional(),
    mediaBuying: z.string().uuid().optional(),
    design: z.string().uuid().optional(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
```

### Naming, versioning, integrity rules

- `slug` is generated from `name` at creation (lowercase, hyphenated, ASCII-only via `slugify`), shown to the user, editable once during onboarding, immutable afterward. Collisions append `-2`, `-3`, etc.
- Artifacts that can have multiple versions over time are date-prefixed: `YYYY-MM-DD-<slug>.{md,json}`.
- All JSON files validated through Zod on read; corrupt or schema-incompatible files raise repo-level errors and are surfaced to the UI rather than silently swallowed.
- Writes are atomic: write to `<filename>.tmp`, then `fs.rename`. No file locking needed (single-user, single-process).

---

## 4. Storage Abstraction — `ClientRepo`

```ts
// lib/repo/ClientRepo.ts
export interface ClientRepo {
  // Lifecycle
  listClients(): Promise<ClientSummary[]>
  getClient(id: string): Promise<Client>
  createClient(input: CreateClientInput): Promise<Client>
  updateClient(id: string, patch: Partial<Client>): Promise<Client>
  archiveClient(id: string): Promise<void>

  // Brief
  getBriefDraft(id: string): Promise<BriefDraft | null>
  saveBriefDraft(id: string, draft: BriefDraft): Promise<void>
  commitBrief(id: string, approved: Brief): Promise<void>
  getBrief(id: string): Promise<Brief | null>

  // Generic artifact I/O (used by all future module specs)
  readArtifact<T>(id: string, path: ArtifactPath, schema: ZodSchema<T>): Promise<T | null>
  writeArtifact<T>(id: string, path: ArtifactPath, data: T, schema: ZodSchema<T>): Promise<void>
  listArtifacts(id: string, dir: ArtifactDir): Promise<ArtifactRef[]>

  // Context (used by AiClient)
  getCoreContext(id: string): Promise<CoreContext>
  getModuleContext(id: string, scope: ContextScope): Promise<string>
}
```

### Adapters

- **`FsClientRepo`** — uses `fs/promises` + Zod. Path resolution honors `process.env.WMM_DATA_DIR`, defaulting to `./data/clients`. Atomic writes via temp-file-then-rename.
- **`SupabaseClientRepo`** (future) — same interface, backed by Postgres tables and Supabase Storage buckets that mirror the on-disk schema names 1-to-1.

### Factory

```ts
// lib/repo/index.ts
export const repo: ClientRepo =
  process.env.STORAGE_DRIVER === "supabase"
    ? new SupabaseClientRepo(/* … */)
    : new FsClientRepo(process.env.WMM_DATA_DIR ?? "./data/clients")
```

### Why generic `readArtifact` / `writeArtifact`

Future module specs (Strategy, Creative Request, Email Flows, Attraction Matrix, Test Lab) **do not need to extend `ClientRepo`**. They pick a typed path (e.g. `["densification-pack", "angles.json"]`) and a Zod schema, and the repo handles validation, atomic writes, and adapter routing. The interface stays stable across modules.

---

## 5. AI Client Abstraction — `AiClient`

```ts
// lib/ai/AiClient.ts
export interface AiClient {
  generate(input: GenerateInput): Promise<GenerateResult>
  generateStream(input: GenerateInput): AsyncIterable<StreamChunk>
}

export interface GenerateInput {
  clientId: string
  module: ModuleId
  prompt: string
  contextScope?: ContextScope
  model?: ModelId
  maxTokens?: number
  temperature?: number
  responseFormat?: "text" | "json"
}
```

### What `generate` does internally

1. Pull `coreContext = repo.getCoreContext(clientId)` — profile + brief summary, capped at ~500 tokens.
2. If `contextScope` is set, pull `moduleContext = repo.getModuleContext(clientId, scope)`.
3. Resolve model: explicit `input.model` > module default > global default (`claude-sonnet-4-6`).
4. Resolve language from `client.language` (overridable by user setting).
5. Build messages: module-specific system prompt + assembled context + user prompt.
6. Call adapter; return `{ text, usage, model, durationMs }`.
7. Append usage record to `data/clients/<slug>/.usage.jsonl`.

### Adapters

- **`AnthropicAiClient`** — direct `@anthropic-ai/sdk`. Reads `ANTHROPIC_API_KEY`. Default model `claude-sonnet-4-6`.
- **`OpenRouterAiClient`** (future) — same interface, OpenAI-compatible REST. Reads `OPENROUTER_API_KEY`. Model IDs translated via a mapping table.

### Module defaults (`lib/ai/defaults.ts`)

```ts
export const modelDefaults = {
  default: "claude-sonnet-4-6",
  byModule: {
    strategy:            "claude-sonnet-4-6",
    "creative-request":  "claude-sonnet-4-6",
    "email-flows":       "claude-sonnet-4-6",
    "attraction-matrix": "claude-opus-4-8",   // heavier reasoning
    "test-lab":          "claude-sonnet-4-6",
    "brief-structurer":  "claude-sonnet-4-6", // onboarding background task
  },
}
```

### Factory

```ts
// lib/ai/index.ts
export const ai: AiClient =
  process.env.AI_PROVIDER === "openrouter"
    ? new OpenRouterAiClient()
    : new AnthropicAiClient()
```

---

## 6. Onboarding Flow

1. **Trigger** — "+ New Client" button in sidebar opens a modal with `name` and `vertical` fields. Slug is auto-generated and shown (editable once). On submit, the folder is created with `client.json.status = "onboarding"` and the user is routed to `/onboarding/[slug]`. The workspace shell at `/clients/[slug]/*` remains gated until the brief is committed.

2. **Paste screen** — single large textarea, "Paste the client brief here." Optional metadata strip below: Meta Business ID, Google Ads ID, GHL Location ID (all optional and fillable later in Settings).

3. **Background structuring** — on submit, the raw paste is written immediately to `brief.draft.md` so nothing is lost. A server action calls `ai.generate({ module: "brief-structurer", prompt: pasteText })` which extracts:
   ```
   offer, icp, usp, competitors[], kpi, budget, language
   ```
   Progress is streamed to the UI; extracted fields appear one at a time.

4. **Review & approve screen** — structured fields shown side-by-side with the raw paste. Each field is editable inline. Competitors render as an editable list (add / remove / edit). Hovering any field reveals a "source paragraph" popover that highlights the original text the AI pulled the field from, so misinterpretations are easy to catch.

5. **Approve & commit** — user clicks "Approve brief":
   - `brief.md` is written: frontmatter = structured fields, body = the user-approved prose.
   - `brief.draft.md` is deleted.
   - `client.json.status` flips from `"onboarding"` to `"active"`.
   - `client.json.language` is set from the detected language.
   - `context/ai-context.md` is generated for the first time.
   - User is redirected to `/clients/[slug]/brief`.

6. **Gating** — until commit, downstream modules are disabled. The sidebar shows the client with an "Onboarding" badge. Attempting to open a module screen for a client whose `brief.md` doesn't exist shows: *"Finish onboarding to enable this module."*

7. **Re-onboarding** — the user can edit `brief.md` later from the Brief tab. Editing uses the same structured-field UX. The structurer can be re-invoked on demand for full re-parses.

The launch-readiness checklist is **not** part of onboarding. It lives in the per-client Settings tab and is filled in over time as the team configures Meta pixel, GHL pipeline, naming conventions, etc.

---

## 7. Workspace UI Shell

### Layout

```
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │  Top bar: breadcrumb · module switcher · ⚙   │
│ (collap- ├──────────────────────────────────────────────┤
│  sible)  │                                              │
│          │  Module view (bento cards, glassmorphism)    │
│  Clients │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Sidebar

- Widths: 280px expanded, 56px collapsed (icon-only). Toggle pinned bottom-left; also bound to keyboard `[`.
- Search box at top filters the client list.
- Clients grouped by status: **Active** (default expanded), **Onboarding** (badge), **Paused**, **Archived** (collapsed).
- Each row is a glassmorphism card with client name, vertical underneath, small status dot. The active client gets a primary-color glow border.
- "+ New Client" pinned bottom.
- Sidebar state (collapsed/expanded, expanded groups) persisted to `localStorage`.

### Top bar

- Breadcrumb: `Clients › Acme Corp › Brief`. Each segment clickable.
- Module switcher (segmented control): `Brief · Strategy · Creative Requests · Email Flows · Attraction Matrix · Test Lab · Settings`. Tabs whose data is not yet available are disabled with reduced opacity and a tooltip explaining why.
- App settings gear on the right opens a drawer with the ES/EN toggle, data folder path display, AI provider/model defaults, and team management.
- Avatar of the active team member at far right; click to switch active user (v1) or sign out (v2).

### Module views

In v1 only the **Brief** tab and **Settings** tab are functional. All other module tabs render placeholder bento cards reading *"Module coming soon — see roadmap"* so the shell is complete and future module specs can slot in without touching the layout.

### Routing

```
/                                  → client list landing
/clients/[slug]                    → redirects to /clients/[slug]/brief
/clients/[slug]/brief              → Brief view/editor
/clients/[slug]/settings           → per-client settings (platforms, status, language override, assignments)
/clients/[slug]/[module]           → future module pages
/settings                          → app-level settings (team, language, AI defaults)
/onboarding/[slug]                 → onboarding flow for a client in "onboarding" status
```

### Active-client state

A Zustand store `useActiveClient()` is synced to the URL slug by the `[slug]/layout.tsx`. All module pages read `clientId` from this store, not from props. Switching slugs in the URL re-binds the store.

### Accessibility

WCAG 2.2 AA per the design skill. Specific commitments:
- Visible focus ring on every interactive element, using the primary token.
- Keyboard nav for sidebar (`↑/↓` traverses clients, `Enter` opens; `[` toggles collapse; `g c` chord returns to client list).
- Color contrast verified against tokens in `DESIGN.md`.
- All glassmorphism panels meet AA against their content; decorative blur never reduces text contrast below threshold.

### Design tokens

A build-time script (`scripts/build-design-tokens.ts`) parses `docs/input/DESIGN.md` frontmatter into `lib/design-tokens/tokens.ts`, then emits Tailwind theme extensions. Editing `DESIGN.md` is the canonical way to change tokens.

---

## 8. Team & Roles

### Roles

`admin`, `strategist`, `media_buyer`, `designer`, `viewer`. Admin can do everything. The role → action permission map is a static table in `lib/permissions/map.ts` for v1, designed to move into Supabase RLS policies later without changing call sites.

### `team.json` (app-level)

```ts
{
  members: [
    {
      id: string,                  // uuid
      name: string,
      email: string,
      role: "admin" | "strategist" | "media_buyer" | "designer" | "viewer",
      createdAt: string,           // ISO
      // passwordHash absent in v1; populated when Supabase Auth lands
    }
  ],
  activeUserId: string | null     // v1 only: which member you "are"
}
```

### Per-client assignments

`client.json` includes `owners: string[]` (member IDs) and `assignments: { strategy?: id, mediaBuying?: id, design?: id }`. Set from the per-client Settings tab. Future module UIs read these to show "assigned to" badges and filter "my clients."

### Interfaces (shape matches Supabase Auth)

```ts
interface TeamRepo {
  listMembers(): Promise<Member[]>
  getMember(id: string): Promise<Member | null>
  inviteMember(input: InviteInput): Promise<Member>     // v1: no email sent
  updateMember(id: string, patch: Partial<Member>): Promise<Member>
  removeMember(id: string): Promise<void>
}

interface SessionProvider {
  getCurrentUser(): Promise<Member | null>              // v1: reads team.json.activeUserId
  signIn(email: string, password: string): Promise<Member>  // v1: throws "not implemented"
  signOut(): Promise<void>
}
```

### Adapters

- v1: `FsTeamRepo` + `LocalSessionProvider`. The "current user" is whichever member id is stored in `team.json.activeUserId`, set from a picker in app settings or the top-bar avatar menu.
- future: `SupabaseTeamRepo` + `SupabaseSessionProvider` — same interfaces, real auth.

### UI surface in v1

- **App Settings → Team tab:** member list with role badges; add / edit / remove (admin only); "I am…" dropdown to set active user.
- **Per-client Settings → Assignments:** assign team members to the strategy / media buying / design roles for that client.
- **Top bar avatar** shows the active user's initials. Click → switch user (v1) or sign out (v2).
- **Permission gating** enforced both in the UI (buttons disabled if role lacks permission) and at the API route layer via a shared `requirePermission(user, action)` helper. The helper checks the in-memory role map today and will check Supabase JWT claims later.

### First-run bootstrap

On first run, the app detects an empty or missing `team.json` and runs a one-time "Create admin" screen: name + email (password field present but ignored in v1). The created member becomes the initial admin and the active user.

---

## 9. Migration Path to Supabase + Vercel

The migration is intentionally compressed to three adapter swaps and a data import. None of the UI or services change.

1. **Provision Supabase project.** Tables mirror the on-disk schema names (`clients`, `briefs`, `angles`, `hooks`, …). Storage buckets mirror folders (`creative-requests/`, `email-flows/`, `attraction-matrix/`, `context/uploads/`).
2. **Implement `SupabaseClientRepo`, `SupabaseTeamRepo`, `SupabaseSessionProvider`.** Each is a single file that fulfills the existing interface; the wider codebase doesn't change.
3. **Switch environment variables.** Set `STORAGE_DRIVER=supabase`, point `ANTHROPIC_API_KEY` at OpenRouter via `AI_PROVIDER=openrouter`, set Supabase URL and anon key.
4. **One-time data import.** A migration script walks `data/clients/`, reads each artifact, and writes it through `SupabaseClientRepo` and `SupabaseTeamRepo`. Idempotent and re-runnable.
5. **Deploy to Vercel.** Next.js project deploys unchanged.

Auth flips on with step 2: `LocalSessionProvider.signIn` is replaced by `SupabaseSessionProvider.signIn`, the login screen route is enabled, and the top-bar "switch user" picker becomes a sign-out button. No UI restructure required.

---

## 10. Testing Approach

- **Unit tests (Vitest):**
  - Zod schemas: round-trip parse and validation failures.
  - `FsClientRepo`: every method against a tmp directory. Atomic-write verification (interrupt before rename leaves no partial file).
  - `FsTeamRepo`: member CRUD, permission map.
  - Slug generation, collision handling.
  - Context assembly: `getCoreContext` token budget enforcement, `getModuleContext` scope routing.
- **Integration tests:**
  - Onboarding flow end-to-end with a mocked `AiClient` returning a known structured response. Verify `brief.draft.md` → `brief.md` transition and `status` flip.
  - Client switching: stub two clients, verify modules read from the active client's folder only.
- **AI client tests:**
  - `AnthropicAiClient` calls mocked; verify message assembly (system prompt + core context + module context + user prompt) and model resolution priority.
- **E2E (Playwright, smoke only in v1):**
  - Create client → paste brief → approve → land in Brief tab → reload → state persists.
  - Toggle sidebar collapse → reload → state persists.
  - Switch active user → verify permission-gated UI updates.

Coverage target: 80% for `lib/`. UI components are not coverage-targeted.

---

## 11. Error Handling

- **Schema validation failures on read** surface as a banner on the affected page: *"This client's `<file>` is corrupt or out of date. View raw file?"* with a link to open the file directly. The app does not auto-overwrite invalid files.
- **AI call failures** surface inline at the call site with a retry button. Streaming failures show partial output with a "Resume" option that re-invokes from the last successful chunk where possible.
- **Filesystem errors** (disk full, permission denied) surface as toast notifications and block the action that triggered them. No silent retries.
- **Permission denials** surface as a toast and disable the offending UI element until the active user is changed.
- **Onboarding draft loss prevention:** the raw paste is written to `brief.draft.md` *before* the AI call. If the AI structuring fails or the user closes the tab, the draft is recoverable on next visit.

---

## 12. Open Items for Implementation Plan

These are deferred to the implementation-plan phase, not redesign questions:

- Exact Tailwind theme extension layout for glassmorphism (backdrop-blur values, surface alpha levels, shadow tokens).
- Initial set of UI strings for ES/EN dictionaries.
- Exact prompt for the `brief-structurer` module (will be drafted in the implementation plan and tuned against sample briefs).
- Concrete shape of `ContextScope` per future module (each module spec defines its own scope).

---

## 13. Acceptance Criteria

A reviewer can verify this spec is met by running `npm run dev` and:

1. Creating a new client, pasting a brief, reviewing the AI-structured fields, approving, and seeing `data/clients/<slug>/brief.md` exist on disk with the structured fields in frontmatter.
2. Closing the app, reopening, and finding the client still in the sidebar with its data intact.
3. Toggling the sidebar collapse with `[`; the state persists across reloads.
4. Switching the UI language ES ↔ EN from app settings; all UI strings flip.
5. Adding a team member in app settings, switching active user, and observing that the avatar in the top bar updates.
6. Assigning a team member to a client's "strategy" role; reopening the client; assignment is preserved.
7. Setting `STORAGE_DRIVER=supabase` with a stub `SupabaseClientRepo` returning canned data; the UI renders the canned data unchanged, proving the abstraction is honored throughout the app.
