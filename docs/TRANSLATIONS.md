# Translations (Paraglide + inlang)

## Overview

This app uses Paraglide JS to compile inlang message files into tree-shakeable
message functions. The compiled output is imported with `@paraglide/*` aliases
and used throughout the UI (for example `@paraglide/messages` in the Settings
route). Locale changes are applied via `@paraglide/runtime` and the app-level
`LocaleContext`.

## Source of Truth

- `project.inlang/settings.json` defines locales and plugins.
- `project.inlang/messages/{locale}.json` holds the actual translations.
- `generated/paraglide/` is compiled output (do not edit by hand).

## How It's Wired

- Vite alias: `@paraglide/*` -> `generated/paraglide/*` (see `vite.config.ts`).
- TS path alias mirrors Vite for editor support (see `tsconfig.json`).
- The locale is set on app load in `src/routes/__root.tsx` using `setLocale`.
- UI uses message functions via `import { m } from "@paraglide/messages"`.

## Development Flow

1. Edit translations in `project.inlang/messages/en.json` or `es.json`.
2. Start dev server: `npm run dev`.
3. The dev script compiles translations once at startup via the Paraglide CLI.
4. Restart the dev server to pick up translation changes (no watch mode due to
   Windows file watcher issues with the Paraglide Vite plugin).

## Deployment / Build Flow

1. CI or local build runs `npm run build`.
2. The Vite Paraglide plugin compiles `project.inlang` into `generated/paraglide`
   as part of the build.
3. The compiled output is bundled into the final app (tree-shaken by Vite).

## Notes & Troubleshooting

- If you see TS warnings like "Could not find a declaration file for module
  '@paraglide/messages'", make sure `src/paraglide.d.ts` exists.
- The Paraglide Vite plugin is only used for production builds. During dev, the
  CLI compiles once at startup to avoid infinite watch loops on Windows.
- Never edit files under `generated/paraglide` manually; they are overwritten.
