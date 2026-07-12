# Shadowrun Reference Archive — Page Generation Instructions

These instructions apply to every file in this repository. They are intended for ChatGPT, Codex, and other coding agents creating or modifying pages.

## Project purpose

This is a static, dependency-free Shadowrun Fifth Edition reference site hosted through GitHub Pages. Pages should feel like modules within one coherent runner operations archive: clean paper, black technical framing, red system accents, condensed typography, clipped industrial shapes, and restrained cyberpunk instrumentation.

Accuracy, usability, accessibility, and consistency take priority over decoration.

## Visual source of truth

`spells/spells.html` is the authority for the appearance and behaviour of shared reference-page components.

When a component exists on the spells page and another page:

1. Match the spells-page structure, dimensions, spacing, typography, states, focus treatment, responsive behaviour, and print behaviour.
2. Put its default styling in `assets/css/shared.css`.
3. Keep page-specific differences in `assets/css/pages/<page-name>.css`.
4. Do not copy shared declarations into a page stylesheet.

Existing deliberate page differences may remain when the page's content model genuinely requires them. Accidental visual drift must be corrected toward the spells-page version.

## Required file structure

Use this structure for new reference modules:

```text
<module>/
├── <module>.html
└── <module>.json

assets/
└── css/
    ├── shared.css
    ├── responsive.css
    └── pages/
        └── <module>.css
```

Every module page must load shared CSS before its page stylesheet:

```html
<link rel="stylesheet" href="../assets/css/shared.css">
<link rel="stylesheet" href="../assets/css/pages/<module>.css">
<link rel="stylesheet" href="../assets/css/responsive.css">
```

`responsive.css` must load last. It owns the final shared tablet, phone, touch-target, tab-overflow, and narrow-record behaviour. Page stylesheets may define specialised responsive layouts, but they must not undo the shared minimum mobile usability rules.

The root home page uses paths without `../`.

Do not add:

- CSS frameworks;
- JavaScript frameworks;
- package-manager or build-step requirements;
- inline `style` attributes;
- routine embedded `<style>` blocks;
- external font dependencies;
- duplicated copies of shared CSS.

The site must continue to work as plain static files on GitHub Pages.

## Core design contract

Preserve these site-wide characteristics unless the user explicitly requests a redesign:

- Primary colours: near-black ink, warm off-white paper, grey rules, and Shadowrun red.
- Shared variables: `--ink`, `--muted`, `--line`, `--faint`, `--paper`, `--red`, `--red-dark`, `--cut`, and `--max`.
- Condensed system font stack for interface text.
- Impact-style stack for major archive display headings where already used.
- Uppercase labels with controlled tracking.
- Square or clipped geometry rather than rounded consumer-app cards.
- Red as an accent and active-state colour, rather than a large background field.
- Fine technical lines, barcodes, crosshairs, IDs, hashes, and diagonal warning stripes used sparingly.
- High information density with clear spacing and readable body copy.
- A centred clipped `.sheet` on desktop and an edge-to-edge layout on narrow screens.

Avoid neon gradients, glassmorphism, soft pill controls, generic sci-fi HUD clutter, excessive animation, large decorative imagery, and effects that reduce legibility.

## Shared page anatomy

A new reference browser should normally contain:

1. The outer `.sheet`.
2. A masthead with the shared mark, kicker, linked Shadowrun title, subtitle, record ID, and barcode.
3. A sticky tab bar for meaningful content categories.
4. A responsive workspace containing an optional sidebar and primary content panel.
5. A list mode for browsing records.
6. A record mode for reading one selected entry.
7. A footer matching the existing archive framing.

The Shadowrun brand/title link must return to the repository's root home page:

```html
<a class="brand-link" href="../shadowrunhome.html">
```

Use `shadowrunhome.html` with exactly that lowercase filename.

## Reusable component rules

Reuse shared components wherever their purpose matches:

