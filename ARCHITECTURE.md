# Application architecture

## Rendering model

The archive is one statically hosted React application. `HashRouter` keeps direct links compatible with GitHub Pages, while route changes preserve the mounted document and shared visual shell.

The home page is generated from `src/registry.ts`. Adding a module to the registry makes it available to home navigation without editing a separate set of links.

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

The Qualities adapter combines the supplied `positive_qualities` and `negative_qualities` objects into one routeable archive while preserving their category rules, quality types and nested option structures. Category counts, full-record search and the shared source selector therefore work without maintaining a second page implementation. `quality_type` participates in the shared filter index; `quality_types` supplies the definition shown by the matching record-tag button.

The Lifestyles adapter applies the same pattern to `lifestyle_extras` and `lifestyle_options`. It retains each record's original category, subtype, source, cost fields, restrictions, notes and nested variants. Variant minimum-lifestyle values are included in the shared filter index, and all nested keys and values remain available to full-record search.

Home-page links prefetch their dataset on hover or focus. Vite emits every dataset with a content hash, allowing normal long-lived browser caching without query-string versions.

## Faithful page-specific presentation

`HomePage` and `ModulePage` own page composition. Shared controls and framing live in `src/components`. Common list, record, filter, tag, source and responsive rules are loaded once.

`RecordDetail` contains the specialised archive views used by the original site: skill sections, metatype profiles, character-quality ledgers, lifestyle dossiers, cyberdeck consoles, Matrix protocols, sprite and spirit profiles, spell and adept grids, ritual procedures, weapon specifications, vehicle dashboards, drone control stacks and equipment market listings. `ModuleChrome` supplies the matching sidebars, legends and footer treatments.

The original page stylesheets are retained in `assets/css/pages/`. `scripts/scope-page-styles.mjs` uses PostCSS to generate one scoped stylesheet at build time, so every unique visual rule remains intact without leaking into another module. Shared React state and routing can therefore evolve independently of the original visual language.

## Responsive composition

List records expose shared structural classes for their index, name and metadata while retaining every page-specific class. At 650px and below, the common layer changes those cards from three columns to a stable two-row name-and-metadata layout. Human-readable text uses normal word boundaries; title sizing derives a mobile-only scale from the longest word so headings remain complete even at 320px.

Desktop category tabs remain unchanged. The same category data also renders a native, fully labelled picker that is hidden on desktop and replaces the tab strip on phones. The home sectors use the same pattern. This avoids horizontal clipping without duplicating category state or navigation logic.

## Motion and interaction

`runArchiveTransition` progressively uses the browser View Transition API and falls back to normal synchronous React navigation. Dossier, list and record animations use opacity and transforms only. `ArchivePageFrame` removes completed animation declarations after the activation sequence, releasing temporary compositor layers and restoring the exact settled page raster.

The interface follows `prefers-reduced-motion`: activation motifs are removed and all other transition durations are reduced to effectively zero. No essential information or navigation depends on animation.

Search input is deferred from list calculation so typing remains responsive. Matching records receive short entrance transitions, visible title terms are highlighted, and the themed empty state provides an immediate reset action.

## Source selection

`SourceSelectionProvider` owns one shared exclusion set for the entire application. It persists that set in `localStorage`, synchronises changes between browser tabs and defaults newly encountered source codes to included. `ModulePage` applies the selection before category counts, search filters and comparison candidates are calculated. A direct link to an excluded record resolves to an explicit recovery state rather than silently showing the wrong list.

The source catalog begins with the friendly names in `src/data.ts`. Additional codes found in a dynamically loaded dataset are registered automatically, so adding records from another book does not require page-specific code.

## Comparison

Weapon, cyberdeck, vehicle and drone comparison is computed entirely from the already loaded, source-enabled reference records. `src/comparison.ts` defines visible fields, normalised values, candidate searching and safe numeric ranking directions. `ComparisonPanel` renders the unchanged desktop matrix above 700px and a mobile card stream at 700px and below; both consume the same selected records and calculated rows rather than maintaining parallel comparison logic.

The mobile dossier uses the dynamic viewport as one vertical scroll surface. Compact record controls open a focus-contained searchable picker over the dossier, collapse after a choice and can be restored without losing the result position. Each specification card repeats the slot marker, record name and value so context never depends on horizontal scrolling. Differences-only filtering, third-record selection, optimal-value indicators, direct record navigation and the global source selection all operate on the shared comparison state. No comparison state is persisted or sent outside the browser.

## Compatibility

The prebuild script creates lightweight redirects for the former URLs such as `spells/spells.html`. Existing hashes are converted to stable slug routes where possible.

## Deployment

GitHub Actions validates all datasets, compiles TypeScript, builds content-hashed assets and deploys `dist/` as a single Pages artifact. The deployment path is defined once in `vite.config.ts`.
