# Release notes

## 2.1.0 — Biography and virtual equipment store

- Added a required final Biography step with identity, physical description, background, and starting-lifestyle selection before character review.
- Rebuilt Resources as a virtual store with department and category browsing, search, product cards, visible prices and availability, and a separate persistent shopping cart.
- Preserved configurable purchase controls for ratings, grades, quantities, augmentation bonuses, and focus bonding inside the cart.
- Removed the manual Matrix Data Processing and carry-over nuyen fields from character creation.
- Calculate carry-over nuyen automatically from the remaining creation budget, enforcing the Core Rulebook maximum without requiring duplicate user input.
- Added migration support for existing saved character drafts and expanded automated coverage for the new workflow.

## 2.0.9 — Priority Array layout repair

- Removed the one-pixel table-cell height rule that caused Priority rows and their contents to collapse and overlap.
- Restored content-driven table row heights for all five priorities.
- Moved desktop click handling and selected styling to the complete table-cell surface without forcing the inner button to stretch the table layout.
- Kept keyboard-accessible buttons inside every cell and preserved the responsive card selector.

## 2.0.8 — Direct full-cell Priority selection

- Removed the redundant Select and Selected badges from the character-creation Priority Array.
- Removed the visible instructions explaining click behavior.
- Expanded every desktop Priority choice to fill its complete table cell.
- Applied hover, keyboard-focus, and selected styling to the entire cell surface rather than only its inner content.
- Preserved the same full-section behavior for responsive Priority cards.

## 2.0.7 — Selectable reference Priority Array and restored navigation

- Rebuilt the creation Priority selector with the same table, typography, data layout, and responsive cards used by the established Priority Array reference page.
- Made every Metatype, Attributes, Magic or Resonance, Skills, and Resources section selectable while preserving toggle and unique-priority behavior.
- Corrected Attribute highlighting so a rating blocked one point below its natural maximum is not styled as though it has reached that maximum.
- Made the character-return and Matrix Search utility buttons readable in their normal, visited, hover, and focus states.
- Added a matching Matrix Search shortcut beneath Sources during Character Creation.
- Restored Shadowrun wordmark navigation from list and record pages to the appropriate Matrix Search sector.
- Kept Character Creation and Matrix Search wordmarks linked to the front access page as previously specified.

## 2.0.6 — Attribute controls and completed-runner navigation

- Replaced all Physical, Mental, and Special Attribute number inputs with constrained plus and minus controls.
- Redesigned Attribute values to show the current Total and actual Max as separate, prominent values.
- Preserved budget, metatype, Exceptional Attribute, Lucky, and single-natural-maximum enforcement in the button states.
- Added a final review action that completes the runner and enters Matrix Search only after the full mechanical audit passes.
- Added a persistent “Return to character display” link beneath selected sources in Matrix Search.
- Removed the separate Matrix Search gateway-return control.
- Made the Shadowrun wordmark return to the front page only from Character Creation and Matrix Search; ordinary reference pages remain unaffected.

## 2.0.5 — Skill grants and Native Language workflow

- Moved Magic or Resonance before Skills so its automatic skill benefits are known when skill allocation begins.
- Removed editable Granted Rating inputs from ordinary individual skills and skill groups.
- Added a dedicated Granted Skills block that derives the required grant count, eligible skill type, and immutable baseline rating from the selected Magic or Resonance priority.
- Allowed granted skills to be raised above their baseline using the appropriate Skills priority pool while preventing ratings below the grant.
- Added an explicit Native Language type that creates a language without requesting or consuming numeric rating points.
- Removed the redundant left-hand Category column from the priority matrix and replaced it with compact full-width category bands.
- Clear obsolete grant markers automatically if the Magic or Resonance priority or path changes.

## 2.0.4 — Informative priority offers and contextual validation