- Masthead and brand link
- Sticky tabs
- Panels and panel interiors
- Filter toggle
- Search, select, and clear controls
- List summary and record count
- Two-column record list
- Cyberpunk record/index code
- Record header and back button
- Clickable tag row and tag-detail panel
- Description and rules sections
- Source-book box
- Footer

Prefer neutral component classes such as `.record-list`, `.record-list-item`, `.record-code`, `.record-header`, `.filter-panel`, and `.tag-detail`. A content-specific class may accompany a shared class when JavaScript or a genuine override needs it.

Use modifier classes for reusable variants:

```html
<div class="filter-panel filter-panel--three-column">
<header class="record-header record-header--compact-title">
```

Do not introduce a new content-prefixed copy of a component solely to rename it.

## Controlled thematic creativity

New modules should have a distinct operational identity while remaining recognisably part of the archive.

Permitted creative additions include:

- A module-specific SVG symbol using `currentColor`;
- A short archive code or operational classification;
- A restrained secondary accent derived from the subject matter;
- A unique technical background motif at very low opacity;
- Subject-appropriate microcopy, status labels, warning text, or empty states;
- A specialised record field layout;
- A meaningful interactive detail such as expandable rules, comparison states, or category-specific filters;
- Small decorative diagrams built with semantic HTML, CSS, or inline SVG.

Keep creativity inside the module content area or page stylesheet. Shared masthead, navigation, controls, list entries, record framing, and footer should remain stable.

A thematic addition must:

1. Communicate the module's subject rather than exist as arbitrary decoration.
2. Preserve contrast and readability.
3. Work without JavaScript when it is purely decorative.
4. Scale down or disappear cleanly on mobile.
5. respect `prefers-reduced-motion`.
6. Avoid changing the shared component contract for unrelated pages.

If a creative pattern could be useful to several modules, implement it as an optional shared modifier rather than changing every page automatically.

## Data and rendering

Keep substantial record data in the module's adjacent JSON file. HTML should provide the stable shell; JavaScript should render or update data-driven content.

Requirements:

- Fetch JSON with a relative path such as `./<module>.json`.
- Use `cache: "no-store"` for rapidly changing reference data when consistent with existing pages.
- Check `response.ok` and show a useful in-page failure message.
- Treat missing optional fields safely.
- Escape plain-text data before inserting it into HTML.
- Permit authored HTML only for fields deliberately designed to contain trusted formatting.
- Keep label maps and formatting helpers close to the module script.
- Use stable, URL-safe record IDs for hashes and deep links.
- Restore the correct category and record from the URL when supported.

Do not silently invent game rules, statistics, sources, page numbers, or descriptions. Preserve the supplied rules text and distinguish editorial summaries from rules content.

## Tabs and filters

Tabs must represent meaningful categories for the module. Include an “All” tab when users benefit from browsing the complete dataset.

Tabs must:

- use proper `role="tablist"`, `role="tab"`, and `aria-selected`;
- have unique IDs and matching controls;
- support visible keyboard focus;
- remain usable when their labels wrap or when the viewport narrows;
- update the visible list without discarding active filters unexpectedly.

Filters must:

- use the shared filter button and control styling;
- expose expansion state with `aria-expanded`;
- have visible labels;
- provide clear buttons where useful;
- combine predictably;
- update the visible result count;
- provide an explicit empty-results message.

## List mode

List mode is the primary scanning interface.

- Use the spells-page list entry as the aesthetic baseline.
- Show a stable cyberpunk-style code on the left.
- Show the record name as the dominant element.
- Use the right edge for the most useful compact discriminator: drain, cost, group, rating, availability, or equivalent.
- Make the full row an accessible button or link.
- Keep hover and keyboard-focus states equivalent.
- Avoid squeezing more than three conceptual fields into one row.
- Switch to one column when two columns stop being comfortably readable.

## Record mode

Record mode should optimise reading rather than imitate a character sheet.

- Use a clear eyebrow, large title, clickable tags where definitions exist, and an obvious return-to-list control.
- Keep the back/filter control from overlapping long titles.
- Prefer semantic sections with descriptive headings.
- Use numbered section markers only when they aid navigation; avoid ornamental numbering without meaning.
- Keep prose measures readable, normally no wider than about 80–90 characters.
- Use the shared source-book component and existing source abbreviations.
- Hide absent optional sections rather than rendering empty boxes.

