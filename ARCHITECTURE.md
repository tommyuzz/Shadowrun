# Application architecture

## Rendering model

The archive is one statically hosted React application. `HashRouter` keeps direct links compatible with GitHub Pages, while route changes preserve the mounted document and shared visual shell.

The bare home route is a two-choice access gateway: **Enter the Shadows** opens guided creation and **Matrix Search** opens the reference archive. The archive itself is generated from `src/registry.ts`; adding a module to the registry makes it available to Matrix Search without editing a separate set of links. Legacy sector query links continue to open the requested archive directly.

The same registry defines each module's specialised filters. Shared filter rendering therefore supports module-specific controls without duplicating filtering code. Search always indexes the complete record payload, including nested values, while each archive keeps its original filter choices.

## Data loading

The original JSON datasets remain separate source files. `src/data.ts` dynamically imports only the selected dataset and adapts it to a common interface:

- stable slug identifier;
- display name;
- category and subcategory;
- tags;
- source;
- original module-specific fields.

Search text is generated once when a record is adapted. It includes the record name, category, tags, source and all nested field names and values, with authored HTML reduced to searchable text.

The Qualities adapter combines the supplied `positive_qualities` and `negative_qualities` objects into one routeable archive while preserving their category rules, quality types and nested option structures. Category counts, full-record search and the shared source selector therefore work without maintaining a second page implementation. `quality_type` participates in the shared filter index; `quality_types` supplies the definition shown by the matching record-tag button. Trusted HTML authored in a Quality description is rendered directly by the dedicated detail component, while plain-text descriptions keep the legacy bullet-list fallback.

The Lifestyles adapter loads `lifestyles.json` and `lifestyle_extras.json` together and exposes three ordered categories: Lifestyles, Entertainment and Lifestyle Options. The first collection preserves every living-standard type, cost, starting-nuyen value, base/limit rating object, lifestyle point, built-in option, special rule, authored HTML description and source credit. The other two collections retain the original subtype, costs, restrictions, notes and nested variants. Filters are defined once but return values only for their applicable records, so the UI automatically shows Lifestyle Type on the first tab, Entertainment Type and Minimum Lifestyle on the second, and Option Type on the third. The record dispatcher selects the new residential profile only for Lifestyles and the original dossier for the restored collections.

The Attributes adapter exposes the supplied Physical, Mental and Special collections as category routes while preserving every nested use, formula, linked skill and rating benchmark. `categories` supplies the authored sidebar definitions, and the shared filter index reads `common_linked_skills` directly rather than maintaining a duplicate skill list.

The Priority Array adapter exposes A through E as source-aware reference records while preserving the full `play_levels` object in the shared payload. `PriorityArrayPage` consumes that one payload directly: the selected Street-Level, Regular or Prime Runner key controls both the Resources column and the corresponding creation-limit dossier. No values or play-level rules are duplicated in components.

The Actions adapter combines `free_actions`, `simple_actions` and `complex_actions` into three ordered routes. The two Reload Weapon records are enriched in memory with only the matching entries from `reload_methods`, making those methods searchable without duplicating them in the source JSON. The complete payload remains available to the action detail view and sidebar rule definitions.

Weapon support records live in `weapons.json` under `weapon_support`, while base weapons remain under `weapons`. The adapter combines both collections into one routeable archive and reserves **Weapon Support** as its final tab. Each support record selects a compact compatibility profile. The profile's label and predicate live once in `relationship_rules.json`; `src/rule-engine.ts` compiles it into a reusable function and `src/relations.ts` exposes the same bidirectional relationship to both sides of the UI.

Equipment enhancements live in the top-level `enhancements` collection rather than the browseable `equipment` collection. Each enhancement carries a group plus compatible item names or subcategories. The central rule file declares how those target fields are evaluated and owns global exclusions; `src/relations.ts` resolves them for the active base record. The detail component then applies the global source selection and renders one configuration planner. This keeps enhancement ownership, compatibility, effect and cost in one data location.

## Structured relationship rules

`relationship_rules.json` is pure data with an explicit ruleset identifier and schema version. It supports `all`, `any`, `not` and reusable `ref` nodes, plus field-based equality, membership, presence, regular-expression and field-to-field containment conditions. `schemas/relationship_rules.schema.json` documents the contract for editors, while `scripts/validate-relationship-rules.mjs` checks operator requirements, field scope, references, cycles, regular expressions and every support record's selected profile during CI.

