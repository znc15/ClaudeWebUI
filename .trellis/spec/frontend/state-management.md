# State Management

> State management is currently local-first. The app does not use a global store library.

## What Exists Today

- `src/app/App.tsx` owns the main interaction state for the page:
  backend connection settings,
  health/session loading state,
  active session identity,
  current session detail,
  current message draft,
  appearance mode.
- Child components receive state and setters through props. Examples:
  `LeftSidebar` receives connection settings, the session list, and selection/create callbacks.
  `ChatView` receives the active session, current draft, and send callback.
- Dialogs and smaller panels keep purely local state inside the component. Examples:
  `SettingsDialog` owns `active` and `servers`
  `RightSidebar` owns `tab`
  `ChatView` owns starred/model/thinking mode UI state

## What Does Not Exist

- No Zustand, Redux, Jotai, Recoil, MobX, or other app-level state library is used in `src/`.
- No server-state cache library exists. Session state is held directly in `App.tsx` and updated from REST/WebSocket events.
- No URL-based state management exists.
- No frontend persistence layer exists beyond `localStorage` for backend connection settings/theme and the cookie handling inside the reusable `src/app/components/ui/sidebar.tsx` primitive.

## Current State Boundaries

- Lift shared app-shell and transport state to `App.tsx` instead of introducing a store. `App.tsx` is the current example of that pattern.
- Keep internal control state inside the owning component when nothing else needs it.
- Use React context only inside self-contained primitive systems where several subcomponents need shared internal state. Examples: `sidebar.tsx`, `form.tsx`, `carousel.tsx`, `chart.tsx`.

## Derived State Patterns

- Derived booleans are computed inline from existing state, for example socket readiness and dark-mode state in `src/app/App.tsx`.
- Static option lists or transport constants stay file-local unless reused across files.
- Small merge/update helpers may stay local to `App.tsx` when they only serve the current app shell.

## Guidance Based On Current Code

- When extending the existing app shell, prefer keeping new state local or lifting it into `App.tsx`.
- Introduce context only when multiple tightly related subcomponents need it and the pattern matches existing primitive modules.
- Do not document a future global state architecture unless the codebase actually adopts one.
