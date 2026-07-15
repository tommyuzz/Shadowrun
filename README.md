# Shadowrun Fifth Edition Reference Archive

This version is a single React and TypeScript application built with Vite. It preserves each original archive's exact page-specific presentation while sharing navigation, filters, lists, record routing, source-book handling, and data loading across every module.

Each archive retains its subject-specific filters. Search covers record names, descriptions, tags, statistics, tests, sources and nested field values rather than being limited to title text.

The **Attributes** archive appears under **Core Rules** and contains all twelve supplied Physical, Mental and Special Attributes. Its category views, linked-skill filter and full-record search lead into dedicated capability dossiers containing uses, derived statistics, linked skills, importance guidance and the complete supplied rating benchmarks. The benchmark screen also keeps the supplied player-facing-analysis notice visible so it cannot be mistaken for an official rating table.

The **Qualities** archive appears under **Core Rules** and contains all supplied Positive and Negative Qualities. The home page opens Core Rules by default so its Skills, Metatypes, Qualities and Lifestyles buttons are visible immediately. The archive presents Karma costs or bonuses, rating limits, selectable options, levels, variants, degrees and side effects in a dedicated character-quality ledger while retaining the complete authored descriptions. Supplied General, Metagenic, Infected and Lifestyle types are searchable and filterable; a type button beneath each typed record title opens the corresponding authored definition.

The **Lifestyles** archive also appears under **Core Rules**. It combines every supplied Entertainment extra and Lifestyle Option into one routeable catalogue, with All, Entertainment and Lifestyle Options views. Full-record search covers nested configurations and restrictions; filters cover lifestyle type and minimum lifestyle. Dedicated dossiers preserve point costs, monthly adjustments, thresholds, restrictions, operational notes and every selectable variant from `lifestyle_extras.json`.

The **Priority Array** is a dedicated Core Rules page built from `priority_array.json`. Its creation-level selector switches between Street-Level, Regular and Prime Runner play without a route change, updating every priority's Resources value and the accompanying Karma, gear, contact and conversion limits from the same dataset. A compact A–E matrix is used on wide screens and equivalent stacked dossiers are used on smaller screens, so the complete character-creation information remains readable without horizontal scrolling.

The interface adds brief archive-specific activation sequences, smooth record and filter transitions, animated data readouts, themed loading and error states, and complete reduced-motion support. Entry animations release their compositor layers after settling, returning the page to the original static presentation without leaving continuous background effects running.

Weapons, cyberdecks, vehicles and drones can be compared from their list or record page. The comparison dossier supports two or three records, marks changed rows, identifies directly comparable numeric advantages and links back to each full record. At 700px and below it becomes a full-screen, single-scroll analysis view: specifications are readable cards, record controls collapse after selection, a searchable archive picker replaces long native menus, and an optional differences-only mode reduces the result set. Comparison remains temporary browser state and does not require an account or storage service.

The **Sources** control in every masthead includes or excludes source books across all archives. The selection is stored in the browser, survives route changes and reloads, and is applied to lists, category counts, direct record links and comparison candidates. Core Rulebook records in **Skills**, **Attributes** and **Priority Array** are intentionally pinned visible because they are foundational creation references; records from any other source in those modules still follow the selected source books. Dataset source codes are registered automatically when their archive loads; full source-book names are maintained once in `src/data.ts`.

At phone widths, category tabs become a full-width archive picker, record cards move metadata beneath the name, and headings scale according to their longest word. Human-readable labels wrap only at natural boundaries. These rules are isolated to viewports of 650px or narrower; the settled desktop rendering remains pixel-identical to the original archive presentation.

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
/#/attributes/all/body
/#/qualities/negative-qualities/addiction
/#/lifestyles/entertainment/garage
/#/priorityarray
```

Compatibility redirect pages retain the former module URLs.

## Project structure

```text
src/components/     Shared visual components
src/pages/          Home, reference module and Priority Array pages
src/comparison.ts   Weapon, cyberdeck, vehicle and drone comparison definitions
src/data.ts         Dataset adapters and stable record identifiers
src/motion.ts       Progressive route-transition helper
src/source-selection.tsx  Persistent global source-book selection
src/registry.ts     Module metadata and home-page registration
src/presentation.ts Page-specific class names, labels and archive copy
src/record-tags.ts  Page-specific tag and rule presentation
src/styles/         Shared CSS and generated scoped original page CSS
assets/css/pages/   Original page stylesheets retained as source files
*.json              Original reference datasets, including attributes.json, lifestyle_extras.json and priority_array.json
scripts/            Build-time validation and compatibility generation
```

`npm run dev` and `npm run build` automatically regenerate `src/styles/original-pages.css` from the original page stylesheets. This keeps the archive-specific artwork, grids, dashboards, panels, legends and responsive behaviour isolated to the correct page without duplicating them in React components.