The evaluator is presentation-agnostic. Existing descriptions, compatibility notes, component structure and CSS stay outside the predicate data. A full generated relationship-matrix snapshot guards every current match, and an exact server-rendered snapshot guards representative weapon, support and equipment panels. This lets the rules become more capable without changing the current page output accidentally.

## Character creation 2.0

`character_creation_rules.json` is a second, independent versioned contract for Core Rulebook priority creation. It references the existing priority, play-level, metatype, Attribute, skill, Quality, Matrix-action, spirit, gear and Lifestyle datasets instead of reproducing their values. It owns only cross-record constraints, numeric expression trees, skill classifications, workflow provenance and explicit precedence for two contradictory Core Rulebook passages.

`src/character-creation-engine.ts` evaluates that contract without React, routing or page classes. Separate validators cover priority assignment, Attribute allocation, Quality legality and Karma, free and purchased skill grants, Magic/Resonance paths, resources, Essence, contacts, leftover Karma and final derived statistics. Stable violation IDs keep mechanics out of screen components.

The runtime integration is split into five narrow layers:

- `src/character-creation/workflow.ts` defines the ordered step identifiers shared by state, orchestration and routing;
- `src/character-creation/draft.ts` defines the one versioned, exportable `CharacterDraft` and the deterministic rebasing rules used when a priority, metatype or path changes;
- `src/character-creation/catalogues.ts` adapts the established Core datasets into stable choices and normalizes authored cost, Availability, Rating, Essence, grade and Lifestyle modifiers;
- `src/character-creation/orchestrator.ts` derives the engine plans, Karma ledger, catalogue validation, completion state and final statistics from that draft;
- `src/character-creation/steps.tsx` renders accessible editors and consumes evaluation results without owning mechanical constants.

`CharacterCreationPage` is a workflow module in the registry rather than a reference dataset module. It is route-level lazy-loaded with its scoped stylesheet and stores the draft in browser `localStorage`; JSON export/import provides user-controlled portability. A blank draft has no preselected creation choices. Confirmation state lives in that draft, while the orchestrator derives the first incomplete step; page controls and direct routes both clamp to that boundary. Editing a confirmed step invalidates its own confirmation and every dependent later confirmation. Existing `ModulePage`, `PriorityArrayPage`, data adapters and page styles have no dependency on the builder integration.

The priority editor presents the existing five categories and five ranks as one semantic table containing 25 buttons. It still calls the same deterministic `assignPriority` swap operation, so the table cannot create duplicate ranks. Attribute editors calculate their allowed next value from the selected priority budget, metatype range, Quality exceptions and current natural-maximum occupant. These hard constraints disable or clamp controls and provide inline reasons; the headless validator remains the independent final audit rather than the primary interaction mechanism.

`scripts/validate-character-creation-rules.mjs` checks the rule file against every referenced dataset and validates all expression trees and Core Quality cost paths. Scenario tests cover both accepted and rejected builds, every directly addressable workflow step and catalogue normalization boundaries.

Matrix Search links prefetch their dataset on hover or focus. The **Enter the Shadows** gateway action instead prefetches the workflow chunk. Vite emits every dataset and route chunk with a content hash, allowing normal long-lived browser caching without query-string versions. `scripts/validate-dist.mjs` enforces the lazy workflow split and an initial-entry size budget.

## Faithful page-specific presentation

`HomePage`, `ModulePage`, the matrix-oriented `PriorityArrayPage` and the lazy `CharacterCreationPage` own page composition. Shared controls and framing live in `src/components`. Common list, record, filter, tag, source and responsive rules are loaded once.

`RecordDetail` contains the specialised archive views used by the original site: skill sections, attribute capability dossiers and benchmark ladders, action-economy dossiers, metatype profiles, character-quality ledgers, lifestyle dossiers, cyberdeck consoles, Matrix protocols, sprite and spirit profiles, spell and adept grids, ritual procedures, weapon specifications and support relationships, vehicle dashboards, drone control stacks and equipment market configuration listings. `ModuleChrome` supplies the matching sidebars, legends and footer treatments.

