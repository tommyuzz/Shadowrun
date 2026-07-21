# Shadowrun Fifth Edition Reference Archive

This version is a single React and TypeScript application built with Vite. It preserves each original archive's exact page-specific presentation while sharing navigation, filters, lists, record routing, source-book handling, and data loading across every module.

The initial home screen is a focused access gateway. **Enter the Shadows** opens guided character creation; **Matrix Search** opens the established four-sector reference archive. Existing sector query links still open their requested archive directly.

Each archive retains its subject-specific filters. Search covers record names, descriptions, tags, statistics, tests, sources and nested field values rather than being limited to title text.

The **Attributes** archive appears under **Core Rules** and contains all twelve supplied Physical, Mental and Special Attributes. Its category views, linked-skill filter and full-record search lead into dedicated capability dossiers containing uses, derived statistics, linked skills, importance guidance and the complete supplied rating benchmarks. The benchmark screen also keeps the supplied player-facing-analysis notice visible so it cannot be mistaken for an official rating table.

The **Actions** archive appears under **Core Rules** and presents all supplied Free, Simple and Complex Actions in three direct tabs. Search and filtering cover tests, requirements, attack restrictions, descriptions and reload methods. Each record uses a dedicated action-economy dossier; the Simple and Complex Reload Weapon records automatically show only the matching methods from `generic_actions.json`.

The **Qualities** archive appears under **Core Rules** and contains all supplied Positive and Negative Qualities. Matrix Search opens the Core Rules sector by default so its reference and creation tools remain immediately available. The archive presents Karma costs or bonuses, rating limits, selectable options, levels, variants, degrees and side effects in a dedicated character-quality ledger while retaining the complete authored descriptions. HTML stored in a Quality description is rendered as authored, including emphasis, headings, lists, line breaks and tables; legacy plain-text bullet descriptions retain their established list treatment. Supplied General, Metagenic, Infected and Lifestyle types are searchable and filterable; a type button beneath each typed record title opens the corresponding authored definition.

The **Lifestyles** archive also appears under **Core Rules** and contains three tabs backed by two independent datasets. **Lifestyles** is first and presents all nine supplied living standards from `lifestyles.json`, with a Lifestyle Type filter and dedicated profiles for monthly costs, starting nuyen, lifestyle points, authored HTML descriptions, category ratings, built-in options and special rules. **Entertainment** restores all 26 extras, while **Lifestyle Options** restores all 14 positive and negative modifiers from `lifestyle_extras.json`; both retain their original subtype and minimum-lifestyle filters, dossiers, restrictions, notes and selectable variants. Search covers every field and nested value within the active tab.

The **Priority Array** is a dedicated Core Rules page built from `priority_array.json`. Its creation-level selector switches between Street-Level, Regular and Prime Runner play without a route change, updating every priority's Resources value and the accompanying Karma, gear, contact and conversion limits from the same dataset. A compact A–E matrix is used on wide screens and equivalent stacked dossiers are used on smaller screens, so the complete character-creation information remains readable without horizontal scrolling.

The **Character Creation** workflow is the 2.0 companion to those reference pages. It turns the structured Core Rulebook contract into a ten-screen, mechanically validated priority builder without copying rule values into page components. The nine mechanical creation stages are followed by a Biography screen for alias, personal details and starting Lifestyle before final review. New drafts begin with no creation level, priorities, metatype, path, Attribute allocation or completed steps. Priority assignment reuses the responsive Priority Array dossier with selectable cells and cards. Resources uses department and category navigation, searchable product cards and a persistent shopping cart; unspent nuyen carryover is derived from the cart rather than entered separately. Each screen must be mechanically clear and explicitly confirmed before the next unlocks; sidebar, mobile-picker and direct-URL navigation all use that same central progression rule. Attribute point budgets, metatype ceilings, the single-natural-maximum rule and Special Attribute caps are enforced directly by their controls with inline explanations. Runner Concept is not a required screen or draft field. One versioned `CharacterDraft` holds the complete mechanical build; catalogue adapters normalize existing metatype, Quality, skill, spell, ritual, adept-power, equipment, weapon, cyberdeck, vehicle, drone and Lifestyle records at the boundary.

Drafts are private browser data. They save locally, can be exported or imported as JSON, and require no account, database or paid service. The workflow is loaded only when opened, so adding the builder does not increase the initial JavaScript needed by the established reference pages. Its CSS is page-scoped and lazy-loaded; the existing archive stylesheet and settled desktop presentation remain unchanged.

The interface adds brief archive-specific activation sequences, smooth record and filter transitions, animated data readouts, themed loading and error states, and complete reduced-motion support. Entry animations release their compositor layers after settling, returning the page to the original static presentation without leaving continuous background effects running.

Weapons, cyberdecks, vehicles and drones can be compared from their list or record page. The comparison dossier supports two or three records, marks changed rows, identifies directly comparable numeric advantages and links back to each full record. At 700px and below it becomes a full-screen, single-scroll analysis view: specifications are readable cards, record controls collapse after selection, a searchable archive picker replaces long native menus, and an optional differences-only mode reduces the result set. Comparison remains temporary browser state and does not require an account or storage service.

