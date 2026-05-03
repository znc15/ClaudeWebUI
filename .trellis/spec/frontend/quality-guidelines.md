# Quality Guidelines

> Frontend quality is currently enforced mainly by keeping the Vite build green and by matching the existing component patterns.

## Tooling Baseline

- The root frontend `package.json` exposes `dev`, `build`, `lint`, and `typecheck`.
- There is still no frontend test runner configured today.
- The repo now has a root ESLint config in `eslint.config.js` for `src/**` and `vite.config.ts`.
- `vite.config.ts` is the main build-time source of truth. It sets the `@` alias to `src`, enables React and Tailwind, and includes a custom `figma:asset/` resolver.

## What Review Should Check First

- Does the change still pass the root frontend lint, typecheck, and build commands?
- Does the new code fit one of the existing shapes:
  app-specific component under `src/app/components/`
  primitive wrapper under `src/app/components/ui/`
  style change under `src/styles/`
- Is shared state still passed explicitly through props unless there is a proven need for internal context?
- If tool parsing or rendering changes, do backend `toolName` values and frontend labels preserve Claude Code wording such as `子Agent`, `Task`, `Bash`, `Shell`, `Search`, `Grep`, `Read`, `Edit`, `Write`, and `MultiEdit`?
- If a reusable primitive is touched, are accessibility attributes and `data-slot` patterns preserved where they already exist?

## Required Patterns Based On Existing Code

- Use the `@` alias only for imports from `src` when it improves clarity; the repo currently mixes relative imports and local same-folder imports.
- Use `cn()` from `src/app/components/ui/utils.ts` when merging Tailwind class names in reusable primitives.
- Keep Tailwind as the default styling mechanism, with inline `style` objects only where the current app shell already relies on gradients, blur, or dynamic sizing.
- Preserve cleanup for browser event listeners. Real examples exist in `src/app/App.tsx`, `src/app/components/left-sidebar.tsx`, and `src/app/components/ui/use-mobile.ts`.

## Patterns That Would Clash With Current Reality

- Claiming frontend tests exist or are required when no frontend test runner is configured.
- Introducing a global store or fetch cache as a hidden quality dependency.
- Rewriting app-shell visuals to remove inline styles just to satisfy a generic convention.
- Treating every component as fully tokenized and theme-driven when the existing app still uses many hard-coded UI colors in component files.

## Accessibility Expectations Seen In Code

- Primitive wrappers already carry useful a11y details. Keep them intact when editing files like `src/app/components/ui/form.tsx` and `src/app/components/ui/sidebar.tsx`.
- Icon-only actions in app-specific components generally use `title` attributes; preserve that pattern where it already exists.
- Modal overlays close on background click and use motion transitions. That behavior appears in both dialog components and should stay consistent unless intentionally changed.

## Minimal Verification For Frontend-Only Spec Changes

- Confirm the spec files render as plain Markdown and are stored in the expected paths under `.trellis/spec/frontend/`.
- For repository health, the smallest meaningful check set is now:
  `npm run lint`
  `npm run typecheck`
  `npm run build`
- Do not claim frontend test status, because no frontend test runner is configured in the current repo.

## Scenario: Frontend Session Wiring

### 1. Scope / Trigger
- Trigger: frontend code under `src/app/` now talks to the local backend over REST and WebSocket, so quality checks must cover both UI code and its typed transport boundary.

### 2. Signatures
- REST:
  `GET /api/health`
  `GET /api/sessions`
  `GET /api/sessions/:sessionId`
  `POST /api/sessions`
- WebSocket:
  `GET /ws?sessionId=<id>[&password=<password>]`

### 3. Contracts
- Request header:
  `X-Claude-Webui-Password` is optional and only sent when the user configured a password.
- Frontend transport types live in:
  `src/app/types.ts`
- Frontend request helpers live in:
  `src/app/lib/api.ts`

### 4. Validation & Error Matrix
- Missing or wrong password -> show backend error text in the app shell instead of silently retrying.
- Missing active session id -> do not open a WebSocket.
- Closed or not-yet-open socket -> disable send and surface a toast on manual send attempts.

### 5. Good/Base/Bad Cases
- Good: health check succeeds, sessions load, a selected session opens one socket, and streamed messages update the current session in place.
- Base: backend is reachable but no sessions exist yet, so the app shows the empty-state CTA.
- Bad: frontend keeps sample/static session data after wiring transport. Real data must replace mock session state.

### 6. Tests Required
- Root verification must include:
  `npm run lint`
  `npm run typecheck`
  `npm run build`
- Assertion points:
  transport helpers type-check against `src/app/types.ts`
  app shell compiles with real session props instead of sample-only props

### 7. Wrong vs Correct
#### Wrong
- Keep mock conversations in component-local constants after adding backend calls.
#### Correct
- Treat REST/WebSocket payloads as the source of truth and merge them into app state in `src/app/App.tsx`.