- Replaced the large rank letters inside priority cells with the actual Metatype, Attribute, Magic or Resonance, Skill, and Resource benefits granted by each choice.
- Made priority cells true toggles: select once to assign, select again to clear, or select an occupied priority to move it while leaving the displaced category unselected.
- Kept new drafts completely unselected and added regression coverage for partial, unique priority assignments.
- Moved each step's validation summary directly beneath its heading so problems are visible before the related controls.
- Increased small builder typography and redesigned validation findings for readable wrapping without overflowing their panel.
- Preserved the five-by-five matrix on narrow screens with contained horizontal scrolling and a sticky category column.

## 2.0.3 — Priority matrix and enforceable Attribute controls

### Improved

- Replaced five repetitive Priority dropdowns with a responsive 5×5 button matrix styled after the established Priority Array table.
- Added clear **Open**, **Swap** and **Assigned** cell states while retaining the deterministic one-rank-per-category swap behavior.
- Added semantic table headings, pressed states, descriptive labels, keyboard-native buttons and compact phone styling.

### Enforced during entry

- Attribute controls now prevent spending beyond the selected priority budget.
- Per-metatype and Exceptional Attribute ceilings are enforced by the stepper and numeric input rather than reported only after entry.
- A second Physical or Mental Attribute cannot be raised to its natural maximum; the affected control identifies which Attribute must be lowered first.
- Edge, Magic and Resonance allocation inputs now enforce both the Special Attribute pool and their final rating maximums.
- Added an in-page constraint dossier and per-control explanations while retaining the independent final validation audit.

### Validation

- Added rendered regression coverage for all 25 Priority buttons, removal of the five dropdowns, exhausted Attribute budgets and the one-natural-maximum restriction.
- All 108 unit and regression tests pass with zero lint or TypeScript warnings; dataset, relationship-rule, character-rule and production-build validation remain unchanged.

## 2.0.2 — Guided entry and sequential creation

### Corrected

- Replaced the bare home route's archive grid with two prominent access choices: **Enter the Shadows** for character creation and **Matrix Search** for the established reference archive.
- Removed the invented Runner Concept screen and its name, concept and notes fields from the active draft and final review.
- Replaced production prefilled choices with a genuinely blank draft: no level, priorities, metatype, path, Attribute values or completed screens are selected on first entry.
- Changed the browser draft storage key so obsolete prefilled 2.0.1 state cannot silently populate a first 2.0.2 session. Schema 1 JSON exports still import safely as unconfirmed drafts.

### Workflow

- Added explicit per-step confirmation and a single central first-incomplete-step rule.
- Future desktop rail items and mobile-picker options remain locked until the current screen is mechanically clear and confirmed.
- Premature or obsolete direct URLs resolve to the first incomplete screen without rendering a later step first.
- Editing an earlier screen invalidates that screen and all later confirmations, preventing stale completion state.

### Compatibility and validation

- Matrix Search retains all four reference sectors, every registered archive module, source selection, legacy sector query links and GitHub Pages-compatible hash routing.
- Added regression coverage for blank initial state, storage migration, one-step-at-a-time unlocking, premature direct links and both gateway actions.
- All 106 unit and regression tests pass with zero lint or TypeScript warnings; the complete data, rules and production-build pipeline remains the release gate.

## 2.0.1 — Code-quality verification

### Improved

- Removed a dead rules import, redundant object fallbacks and a duplicated catalogue calculation without changing any returned value or rendered output.
- Simplified equivalent search and legality predicates so their intent is explicit and easier to review.
- Enabled compiler checks for unused code, unreachable code, unused labels, implicit returns, switch fallthrough and unchecked side-effect imports.
- Added a repository lint gate covering TypeScript, React, module imports, promises, build scripts and configuration; it now runs before the existing validation and regression pipeline.

### Compatibility

- No datasets, routes, markup, styles, filters, mechanics or user interactions were changed.
- Existing rendered-presentation and relationship snapshots remain the behavioral contract for the reference site.

