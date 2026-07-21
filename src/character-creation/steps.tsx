import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  characterCreationRules,
  karmaPurchaseCost,
  qualityKarmaValue,
  stableCreationId,
  type IndividualSkillAllocation,
  type KarmaPurchaseKind,
  type QualitySelection,
  type RuleViolation,
  type SkillGroupAllocation
} from "../character-creation-engine";
import {
  ATTRIBUTE_IDS,
  PRIORITY_CATEGORIES,
  PRIORITY_CATEGORY_LABELS,
  PRIORITY_RANKS,
  adeptPowerCatalogue,
  availableMagicPaths,
  availableMetatypes,
  complexFormCatalogue,
  magicPathOptions,
  magicPriorityGrant,
  metatypeAttributeRange,
  metatypeOptions,
  metatypeSpecialPointBudget,
  playLevelOptions,
  priorityRow,
  qualityCatalogue,
  qualityOptions,
  resolveCatalogueAvailability,
  resolveCatalogueCost,
  resolveCatalogueEssence,
  resourceCatalogue,
  ritualCatalogue,
  skillCatalogue,
  skillGroupCatalogue,
  skillPointBudget,
  spellCatalogue,
  spiritTypeOptions,
  testedMatrixActionOptions,
  titleCase,
  type AttributeId,
  type QualityCatalogueEntry,
  type ResourceCatalogueEntry,
  type ResourceSelectionShape,
  type SpecialAttributeId
} from "./catalogues";
import {
  assignPriority,
  draftInstanceId,
  naturalAttributeRatings,
  rebaseDraftCoreChoices,
  type CharacterDraft,
  type DraftKarmaPurchase
} from "./draft";
import {
  CREATION_STEPS,
  searchableKarmaTargets,
  suggestedKarmaCurrentRating,
  type CharacterDraftEvaluation,
  type CreationStepId
} from "./orchestrator";

export type SetCharacterDraft = Dispatch<SetStateAction<CharacterDraft>>;

interface StepProps {
  draft: CharacterDraft;
  setDraft: SetCharacterDraft;
  evaluation: CharacterDraftEvaluation;
}

interface ReviewStepProps extends StepProps {
  goToStep: (step: CreationStepId) => void;
  exportDraft: () => void;
  printDraft: () => void;
}

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : [];
const numberInput = (value: string): number => value === "" ? 0 : Number(value);
const optionalNumberInput = (value: string): number | undefined => value === "" ? undefined : Number(value);
const formatNuyen = (value: number): string => `${Math.round(value).toLocaleString("en-GB")}¥`;
const stripHtml = (value: unknown): string => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function StepHeader({ code, title, copy }: { code: string; title: string; copy: string }) {
  return <header className="creation-step-header">
    <span className="creation-step-code">{code}</span>
    <h2 tabIndex={-1} id="creation-step-title">{title}</h2>
    <p>{copy}</p>
  </header>;
}

function ValidationPanel({ violations, empty = "This step currently passes every mechanical check." }: { violations: RuleViolation[]; empty?: string }) {
  return <section className={`creation-validation ${violations.length ? "has-findings" : "is-clear"}`} aria-live="polite" aria-atomic="false">
    <header><span aria-hidden="true">{violations.length ? "!" : "✓"}</span><div><strong>{violations.length ? `${violations.length} validation finding${violations.length === 1 ? "" : "s"}` : "Validation clear"}</strong><small>{violations.length ? "Resolve errors before finalizing; warnings may be accepted." : empty}</small></div></header>
    {violations.length ? <ul>{violations.map((item, index) => <li data-severity={item.severity} key={`${item.id}:${item.path || ""}:${index}`}><span>{item.severity}</span><div><strong>{item.message}</strong><code>{item.id}</code></div></li>)}</ul> : null}
  </section>;
}

function BudgetMeter({ label, spent, total, unit = "", invert = false }: { label: string; spent: number; total: number; unit?: string; invert?: boolean }) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, spent / total)) : spent === 0 ? 0 : 1;
  const over = spent > total;
  return <div className="creation-budget" data-over={over || undefined}>
    <div><strong>{label}</strong><span>{invert ? `${Math.max(0, total - spent)} remaining` : `${spent} / ${total}`} {unit}</span></div>
    <span className="creation-budget-track" aria-hidden="true"><span style={{ width: `${ratio * 100}%` }}/></span>
  </div>;
}

function EmptySelection({ children }: { children: ReactNode }) {
  return <div className="creation-empty-selection"><span aria-hidden="true">◇</span><p>{children}</p></div>;
}

function PriorityMetatypeOptions({ value }: { value: unknown }) {
  return <ul className="priority-metatype-list">{Object.entries(asRecord(value)).map(([name, points]) => <li key={name}><span>{name}</span><strong>{String(points)} SAP</strong></li>)}</ul>;
}

function priorityGrantDescription(value: unknown, label: string): string {
  const grant = asRecord(value);
  const count = Number(grant.count || 0);
  const rating = Number(grant.rating || 0);
  return count && rating ? `${count} ${label}${count === 1 ? "" : "s"} at Rating ${rating}` : "";
}

function PriorityMagicOptions({ value }: { value: unknown }) {
  const options = Object.entries(asRecord(value));
  if (!options.length) return <span className="priority-mundane">Mundane only</span>;
  return <ul className="priority-magic-list">{options.map(([name, raw]) => {
    const detail = asRecord(raw);
    const features = [
      priorityGrantDescription(detail.magical_skills, "Magical Skill"),
      priorityGrantDescription(detail.resonance_skills, "Resonance Skill"),
      priorityGrantDescription(detail.active_skill, "Active Skill"),
      priorityGrantDescription(detail.magical_skill_group, "Magical Skill Group"),
      detail.spells == null ? "" : `${String(detail.spells)} Spell${Number(detail.spells) === 1 ? "" : "s"}`,
      detail.complex_forms == null ? "" : `${String(detail.complex_forms)} Complex Form${Number(detail.complex_forms) === 1 ? "" : "s"}`
    ].filter(Boolean);
    const attribute = detail.magic == null ? `RES ${String(detail.resonance)}` : `MAG ${String(detail.magic)}`;
    return <li key={name}><strong>{name}</strong><span><b>{attribute}</b>{features.length ? ` · ${features.join(" · ")}` : ""}</span></li>;
  })}</ul>;
}

function PrioritySkillAllocation({ value }: { value: unknown }) {
  const skills = asRecord(value);
  return <dl className="priority-skill-grid"><div><dt>Skill points</dt><dd>{String(skills.skill_points)}</dd></div><div><dt>Group points</dt><dd>{String(skills.skill_group_points)}</dd></div></dl>;
}

