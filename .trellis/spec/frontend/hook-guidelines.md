# Hook Guidelines

> Custom hooks are minimal in this repo. Most stateful logic still lives directly inside components.

## Current Reality

- There is only one standalone custom hook file today: `src/app/components/ui/use-mobile.ts`.
- Additional hook-like helpers exist inside primitive files as local helpers, not as separate modules. Examples:
  `useSidebar()` in `src/app/components/ui/sidebar.tsx`
  `useFormField()` in `src/app/components/ui/form.tsx`
- App-specific components such as `src/app/App.tsx`, `src/app/components/left-sidebar.tsx`, and `src/app/components/chat-view.tsx` keep their `useState`, `useEffect`, `useRef`, and `useCallback` calls inline.

## When Hooks Become Separate Files Here

- Separate hook files are used only when the logic is reusable across a component family.
- `use-mobile.ts` is a good example: it encapsulates a media-query listener that the sidebar primitive can reuse.
- If logic is only needed by one app-specific component, the current codebase keeps it inside that component instead of extracting a new hook file.

## Naming And Placement

- Hook names follow normal React naming: `useIsMobile`, `useSidebar`, `useFormField`.
- Standalone hook files use kebab-case names based on the hook name, for example `use-mobile.ts`.
- Hooks are colocated near the component family they support. The repo does not have a shared top-level hooks directory at the moment.

## Data Fetching

- There is no frontend data-fetching hook layer today.
- No React Query, SWR, or custom async fetch hooks are used in `src/`.
- If new frontend network logic is added, do not document it as an existing pattern until it actually exists in code.

## Patterns To Match

- For browser listeners, use an effect with cleanup, as in `src/app/components/ui/use-mobile.ts`.
- For click-outside handling, the current app keeps the effect inside the component. See `src/app/App.tsx`, `src/app/components/left-sidebar.tsx`, and `src/app/components/chat-view.tsx`.
- For internal component context, expose a small hook that throws when used outside its provider. See `useSidebar()` in `src/app/components/ui/sidebar.tsx`.

## Things Not To Assume

- Do not create a hook just to hide two or three lines of local state.
- Do not create fetch hooks, mutation hooks, or store hooks as if they already define the architecture. They do not in this repo.
- Do not add a global hooks directory unless multiple features actually start sharing standalone hooks.
