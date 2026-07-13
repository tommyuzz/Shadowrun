# Release 1.3.0 — Source controls and expanded comparison

## Added

- Two- or three-record comparison dossiers for vehicles.
- Two- or three-record comparison dossiers for drones.
- A **Sources** control in the masthead on desktop and mobile.
- Persistent include/exclude choices shared by every archive route and browser reload.
- Source-aware lists, category counts, search filters and comparison candidates.
- Clear recovery screens when all records in a category, or a directly linked record, belong to an excluded source.
- Cross-tab source-selection synchronisation.

The bundled datasets currently contain records from `CRB` only, so that is the initial source option. New source codes found in subsequently loaded datasets register automatically; friendly source-book names can be added once to `sourceBooks` in `src/data.ts`.

## Comparison fields

Vehicle comparison covers class, type, control skill, handling, speed, acceleration, Body, Armor, Pilot, Sensor, seats, availability, cost and source. Drone comparison covers drone class, control skill, handling, speed, acceleration, Body, Armor, Pilot, Sensor, availability, cost and source.

Numeric advantages are marked only where a higher or lower value has an unambiguous meaning. Compound vehicle handling and speed profiles remain highlighted as differences without declaring a winner.

## Validation

- 13 datasets and 766 records validated.
- 25 unit tests passed.
- Production TypeScript and Vite build passed.
- Browser interaction checks passed for source persistence, both new comparison modules, direct-link recovery, mobile layout and all 13 data routes.
- No browser console or page errors were detected.

No server, account, paid service or GitHub Pages configuration change is required.
