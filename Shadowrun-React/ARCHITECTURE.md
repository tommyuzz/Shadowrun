# Application architecture

## Rendering model

The archive is one statically hosted React application. `HashRouter` keeps direct links compatible with GitHub Pages, while route changes preserve the mounted document and shared visual shell.

The home page is generated from `src/registry.ts`. Adding a module to the registry makes it available to home navigation without editing a separate set of links.

The same registry defines each module's specialised filters. Shared filter rendering therefore supports module-specific controls without duplicating filtering code.

## Data loading

The original JSON datasets remain separate source files. `src/data.ts` dynamically imports only the selected dataset and adapts it to a common interface:

- stable slug identifier;
- display name;
- category and subcategory;
- tags;
- source;
- original module-specific fields.

Search text is generated once when a record is adapted. It includes the record name, category, tags, source and all nested field names and values, with authored HTML reduced to searchable text.

Home-page links prefetch their dataset on hover or focus. Vite emits every dataset with a content hash, allowing normal long-lived browser caching without query-string versions.

## Shared presentation

`HomePage` and `ModulePage` own page composition. Shared controls and framing live in `src/components`. Common list, record, filter, tag, source and responsive rules are loaded once.

Module-specific data is presented through a consistent specification grid. A module can supply a specialised detail component through the registry without changing routing, search, filtering, source handling or navigation.

## Compatibility

The prebuild script creates lightweight redirects for the former URLs such as `spells/spells.html`. Existing hashes are converted to stable slug routes where possible.

## Deployment

GitHub Actions validates all datasets, compiles TypeScript, builds content-hashed assets and deploys `dist/` as a single Pages artifact. The deployment path is defined once in `vite.config.ts`.
