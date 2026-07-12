# Mobile compatibility update

The desktop design remains governed by `shared.css` and each module stylesheet. A final `assets/css/responsive.css` layer now supplies consistent tablet and phone behaviour across the home, spells, adept powers, skills, weapons, and vehicles pages.

## Shared improvements

- Edge-to-edge sheets below 900px without clipped borders or horizontal page overflow.
- Compact mastheads that retain each module symbol and hide secondary record metadata.
- Horizontally scrollable, touch-friendly tabs with snap points and visible scrollbar feedback.
- Primary content placed before supporting sidebars on narrow screens.
- Single-column record lists and filters at phone widths.
- Minimum touch sizes for filter, clear, back, tag, search, and tab controls.
- Consistent protection against title/button collisions in list and record modes.
- Adaptive stat, data, source, telemetry, module-card, and footer layouts.
- Long names and values wrap instead of overflowing.
- Touch-device hover corrections and reduced-motion support.

## Loading order

Every page loads styles in this order:

1. `shared.css`
2. Its page-specific stylesheet
3. `responsive.css`

Future pages should preserve this order so the final mobile usability rules win the cascade.

## Breakpoints

- `900px`: tablet layout, scrolling tabs, single-column workspace, content before sidebar.
- `650px`: phone layout, single-column filters and lists, compact headers and controls.
- `420px`: narrow-phone layout, stacked list metadata, single-column data fields and compact source/footer components.

The site version was increased to `3` so the existing version check refreshes previously cached HTML.