### Validation

- Lint completes with zero warnings, and the 39-module source graph contains no circular dependencies or UI imports in the headless rules layers.
- All 102 unit and regression tests, 19 dataset checks, 1,374 record checks, TypeScript compilation and production asset validation pass after a clean `npm ci` installation.
- Source data, CSS and stored presentation snapshots are byte-identical to 2.0.0, and the dependency audit reports zero known vulnerabilities.

## 2.0.0 — Mechanically validated character creation

### Added

- Added a complete ten-screen Core Rulebook priority-creation workflow beneath **Core Rules**, with stable direct routes, desktop step navigation and a mobile-native step picker.
- Added one versioned `CharacterDraft` for all selections, deterministic priority swapping and targeted rebasing when metatype, Magic path or priority choices change.
- Added catalogue adapters for metatypes, Qualities, skills, spells, rituals, complex forms, adept powers, equipment, weapons, cyberdecks, vehicles, drones and Lifestyles without duplicating values owned by their reference datasets.
- Added structured editors for Quality parameters, priority and Knowledge skills, Magic/Resonance formulas, adept powers, resources, augmentations, foci, contacts and leftover Karma.
- Added live validation, stable violation IDs, budgets, Essence, Power Points, Karma accounting, final derived statistics and a printable review dossier.
- Added private browser draft persistence plus JSON export, import and deliberate two-step reset. No account, server or database is required.

### Compatibility and performance

- Character Creation and its scoped stylesheet are route-level lazy chunks; reference pages do not import the workflow integration and keep the established initial stylesheet unchanged.
- Home navigation prefetches the workflow only on intent. Production validation enforces a 500,000-byte initial-script budget and verifies the workflow remains lazy.
- Production builds clear and recreate `dist/`, and post-build validation rejects duplicate entry or workflow chunks so obsolete content-hashed filenames cannot survive a copied release.
- Existing reference JSON, shared responsive CSS, generated original-page CSS, routes, filters, source selection, comparisons and page-specific presentation remain unchanged.
- The application remains a static Vite build deployable at no cost through the existing GitHub Pages workflow.

### Validation

- Added adapter, draft, orchestration, contact-allocation, Karma-sequence, fixed-power and direct-route regression coverage.
- All 19 existing datasets and 1,374 reference records remain unchanged and continue through their established validators and rendering contracts.
- All 102 unit and regression tests pass, followed by TypeScript, production-build and built-asset integrity validation.

## 1.13.0 — Core Rulebook character-creation rules

### Added

- Added `character_creation_rules.json`, a versioned headless contract for the complete nine-step Core Rulebook priority-creation workflow.
- Added cross-file rules for priorities, Attributes, all six Magic/Resonance paths, all 59 Core Qualities, skills, resources, leftover Karma, contacts and final calculations without duplicating the values owned by existing datasets.
- Added a presentation-independent TypeScript engine with stable validation outcomes, numeric expression evaluation, Karma accounting, Essence handling and derived-stat calculation.
- Added a semantic CI validator for dataset pointers, priority coverage, Quality cost structures, path grants, skill classifications, formula trees and source provenance.
- Added 24 scenario tests covering valid and invalid builds, all Core Quality costs and worked creation arithmetic.
- Documented the mechanical scope and future 2.0 integration contract in `CHARACTER_CREATION_RULES.md`.

### Source rulings

- Selected 5 Karma per Mystic Adept Power Point because the detailed rule, Step Three rule and worked example agree; retained the conflicting checklist value as machine-readable provenance.
- Applied dwarf and troll modifiers to Lifestyle costs only, following the governing table, prose and worked resource example; retained the stale contradictory references as machine-readable provenance.

### Compatibility

- The current React application does not import the new character-creation engine. Existing datasets, routes, rendered markup, CSS and page-specific presentation remain unchanged.
- The rules foundation remains static-host compatible and adds no runtime service, account, database or paid dependency.