Clickable tags must be real buttons, expose pressed state with `aria-pressed`, and display their explanation in the shared tag-detail panel. Selecting another tag should replace the detail content predictably.

## Accessibility requirements

Every new or modified page must:

- use semantic landmarks: `header`, `nav`, `main`, `aside`, and `footer` where appropriate;
- retain a logical heading hierarchy;
- provide accessible names for icon-only controls;
- use buttons for actions and links for navigation;
- be fully operable with a keyboard;
- provide clear `:focus-visible` styles;
- maintain readable colour contrast;
- mark decorative SVGs and ornaments `aria-hidden="true"`;
- use `hidden` consistently for inactive views;
- avoid conveying meaning through colour alone;
- honour `prefers-reduced-motion: reduce`.

Do not remove outlines unless an equally visible replacement is supplied.

## Responsive and print requirements

Support at least:

- Wide desktop;
- Narrow desktop/tablet;
- Mobile around 650px and below;
- Print.

On mobile:

- Remove the outer sheet clipping when needed.
- Collapse the workspace to one column.
- Prevent tabs, titles, buttons, filters, and record fields from overlapping.
- Reduce or hide decorative metadata before hiding useful content.
- Preserve a minimum comfortable control height.

Print styles should remove sticky navigation and nonessential controls, use a white background, avoid clipped content, and prevent important record blocks from splitting where practical.

## Versioning and paths

Preserve the existing `version.json` cache-refresh mechanism on pages that already use it. Do not add separate hand-maintained version numbers to every asset URL.

Before completing a page:

- Resolve every relative link from the page's actual directory.
- Confirm JSON, CSS, home-page, and module links use correct filename casing.
- Assume GitHub Pages is case-sensitive.
- Avoid root-relative paths except where the repository's `/Shadowrun/` deployment path is intentionally required.

## Change discipline

When modifying an existing page:

1. Inspect `spells/spells.html`, `assets/css/shared.css`, `assets/css/responsive.css`, and that page's stylesheet first.
2. Identify whether each change is shared, reusable as a modifier, or page-specific.
3. Make shared fixes once.
4. Preserve unrelated behaviour and user-authored content.
5. Avoid broad rewrites when a focused change is sufficient.
6. Never overwrite unrelated repository changes.

When adding a shared rule, verify that it does not unintentionally change every existing page. When adding a page override, verify that it is genuinely specific and does not duplicate shared declarations.

## Completion checklist

Before presenting a new page or change as complete, verify:

- [ ] The page loads through HTTP/GitHub Pages without console errors.
- [ ] Every required JSON and CSS file resolves.
- [ ] No routine embedded or inline CSS was added.
- [ ] Shared components match `spells.html`.
- [ ] Page-specific CSS contains only intentional differences.
- [ ] List and record modes both work.
- [ ] Tabs, filters, clear buttons, tags, and back navigation work.
- [ ] URL hashes/deep links work where implemented.
- [ ] Keyboard focus and ARIA states are correct.
- [ ] Long titles and unusually long data do not overlap controls.
- [ ] Desktop, mobile, reduced-motion, and print layouts remain usable.
- [ ] Home navigation resolves to lowercase `shadowrunhome.html`.
- [ ] JSON is valid and no game data was invented.
- [ ] The home page links to the new module.

## Future-page workflow

For a new module:

1. Inspect the current repository instead of relying on an older copied page.
2. Define the record schema, meaningful tabs, filters, right-edge list value, record sections, and tag definitions.
3. Reuse the established reference-page shell and shared components.
4. Create the module JSON and page stylesheet.
5. Add only subject-specific presentation and interactions.
6. Add the module to the appropriate home-page category.
7. Run the complete checklist above.

The intended result is a page with its own operational character whose controls and structure feel immediately familiar to users of every other archive module.
