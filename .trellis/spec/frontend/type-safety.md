# Type Safety

> The repo is written in TypeScript-flavored React files, but type organization is lightweight and local.

## Current Type Organization

- Most types live in the same file as the component that uses them.
- App-specific props may use a named interface near the top of the file, for example `LeftSidebarProps` in `src/app/components/left-sidebar.tsx` and `RightSidebarProps` in `src/app/components/right-sidebar.tsx`.
- Small components often use inline object types instead of separate interfaces, for example `SettingsDialog` and `ContextDetailsDialog`.
- Shared transport/domain types for the app shell live in `src/app/types.ts`.
- There is no shared `types/` directory in `src/`.

## Patterns Used In Real Code

- Use literal unions for bounded UI state:
  `useState<"system" | "light" | "dark">(...)` in `src/app/App.tsx`
  `useState<"files" | "changes">("files")` in `src/app/components/right-sidebar.tsx`
  `role: "user" | "assistant"` in `src/app/components/chat-view.tsx`
- Use `React.ComponentProps<...>` to inherit DOM or component prop types in shared primitives, for example in `src/app/components/ui/button.tsx`, `form.tsx`, and `sidebar.tsx`.
- Use library helper types instead of rebuilding them manually. Examples:
  `VariantProps<typeof buttonVariants>` in `src/app/components/ui/button.tsx`
  `ControllerProps`, `FieldPath`, and `FieldValues` in `src/app/components/ui/form.tsx`
- Use `React.CSSProperties` for structured inline style objects when class names are not enough, for example in `src/app/App.tsx` and `src/app/components/left-sidebar.tsx`.

## Assertions And Escape Hatches

- Non-null assertion is currently used once at the app mount point:
  `document.getElementById("root")!` in `src/main.tsx`.
- Some generated primitives use type assertions for style variables or theme props, for example:
  `as React.CSSProperties` in `src/app/components/ui/sidebar.tsx`
  `theme as ToasterProps["theme"]` in `src/app/components/ui/sonner.tsx`
- These assertions already exist in the codebase; avoid adding broader `any`-driven escape hatches when a narrower type is available.

## Runtime Validation

- There is no runtime schema validation library in the frontend today.
- Server URLs, static lists, and dialog data are kept as trusted literals inside component files.
- Do not describe Zod, Yup, or similar tools as project conventions unless they are actually introduced.

## Current Weak Spots To Be Honest About

- The repo now has a root frontend `tsconfig.json` for `src` and `vite.config.ts`, plus a separate `server/tsconfig.json` for backend code.
- Only transport/session domain model types have been extracted to `src/app/types.ts`; repeated purely visual UI data shapes still live close to components.
- Some generated UI files preserve `"use client"` markers from upstream sources even though this is a Vite app. Treat that as current source shape, not as a signal to add Next.js-specific patterns elsewhere.
