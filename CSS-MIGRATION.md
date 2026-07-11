# Centralised CSS migration

This package contains the current Shadowrun reference pages with their embedded CSS extracted into shared and page-specific stylesheets.

## Structure

- `assets/css/shared.css` contains component rules shared by the existing pages. Where duplicated rules existed, the version from `spells.html` is authoritative.
- `assets/css/pages/home.css` contains home-page-only rules.
- `assets/css/pages/spells.css` contains spell-page-only rules.
- `assets/css/pages/adept-powers.css` contains adept-power-only rules.
- `assets/css/pages/skills.css` contains skill-page-only rules.

Each HTML page loads `shared.css` first and its page stylesheet second. This lets a page customise a component without changing the shared default.

## Adding a new reference page

1. Copy the closest existing HTML page as the structural starting point.
2. Load `../assets/css/shared.css` before the new page stylesheet.
3. Create `assets/css/pages/<page-name>.css` for rules unique to that page.
4. Reuse existing shared class names and markup for mastheads, tabs, panels, filters, list entries, record headers, tags, source boxes and footers.
5. Add a rule to `shared.css` when it should affect every page. Use the spells-page appearance when deciding the shared default.
6. Add an override to the page stylesheet when the difference is intentional and specific to that page.
7. Keep the page data JSON beside its HTML file and add the new page to `shadowrunhome.html`.
8. Check desktop, mobile, keyboard focus, list mode, record mode, filters and print layout before publishing.

## Deployment

Copy the contents of this directory over the repository root while preserving the directory structure. The archive includes the JSON data required by the existing pages.
