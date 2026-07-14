# Release notes

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
