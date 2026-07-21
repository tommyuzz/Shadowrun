# Character-creation rules contract

`character_creation_rules.json` is the headless rules contract for Core Rulebook priority-based character creation. Version 2.0 uses it through a deliberately thin integration layer, without coupling mechanics to workflow screens or changing any established reference-page rendering.

## Scope and provenance

The ruleset covers the nine-step process on printed pages 62–107 of the supplied Core Rulebook. Page numbers are retained only as provenance metadata; the rule text is paraphrased into facts, limits and expression trees.

Two internal source conflicts are retained in `source_conflicts` so the interface never silently changes its ruling:

- Mystic Adept Power Points use 5 Karma each. The detailed type rule, Step Three rule and worked example agree on 5; a later checklist says 2.
- Dwarfs pay 20 percent more and trolls pay twice as much for Lifestyles. No blanket gear multiplier is applied. The governing table, prose and worked resource example agree; two later/example references are stale.

The supplied PDF is not included in the project or build.

## One source for each fact

The contract deliberately references existing project data instead of copying it:

- priorities and play levels: `priority_array.json`;
- metatype minimums and natural limits: `metatypes.json`;
- Active skills and groups: `skills.json`;
- Positive and Negative Quality records and option values: `qualities.json`;
- Matrix actions and spirit types used by Quality choices: `matrixinteraction.json` and `spirits.json`;
- equipment, weapons and Lifestyles: their established datasets.

`character_creation_rules.json` adds only cross-record constraints, formulas, classifications, precedence decisions and workflow metadata. Updating a priority value, metatype range or Quality option in its owning dataset therefore does not require a second value change in a component.

## Mechanical coverage

| Step | Enforced contract |
| --- | --- |
| 1. Concept | Ordered workflow metadata; narrative choice remains advisory. |
| 2. Metatype and Attributes | A–E bijection, metatype availability, exact Attribute-point spend, natural limits, one Physical/Mental maximum, Special Attribute allocation, Lucky and Exceptional Attribute exceptions. |
| 3. Magic or Resonance | Six paths, priority availability, restricted skill groups, free grants, formulas and complex-form limits, adept/mystic Power Points, bound spirits, registered sprites and bonded-focus Force. |
| 4. Qualities | All 59 Core Quality costs, ratings, choices, repeatability, prerequisites, incompatibilities, GM approvals and play-level Karma caps. |
| 5. Skills | Separate individual/group/free Knowledge pools, native languages, priority grants, path restrictions, group overlap, specializations and creation rating limits. |
| 6. Resources | Play-level budgets, Karma conversion, Availability and Device Rating, grades, augmentation cap, Essence, Sensitive System, carryover nuyen and metatype Lifestyle multipliers. |
| 7. Leftover Karma and Contacts | Cumulative advancement costs, quality cost modifiers, formulas/forms/services/tasks, contact budgets and caps, and the seven-Karma carryover limit. |
| 8. Final calculations | Initiative modes, inherent limits, condition monitors, overflow and technomancer living-persona values as numeric expression trees. |
| 9. Final touches | Ordered workflow metadata and explicit GM approval; narrative review remains advisory. |

## Runtime API

`src/character-creation-engine.ts` is presentation-independent. Its validators return stable violation IDs, severity, message and optional data path. The principal entry points are:

- `validatePrioritySelection` and `validatePriorityAttributes`;
- `validateQualitySelections` and `qualityCostSummary`;
- `validateSkillPlan` and `validateKnowledgeLanguageBudget`;
- `validateMagicSelection`, `magicKarmaCost`, `availablePowerPoints` and `validatePowerPointAllocation`;
- `validateResourcePlan`, `essenceAfterResources`, `specialAttributeAfterEssenceLoss` and `calculateStartingNuyen`;
- `validateContacts`;
- `validateKarmaPlan`, `summarizeKarmaPlan` and `karmaPurchaseCost`;
- `deriveCreationStatistics`.

The engine accepts normalized selections rather than React state. `src/character-creation/orchestrator.ts` converts the one versioned `CharacterDraft` into those inputs after every edit and returns errors, warnings, approvals, budgets and derived values. `src/character-creation/catalogues.ts` is the only boundary that interprets authored catalogue strings; UI components never parse prices or reproduce rules.

The workflow integration entry points are:

- the ordered builder screens and typed confirmation IDs in `workflow.ts`;
- `createEmptyCharacterDraft`, `assignPriority`, `rebaseDraftCoreChoices` and `parseCharacterDraft` in `draft.ts`;
- the typed catalogue collections and `resolveResourceSelection` in `catalogues.ts`;
- `evaluateCharacterDraft` and its plan-mapping helpers in `orchestrator.ts`.

## Validation layers

`schemas/character_creation_rules.schema.json` versions the serialized contract. `scripts/validate-character-creation-rules.mjs` performs the semantic checks JSON Schema cannot express conveniently, including cross-file pointers, complete priority coverage, all 59 Core Quality cost paths, Magic options, skill classifications, formula expression trees and documented conflict precedence.

`src/character-creation-engine.test.ts` exercises legal and illegal scenarios plus worked creation arithmetic. `src/character-creation/orchestrator.test.tsx` covers adapters, unified-draft behavior, final audit outcomes and every direct workflow route. Existing relationship and server-rendered presentation regression tests remain separate and continue to guard the current site.

Run everything with:

```bash
npm test
```

Run only the static contract check with:

```bash
npm run validate:character-rules
```

## Deliberate boundaries

Narrative concept and backstory remain outside the mechanical builder: there is no Runner Concept screen, required field or completion shortcut. Advisory workflow provenance remains in the headless source contract, while actual GM judgements are represented as explicit approval outcomes. The existing adept-power catalogue remains the source for individual power costs; the integration validates fixed and rated powers while the engine enforces each path's available Power Point pool and quarter-point spend. Focus-bonding Karma varies by focus type and Force; until a dedicated focus catalogue exists, the Karma ledger accepts a validated positive declared cost while the Magic validator enforces the total-Force limit. Preparation names remain explicit user entries because the project does not yet have an independent preparation catalogue.

Version 2.0 implements the complete Core workflow and Core catalogue adapters. Additional source-book creation packs can extend the same adapter and rules contracts later. The builder is lazy-loaded behind its own route and scoped CSS; established routes, markup, filters, datasets and page-specific visual designs remain independent and unchanged.
