# Frontend Integrate Backend Chat

## Goal

Replace the sample-only frontend chat/session behavior with a usable frontend that talks to the verified backend in `server/` through REST and WebSocket APIs, while preserving the current app shell style as much as possible.

## What I Already Know

- The backend exposes `GET /api/health`, `GET /api/sessions`, `POST /api/sessions`, `GET /api/sessions/:id`, and `GET /ws?sessionId=...`.
- Backend auth is password-based through `Authorization` or `X-Claude-Webui-Password` on HTTP and a `password` query param for WebSocket.
- Session payloads include summaries, full message history, status, and tool/message blocks.
- The current frontend is mostly static sample state in `src/app/App.tsx`, `src/app/components/chat-view.tsx`, and `src/app/components/left-sidebar.tsx`.
- Root frontend now has real `lint`, `typecheck`, and `build` scripts and this task must leave them green.

## Requirements

- Replace static/sample session data with backend-driven session listing and selection.
- Support creating a session from the frontend and switching the active session.
- Load session detail/history for the active session.
- Open and manage a WebSocket connection for the active session.
- Send user input through the WebSocket and render streamed server events.
- Render server tool blocks in the chat UI in a readable way.
- Keep the existing visual language where practical, but simplify dead sample behavior if it blocks correctness.
- Fix frontend lint/typecheck/build issues in `src/**`, `src/main.tsx`, `tsconfig.json`, `vite.config.ts`, and root `package.json` config/scripts if needed.
- Do not edit `server/**` or `README.md`.

## Acceptance Criteria

- [ ] Frontend can load backend health information and show connection state.
- [ ] Frontend can list existing sessions from `/api/sessions`.
- [ ] Frontend can create a new session via `POST /api/sessions`.
- [ ] Frontend can fetch and render `/api/sessions/:id` for the selected session.
- [ ] Frontend opens `/ws` for the active session and handles snapshot, message, and status events.
- [ ] Frontend can send chat input to the active session over WebSocket.
- [ ] Streamed assistant messages and tool blocks render without relying on sample data.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` all pass at the repo root.

## Definition of Done

- Required frontend behavior works against the existing backend contract.
- Root frontend verification commands pass.
- No backend files or `README.md` are changed.

## Technical Approach

- Keep `App.tsx` as the composition root and lift shared session/connection state there.
- Add small frontend-only helper modules under `src/app/` for backend types, REST helpers, and WebSocket event handling.
- Reuse the existing sidebars and chat shell where possible, but remove dead sample-only state and controls when they interfere with real data flow.
- Use local React state and effects instead of introducing a global store or fetch library.

## Decision (ADR-lite)

**Context**: The current UI is visually rich but driven by hardcoded sample sessions and messages, while the backend already owns the real chat/session lifecycle.

**Decision**: Keep the visual shell and convert the main screen to a backend-driven state model rooted in `App.tsx`, with small colocated helper modules for transport/types.

**Consequences**: This minimizes churn in the visual structure, but some sample-only controls and static lists may be reduced or repurposed so the app remains functional and maintainable.

## Out of Scope

- Backend API changes.
- Editing `server/**`.
- Editing `README.md`.
- Adding a new frontend state-management library.
- Adding a frontend test framework unless strictly required to make the repo pass current checks.

## Technical Notes

- Relevant frontend specs: `.trellis/spec/frontend/index.md` plus checklist files for directory structure, components, hooks, state, type safety, and quality.
- Relevant shared guides: `.trellis/spec/guides/index.md`, especially cross-layer and code-reuse guides because this task crosses API, WebSocket, and UI boundaries.
- Backend defaults to `http://127.0.0.1:4096` unless configured otherwise.
