# Release notes

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
