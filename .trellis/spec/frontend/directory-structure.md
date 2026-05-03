# Directory Structure

> The frontend is a single Vite + React app. Document the structure that exists today, not an aspirational feature-based split.

## Current Layout

```text
src/
├── app/
│   ├── App.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── types.ts
│   └── components/
│       ├── chat-view.tsx
│       ├── context-details-dialog.tsx
│       ├── left-sidebar.tsx
│       ├── right-sidebar.tsx
│       ├── settings-dialog.tsx
│       ├── figma/
│       │   └── ImageWithFallback.tsx
│       └── ui/
│           ├── button.tsx
│           ├── form.tsx
│           ├── sidebar.tsx
│           ├── use-mobile.ts
│           └── utils.ts
├── imports/
│   └── image*.png
└── styles/
    ├── fonts.css
    ├── index.css
    ├── tailwind.css
    ├── theme.css
    └── globals.css
```

## What Lives Where

- `src/main.tsx` is the only frontend entrypoint. It mounts `src/app/App.tsx` and imports `src/styles/index.css`.
- `src/app/App.tsx` is the current screen-level container. It owns most application state and wires the main layout together.
- `src/app/lib/` stores app-level helpers that are not UI primitives. `api.ts` is the current example for REST/WebSocket transport helpers.
- `src/app/types.ts` is the frontend-owned contract file for backend session payloads and socket event shapes used by the app shell.
- `src/app/components/*.tsx` contains app-specific UI such as `left-sidebar.tsx`, `right-sidebar.tsx`, `chat-view.tsx`, and the dialogs.
- `src/app/components/ui/*.tsx` contains shared primitives and generated wrappers around Radix/shadcn-style building blocks. Examples: `button.tsx`, `form.tsx`, `sidebar.tsx`.
- `src/app/components/figma/` is a narrow helper area for imported Make/Figma assets. Right now it only contains `ImageWithFallback.tsx`.
- `src/imports/` stores generated image assets that are imported from the UI.
- `src/styles/` centralizes CSS entrypoints, theme variables, and global utility classes.

## Practical Conventions

- New app-specific components should go under `src/app/components/` unless they are clearly reusable UI primitives.
- App-specific transport helpers and non-visual utilities should live under `src/app/lib/`, not under `src/app/components/`.
- Shared frontend-only contract types that are consumed by multiple app-specific files should live in `src/app/types.ts` before creating deeper type folders.
- Reusable low-level controls should stay in `src/app/components/ui/` and follow the existing primitive style used by `button.tsx`, `input.tsx`, and `sidebar.tsx`.
- Do not introduce a new top-level `hooks/`, `stores/`, or `features/` directory unless the codebase actually grows into that shape. No such structure exists today.
- Keep helper files close to the components that use them. The only custom hook today is `src/app/components/ui/use-mobile.ts`, colocated with the sidebar primitive that depends on it.

## Naming Patterns Seen In This Repo

- App-specific component files use kebab-case file names: `chat-view.tsx`, `settings-dialog.tsx`, `right-sidebar.tsx`.
- Primitive UI files also use kebab-case and often mirror the exported component name: `button.tsx`, `toggle-group.tsx`, `alert-dialog.tsx`.
- The main app shell uses PascalCase exports even when the file name is kebab-case: `export function LeftSidebar()` in `src/app/components/left-sidebar.tsx`.
- CSS entrypoints are flat and descriptive: `index.css`, `theme.css`, `globals.css`.

## Examples To Follow

- `src/app/App.tsx` for the current top-level composition pattern.
- `src/app/components/left-sidebar.tsx` for an app-specific component with inline data, local state, and layout logic.
- `src/app/components/ui/sidebar.tsx` for a reusable primitive module with helpers, context, and multiple exports.