### Validation

- All 19 existing datasets and 1,374 reference records remain valid and unchanged.
- The semantic rules validator confirms 59 Core Qualities, six creation paths, twelve derived mechanics and both documented source conflicts.
- All 92 unit and regression tests pass, including 24 character-creation scenarios and the existing relationship and rendered-presentation contracts.
- The production TypeScript and Vite build passes with GitHub Pages-compatible output.

## 1.12.0 — Structured relationship rules

### Changed

- Moved every runtime weapon-support compatibility predicate and display label from a TypeScript switch into the versioned `relationship_rules.json` ruleset.
- Moved Equipment enhancement target evaluation and the armor-on-shield exclusion into the same structured data contract.
- Replaced feature-specific matching branches with a compiled generic evaluator supporting logical composition, reusable definitions, field matching and field-to-field containment.
- Simplified the optional organization script so records must arrive with structured relationship metadata instead of having rules inferred from duplicated name lists.
- Preserved the existing record data, descriptions, components, CSS and rendered rule presentation.

### Added

- Added a machine-readable JSON Schema and a dedicated CI validator for rule structure, operators, scoped fields, references, cycles, regular expressions and assigned compatibility profiles.
- Added unit coverage for the generic rule engine.
- Added exhaustive snapshots for every generated weapon-support and Equipment-enhancement relationship.
- Added exact rendered-markup regression coverage for representative weapon, support and Equipment configuration records.

### Validation

- All 19 datasets and 1,374 reference records remain unchanged and valid.
- All 67 unit and regression tests pass, including the rule engine, full relationship matrix and rendered presentation contracts.
- The complete pre-refactor relationship matrix and representative rendered panels match exactly.
- The production TypeScript and Vite build passes with GitHub Pages-compatible output.

## 1.11.0 — Related equipment, weapon support and Actions

### Added

- Added the **Actions** archive beneath **Core Rules**, using all 44 supplied Free, Simple and Complex Actions from `generic_actions.json`.
- Added action-role filtering, full-field search, action-economy dossiers, requirements, attack restrictions and action-type-specific reload method cards.
- Added a dedicated **Weapon Support** tab containing all 45 ammunition and accessory records formerly shown under Equipment.
- Added expandable weapon-side attachment and ammunition lists with effect, cost, mount and modifier details.
- Added expandable support-side applicable-weapon lists with direct navigation to each weapon record.
- Added in-record Equipment configuration planners for all 67 supplied vision, audio, sensor, cybereye, cyberear, cyberlimb, armor, clothing and fitted enhancements.

### Changed

- Weapon list cards now show both weapon type and price.
- Enhancements no longer appear as unrelated standalone Equipment results; they are resolved from one compatibility declaration and displayed with every compatible base item.
- Equipment configuration summaries calculate exact totals for fixed-price selections and identify variable authored costs without inventing values.
- Weapon comparison continues to include weapons only; support records are intentionally excluded from comparison candidates.

### Validation

- 19 datasets and 1,374 reference records validated, including support ownership, enhancement targets and complete Generic Action fields.
- 60 unit tests passed, including bidirectional weapon compatibility, embedded Thermographic Vision, action reload search and dedicated record rendering.
- Production TypeScript and Vite build passed and generated the new Actions compatibility redirect.

## 1.10.1 — Three-tab Lifestyle archive

### Corrected

- Restored the original **Entertainment** and **Lifestyle Options** collections instead of replacing them.
- The Lifestyle page now contains exactly three ordered tabs: **Lifestyles**, **Entertainment**, and **Lifestyle Options**.
- The new `lifestyles.json` records and residential profile design apply only to the first tab.
- The restored tabs again use their original safehouse dossier, restrictions, notes, selectable variants and category-specific presentation.

### Improved