## Scenario: Claude Code Tool Blocks

### 1. Scope / Trigger
- Trigger: backend output parsing and frontend chat rendering share the `ToolBlock` contract, so Claude Code tool names must survive the transport boundary instead of being normalized into generic UI-only labels.

### 2. Signatures
- Backend parser:
  `deriveBlocks(content: string): ToolBlock[]`
- Transport field:
  `ChatMessage.blocks: ToolBlock[]`
- Frontend renderer:
  `ChatView` receives `SessionDetail.messages[].blocks` and renders each block by `kind`.

### 3. Contracts
- `ToolBlock.kind` is the behavior category:
  `thinking`, `agent`, `bash`, `grep`, `edit`, or `text`.
- `ToolBlock.toolName` is the user-facing Claude Code label and must preserve recognized labels:
  `思考`, `子Agent`, `Task`, `Subagent`, `Agent`, `Bash`, `Shell`, `Search`, `Grep`, `Read`, `Edit`, `Write`, `MultiEdit`.
- `子Agent`, `Subagent`, `Agent`, and `Task` map to `kind: "agent"` but keep their original `toolName`.
- `Shell` maps to `kind: "bash"` and `Search` maps to `kind: "grep"` while preserving `toolName`.
- `Read`, `Edit`, `Write`, and `MultiEdit` map to `kind: "edit"` with `action` set to `read`, `edit`, `write`, or `multiedit`.

### 4. Validation & Error Matrix
- Unknown structured heading -> emit a `text` block, not a fake tool block.
- Claude Code narrative text after a tool block -> split it into a following `text` block instead of swallowing it into command output or edit excerpts.
- Exited session status -> frontend must not send input through the WebSocket.
- Socket not open -> frontend must show the explicit socket status and block send attempts.

### 5. Good/Base/Bad Cases
- Good: `子Agent: status: running` renders as an agent block labeled `子Agent`.
- Good: `Task: ...` renders as an agent block labeled `Task`.
- Good: `Shell: npm test` renders as a bash-style block labeled `Shell`.
- Base: plain assistant prose with no recognized heading renders as a single `text` block.
- Bad: parser rewrites `子Agent` to `Agent` or `Shell` to `Bash`, because the UI no longer reflects Claude Code output.

### 6. Tests Required
- Backend parser tests must cover:
  `思考`, `子Agent`, `Task`, `Bash`, `Shell`, `Search`, `Grep`, `Read`, `Edit`, `Write`, `MultiEdit`, and trailing narrative text after tool output.
- Frontend verification must include:
  `npm run lint`
  `npm run typecheck`
  `npm run build`
- Backend verification must include:
  `npm run lint`
  `npm run typecheck`
  `npm run build`
  `npm test`

### 7. Wrong vs Correct
#### Wrong
- Parse `Task` or `子Agent` into a generic text block, or display every agent-like block as `Agent`.
#### Correct
- Categorize agent-like tools with `kind: "agent"` while preserving the exact Claude Code label in `toolName` for the chat UI.

## Scenario: Root Dev Launcher

### 1. Scope / Trigger
- Trigger: the repo now has a root-level one-command launcher for local development, in addition to standalone frontend and backend dev commands.

### 2. Signatures
- Root launcher:
  `npm run dev:all`
- Frontend-only:
  `npm run dev`
  `npm run dev:frontend`
- Backend-only:
  `cd server && npm run dev`

### 3. Contracts
- `npm run dev:all` must start the frontend and backend together from the repo root.
- The frontend process must be launched with Vite's open flag so the browser opens automatically when the dev server is ready.
- The backend process must continue to use the existing `server/` dev script.
- The launcher must stop the other child process if either side exits unexpectedly.
- The launcher must surface failures explicitly instead of silently ignoring them.

### 4. Validation & Error Matrix
- Frontend exits early -> launcher kills backend and exits nonzero.
- Backend exits early -> launcher kills frontend and exits nonzero.
- User presses Ctrl+C -> both children terminate cleanly.
- Launch script syntax breaks -> `node --check` fails before runtime.

### 5. Good/Base/Bad Cases
- Good: one root command opens the browser and keeps both dev servers running.
- Base: frontend still starts alone with `npm run dev`.
- Bad: silent background failure where one child dies and the other keeps running.

### 6. Tests Required
- Root verification must include:
  `npm run lint`
  `npm run typecheck`
  `npm run build`
- Backend verification must include:
  `npm run lint`
  `npm run typecheck`
  `npm run build`
- Launcher script verification must include:
  `node --check scripts/dev-launcher.mjs`

### 7. Wrong vs Correct
#### Wrong
- Hide child-process failures or require two manual terminal commands for the default workflow.
#### Correct
- Provide a root launcher that makes the common path one command while keeping single-side debug commands available.