The **Weapons** archive now owns all ammunition and firearm accessories in a dedicated **Weapon Support** tab. Weapon list cards show both weapon type and price. Full weapon records expose compatible attachments and ammunition with effect, cost and mount or modifier data; every support record can expand a generated list of applicable weapons. Compatibility profiles are centralized as versioned predicates in `relationship_rules.json`, so matching newly added weapons participate from their category, subcategory and ammunition-feed fields without copied component logic.

The **Equipment** market now lists base products rather than scattering enhancements through separate search results. Vision, audio, sensor, cybereye, cyberear, cyberlimb, armor, clothing and fitted add-ons are stored once in the `enhancements` collection and appear inside every compatible base record. The in-record configuration planner lists effect, cost, Capacity and Rating, allows options to be selected, and calculates an exact total or a clearly labelled fixed subtotal when authored prices depend on Rating or another variable.

The **Sources** control in every masthead includes or excludes source books across all archives. The selection is stored in the browser, survives route changes and reloads, and is applied to lists, category counts, direct record links and comparison candidates. Core Rulebook records in **Skills**, **Attributes** and **Priority Array** are intentionally pinned visible because they are foundational creation references; records from any other source in those modules still follow the selected source books. Records credited to more than one book remain available while any credited source is included. Dataset source codes are registered automatically when their archive loads; full source-book names are maintained once in `src/data.ts`.

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

`npm test` first runs the TypeScript/React code-quality gate, then validates all datasets, relationship predicates and Core Rulebook character-creation rules; runs filter, search, comparison, complete relationship-matrix, character-mechanics and rendered-presentation regression suites; type-checks the application; and creates the production build.

## Character creation 2.0

`character_creation_rules.json` and `src/character-creation-engine.ts` remain presentation-independent. Priorities, Attributes, Magic/Resonance paths, all 59 Core Qualities, skills, resources, leftover Karma, contacts and final calculations are represented as structured constraints or expression trees. Existing datasets remain the source of their own record values.

The builder-specific integration lives under `src/character-creation/`: `draft.ts` owns normalized state and import compatibility, `catalogues.ts` adapts authored reference records, `orchestrator.ts` maps the draft through the headless validators, and `steps.tsx` renders the workflow. Reference pages do not import this integration layer. See `CHARACTER_CREATION_RULES.md` for coverage, API entry points, source-conflict rulings and extension guidance.

## Structured relationship rules

Weapon-support compatibility and Equipment enhancement targeting are declared in `relationship_rules.json`. Its format is versioned by `schema_version` and documented by `schemas/relationship_rules.schema.json`; `src/rule-engine.ts` is the generic evaluator. Record descriptions, compatibility notes and all rendered markup remain in their established presentation sources, so editing a predicate cannot silently rewrite user-facing rule text.

To add a new compatibility profile, add one labelled predicate beneath `weapon_support.profiles`, assign that profile name to the support record's `compatibility_profile`, and run `npm test`. Existing profiles are edited in that one JSON file. Equipment enhancements continue to declare `compatible_items` or `compatible_subcategories` on their own record, while global exclusions live under `equipment_enhancements.exclusions`.

The regression suite snapshots every generated support-to-weapon and enhancement-to-equipment match. It also snapshots representative rendered relationship panels. A change to rule behaviour or presentation therefore fails visibly and must be reviewed intentionally.

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
/#/actions/simple-actions/reload-weapon
/#/qualities/negative-qualities/addiction
/#/lifestyles/lifestyles/street
/#/lifestyles/entertainment/garage
/#/lifestyles/lifestyle-options/safehouse
/#/priorityarray
/#/charactercreation/priorities
/#/charactercreation/review
```

Compatibility redirect pages retain the former module URLs.

## Project structure

```text
src/components/     Shared visual components
src/pages/          Home, reference module, Priority Array and lazy Character Creation pages
src/character-creation/  Versioned draft, catalogue adapters, orchestrator and workflow steps
src/comparison.ts   Weapon, cyberdeck, vehicle and drone comparison definitions
src/data.ts         Dataset adapters and stable record identifiers
src/rule-engine.ts  Generic evaluator for versioned structured predicates
src/character-creation-engine.ts  Headless Core Rulebook creation validators and calculators
src/relations.ts    Relationship lookup and stable presentation-facing API
src/motion.ts       Progressive route-transition helper
src/source-selection.tsx  Persistent global source-book selection
src/registry.ts     Module metadata and home-page registration
src/presentation.ts Page-specific class names, labels and archive copy
src/record-tags.ts  Page-specific tag and rule presentation
src/styles/         Shared CSS and generated scoped original page CSS
assets/css/pages/   Original page stylesheets retained as source files
relationship_rules.json  Single source of relationship predicates and labels
character_creation_rules.json  Versioned Core Rulebook character-creation contract
schemas/            Machine-readable rule-data schema
*.json              Reference datasets, including generic_actions.json, lifestyles.json, lifestyle_extras.json and priority_array.json
scripts/            Build-time data, rule and deployment validation
```

`npm run dev` and `npm run build` automatically regenerate `src/styles/original-pages.css` from the original page stylesheets. This keeps the archive-specific artwork, grids, dashboards, panels, legends and responsive behaviour isolated to the correct page without duplicating them in React components.

Production builds also replace `dist/` from scratch before Vite writes new content-hashed assets. This prevents an older copied build from retaining obsolete filenames alongside the current release.
