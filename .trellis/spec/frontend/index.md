# Frontend Development Guidelines

> Current frontend conventions for the Vite + React UI that lives under `src/`.

## Current Scope

- This repo has one frontend app rooted at `src/` and one separate backend area rooted at `server/`.
- The frontend is not split into packages. `python3 ./.trellis/scripts/get_context.py --mode packages` reports a single-repo setup with the `frontend` spec layer.
- These documents describe the code that exists today. They are not an aspirational architecture plan.

## Pre-Development Checklist

Read these files before changing frontend code:

1. [Directory Structure](./directory-structure.md) for where new files belong.
2. [Component Guidelines](./component-guidelines.md) for component shapes, prop typing, and styling patterns.
3. [Hook Guidelines](./hook-guidelines.md) for the repo's current hook extraction threshold.
4. [State Management](./state-management.md) for local-vs-parent-vs-context state boundaries.
5. [Type Safety](./type-safety.md) for current TypeScript patterns and existing escape hatches.
6. [Quality Guidelines](./quality-guidelines.md) for what can actually be verified in this repo today.

## Guide Index

| Guide | What it captures |
|-------|------------------|
| [Directory Structure](./directory-structure.md) | Real `src/` layout, naming, and placement rules |
| [Component Guidelines](./component-guidelines.md) | App-specific vs primitive component patterns |
| [Hook Guidelines](./hook-guidelines.md) | Current hook usage and extraction rules |
| [State Management](./state-management.md) | Local-first state ownership and context boundaries |
| [Quality Guidelines](./quality-guidelines.md) | Build-based verification and review expectations |
| [Type Safety](./type-safety.md) | Local type organization and existing TS patterns |

## Quality Check

When reviewing frontend changes:

1. Re-read the specific guideline files that match the touched area.
2. Verify any referenced paths still exist and still match the described pattern.
3. Run the smallest meaningful frontend check set that exists today:
   `npm run lint`
   `npm run typecheck`
   `npm run build`
4. Do not claim frontend test coverage unless a frontend test runner is added to the repo for real.

## Documentation Rules

- Keep examples tied to real files under `src/`, `vite.config.ts`, or other paths that actually exist in this repo.
- Update these docs when the codebase changes shape; do not leave template statuses or bootstrap placeholders behind.
- Keep the docs in English unless the project deliberately changes its documentation language.