- Filters now adapt to the active tab: Lifestyle Type for Lifestyles; Entertainment Type and Minimum Lifestyle for Entertainment; and Option Type for Lifestyle Options.
- Full-field search, persistent source-book selection and stable deep links operate across all 49 Lifestyle-page records.

### Validation

- 18 datasets and 1,319 reference records validated.
- 51 unit tests and the production TypeScript and Vite build passed.

## 1.10.0 — Lifestyle profiles

### Changed

- Replaced the former Entertainment extras and Lifestyle Options catalogue with all nine supplied living standards from `lifestyles.json`.
- Replaced the old category and minimum-lifestyle controls with one Lifestyle Type filter covering Residential, Hideout, Mobile Lodging and Business Premises records.
- Updated archive labels, guidance, notation, search copy, list values and routes for the new Lifestyle-focused dataset.

### Added

- Added a dedicated Lifestyle profile design with readable monthly costs, starting nuyen and lifestyle-point fields.
- Added base-versus-limit rating tracks for Comforts & Necessities, Security and Neighborhood.
- Added responsive Built-in Options and Special Rules cards, authored HTML descriptions, shared-rule definition buttons and multi-book source cards.
- Added correct global source filtering for composite credits such as `CRB / SRF`; these records remain visible while either credited book is included.

### Validation

- 17 datasets and 1,279 reference records validated.
- 49 unit tests and the production TypeScript and Vite build passed.

## 1.9.1 — Quality description HTML

### Corrected

- Quality record descriptions now render their stored HTML instead of displaying tags as text.
- Added page-specific presentation for authored headings, emphasis, lists, line breaks and tables, including contained horizontal table scrolling on narrow screens.
- Preserved the established structured-list treatment for the three existing plain-text descriptions that use `•` separators.

### Validation

- Added regression coverage for unescaped HTML elements, tables and the legacy bullet fallback.
- 17 datasets and 1,310 reference records validated.
- 47 unit tests and the production TypeScript and Vite build passed.

## 1.9.0 — Attributes archive

### Added

- Added **Attributes** beneath **Core Rules** on the generated home page.
- Added all twelve supplied Physical, Mental and Special Attributes from `attributes.json`, with stable category and record routes.
- Added full-record search across uses, formulas, linked skills, importance guidance and nested benchmarks, plus a dedicated Linked Skill filter.
- Added responsive attribute dossiers, formula cards, skill chips, rating benchmark ladders, archive guidance, iconography, footer treatment and legacy URL generation.

### Changed

- Core Rulebook records in **Skills**, **Attributes** and **Priority Array** now remain visible regardless of the global source-book selection. Future records from other books in those modules still obey their own source toggles.

### Validation

- 17 datasets and 1,310 reference records validated.
- 45 unit tests and the production TypeScript and Vite build passed.

## 1.8.1 — Priority Array readability

### Improved

- Rebalanced the desktop matrix to give Metatype and Magic or Resonance substantially more space, with larger text, stronger contrast and more generous row spacing.
- Changed the responsive breakpoint so the readable card layout replaces the matrix before desktop columns become cramped.
- Restyled all selected Resources values as compact, high-contrast monospaced amounts instead of oversized red display text.

### Validation

- 16 datasets and 1,298 reference records validated.
- 39 unit tests and the production TypeScript and Vite build passed.

## 1.8.0 — Priority Array creation page

### Added

- Added **Priority Array** beneath **Core Rules** on the generated home page.
- Added all five supplied Priority levels and all three supplied play-level rule sets from `priority_array.json`.
- Added a native Creation Level selector for Street-Level, Regular and Prime Runner play; it updates Resources, Karma, gear, contact and conversion limits in place without navigation or duplicated values.
- Added a dedicated desktop assignment matrix and responsive A–E creation dossiers for smaller screens.
- Added Priority-specific protocol guidance, notation, iconography, source-book behavior, loading states, footer treatment and legacy URL generation.

### Validation

