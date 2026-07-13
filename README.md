# Shadowrun Fifth Edition Reference Archive

This version is a single React and TypeScript application built with Vite. It preserves each original archive's exact page-specific presentation while sharing navigation, filters, lists, record routing, source-book handling, and data loading across every module.

Each archive retains its subject-specific filters. Search covers record names, descriptions, tags, statistics, tests, sources and nested field values rather than being limited to title text.

The interface adds brief archive-specific activation sequences, smooth record and filter transitions, animated data readouts, themed loading and error states, and complete reduced-motion support. Entry animations release their compositor layers after settling, returning the page to the original static presentation without leaving continuous background effects running.

Weapons and cyberdecks can be compared from their list or record page. The comparison dossier supports two or three records, marks changed rows, identifies directly comparable numeric advantages and links back to each full record. Comparison remains temporary browser state and does not require an account or storage service.

## Local development

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The site must be served over HTTP; opening `index.html` directly with `file://` cannot load a Vite application.

## Production verification

```bash
npm test
npm run preview
```

`npm test` validates all datasets, runs the filter, full-record-search and comparison regression suites, type-checks the application and creates the production build.

## GitHub Pages

The deployment workflow builds `dist/` and publishes it through GitHub Pages. In repository **Settings → Pages**, set the source to **GitHub Actions**.

The repository deployment path is configured once in `vite.config.ts`:

```ts
base: "/Shadowrun/"
```

Change that value only if the repository name or hosting path changes. Asset and data versions are content-hashed by Vite, so there is no `version.json` or hand-maintained query parameter.

## Routes

GitHub Pages-compatible hash routes are used for reliable direct links:

```text
/#/
/#/spells/combat
/#/spells/combat/acid-stream
```

Compatibility redirect pages retain the former module URLs.

## Project structure

```text
src/components/     Shared visual components
src/pages/          Home and reference module pages
src/comparison.ts   Weapon and cyberdeck comparison definitions
src/data.ts         Dataset adapters and stable record identifiers
src/motion.ts       Progressive route-transition helper
src/registry.ts     Module metadata and home-page registration
src/presentation.ts Page-specific class names, labels and archive copy
src/record-tags.ts  Page-specific tag and rule presentation
src/styles/         Shared CSS and generated scoped original page CSS
assets/css/pages/   Original page stylesheets retained as source files
*.json              Original reference datasets
scripts/            Build-time validation and compatibility generation
```

`npm run dev` and `npm run build` automatically regenerate `src/styles/original-pages.css` from the original page stylesheets. This keeps the archive-specific artwork, grids, dashboards, panels, legends and responsive behaviour isolated to the correct page without duplicating them in React components.
