# Component Guidelines

> Components in this repo fall into two clear families: app-specific shells under `src/app/components/` and reusable primitives under `src/app/components/ui/`.

## Component Families

- App-specific components are layout-heavy and own presentation details directly. Examples: `src/app/components/left-sidebar.tsx`, `src/app/components/right-sidebar.tsx`, `src/app/components/settings-dialog.tsx`.
- Primitive UI components are thin wrappers around Radix, shadcn, or shared utility patterns. Examples: `src/app/components/ui/button.tsx`, `src/app/components/ui/form.tsx`, `src/app/components/ui/sidebar.tsx`.
- Generated or imported helper components are isolated under `src/app/components/figma/`, currently only `ImageWithFallback.tsx`.

## Props Patterns

- Simple components usually type props inline in the function signature:
  `SettingsDialog({ open, onClose, isDark = false }: { open: boolean; onClose: () => void; isDark?: boolean })`.
- Larger app-specific components tend to use a named interface near the top of the file, for example `LeftSidebarProps` in `src/app/components/left-sidebar.tsx` and `RightSidebarProps` in `src/app/components/right-sidebar.tsx`.
- Primitive wrappers reuse DOM and library prop types instead of redefining them. Examples:
  `React.ComponentProps<"button">` in `src/app/components/ui/button.tsx`
  `ControllerProps<TFieldValues, TName>` in `src/app/components/ui/form.tsx`
  `VariantProps<typeof buttonVariants>` in `src/app/components/ui/button.tsx`

## Composition Patterns

- `App.tsx` is the composition root. It passes state and callbacks down to sidebars, dialogs, and the chat view rather than using a global store.
- App-specific components accept explicit callback props such as `onToggle`, `setSettingsOpen`, or `onResizeStart` instead of reaching into shared context.
- Primitive UI components may define their own local context when the component family needs shared internal state. Examples: `useSidebar()` in `src/app/components/ui/sidebar.tsx` and `useFormField()` in `src/app/components/ui/form.tsx`.

## Styling Patterns

- Tailwind utility classes are the default styling layer across the repo.
- App-specific components often mix Tailwind classes with inline `style` objects for gradients, blur, box-shadow, and font control. See `src/app/App.tsx` and `src/app/components/chat-view.tsx`.
- Shared utilities use the `cn()` helper from `src/app/components/ui/utils.ts` to merge class names.
- Variant-heavy primitives use `class-variance-authority`, as seen in `src/app/components/ui/button.tsx`.
- Theme tokens live in `src/styles/theme.css`, but many app-shell visuals still use direct hex colors in component files. That is current reality in this codebase.

## Accessibility Patterns Already Present

- Reusable primitives include accessibility attributes when the upstream pattern provides them. Examples: `aria-invalid` and `aria-describedby` in `src/app/components/ui/form.tsx`, `sr-only` labels in `src/app/components/ui/sidebar.tsx`.
- Interactive icon-only buttons often rely on `title` attributes in app-specific components, for example in `src/app/components/right-sidebar.tsx`.
- Dialog overlays close on backdrop click in `context-details-dialog.tsx` and `settings-dialog.tsx`.

## Current Tradeoffs To Preserve

- Do not force all styling into tokens or CSS variables. The app shell currently relies on inline visual tuning.
- Do not move all local constants out of component files. Static arrays like `models`, `historyItems`, and `navItems` are currently colocated with the components that render them.
- Do not invent a feature-folder architecture for new work unless the rest of the app is being reorganized at the same time.

## Useful Examples

- `src/app/App.tsx` for parent-owned composition and callback passing.
- `src/app/components/chat-view.tsx` for mixed content rendering with local helper components in the same file.
- `src/app/components/ui/button.tsx` for the current primitive-wrapper pattern.