The original page stylesheets are retained in `assets/css/pages/`. `scripts/scope-page-styles.mjs` uses PostCSS to generate one scoped stylesheet at build time, so every unique visual rule remains intact without leaking into another module. Shared React state and routing can therefore evolve independently of the original visual language.

## Responsive composition

List records expose shared structural classes for their index, name and metadata while retaining every page-specific class. At 650px and below, the common layer changes those cards from three columns to a stable two-row name-and-metadata layout. Human-readable text uses normal word boundaries; title sizing derives a mobile-only scale from the longest word so headings remain complete even at 320px.

Desktop category tabs remain unchanged. The same category data also renders a native, fully labelled picker that is hidden on desktop and replaces the tab strip on phones. The home sectors use the same pattern. This avoids horizontal clipping without duplicating category state or navigation logic.

The Priority Array uses one set of adapted records in both layouts: a six-column matrix on wide screens and stacked A–E dossiers below the matrix breakpoint. The native creation-level picker is shared by both representations and changes only the data key being displayed, avoiding navigation flicker and duplicate rule state.

Character Creation keeps the desktop step rail and dossier layout above its breakpoint, then replaces the rail with a labelled native step picker and collapses editors to one column. Controls maintain touch targets, labels wrap only at natural boundaries and the workflow avoids nested horizontal scroll surfaces. Both layouts edit the same draft and use the same validation result.

## Motion and interaction

`runArchiveTransition` progressively uses the browser View Transition API and falls back to normal synchronous React navigation. Dossier, list and record animations use opacity and transforms only. `ArchivePageFrame` removes completed animation declarations after the activation sequence, releasing temporary compositor layers and restoring the exact settled page raster.

The interface follows `prefers-reduced-motion`: activation motifs are removed and all other transition durations are reduced to effectively zero. No essential information or navigation depends on animation.

Search input is deferred from list calculation so typing remains responsive. Matching records receive short entrance transitions, visible title terms are highlighted, and the themed empty state provides an immediate reset action.

## Source selection

`SourceSelectionProvider` owns one shared exclusion set for the entire application. It persists that set in `localStorage`, synchronises changes between browser tabs and defaults newly encountered source codes to included. `ModulePage` applies the selection before category counts, search filters and comparison candidates are calculated. Composite record credits such as `CRB / SRF` are split into their registered source codes and remain visible while any credited source is enabled. A direct link to an excluded record resolves to an explicit recovery state rather than silently showing the wrong list.

`sourceRecordIsVisible` centralises the one creation-reference exception: CRB records in Skills, Attributes and Priority Array remain visible even when CRB is excluded globally. The exception is record-level, so future non-CRB records in those modules continue to respect their own source toggles.

The source catalog begins with the friendly names in `src/data.ts`. Additional codes found in a dynamically loaded dataset are registered automatically, so adding records from another book does not require page-specific code.

## Comparison

Weapon, cyberdeck, vehicle and drone comparison is computed entirely from the already loaded, source-enabled reference records. `src/comparison.ts` defines visible fields, normalised values, candidate searching and safe numeric ranking directions. `ComparisonPanel` renders the unchanged desktop matrix above 700px and a mobile card stream at 700px and below; both consume the same selected records and calculated rows rather than maintaining parallel comparison logic.

The mobile dossier uses the dynamic viewport as one vertical scroll surface. Compact record controls open a focus-contained searchable picker over the dossier, collapse after a choice and can be restored without losing the result position. Each specification card repeats the slot marker, record name and value so context never depends on horizontal scrolling. Differences-only filtering, third-record selection, optimal-value indicators, direct record navigation and the global source selection all operate on the shared comparison state. No comparison state is persisted or sent outside the browser.

## Compatibility

The prebuild script creates lightweight redirects for the former URLs such as `spells/spells.html`. Existing hashes are converted to stable slug routes where possible.

## Deployment

GitHub Actions validates all datasets, compiles TypeScript, builds content-hashed assets and deploys `dist/` as a single Pages artifact. The deployment path is defined once in `vite.config.ts`.

## Code-quality gates

The release pipeline runs Oxlint across application source, build scripts and Vite configuration with TypeScript, React, import and Promise analysis enabled. TypeScript additionally rejects unused or unreachable code, unused labels, implicit return paths, switch fallthrough and unresolved side-effect imports. These checks run before dataset, mechanics, snapshot and production-build verification, so maintainability failures cannot be hidden by a successful bundle.
