# Shared reference-page infrastructure

The site remains dependency-free and deployable as static GitHub Pages files.

## Shared JavaScript

- `assets/js/reference-browser.js` provides safe JSON fetching, text/select helpers,
  URL hash helpers, and keyboard tab navigation for reference modules.
- `assets/js/source-books.js` holds source-code display names in one place.
- `assets/js/version-check.js` is the single cache-version check used by the home,
  spells, and adept-powers pages.

Module pages retain their data adapters and record renderers because their schemas
and presentation layouts differ. New pages should call the shared helpers before
adding module-specific code.

## Shared CSS

`assets/css/shared.css` now includes reusable reference-browser layout classes:
`reference-header`, `reference-list-header`, `reference-record-header`,
`reference-list`, `reference-list-item`, `reference-list-index`, and
`reference-list-meta`.

The weapons and vehicles pages use these classes alongside their current module
classes, providing a migration path that does not alter their existing appearance.
Apply the same pattern when touching other record-browser pages, then remove a
module rule after its shared equivalent fully covers it.
