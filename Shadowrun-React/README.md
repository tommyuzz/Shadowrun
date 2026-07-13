# Shadowrun Fifth Edition Reference Archive

This version is a single React and TypeScript application built with Vite. It preserves the existing archive styling while sharing navigation, filters, lists, record routing, source-book handling, and data loading across every module.

Each archive retains its subject-specific filters. Search covers record names, descriptions, tags, statistics, tests, sources and nested field values rather than being limited to title text.

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

`npm test` validates all datasets, runs the filter and full-record-search regression suite, type-checks the application and creates the production build.

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
src/data.ts         Dataset adapters and stable record identifiers
src/registry.ts     Module metadata and home-page registration
src/styles/         Application-specific shared styles
*.json              Original reference datasets
scripts/            Build-time validation and compatibility generation
```