- 16 datasets and 1,298 reference records validated, including A–E and every play-level resource key.
- Added regression coverage for Core Rules registration, record preservation and all three selectable creation rule sets.

## 1.7.1 — Quality type filtering and definitions

### Added

- Replaced the Quality dataset with the supplied version containing General, Metagenic, Infected and Lifestyle type metadata.
- Added **Quality Type** to the existing Quality filter panel alongside full-record search and Quality Structure.
- Added a clickable type button beneath each typed Quality record title; selecting it reveals the authored type definition using the established tag-detail pattern.
- Kept the 31 records without a supplied `quality_type` visible under **All quality types** without inventing classifications.
- Expanded the Quality filter panel responsively for its third control and updated the notation legend and archive guidance.

### Validation

- 15 datasets and 1,049 reference records validated, including all four type definitions.
- 36 unit tests passed, including exact type-filter options, missing-field behavior and Metagenic tag-definition rendering.
- Production TypeScript and Vite build passed.
- Production browser checks passed for the four filter options, the 74-record Metagenic result set, clickable definitions, missing-type handling and 320px horizontal fit.

## 1.7.0 — Lifestyle extras and options archive

### Added

- Added **Lifestyles** beneath **Core Rules** on the generated home page.
- Added all 26 Entertainment extras and 14 Lifestyle Options from the supplied `lifestyle_extras.json` dataset.
- Added All, Entertainment and Lifestyle Options routes with stable deep links for every record.
- Added full-record search across effects, costs, restrictions, notes and nested variant fields.
- Added Lifestyle Type and Minimum Lifestyle filters; nested variant thresholds participate in filtering.
- Added a dedicated safehouse dossier with point costs or adjustments, monthly costs, minimum lifestyle thresholds, restrictions, notes and structured configuration cards.
- Added lifestyle-specific category rules, notation legend, tags, iconography, footer treatment and narrow-screen layouts.
- Integrated the SRF records with the existing persistent source-book selector and compatibility redirect generation.

### Validation

- 15 datasets and 1,049 reference records validated.
- 35 unit tests passed, including nested lifestyle search, variant filtering, exact collection counts and Core Rules registration.
- Production TypeScript and Vite build passed.
- Production browser checks passed for home registration, the 40-record list, SRF naming, nested search, variant filtering, detail rendering, restrictions and 320px horizontal fit.

## 1.6.1 — Core Rules home correction

### Corrected

- Changed the initial home sector from Magic to **Core Rules**, making the new **Qualities** archive button visible immediately on first load.
- Preserved explicit home links to Magic, Hacking and Items sectors.
- Added rendered-home regression coverage that verifies the Qualities link and all three Core Rules module cards.

### Validation

- 31 unit tests passed, including initial and explicitly selected home-sector rendering.
- Production browser checks confirmed the Qualities card on the direct desktop and 320px home routes.
- The complete data, production build, source-selection and responsive Qualities checks continue to pass.

## 1.6.0 — Positive and Negative Qualities archive

### Added

- Added **Qualities** to the **Core Rules** home section.
- Added all 31 Positive and 28 Negative Qualities from the supplied `qualities.json` dataset.
- Added dedicated All, Positive and Negative routes with stable deep links for every quality.
- Added full-record search across descriptions, requirements and every nested level, variant, degree, side effect and option field.
- Added a Quality Structure filter for fixed, rated and choice-based entries.
- Added a character-quality ledger showing category, Karma cost or bonus, structure, rating limit and record code.
- Added structured option cards for levels, variants, rarity, severity, prevalence, degree and possible side effects.
- Added quality-specific category rules, notation legend, tags, iconography and footer treatment.
- Integrated Qualities with the persistent source-book selector and legacy redirect generation.

### Validation