export function PriorityStep({ draft, setDraft, evaluation }: StepProps) {
  const metatypeRank = draft.priorityAssignments.metatype;
  const magicRank = draft.priorityAssignments.magic_or_resonance;
  const metatypeChoices = availableMetatypes(metatypeRank);
  const pathChoices = availableMagicPaths(magicRank);
  return <>
    <StepHeader code="STEP 01 // ARRAY" title="Priority assignment" copy="Choose a creation level, assign A through E exactly once, then select the metatype and magical path those priorities make available."/>
    <ValidationPanel violations={evaluation.steps.priorities.violations}/>
    <fieldset className="creation-fieldset"><legend>Creation level</legend><div className="creation-choice-grid">
      {playLevelOptions.map((option) => <label className="creation-choice-card" data-selected={draft.playLevelId === option.id || undefined} key={option.id}><input type="radio" name="play-level" value={option.id} checked={draft.playLevelId === option.id} onChange={() => setDraft((current) => ({ ...current, playLevelId: option.id }))}/><strong>{option.name}</strong><span>{option.startingKarma} starting Karma // Availability {option.maximumAvailability}</span><small>{option.description}</small></label>)}
    </div></fieldset>
    <fieldset className="creation-fieldset creation-priority-fieldset"><legend>A–E assignment array</legend><div className="page-priorityarray creation-reference-priority">
      <div className="priority-table-frame"><table className="priority-table"><caption className="priority-sr-only">Selectable Priority A through E character-creation array.</caption><colgroup><col className="priority-col-level"/><col className="priority-col-metatype"/><col className="priority-col-attributes"/><col className="priority-col-magic"/><col className="priority-col-skills"/><col className="priority-col-resources"/></colgroup><thead><tr><th scope="col">Priority</th><th scope="col">Metatype</th><th scope="col">Attributes</th><th scope="col">Magic or Resonance</th><th scope="col">Skills</th><th scope="col">Resources</th></tr></thead><tbody>{PRIORITY_RANKS.map((rank) => { const row = priorityRow(rank); return <tr key={rank} data-priority={rank}><th scope="row"><span>Priority</span><strong>{rank}</strong></th>{PRIORITY_CATEGORIES.map((category) => { const selected = draft.priorityAssignments[category] === rank; return <td className={category === "attributes" ? "priority-attribute-cell" : category === "resources" ? "priority-resource-cell" : undefined} data-selected={selected || undefined} key={category} onClick={() => setDraft((current) => assignPriority(current, category, rank))}><button className="creation-priority-choice" type="button" aria-pressed={selected} data-selected={selected || undefined}>{category === "metatype" ? <PriorityMetatypeOptions value={row.metatype}/> : category === "attributes" ? <><strong>{String(row.attributes)}</strong><span>Attribute points</span></> : category === "magic_or_resonance" ? <PriorityMagicOptions value={row.magic_or_resonance}/> : category === "skills" ? <PrioritySkillAllocation value={row.skills}/> : <><strong className="priority-resource-value">{String(asRecord(row.resources)[draft.playLevelId] || "Choose level")}</strong><span>Starting nuyen</span></>}</button></td>; })}</tr>; })}</tbody></table></div>
      <div className="priority-card-list">{PRIORITY_RANKS.map((rank) => { const row = priorityRow(rank); return <article className="priority-card" key={rank} data-priority={rank}><header><span>Creation tier</span><h2>Priority {rank}</h2><button className="priority-card-resource creation-priority-choice" type="button" aria-pressed={draft.priorityAssignments.resources === rank} data-selected={draft.priorityAssignments.resources === rank || undefined} onClick={() => setDraft((current) => assignPriority(current, "resources", rank))}><span>Selected resources</span><strong className="priority-resource-value">{String(asRecord(row.resources)[draft.playLevelId] || "Choose level")}</strong></button></header><button className="priority-card-field priority-card-metatype creation-priority-choice" type="button" aria-pressed={draft.priorityAssignments.metatype === rank} data-selected={draft.priorityAssignments.metatype === rank || undefined} onClick={() => setDraft((current) => assignPriority(current, "metatype", rank))}><h3>Metatype <small>Special Attribute Points</small></h3><PriorityMetatypeOptions value={row.metatype}/></button><button className="priority-card-field priority-card-attributes creation-priority-choice" type="button" aria-pressed={draft.priorityAssignments.attributes === rank} data-selected={draft.priorityAssignments.attributes === rank || undefined} onClick={() => setDraft((current) => assignPriority(current, "attributes", rank))}><h3>Attributes</h3><strong>{String(row.attributes)}</strong><span>Attribute points</span></button><button className="priority-card-field creation-priority-choice" type="button" aria-pressed={draft.priorityAssignments.magic_or_resonance === rank} data-selected={draft.priorityAssignments.magic_or_resonance === rank || undefined} onClick={() => setDraft((current) => assignPriority(current, "magic_or_resonance", rank))}><h3>Magic or Resonance</h3><PriorityMagicOptions value={row.magic_or_resonance}/></button><button className="priority-card-field creation-priority-choice" type="button" aria-pressed={draft.priorityAssignments.skills === rank} data-selected={draft.priorityAssignments.skills === rank || undefined} onClick={() => setDraft((current) => assignPriority(current, "skills", rank))}><h3>Skills</h3><PrioritySkillAllocation value={row.skills}/></button></article>; })}</div>
    </div></fieldset>
    <div className="creation-form-grid">
      <label><span>Metatype</span><select value={draft.metatypeId} disabled={!metatypeRank} onChange={(event) => setDraft((current) => rebaseDraftCoreChoices(current, { metatypeId: event.target.value }))}><option value="">Select metatype…</option>{metatypeChoices.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select><small>{metatypeRank ? `Available at Metatype Priority ${metatypeRank}.` : "Assign a Metatype priority first."}</small></label>
      <label><span>Magic or Resonance path</span><select value={draft.magicPathId} disabled={!magicRank} onChange={(event) => setDraft((current) => rebaseDraftCoreChoices(current, { magicPathId: event.target.value }))}><option value="">Select path…</option>{pathChoices.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select><small>{magicRank ? `Available at Magic or Resonance Priority ${magicRank}.` : "Assign a Magic or Resonance priority first."}</small></label>
      {draft.magicPathId === "aspected-magician" ? <label><span>Aspected skill group</span><select value={draft.aspectedSkillGroup || ""} onChange={(event) => setDraft((current) => ({ ...current, aspectedSkillGroup: event.target.value || undefined }))}><option value="">Select a group…</option>{["sorcery", "conjuring", "enchanting"].map((id) => <option value={id} key={id}>{titleCase(id)}</option>)}</select></label> : null}
    </div>
  </>;
}

export function AttributesStep({ draft, setDraft, evaluation }: StepProps) {
  const natural = naturalAttributeRatings(draft);
  const budget = Number(priorityRow(draft.priorityAssignments.attributes).attributes) || 0;
  const spent = ATTRIBUTE_IDS.reduce((sum, id) => sum + draft.attributeRatings[id] - metatypeAttributeRange(draft.metatypeId, id).minimum, 0);
  const specialBudget = metatypeSpecialPointBudget(draft.priorityAssignments.metatype, draft.metatypeId);
  const specialSpent = Object.values(draft.specialPointSpend).reduce((sum, value) => sum + value, 0);
  const exceptionalTarget = String(draft.qualities.find((quality) => quality.id === "exceptional-attribute")?.parameters?.attribute_id || "");
  const lucky = draft.qualities.some((quality) => quality.id === "lucky");
  const path = magicPathOptions.find((option) => option.id === draft.magicPathId);
  const remaining = Math.max(0, budget - spent);
  const naturalMaximumAttributes = ATTRIBUTE_IDS.filter((id) => draft.attributeRatings[id] >= metatypeAttributeRange(draft.metatypeId, id).maximum);

  function attributeMaximumAllowed(id: AttributeId): number {
    const range = metatypeAttributeRange(draft.metatypeId, id);
    const absoluteMaximum = range.maximum + (exceptionalTarget === id ? 1 : 0);
    const anotherAtNaturalMaximum = ATTRIBUTE_IDS.some((candidate) => candidate !== id && draft.attributeRatings[candidate] >= metatypeAttributeRange(draft.metatypeId, candidate).maximum);
    const naturalMaximumAllowance = anotherAtNaturalMaximum ? range.maximum - 1 : absoluteMaximum;
    return Math.max(range.minimum, Math.min(absoluteMaximum, naturalMaximumAllowance, draft.attributeRatings[id] + remaining));
  }

  function setRating(id: AttributeId, value: number) {
    const range = metatypeAttributeRange(draft.metatypeId, id);
    const maximum = attributeMaximumAllowed(id);
    setDraft((current) => ({ ...current, attributeRatings: { ...current.attributeRatings, [id]: Math.max(range.minimum, Math.min(maximum, Math.trunc(value))) } }));
  }
  function specialMaximumAllowed(id: SpecialAttributeId, ratingMaximum: number): number {
    const otherSpent = Object.entries(draft.specialPointSpend).filter(([key]) => key !== id).reduce((sum, [, points]) => sum + points, 0);
    const baseRating = natural[id] - draft.specialPointSpend[id];
    return Math.max(0, Math.min(specialBudget - otherSpent, ratingMaximum - baseRating));
  }
  function setSpecial(id: SpecialAttributeId, value: number, ratingMaximum: number) {
    const allowed = specialMaximumAllowed(id, ratingMaximum);
    setDraft((current) => ({ ...current, specialPointSpend: { ...current.specialPointSpend, [id]: Math.max(0, Math.min(allowed, Math.trunc(value))) } }));
  }
  return <>
    <StepHeader code="STEP 02 // CAPABILITY" title="Attributes" copy="Spend the selected priority's Physical and Mental points, then allocate metatype Special Attribute points to Edge and the path's active Special Attribute."/>
    <ValidationPanel violations={evaluation.steps.attributes.violations}/>
    <div className="creation-budget-grid"><BudgetMeter label="Attribute points" spent={spent} total={budget} invert/><BudgetMeter label="Special points" spent={specialSpent} total={specialBudget} invert/></div>
    <aside className="creation-rule-guidance" data-complete={remaining === 0 || undefined}><div><strong>{remaining ? `${remaining} Attribute point${remaining === 1 ? "" : "s"} remaining` : "Attribute pool fully allocated"}</strong><span>Controls stop when the priority budget is exhausted.</span></div><div><strong>{naturalMaximumAttributes.length ? `Natural maximum: ${titleCase(naturalMaximumAttributes[0])}` : "Natural maximum slot open"}</strong><span>Only one Physical or Mental Attribute may reach its natural maximum.</span></div></aside>
    <div className="creation-attribute-grid">
      {ATTRIBUTE_IDS.map((id) => {
        const range = metatypeAttributeRange(draft.metatypeId, id);
        const maximum = range.maximum + (exceptionalTarget === id ? 1 : 0);
        const allowedMaximum = attributeMaximumAllowed(id);
        const anotherAtNaturalMaximum = naturalMaximumAttributes.find((candidate) => candidate !== id);
        const increaseReason = draft.attributeRatings[id] >= maximum
          ? `${titleCase(id)} has reached its maximum of ${maximum}.`
          : remaining === 0
            ? "All Attribute points are allocated. Lower another Attribute first."
            : draft.attributeRatings[id] >= allowedMaximum && anotherAtNaturalMaximum
              ? `Only one Attribute may reach its natural maximum. Lower ${titleCase(anotherAtNaturalMaximum)} first.`
              : "";
        return <div className="creation-attribute-card" data-at-maximum={draft.attributeRatings[id] >= maximum || undefined} key={id}><div><span>{id.slice(0, 3).toUpperCase()}</span><strong>{titleCase(id)}</strong><small>Minimum {range.minimum}{exceptionalTarget === id ? " // Exceptional Attribute" : ""}</small>{increaseReason && remaining > 0 ? <em className="creation-constraint-reason">{increaseReason}</em> : null}</div><div className="creation-stepper"><button type="button" onClick={() => setRating(id, draft.attributeRatings[id] - 1)} disabled={draft.attributeRatings[id] <= range.minimum} aria-label={`Decrease ${id}`}>−</button><output className="creation-attribute-value" aria-label={`${titleCase(id)} total ${draft.attributeRatings[id]}, maximum ${maximum}`}><span>Total</span><strong>{draft.attributeRatings[id]}</strong><small>Max {maximum}</small></output><button type="button" title={increaseReason || `Increase ${titleCase(id)}`} onClick={() => setRating(id, draft.attributeRatings[id] + 1)} disabled={Boolean(increaseReason)} aria-label={increaseReason || `Increase ${id}`}>+</button></div></div>;
      })}
    </div>
    <fieldset className="creation-fieldset"><legend>Special Attribute points</legend><div className="creation-special-grid">
      {(["edge", "magic", "resonance"] as const).map((id) => {
        const active = id === "edge" || path?.specialAttribute === id;
        const maximum = id === "edge" ? metatypeAttributeRange(draft.metatypeId, "edge").maximum + (lucky ? 1 : 0) : 6 + (exceptionalTarget === id ? 1 : 0);
        const allowed = active ? specialMaximumAllowed(id, maximum) : 0;
        const restriction = active && allowed <= draft.specialPointSpend[id]
          ? natural[id] >= maximum ? `${titleCase(id)} has reached its rating maximum.` : "All Special Attribute points are allocated."
          : "";
        return <div className="creation-special-card" data-disabled={!active || undefined} data-restricted={Boolean(restriction) || undefined} key={id}><span>{titleCase(id)}</span><div className="creation-stepper"><button type="button" disabled={!active || draft.specialPointSpend[id] <= 0} onClick={() => setSpecial(id, draft.specialPointSpend[id] - 1, maximum)} aria-label={`Decrease ${id}`}>−</button><output className="creation-attribute-value" aria-label={`${titleCase(id)} total ${natural[id]}, maximum ${maximum}`}><span>Total</span><strong>{natural[id]}</strong><small>Max {maximum}</small></output><button type="button" disabled={!active || Boolean(restriction)} title={restriction || `Increase ${titleCase(id)}`} onClick={() => setSpecial(id, draft.specialPointSpend[id] + 1, maximum)} aria-label={restriction || `Increase ${id}`}>+</button></div><small>{active ? `${draft.specialPointSpend[id]} Special point${draft.specialPointSpend[id] === 1 ? "" : "s"} allocated` : `Not used by ${titleCase(draft.magicPathId)}`}</small>{restriction ? <em className="creation-constraint-reason">{restriction}</em> : null}</div>;
      })}
    </div></fieldset>
  </>;
}

function initialQualitySelection(quality: QualityCatalogueEntry): QualitySelection {
  const constraint = quality.constraint;
  const parameters: Record<string, unknown> = {};
  const rating = asRecord(constraint.rating).minimum;
  const composite = asRecord(asRecord(characterCreationRules.quality_rules.cost_resolution.composite_qualities)[quality.id]);
  for (const path of stringArray(composite.sum_option_paths)) parameters[path] = Object.keys(asRecord(quality.raw[path]))[0] || "";
  if (typeof constraint.option_source === "string") {
    const parameter = typeof constraint.option_parameter === "string" ? constraint.option_parameter : "option";
    parameters[parameter] = Object.keys(asRecord(quality.raw[constraint.option_source]))[0] || "";
  }
  for (const [parameter, values] of Object.entries(asRecord(constraint.allowed_parameter_values))) if (parameters[parameter] == null) parameters[parameter] = stringArray(values)[0] || "";
  for (const parameter of stringArray(constraint.required_parameters)) if (parameters[parameter] == null) parameters[parameter] = parameter === "limit_allocations" ? { mental: 0, physical: 0, social: 0 } : "";
  return { id: quality.id, ...(typeof rating === "number" ? { rating } : {}), ...(Object.keys(parameters).length ? { parameters } : {}) };
}

function QualityParameterEditor({ quality, selection, update }: { quality: QualityCatalogueEntry; selection: QualitySelection; update: (selection: QualitySelection) => void }) {
  const constraint = quality.constraint;
  const parameters = selection.parameters || {};
  const parameterNames = new Set(stringArray(constraint.required_parameters));
  const composite = asRecord(asRecord(characterCreationRules.quality_rules.cost_resolution.composite_qualities)[quality.id]);
  stringArray(composite.sum_option_paths).forEach((parameter) => parameterNames.add(parameter));
  if (typeof constraint.option_source === "string") parameterNames.add(typeof constraint.option_parameter === "string" ? constraint.option_parameter : "option");
  Object.keys(asRecord(constraint.allowed_parameter_values)).forEach((parameter) => parameterNames.add(parameter));
  const parameterRules = Array.isArray(constraint.parameter_rules) ? constraint.parameter_rules.map(asRecord) : [];
  const setParameter = (parameter: string, value: unknown) => update({ ...selection, parameters: { ...parameters, [parameter]: value } });
  const ruleFor = (parameter: string) => parameterRules.find((rule) => rule.parameter === parameter);
  const optionSource = typeof constraint.option_source === "string" ? constraint.option_source : "";
  const optionParameter = typeof constraint.option_parameter === "string" ? constraint.option_parameter : "option";

  return <div className="creation-quality-config">
    {Object.keys(asRecord(constraint.rating)).length ? <label><span>Rating</span><input type="number" min={Number(asRecord(constraint.rating).minimum)} max={Number(asRecord(constraint.rating).maximum)} value={selection.rating || ""} onChange={(event) => update({ ...selection, rating: numberInput(event.target.value) })}/></label> : null}
    {[...parameterNames].map((parameter) => {
      const rule = ruleFor(parameter);
      const allowed = stringArray(asRecord(constraint.allowed_parameter_values)[parameter]);
      let options: Array<{ value: string; label: string }> = [];
      if (optionParameter === parameter && optionSource) options = qualityOptions(quality, optionSource);
      else if (asRecord(quality.raw[parameter]) && Object.keys(asRecord(quality.raw[parameter])).length) options = qualityOptions(quality, parameter);
      else if (allowed.length) options = allowed.map((value) => ({ value, label: titleCase(value) }));
      else if (rule?.kind === "known_active_skill" || rule?.kind === "minimum_skill_rating") options = skillCatalogue.map((skill) => ({ value: skill.id, label: skill.name }));
      else if (rule?.kind === "tested_matrix_action") options = testedMatrixActionOptions.map((action) => ({ value: action.name, label: action.name }));
      else if (rule?.kind === "known_spirit_type") options = spiritTypeOptions.map((spirit) => ({ value: spirit.name, label: spirit.name }));
      else if (rule?.kind === "eligible_unpurchased_skill_group") options = skillGroupCatalogue.map((group) => ({ value: group.id, label: group.name }));
      if (rule?.kind === "allocation_sum_equals_rating") {
        const allocation = asRecord(parameters[parameter]);
        return <fieldset className="creation-allocation-field" key={parameter}><legend>{titleCase(parameter)}</legend>{stringArray(rule.allowed_keys).map((key) => <label key={key}><span>{titleCase(key)}</span><input type="number" min={0} max={selection.rating || 0} value={Number(allocation[key] || 0)} onChange={(event) => setParameter(parameter, { ...allocation, [key]: numberInput(event.target.value) })}/></label>)}</fieldset>;
      }
      return <label key={parameter}><span>{titleCase(parameter)}</span>{options.length ? <select value={String(parameters[parameter] || "")} onChange={(event) => setParameter(parameter, event.target.value)}><option value="">Select…</option>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select> : <input value={String(parameters[parameter] || "")} onChange={(event) => setParameter(parameter, event.target.value)} placeholder={`Enter ${titleCase(parameter).toLowerCase()}`}/>}</label>;
    })}
  </div>;
}

export function QualitiesStep({ draft, setDraft, evaluation }: StepProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "positive" | "negative">("all");
  const filtered = useMemo(() => qualityCatalogue.filter((quality) => (kind === "all" || quality.kind === kind) && `${quality.name} ${quality.qualityType} ${stripHtml(quality.raw.description)}`.toLowerCase().includes(query.toLowerCase().trim())), [query, kind]);
  const selectedCount = (id: string) => draft.qualities.filter((selection) => selection.id === id).length;
  const updateSelection = (index: number, selection: QualitySelection) => setDraft((current) => ({ ...current, qualities: current.qualities.map((item, itemIndex) => itemIndex === index ? selection : item) }));
  return <>
    <StepHeader code="STEP 03 // PROFILE" title="Qualities" copy="Choose Core Rulebook Positive and Negative Qualities. Rated, option-based, repeatable, eligibility, incompatibility, and approval rules are generated from the structured contract."/>
    <ValidationPanel violations={evaluation.steps.qualities.violations}/>
    <div className="creation-ledger-strip"><div><span>Positive</span><strong>{evaluation.qualitySummary?.positive ?? "—"}</strong><small>Karma spent</small></div><div><span>Negative</span><strong>{evaluation.qualitySummary?.negative ?? "—"}</strong><small>Karma gained</small></div><div><span>Available</span><strong>{evaluation.qualitySummary?.netKarmaAfterQualities ?? "—"}</strong><small>After qualities</small></div></div>
    <div className="creation-catalogue-tools"><label><span>Search qualities</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, type, rule or effect…"/></label><label><span>Quality kind</span><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="all">All qualities</option><option value="positive">Positive</option><option value="negative">Negative</option></select></label></div>
    <div className="creation-split-catalogue">
      <section className="creation-catalogue-list" aria-label="Available qualities"><header><strong>{filtered.length} available</strong><span>Core Rulebook ruleset</span></header>{filtered.map((quality) => {
        const repeatable = quality.constraint.repeatable === true;
        const selected = selectedCount(quality.id);
        return <button type="button" key={quality.id} onClick={() => setDraft((current) => ({ ...current, qualities: [...current.qualities, initialQualitySelection(quality)] }))} disabled={selected > 0 && !repeatable}><span><strong>{quality.name}</strong><small>{quality.qualityType || quality.category} // {quality.kind}</small></span><span>{selected && !repeatable ? "Selected" : repeatable && selected ? `Add another (${selected})` : "Add"}</span></button>;
      })}</section>
      <section className="creation-selected-list" aria-label="Selected qualities"><header><strong>Selected qualities</strong><span>{draft.qualities.length} records</span></header>{draft.qualities.length ? draft.qualities.map((selection, index) => {
        const quality = qualityCatalogue.find((entry) => entry.id === selection.id);
        if (!quality) return null;
        let cost = "Configure";
        try { const resolved = qualityKarmaValue(selection); cost = `${resolved.amount} Karma`; } catch { /* Configuration editor exposes missing values. */ }
        const approvalId = `quality:${quality.id}`;
        return <article className="creation-selected-card" key={`${selection.id}:${index}`}><header><div><span>{quality.kind}</span><h3>{quality.name}</h3><small>{cost}</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, qualities: current.qualities.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Remove ${quality.name}`}>Remove</button></header><p>{stripHtml(quality.raw.description).slice(0, 230)}{stripHtml(quality.raw.description).length > 230 ? "…" : ""}</p><QualityParameterEditor quality={quality} selection={selection} update={(next) => updateSelection(index, next)}/>{quality.constraint.requires_gamemaster_approval ? <label className="creation-approval"><input type="checkbox" checked={draft.approvals.includes(approvalId)} onChange={(event) => setDraft((current) => ({ ...current, approvals: event.target.checked ? [...current.approvals, approvalId] : current.approvals.filter((id) => id !== approvalId) }))}/><span>Gamemaster approval recorded</span></label> : null}</article>;
      }) : <EmptySelection>Select qualities from the catalogue. A character may also begin with none.</EmptySelection>}</section>
    </div>
  </>;
}

function skillName(allocation: IndividualSkillAllocation): string {
  return skillCatalogue.find((skill) => skill.id === stableCreationId(allocation.id))?.name || allocation.id;
}

export function SkillsStep({ draft, setDraft, evaluation }: StepProps) {
  const [activeChoice, setActiveChoice] = useState("");
  const [groupChoice, setGroupChoice] = useState("");
  const [grantChoice, setGrantChoice] = useState("");
  const [customName, setCustomName] = useState("");
  const [customKind, setCustomKind] = useState<"knowledge" | "language" | "native">("knowledge");
  const budget = skillPointBudget(draft.priorityAssignments.skills);
  const magicGrant = magicPriorityGrant(draft.priorityAssignments.magic_or_resonance, draft.magicPathId);
  const individualGrant = asRecord(magicGrant.magical_skills || magicGrant.resonance_skills || magicGrant.active_skill);
  const individualGrantCount = Number(individualGrant.count || 0);
  const individualGrantRating = Number(individualGrant.rating || 0);
  const individualGrantKind = magicGrant.magical_skills ? "magic" : magicGrant.resonance_skills ? "resonance" : magicGrant.active_skill ? "active" : "";
  const groupGrant = asRecord(magicGrant.magical_skill_group);
  const groupGrantCount = Number(groupGrant.count || 0);
  const groupGrantRating = Number(groupGrant.rating || 0);
  const grantedSkills = draft.individualSkills.filter((skill) => (skill.grantedRating || 0) > 0);
  const grantedGroups = draft.skillGroups.filter((group) => (group.grantedRating || 0) > 0);
  const individualSpent = draft.individualSkills.reduce((sum, skill) => sum + (skill.priorityPoints || 0) + (skill.specializations || []).length, 0);
  const groupSpent = draft.skillGroups.reduce((sum, group) => sum + (group.priorityPoints || 0), 0);
  const knowledgeBudget = (evaluation.naturalAttributes.intuition + evaluation.naturalAttributes.logic) * 2;
  const knowledgeSpent = draft.individualSkills.reduce((sum, skill) => sum + (skill.knowledgeLanguagePoints || 0), 0);
  const unusedSkills = skillCatalogue.filter((skill) => !draft.individualSkills.some((allocation) => stableCreationId(allocation.id) === skill.id));
  const grantableSkills = unusedSkills.filter((skill) => individualGrantKind === "active" || skill.attribute === individualGrantKind);
  const unusedGroups = skillGroupCatalogue.filter((group) => !draft.skillGroups.some((allocation) => stableCreationId(allocation.id) === group.id));
  const updateSkill = (index: number, patch: Partial<IndividualSkillAllocation>) => setDraft((current) => ({ ...current, individualSkills: current.individualSkills.map((skill, itemIndex) => itemIndex === index ? { ...skill, ...patch } : skill) }));
  const updateGroup = (index: number, patch: Partial<SkillGroupAllocation>) => setDraft((current) => ({ ...current, skillGroups: current.skillGroups.map((group, itemIndex) => itemIndex === index ? { ...group, ...patch } : group) }));
  return <>
    <StepHeader code="STEP 05 // COMPETENCY" title="Skills" copy="Apply the skills granted by Magic or Resonance, increase them with the normal skill pools if desired, then allocate Active, group, Knowledge, and Language points."/>
    <ValidationPanel violations={evaluation.steps.skills.violations}/>
    <div className="creation-budget-grid creation-budget-grid--three"><BudgetMeter label="Active skill points" spent={individualSpent} total={budget.individual} invert/><BudgetMeter label="Skill group points" spent={groupSpent} total={budget.groups} invert/><BudgetMeter label="Knowledge & Language" spent={knowledgeSpent} total={knowledgeBudget} invert/></div>
    <div className="creation-add-row"><label><span>Add Active skill</span><select value={activeChoice} onChange={(event) => setActiveChoice(event.target.value)}><option value="">Choose a skill…</option>{unusedSkills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name} // {titleCase(skill.attribute)}</option>)}</select></label><button type="button" disabled={!activeChoice} onClick={() => { const skill = skillCatalogue.find((entry) => entry.id === activeChoice); if (skill) setDraft((current) => ({ ...current, individualSkills: [...current.individualSkills, { id: skill.id, kind: "active", priorityPoints: 1 }] })); setActiveChoice(""); }}>Add skill</button></div>
    <section className="creation-allocation-list"><header><strong>Individual skills</strong><span>Purchased with the Skills priority pool</span></header>{draft.individualSkills.some((skill) => (skill.kind || "active") === "active" && !(skill.grantedRating || 0)) ? draft.individualSkills.map((skill, index) => (skill.kind || "active") === "active" && !(skill.grantedRating || 0) ? <article key={`${skill.id}:${index}`}><header><div><strong>{skillName(skill)}</strong><small>{skillCatalogue.find((entry) => entry.id === stableCreationId(skill.id))?.groupName || "Standalone skill"}</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, individualSkills: current.individualSkills.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></header><div className="creation-inline-fields"><label><span>Rating from skill points</span><input type="number" min={1} max={7} value={skill.priorityPoints || 1} onChange={(event) => updateSkill(index, { priorityPoints: numberInput(event.target.value) })}/></label><label><span>Specialization</span><input value={skill.specializations?.[0]?.name || ""} onChange={(event) => updateSkill(index, { specializations: event.target.value ? [{ name: event.target.value, paidWith: "priority" }] : [] })} placeholder="Optional (+1 point)"/></label></div></article> : null) : <EmptySelection>Add Active skills from the Core Rulebook catalogue.</EmptySelection>}</section>
    <div className="creation-add-row"><label><span>Add skill group</span><select value={groupChoice} onChange={(event) => setGroupChoice(event.target.value)}><option value="">Choose a group…</option>{unusedGroups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><button type="button" disabled={!groupChoice} onClick={() => { setDraft((current) => ({ ...current, skillGroups: [...current.skillGroups, { id: groupChoice, priorityPoints: 1 }] })); setGroupChoice(""); }}>Add group</button></div>
    <section className="creation-allocation-list"><header><strong>Skill groups</strong><span>Purchased with the Skill Group priority pool</span></header>{draft.skillGroups.some((group) => !(group.grantedRating || 0)) ? draft.skillGroups.map((group, index) => !(group.grantedRating || 0) ? <article key={`${group.id}:${index}`}><header><div><strong>{skillGroupCatalogue.find((entry) => entry.id === group.id)?.name || group.id}</strong><small>{skillGroupCatalogue.find((entry) => entry.id === group.id)?.skillIds.map((id) => skillCatalogue.find((skill) => skill.id === id)?.name).join(", ")}</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, skillGroups: current.skillGroups.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></header><div className="creation-inline-fields"><label><span>Group rating</span><input type="number" min={1} max={6} value={group.priorityPoints || 1} onChange={(event) => updateGroup(index, { priorityPoints: numberInput(event.target.value) })}/></label></div></article> : null) : <EmptySelection>Add a group if the selected Skills priority grants group points.</EmptySelection>}</section>
    <section className="creation-allocation-list creation-granted-skills"><header><strong>Granted skills</strong><span>Automatic minimum ratings from the completed Magic or Resonance step</span></header>
      {individualGrantCount > 0 ? <><div className="creation-add-row"><label><span>Choose granted skill ({grantedSkills.length}/{individualGrantCount})</span><select value={grantChoice} disabled={grantedSkills.length >= individualGrantCount} onChange={(event) => setGrantChoice(event.target.value)}><option value="">Choose an eligible skill…</option>{grantableSkills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name} // {titleCase(skill.attribute)}</option>)}</select></label><button type="button" disabled={!grantChoice || grantedSkills.length >= individualGrantCount} onClick={() => { setDraft((current) => ({ ...current, individualSkills: [...current.individualSkills, { id: grantChoice, kind: "active", grantedRating: individualGrantRating }] })); setGrantChoice(""); }}>Apply grant</button></div>{draft.individualSkills.map((skill, index) => (skill.grantedRating || 0) > 0 ? <article key={`grant:${skill.id}:${index}`}><header><div><strong>{skillName(skill)}</strong><small>Granted at {skill.grantedRating}; increases spend individual skill points</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, individualSkills: current.individualSkills.filter((_, itemIndex) => itemIndex !== index) }))}>Change</button></header><div className="creation-inline-fields"><label><span>Total rating</span><input type="number" min={skill.grantedRating} max={7} value={(skill.grantedRating || 0) + (skill.priorityPoints || 0)} onChange={(event) => updateSkill(index, { priorityPoints: Math.max(0, numberInput(event.target.value) - (skill.grantedRating || 0)) })}/><small>Cannot be lower than the granted Rating {skill.grantedRating}.</small></label><label><span>Specialization</span><input value={skill.specializations?.[0]?.name || ""} onChange={(event) => updateSkill(index, { specializations: event.target.value ? [{ name: event.target.value, paidWith: "priority" }] : [] })} placeholder="Optional (+1 point)"/></label></div></article> : null)}</> : null}
      {groupGrantCount > 0 ? <>{!grantedGroups.length ? <button className="creation-primary-action" type="button" onClick={() => setDraft((current) => ({ ...current, skillGroups: [...current.skillGroups, { id: current.aspectedSkillGroup || "", grantedRating: groupGrantRating }] }))} disabled={!draft.aspectedSkillGroup}>Apply granted {titleCase(draft.aspectedSkillGroup || "skill group")}</button> : null}{draft.skillGroups.map((group, index) => (group.grantedRating || 0) > 0 ? <article key={`grant-group:${group.id}:${index}`}><header><div><strong>{skillGroupCatalogue.find((entry) => entry.id === group.id)?.name || titleCase(group.id)}</strong><small>Granted at {group.grantedRating}; increases spend Skill Group points</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, skillGroups: current.skillGroups.filter((_, itemIndex) => itemIndex !== index) }))}>Change</button></header><label><span>Total group rating</span><input type="number" min={group.grantedRating} max={6} value={(group.grantedRating || 0) + (group.priorityPoints || 0)} onChange={(event) => updateGroup(index, { priorityPoints: Math.max(0, numberInput(event.target.value) - (group.grantedRating || 0)) })}/><small>Cannot be lower than the granted Rating {group.grantedRating}.</small></label></article> : null)}</> : null}
      {!individualGrantCount && !groupGrantCount ? <EmptySelection>The selected path and priority do not grant starting skills.</EmptySelection> : null}
    </section>
    <div className="creation-add-row creation-add-row--custom"><label><span>Knowledge or Language name</span><input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="e.g. Seattle Gangs or English"/></label><label><span>Type</span><select value={customKind} onChange={(event) => setCustomKind(event.target.value as typeof customKind)}><option value="knowledge">Knowledge</option><option value="language">Language</option><option value="native">Native Language (no rating)</option></select></label><button type="button" disabled={!customName.trim()} onClick={() => { const native = customKind === "native"; setDraft((current) => ({ ...current, individualSkills: [...current.individualSkills, { id: customName.trim(), kind: native ? "language" : customKind, ...(native ? { native: true } : customKind === "language" ? { native: false } : {}), ...(!native ? { knowledgeLanguagePoints: 1 } : {}) }] })); setCustomName(""); }}>Add custom skill</button></div>
    <section className="creation-allocation-list"><header><strong>Knowledge & Languages</strong><span>Select Native Language as a type; it never requires a number</span></header>{draft.individualSkills.some((skill) => skill.kind === "knowledge" || skill.kind === "language") ? draft.individualSkills.map((skill, index) => skill.kind === "knowledge" || skill.kind === "language" ? <article key={`${skill.id}:${index}`}><header><div><strong>{skill.id}</strong><small>{skill.native ? "Native Language // no numeric rating" : titleCase(skill.kind)}</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, individualSkills: current.individualSkills.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></header>{skill.native ? <div className="creation-native-language-badge">Native language selected — no points required</div> : <div className="creation-inline-fields"><label><span>Rating points</span><input type="number" min={1} max={6} value={skill.knowledgeLanguagePoints || 1} onChange={(event) => updateSkill(index, { knowledgeLanguagePoints: numberInput(event.target.value) })}/></label></div>}</article> : null) : <EmptySelection>Add at least one Native Language, then allocate the Knowledge and Language point pool.</EmptySelection>}</section>
  </>;
}

function FormulaPicker({ label, options, selected, onAdd, onRemove }: { label: string; options: Array<{ id: string; name: string; category: string; detail?: string }>; selected: string[]; onAdd: (id: string) => void; onRemove: (id: string) => void }) {
  const [choice, setChoice] = useState("");
  const remaining = options.filter((option) => !selected.includes(option.id));
  return <section className="creation-formula-picker"><header><div><strong>{label}</strong><span>{selected.length} selected</span></div><div><select aria-label={`Add ${label}`} value={choice} onChange={(event) => setChoice(event.target.value)}><option value="">Choose from catalogue…</option>{remaining.map((option) => <option value={option.id} key={option.id}>{option.name} // {option.category}{option.detail ? ` // ${option.detail}` : ""}</option>)}</select><button type="button" disabled={!choice} onClick={() => { onAdd(choice); setChoice(""); }}>Add</button></div></header>{selected.length ? <div className="creation-token-list">{selected.map((id) => { const option = options.find((entry) => entry.id === id); return <button type="button" key={id} onClick={() => onRemove(id)} aria-label={`Remove ${option?.name || id}`}><span>{option?.name || id}</span><small>{option?.category}</small><b aria-hidden="true">×</b></button>; })}</div> : <EmptySelection>No {label.toLowerCase()} selected.</EmptySelection>}</section>;
}

export function MagicStep({ draft, setDraft, evaluation }: StepProps) {
  const grant = magicPriorityGrant(draft.priorityAssignments.magic_or_resonance, draft.magicPathId);
  const path = magicPathOptions.find((option) => option.id === draft.magicPathId);
  const [powerChoice, setPowerChoice] = useState("");
  const [preparation, setPreparation] = useState("");
  const allowedCategories = path?.raw.allowed_formula_categories_by_selected_group
    ? stringArray(asRecord(path.raw.allowed_formula_categories_by_selected_group)[draft.aspectedSkillGroup || ""])
    : stringArray(path?.raw.allowed_formula_categories);
  const allows = (category: string) => allowedCategories.includes(category);
  const allowsBinding = path?.raw.may_bind_spirits === true || path?.raw.may_bind_spirits_when_selected_group === draft.aspectedSkillGroup;
  const allowsSprites = path?.raw.may_register_sprites === true;
  const updateMagicList = (field: "spells" | "rituals" | "complexForms", next: string[]) => setDraft((current) => ({ ...current, magic: { ...current.magic, [field]: next } }));
  return <>
    <StepHeader code="STEP 04 // AWAKENING" title="Magic & Resonance" copy="Select the actual formulas, powers, spirits, or sprites behind the priority grant. Counts and Power Point spend are derived from these records rather than entered twice."/>
    <ValidationPanel violations={evaluation.steps.magic.violations}/>
    <div className="creation-path-banner"><span>{titleCase(draft.magicPathId)}</span><strong>{path?.specialAttribute ? `${titleCase(path.specialAttribute)} ${evaluation.naturalAttributes[path.specialAttribute]}` : "No Magic or Resonance attribute"}</strong><small>Priority {draft.priorityAssignments.magic_or_resonance}{draft.aspectedSkillGroup ? ` // ${titleCase(draft.aspectedSkillGroup)}` : ""}</small></div>
    {draft.magicPathId === "mundane" ? <EmptySelection>This path has no spells, complex forms, adept powers, bound spirits, or registered sprites. Continue to Resources.</EmptySelection> : <>
      {allows("spells") ? <FormulaPicker label={`Spells${grant.spells ? ` (${grant.spells} granted)` : ""}`} options={spellCatalogue} selected={draft.magic.spells} onAdd={(id) => updateMagicList("spells", [...draft.magic.spells, id])} onRemove={(id) => updateMagicList("spells", draft.magic.spells.filter((item) => item !== id))}/> : null}
      {allows("rituals") ? <FormulaPicker label="Rituals" options={ritualCatalogue} selected={draft.magic.rituals} onAdd={(id) => updateMagicList("rituals", [...draft.magic.rituals, id])} onRemove={(id) => updateMagicList("rituals", draft.magic.rituals.filter((item) => item !== id))}/> : null}
      {allows("complex_forms") ? <FormulaPicker label={`Complex forms${grant.complex_forms ? ` (${grant.complex_forms} granted)` : ""}`} options={complexFormCatalogue} selected={draft.magic.complexForms} onAdd={(id) => updateMagicList("complexForms", [...draft.magic.complexForms, id])} onRemove={(id) => updateMagicList("complexForms", draft.magic.complexForms.filter((item) => item !== id))}/> : null}
      {allows("preparations") ? <section className="creation-formula-picker"><header><div><strong>Preparations</strong><span>{draft.magic.preparations.length} selected</span></div><div><input aria-label="Preparation formula name" value={preparation} onChange={(event) => setPreparation(event.target.value)} placeholder="Preparation formula name"/><button type="button" disabled={!preparation.trim()} onClick={() => { setDraft((current) => ({ ...current, magic: { ...current.magic, preparations: [...current.magic.preparations, preparation.trim()] } })); setPreparation(""); }}>Add</button></div></header>{draft.magic.preparations.length ? <div className="creation-token-list">{draft.magic.preparations.map((name, index) => <button type="button" key={`${name}:${index}`} onClick={() => setDraft((current) => ({ ...current, magic: { ...current.magic, preparations: current.magic.preparations.filter((_, itemIndex) => itemIndex !== index) } }))}><span>{name}</span><small>Preparation</small><b aria-hidden="true">×</b></button>)}</div> : <EmptySelection>No preparations selected.</EmptySelection>}</section> : null}
      {["adept", "mystic-adept"].includes(draft.magicPathId) ? <section className="creation-power-section"><header><div><strong>Adept powers</strong><span>{evaluation.powerPoints.spent} / {evaluation.powerPoints.available} PP</span></div><div><select value={powerChoice} onChange={(event) => setPowerChoice(event.target.value)}><option value="">Choose a power…</option>{adeptPowerCatalogue.map((power) => <option value={power.id} key={power.id}>{power.name} // {String(power.raw.cost)}</option>)}</select><button type="button" disabled={!powerChoice} onClick={() => { setDraft((current) => ({ ...current, magic: { ...current.magic, adeptPowers: [...current.magic.adeptPowers, { instanceId: draftInstanceId("power", current.magic.adeptPowers.map((power) => power.instanceId)), powerId: powerChoice, rating: 1 }] } })); setPowerChoice(""); }}>Add power</button></div></header><BudgetMeter label="Power Points" spent={evaluation.powerPoints.spent} total={evaluation.powerPoints.available}/>{draft.magicPathId === "mystic-adept" ? <label className="creation-inline-control"><span>Power Points purchased with Karma</span><input type="number" min={0} max={evaluation.naturalAttributes.magic} value={draft.magic.purchasedPowerPoints} onChange={(event) => setDraft((current) => ({ ...current, magic: { ...current.magic, purchasedPowerPoints: numberInput(event.target.value) } }))}/><small>5 Karma each under the selected Core rules precedence.</small></label> : null}<div className="creation-allocation-list">{draft.magic.adeptPowers.length ? draft.magic.adeptPowers.map((selection, index) => { const power = adeptPowerCatalogue.find((entry) => entry.id === selection.powerId); return <article key={selection.instanceId}><header><div><strong>{power?.name || selection.powerId}</strong><small>{String(power?.raw.cost || "Unknown cost")}</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, magic: { ...current.magic, adeptPowers: current.magic.adeptPowers.filter((_, itemIndex) => itemIndex !== index) } }))}>Remove</button></header><div className="creation-inline-fields"><label><span>Rating / level</span><input type="number" min={1} max={Math.max(1, evaluation.naturalAttributes.magic)} value={selection.rating} onChange={(event) => setDraft((current) => ({ ...current, magic: { ...current.magic, adeptPowers: current.magic.adeptPowers.map((powerSelection, itemIndex) => itemIndex === index ? { ...powerSelection, rating: numberInput(event.target.value) } : powerSelection) } }))}/></label>{/attribute|skill|sense|limit/i.test(power?.name || "") ? <label><span>Selected subject</span><input value={selection.choice || ""} onChange={(event) => setDraft((current) => ({ ...current, magic: { ...current.magic, adeptPowers: current.magic.adeptPowers.map((powerSelection, itemIndex) => itemIndex === index ? { ...powerSelection, choice: event.target.value } : powerSelection) } }))} placeholder="Attribute, skill, sense, or limit"/></label> : null}</div></article>; }) : <EmptySelection>No adept powers selected.</EmptySelection>}</div></section> : null}
      {allowsBinding ? <EntitySection type="spirit" draft={draft} setDraft={setDraft} rating={evaluation.naturalAttributes.magic}/> : null}
      {allowsSprites ? <EntitySection type="sprite" draft={draft} setDraft={setDraft} rating={evaluation.naturalAttributes.resonance}/> : null}
    </>}
  </>;
}

function EntitySection({ type, draft, setDraft, rating }: { type: "spirit" | "sprite"; draft: CharacterDraft; setDraft: SetCharacterDraft; rating: number }) {
  const [choice, setChoice] = useState("");
  const isSpirit = type === "spirit";
  const rows = isSpirit ? draft.magic.boundSpirits : draft.magic.registeredSprites;
  return <section className="creation-entity-section"><header><div><strong>{isSpirit ? "Bound spirits" : "Registered sprites"}</strong><span>{rows.length} entities // {isSpirit ? "Force" : "Level"} {rating}</span></div><div>{isSpirit ? <select value={choice} onChange={(event) => setChoice(event.target.value)}><option value="">Choose spirit type…</option>{spiritTypeOptions.map((spirit) => <option value={spirit.id} key={spirit.id}>{spirit.name}</option>)}</select> : <input value={choice} onChange={(event) => setChoice(event.target.value)} placeholder="Sprite designation"/>}<button type="button" disabled={!choice} onClick={() => { setDraft((current) => isSpirit ? ({ ...current, magic: { ...current.magic, boundSpirits: [...current.magic.boundSpirits, { instanceId: draftInstanceId("spirit", current.magic.boundSpirits.map((item) => item.instanceId)), spiritId: choice, services: 1 }] } }) : ({ ...current, magic: { ...current.magic, registeredSprites: [...current.magic.registeredSprites, { instanceId: draftInstanceId("sprite", current.magic.registeredSprites.map((item) => item.instanceId)), spriteName: choice, tasks: 1 }] } })); setChoice(""); }}>Add</button></div></header><div className="creation-allocation-list">{rows.length ? rows.map((row, index) => <article key={row.instanceId}><header><div><strong>{isSpirit ? spiritTypeOptions.find((spirit) => spirit.id === (row as typeof draft.magic.boundSpirits[number]).spiritId)?.name : (row as typeof draft.magic.registeredSprites[number]).spriteName}</strong><small>{isSpirit ? "Force" : "Level"} {rating}</small></div><button type="button" onClick={() => setDraft((current) => isSpirit ? ({ ...current, magic: { ...current.magic, boundSpirits: current.magic.boundSpirits.filter((_, itemIndex) => itemIndex !== index) } }) : ({ ...current, magic: { ...current.magic, registeredSprites: current.magic.registeredSprites.filter((_, itemIndex) => itemIndex !== index) } }))}>Remove</button></header><label className="creation-inline-control"><span>{isSpirit ? "Services" : "Tasks"}</span><input type="number" min={1} value={isSpirit ? (row as typeof draft.magic.boundSpirits[number]).services : (row as typeof draft.magic.registeredSprites[number]).tasks} onChange={(event) => setDraft((current) => isSpirit ? ({ ...current, magic: { ...current.magic, boundSpirits: current.magic.boundSpirits.map((item, itemIndex) => itemIndex === index ? { ...item, services: numberInput(event.target.value) } : item) } }) : ({ ...current, magic: { ...current.magic, registeredSprites: current.magic.registeredSprites.map((item, itemIndex) => itemIndex === index ? { ...item, tasks: numberInput(event.target.value) } : item) } }))}/></label></article>) : <EmptySelection>No {isSpirit ? "bound spirits" : "registered sprites"} selected.</EmptySelection>}</div></section>;
}

function resourceAuthoredValue(entry: ResourceCatalogueEntry, field: "cost" | "availability" | "essence"): string {
  const value = field === "cost" && entry.kind === "lifestyle" ? entry.raw.monthly_cost : entry.raw[field];
  return String(value ?? "—");
}

export function ResourcesStep({ draft, setDraft, evaluation }: StepProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(resourceCatalogue.map((entry) => entry.category))], []);
  const filtered = useMemo(() => resourceCatalogue.filter((entry) => (category === "all" || entry.category === category) && `${entry.name} ${entry.category} ${entry.subcategory} ${entry.raw.description || ""}`.toLowerCase().includes(query.toLowerCase().trim())), [query, category]);
  const visible = filtered.slice(0, 60);
  const update = (index: number, patch: Partial<ResourceSelectionShape>) => setDraft((current) => ({ ...current, resources: current.resources.map((selection, itemIndex) => itemIndex === index ? { ...selection, ...patch } : selection) }));
  return <>
    <StepHeader code="STEP 06 // PROCUREMENT" title="Resources" copy="Purchase from the existing equipment, weapon, cyberdeck, vehicle, drone, focus, and lifestyle catalogues. Fixed and rated values resolve automatically; authored variable prices are entered transparently."/>
    <ValidationPanel violations={evaluation.steps.resources.violations}/>
    <div className="creation-budget-grid"><BudgetMeter label="Nuyen spent" spent={evaluation.resources.spent + evaluation.resources.carryover} total={evaluation.resources.budget} invert/><BudgetMeter label="Essence used" spent={Math.max(0, 6 - evaluation.resources.essence)} total={6}/></div>
    <div className="creation-inline-fields creation-resource-controls"><label><span>Karma converted to nuyen</span><input type="number" min={0} value={draft.karmaConvertedToNuyen} onChange={(event) => setDraft((current) => ({ ...current, karmaConvertedToNuyen: numberInput(event.target.value) }))}/><small>{formatNuyen(draft.karmaConvertedToNuyen * 2000)}</small></label><label><span>Nuyen carried into play</span><input type="number" min={0} max={5000} step={100} value={draft.nuyenCarryover} onChange={(event) => setDraft((current) => ({ ...current, nuyenCarryover: numberInput(event.target.value) }))}/></label><label><span>Matrix Data Processing</span><input type="number" min={0} max={12} value={draft.matrixDataProcessing} onChange={(event) => setDraft((current) => ({ ...current, matrixDataProcessing: numberInput(event.target.value) }))}/><small>Current configured value for derived initiative.</small></label></div>
    <div className="creation-catalogue-tools"><label><span>Search procurement catalogue</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Item, category, effect, cost…"/></label><label><span>Department</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All departments</option>{categories.map((name) => <option value={name} key={name}>{name}</option>)}</select></label></div>
    <div className="creation-split-catalogue">
      <section className="creation-catalogue-list creation-resource-catalogue"><header><strong>{filtered.length} matching records</strong><span>{filtered.length > visible.length ? `Showing first ${visible.length}` : "Core-compatible"}</span></header>{visible.map((entry) => <button type="button" key={entry.catalogueId} onClick={() => setDraft((current) => ({ ...current, resources: [...current.resources, { instanceId: draftInstanceId("item", current.resources.map((item) => item.instanceId)), catalogueId: entry.catalogueId, quantity: 1, ...(entry.ratingMinimum != null ? { rating: entry.ratingMinimum } : {}), ...(entry.kind === "augmentation" ? { grade: "standard" as const } : {}) }] }))}><span><strong>{entry.name}</strong><small>{entry.category} // {entry.subcategory || entry.kind}</small></span><span><b>{resourceAuthoredValue(entry, "cost")}</b><small>Availability {resourceAuthoredValue(entry, "availability")}</small></span></button>)}</section>
      <section className="creation-selected-list creation-resource-selected"><header><strong>Procurement plan</strong><span>{draft.resources.length} line items</span></header>{draft.resources.length ? draft.resources.map((selection, index) => {
        const entry = resourceCatalogue.find((item) => item.catalogueId === selection.catalogueId);
        if (!entry) return null;
        const automaticCost = resolveCatalogueCost(entry, selection.rating);
        const automaticAvailability = resolveCatalogueAvailability(entry, selection.rating);
        const automaticEssence = resolveCatalogueEssence(entry, selection.rating);
        return <article className="creation-selected-card creation-resource-card" key={selection.instanceId}><header><div><span>{entry.collection}</span><h3>{entry.name}</h3><small>{resourceAuthoredValue(entry, "cost")} // Availability {resourceAuthoredValue(entry, "availability")}</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, resources: current.resources.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></header><div className="creation-inline-fields"><label><span>Quantity</span><input type="number" min={1} value={selection.quantity} onChange={(event) => update(index, { quantity: numberInput(event.target.value) })}/></label>{entry.ratingMinimum != null ? <label><span>{entry.isFocus ? "Force" : "Rating"}</span><input type="number" min={entry.ratingMinimum} max={entry.ratingMaximum} value={selection.rating || entry.ratingMinimum} onChange={(event) => update(index, { rating: numberInput(event.target.value) })}/></label> : null}{entry.kind === "augmentation" ? <label><span>Grade</span><select value={selection.grade || "standard"} onChange={(event) => update(index, { grade: event.target.value as "standard" | "alphaware" })}><option value="standard">Standard</option><option value="alphaware">Alphaware</option></select></label> : null}</div><details><summary>Configured numeric values</summary><div className="creation-inline-fields"><label><span>Per-item cost</span><input type="number" min={0} value={selection.manualCost ?? ""} placeholder={automaticCost == null ? "Required" : String(automaticCost)} onChange={(event) => update(index, { manualCost: optionalNumberInput(event.target.value) })}/><small>{automaticCost == null ? "Variable authored price" : `Automatic: ${formatNuyen(automaticCost)}`}</small></label><label><span>Availability</span><input type="number" min={0} value={selection.manualAvailability ?? ""} placeholder={automaticAvailability == null ? "Required" : String(automaticAvailability)} onChange={(event) => update(index, { manualAvailability: optionalNumberInput(event.target.value) })}/></label>{entry.kind === "augmentation" ? <label><span>Per-item Essence</span><input type="number" min={0} step={0.01} value={selection.manualEssence ?? ""} placeholder={automaticEssence == null ? "Required" : String(automaticEssence)} onChange={(event) => update(index, { manualEssence: optionalNumberInput(event.target.value) })}/></label> : null}</div></details>{entry.kind === "augmentation" ? <details><summary>Declared Attribute bonuses</summary><div className="creation-augmentation-grid">{ATTRIBUTE_IDS.map((id) => <label key={id}><span>{id.slice(0, 3).toUpperCase()}</span><input type="number" min={0} max={4} value={selection.attributeBonuses?.[id] || 0} onChange={(event) => update(index, { attributeBonuses: { ...selection.attributeBonuses, [id]: numberInput(event.target.value) } })}/></label>)}</div></details> : null}{entry.isFocus ? <div className="creation-focus-controls"><label className="creation-check-field"><input type="checkbox" checked={Boolean(selection.bonded)} onChange={(event) => update(index, { bonded: event.target.checked })}/><span>Bond this focus at creation</span></label>{selection.bonded ? <label><span>Bonding Karma cost</span><input type="number" min={1} value={selection.bondKarmaCost || ""} onChange={(event) => update(index, { bondKarmaCost: numberInput(event.target.value) })}/><small>Enter the cost for the selected focus type and Force.</small></label> : null}</div> : null}</article>;
      }) : <EmptySelection>Add purchases from the catalogue. Empty plans are valid but unspent nuyen will be lost.</EmptySelection>}</section>
    </div>
  </>;
}

export function ContactsStep({ draft, setDraft, evaluation }: StepProps) {
  const multiplier = draft.playLevelId === "prime_runner" ? 6 : 3;
  const budget = evaluation.naturalAttributes.charisma * multiplier;
  const totalRatings = draft.contacts.reduce((sum, contact) => sum + contact.connection + contact.loyalty, 0);
  const paidRatings = draft.karmaPurchases.filter((purchase) => purchase.kind === "contact_rating_point").reduce((sum, purchase) => sum + (purchase.quantity || 1), 0);
  const spent = Math.max(0, totalRatings - paidRatings);
  return <>
    <StepHeader code="STEP 07 // NETWORK" title="Contacts" copy="Define the runner's starting network. Connection plus Loyalty spends the free contact pool; no single contact may receive more than seven points."/>
    <ValidationPanel violations={evaluation.steps.contacts.violations}/>
    <BudgetMeter label="Free contact Karma" spent={spent} total={budget} invert/>
    {paidRatings ? <aside className="creation-protocol-note"><strong>{paidRatings} paid contact point{paidRatings === 1 ? "" : "s"}</strong><p>These points are charged in the Karma step and removed from the free contact allocation.</p></aside> : null}
    <button className="creation-primary-action" type="button" onClick={() => setDraft((current) => ({ ...current, contacts: [...current.contacts, { instanceId: draftInstanceId("contact", current.contacts.map((contact) => contact.instanceId)), name: "", connection: 1, loyalty: 1, notes: "" }] }))}>Add contact</button>
    <section className="creation-contact-grid">{draft.contacts.length ? draft.contacts.map((contact, index) => <article key={contact.instanceId}><header><span>CONTACT {String(index + 1).padStart(2, "0")}</span><button type="button" onClick={() => setDraft((current) => ({ ...current, contacts: current.contacts.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></header><label><span>Name or role</span><input value={contact.name} onChange={(event) => setDraft((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} placeholder="Fixer, talismonger, street doc…"/></label><div className="creation-inline-fields"><label><span>Connection</span><input type="number" min={1} max={6} value={contact.connection} onChange={(event) => setDraft((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, connection: numberInput(event.target.value) } : item) }))}/></label><label><span>Loyalty</span><input type="number" min={1} max={6} value={contact.loyalty} onChange={(event) => setDraft((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, loyalty: numberInput(event.target.value) } : item) }))}/></label></div><label><span>Notes</span><textarea rows={3} value={contact.notes} onChange={(event) => setDraft((current) => ({ ...current, contacts: current.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, notes: event.target.value } : item) }))}/></label></article>) : <EmptySelection>Add contacts until the free pool is allocated, or accept the warning that unused points are lost.</EmptySelection>}</section>
  </>;
}

const MANUAL_KARMA_KINDS: Array<{ id: KarmaPurchaseKind; label: string }> = [
  { id: "attribute", label: "Raise Attribute" },
  { id: "active_skill", label: "Raise Active skill" },
  { id: "skill_group", label: "Raise skill group" },
  { id: "knowledge_skill", label: "Raise Knowledge skill" },
  { id: "language_skill", label: "Raise Language skill" },
  { id: "specialization", label: "Buy specialization" },
  { id: "contact_rating_point", label: "Additional contact point" }
];

function defaultKarmaPurchase(draft: CharacterDraft, kind: KarmaPurchaseKind): DraftKarmaPurchase {
  const targets = searchableKarmaTargets(kind);
  const targetId = targets[0]?.id;
  const currentRating = targetId ? suggestedKarmaCurrentRating(draft, kind, targetId) : 0;
  return {
    instanceId: draftInstanceId("karma", draft.karmaPurchases.map((purchase) => purchase.instanceId)),
    kind,
    ...(targetId ? { targetId } : {}),
    ...(["attribute", "active_skill", "skill_group", "knowledge_skill", "language_skill"].includes(kind) ? { currentRating, newRating: currentRating + 1 } : { quantity: 1 })
  };
}

export function KarmaStep({ draft, setDraft, evaluation }: StepProps) {
  const [kind, setKind] = useState<KarmaPurchaseKind>("attribute");
  const summary = evaluation.karmaSummary;
  const update = (index: number, patch: Partial<DraftKarmaPurchase>) => setDraft((current) => ({ ...current, karmaPurchases: current.karmaPurchases.map((purchase, itemIndex) => itemIndex === index ? { ...purchase, ...patch } : purchase) }));
  return <>
    <StepHeader code="STEP 08 // KARMA" title="Leftover Karma" copy="Quality values, formula purchases, Mystic Adept Power Points, bound services, registered tasks, and focus bonding flow into one ledger. Add any final Attribute or skill purchases here."/>
    <ValidationPanel violations={evaluation.steps.karma.violations}/>
    <div className="creation-ledger-strip creation-ledger-strip--karma"><div><span>Starting</span><strong>{summary?.startingKarma ?? "—"}</strong><small>Creation level</small></div><div><span>After qualities</span><strong>{summary?.availableAfterQualities ?? "—"}</strong><small>Available</small></div><div><span>Purchases</span><strong>{summary?.purchaseCost ?? "—"}</strong><small>Karma spent</small></div><div><span>Carryover</span><strong>{draft.karmaCarryover}</strong><small>Maximum 7</small></div><div><span>Lost</span><strong>{summary?.lostKarma ?? "—"}</strong><small>Unallocated</small></div></div>
    <label className="creation-inline-control"><span>Karma carried into play</span><input type="number" min={0} max={7} value={draft.karmaCarryover} onChange={(event) => setDraft((current) => ({ ...current, karmaCarryover: numberInput(event.target.value) }))}/></label>
    <div className="creation-add-row"><label><span>Add final purchase</span><select value={kind} onChange={(event) => setKind(event.target.value as KarmaPurchaseKind)}>{MANUAL_KARMA_KINDS.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label><button type="button" onClick={() => setDraft((current) => ({ ...current, karmaPurchases: [...current.karmaPurchases, defaultKarmaPurchase(current, kind)] }))}>Add purchase</button></div>
    <section className="creation-allocation-list"><header><strong>Manual Karma purchases</strong><span>Formula and entity costs are generated from earlier steps</span></header>{draft.karmaPurchases.length ? draft.karmaPurchases.map((purchase, index) => {
      const targets = searchableKarmaTargets(purchase.kind);
      const needsRatings = ["attribute", "active_skill", "skill_group", "knowledge_skill", "language_skill"].includes(purchase.kind);
      let cost = "Invalid";
      try { cost = `${karmaPurchaseCost(purchase, draft.qualities)} Karma`; } catch { /* Validator provides the exact issue. */ }
      return <article key={purchase.instanceId}><header><div><strong>{MANUAL_KARMA_KINDS.find((option) => option.id === purchase.kind)?.label || titleCase(purchase.kind)}</strong><small>{cost}</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, karmaPurchases: current.karmaPurchases.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></header><div className="creation-inline-fields">{targets.length ? <label><span>Target</span><select value={purchase.targetId || ""} onChange={(event) => { const targetId = event.target.value; const currentRating = suggestedKarmaCurrentRating(draft, purchase.kind, targetId); update(index, { targetId, ...(needsRatings ? { currentRating, newRating: currentRating + 1 } : {}) }); }}>{targets.map((target) => <option value={target.id} key={target.id}>{target.name}</option>)}</select></label> : ["knowledge_skill", "language_skill", "specialization"].includes(purchase.kind) ? <label><span>Target</span><input value={purchase.targetId || ""} onChange={(event) => update(index, { targetId: event.target.value })} placeholder="Skill or specialization target"/></label> : null}{needsRatings ? <><label><span>Current rating</span><input type="number" min={0} value={purchase.currentRating ?? 0} onChange={(event) => update(index, { currentRating: numberInput(event.target.value) })}/></label><label><span>New rating</span><input type="number" min={1} value={purchase.newRating ?? 1} onChange={(event) => update(index, { newRating: numberInput(event.target.value) })}/></label></> : <label><span>Quantity</span><input type="number" min={1} value={purchase.quantity || 1} onChange={(event) => update(index, { quantity: numberInput(event.target.value) })}/></label>}</div></article>;
    }) : <EmptySelection>No manual purchases. Costs selected elsewhere are still included in the complete ledger.</EmptySelection>}</section>
  </>;
}

function statisticValue(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    if (row.value != null && row.dice != null) return `${row.value} + ${row.dice}D6`;
    return Object.entries(row).map(([key, nested]) => `${titleCase(key)} ${nested}`).join(" // ");
  }
  return String(value ?? "—");
}

export function ReviewStep({ draft, evaluation, goToStep, exportDraft, printDraft }: ReviewStepProps) {
  return <>
    <StepHeader code="STEP 09 // AUDIT" title="Final review" copy="This dossier is generated from the same draft evaluated by the rules engine. Final status remains blocked while any mechanical error, approval, or unfinished step is unresolved."/>
    <ValidationPanel violations={evaluation.steps.review.violations} empty="The complete mechanical audit is clear."/>
    <section className="creation-final-status" data-ready={evaluation.ready || undefined}><span aria-hidden="true">{evaluation.ready ? "✓" : "!"}</span><div><strong>{evaluation.ready ? "Runner mechanically ready" : "Runner requires attention"}</strong><p>{evaluation.ready ? "Every creation step is confirmed and no blocking errors or approvals remain. Warnings identify optional unspent resources." : `${evaluation.steps.review.errors} errors and ${evaluation.steps.review.approvals} approvals remain across the workflow.`}</p></div><div><button type="button" onClick={exportDraft}>Export JSON</button><button type="button" onClick={printDraft}>Print dossier</button></div></section>
    <div className="creation-review-grid">
      <section><header><span>CREATION PROFILE</span><button type="button" onClick={() => goToStep("priorities")}>Edit</button></header><h3>{metatypeOptions.find((option) => option.id === draft.metatypeId)?.name || "Metatype not selected"}</h3><p>{titleCase(draft.magicPathId || "Path not selected")}</p><dl><div><dt>Metatype</dt><dd>{metatypeOptions.find((option) => option.id === draft.metatypeId)?.name}</dd></div><div><dt>Path</dt><dd>{titleCase(draft.magicPathId)}</dd></div><div><dt>Creation level</dt><dd>{playLevelOptions.find((option) => option.id === draft.playLevelId)?.name}</dd></div></dl></section>
      <section><header><span>PRIORITIES</span><button type="button" onClick={() => goToStep("priorities")}>Edit</button></header><dl>{PRIORITY_CATEGORIES.map((category) => <div key={category}><dt>{PRIORITY_CATEGORY_LABELS[category]}</dt><dd>{draft.priorityAssignments[category]}</dd></div>)}</dl></section>
      <section className="creation-review-wide"><header><span>ATTRIBUTES</span><button type="button" onClick={() => goToStep("attributes")}>Edit</button></header><div className="creation-review-stat-grid">{[...ATTRIBUTE_IDS, "edge", "magic", "resonance"].map((id) => <div key={id}><span>{id.slice(0, 3).toUpperCase()}</span><strong>{evaluation.naturalAttributes[id]}</strong>{evaluation.augmentedAttributes[id] !== evaluation.naturalAttributes[id] ? <small>Aug {evaluation.augmentedAttributes[id]}</small> : null}</div>)}</div></section>
      <section className="creation-review-wide"><header><span>DERIVED STATISTICS</span><span>Essence {evaluation.resources.essence.toFixed(2)}</span></header><dl className="creation-derived-grid">{Object.entries(evaluation.derivedStatistics).map(([id, value]) => <div key={id}><dt>{titleCase(id)}</dt><dd>{statisticValue(value)}</dd></div>)}</dl></section>
      <section><header><span>LOADOUT</span><button type="button" onClick={() => goToStep("resources")}>Edit</button></header><dl><div><dt>Resources</dt><dd>{formatNuyen(evaluation.resources.spent)} / {formatNuyen(evaluation.resources.budget)}</dd></div><div><dt>Line items</dt><dd>{draft.resources.length}</dd></div><div><dt>Skills</dt><dd>{Object.keys(evaluation.skillRatings).length}</dd></div><div><dt>Qualities</dt><dd>{draft.qualities.length}</dd></div><div><dt>Contacts</dt><dd>{draft.contacts.length}</dd></div></dl></section>
      <section><header><span>KARMA</span><button type="button" onClick={() => goToStep("karma")}>Edit</button></header><dl><div><dt>After qualities</dt><dd>{evaluation.karmaSummary?.availableAfterQualities ?? "—"}</dd></div><div><dt>Purchases</dt><dd>{evaluation.karmaSummary?.purchaseCost ?? "—"}</dd></div><div><dt>Carryover</dt><dd>{draft.karmaCarryover}</dd></div><div><dt>Lost</dt><dd>{evaluation.karmaSummary?.lostKarma ?? "—"}</dd></div></dl></section>
    </div>
    <section className="creation-review-findings"><header><strong>Workflow audit</strong><span>{evaluation.allViolations.length} total findings</span></header>{CREATION_STEPS.filter((step) => step.id !== "review").map((step) => { const result = evaluation.steps[step.id]; return <button type="button" onClick={() => goToStep(step.id)} key={step.id} data-clear={result.complete || undefined}><span>{result.complete ? "✓" : "!"}</span><strong>{step.label}</strong><small>{result.errors} errors // {result.approvals} approvals // {result.warnings} warnings</small></button>; })}</section>
  </>;
}