- 14 datasets and 825 reference records validated.
- 29 unit tests passed, including nested quality search, filter registration and exact Positive/Negative record counts.
- Browser checks passed for all 59 records, nested search, structure filtering, detail cards, Core Rules registration and deep routes.
- List and record layouts passed horizontal-overflow checks at 320, 390 and 640px with no console or page errors.
- Production TypeScript and Vite build passed.

## 1.5.0 — Mobile comparison dossier

### Added and corrected

- Replaced the 680px horizontally scrolling comparison table on phones and small tablets with full-width specification cards.
- Added a full-screen, dynamic-viewport dossier with one predictable vertical scroll surface and safe-area support.
- Added compact A/B/C record controls that collapse after selection and can be restored with **Edit records**.
- Replaced long mobile record dropdowns with a searchable archive picker covering names, categories, sources and complete record fields.
- Added a mobile **Differences only** mode and a clear no-differences recovery state.
- Preserved two- and three-record comparison, optimal-value marking, direct record navigation, focus containment and source-book exclusions.
- Restored natural word wrapping throughout comparison titles, record names and values, with touch targets of at least 44px.

### Validation

- Responsive comparison checks passed at 320, 360, 390, 430, 480, 640 and 700px, plus a 667×375 landscape viewport.
- Weapons, cyberdecks, vehicles and drones were checked for viewport fit, horizontal overflow, clipped controls and correct mobile/desktop presentation selection.
- Search, picker focus, Escape handling, automatic control collapse, differences-only filtering, third-record selection and removal were exercised in a real browser.
- Before-and-after screenshots for all four desktop comparison dialogs reported zero changed pixels.
- 26 unit tests and the production TypeScript/Vite build passed with no browser console or page errors.

## 1.4.0 — Mobile readability and reflow

### Added and corrected

- Replaced mobile category tab strips with a full-width archive picker, including the home sectors.
- Converted every mobile record card to a shared two-row layout at 650px and below.
- Restored natural word boundaries for titles, record names, metadata and action buttons.
- Added content-aware mobile title scaling based on the longest word.
- Normalised masthead sizing at narrow widths so the archive title and Sources control stay within the viewport.
- Removed page-level overflow masking after constraining the actual components.

### Validation

- 67 responsive browser checks passed at 320, 360, 390, 412, 430, 480 and 640px.
- All 13 archives, all four home sectors, long record headings and the Manipulation spell category were checked for clipped controls, page overflow and mid-word wrapping.
- Before-and-after desktop screenshots across home and all 13 archives reported zero changed pixels.
- No browser console or page errors were detected.

## 1.3.0 — Source controls and expanded comparison

### Added

- Two- or three-record comparison dossiers for vehicles.
- Two- or three-record comparison dossiers for drones.
- A **Sources** control in the masthead on desktop and mobile.
- Persistent include/exclude choices shared by every archive route and browser reload.
- Source-aware lists, category counts, search filters and comparison candidates.
- Clear recovery screens when all records in a category, or a directly linked record, belong to an excluded source.
- Cross-tab source-selection synchronisation.

The bundled datasets currently contain records from `CRB` only, so that is the initial source option. New source codes found in subsequently loaded datasets register automatically; friendly source-book names can be added once to `sourceBooks` in `src/data.ts`.

### Comparison fields

Vehicle comparison covers class, type, control skill, handling, speed, acceleration, Body, Armor, Pilot, Sensor, seats, availability, cost and source. Drone comparison covers drone class, control skill, handling, speed, acceleration, Body, Armor, Pilot, Sensor, availability, cost and source.

Numeric advantages are marked only where a higher or lower value has an unambiguous meaning. Compound vehicle handling and speed profiles remain highlighted as differences without declaring a winner.

### Validation

- 13 datasets and 766 records validated.
- 25 unit tests passed.
- Production TypeScript and Vite build passed.
- Browser interaction checks passed for source persistence, both new comparison modules, direct-link recovery, mobile layout and all 13 data routes.
- No browser console or page errors were detected.

No server, account, paid service or GitHub Pages configuration change is required.
