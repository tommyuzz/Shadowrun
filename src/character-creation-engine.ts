import rulesPayload from "../character_creation_rules.json";
import metatypePayload from "../metatypes.json";
import priorityPayload from "../priority_array.json";
import qualityPayload from "../qualities.json";
import skillPayload from "../skills.json";
import matrixPayload from "../matrixinteraction.json";
import spiritPayload from "../spirits.json";
import lifestylePayload from "../lifestyles.json";
import { evaluateRule, ruleValueAtPath, type RuleNode } from "./rule-engine";

type UnknownRecord = Record<string, unknown>;
type NumericExpression = number | { op: "path"; path: string } | { op: "add" | "subtract" | "multiply" | "divide" | "min" | "max"; args: NumericExpression[] } | { op: "ceil" | "floor"; args: [NumericExpression] };

export interface RuleViolation {
  id: string;
  severity: "error" | "warning" | "approval";
  message: string;
  path?: string;
}

export interface QualitySelection {
  id: string;
  rating?: number;
  parameters?: Record<string, unknown>;
}

export interface QualityValidationContext {
  playLevelId: string;
  metatypeId: string;
  magicPathId: string;
  magicRating: number;
  resonanceRating: number;
  aspectedSkillGroup?: string;
  skillRatings?: Record<string, number>;
  purchasedSkillGroupIds?: string[];
  capabilityIds?: string[];
  approvals?: string[];
}

export interface PrioritySelection {
  playLevelId: string;
  assignments: Record<string, string | undefined>;
  metatypeId: string;
  magicPathId: string;
}

export interface AttributePrioritySelection {
  metatypeId: string;
  metatypePriorityRank: string;
  attributePriorityRank: string;
  magicPriorityRank: string;
  magicPathId: string;
  ratings: Record<string, number>;
  specialPointSpend: Partial<Record<"edge" | "magic" | "resonance", number>>;
  qualities?: QualitySelection[];
}

export interface IndividualSkillAllocation {
  id: string;
  kind?: "active" | "knowledge" | "language";
  priorityPoints?: number;
  knowledgeLanguagePoints?: number;
  grantedRating?: number;
  specializations?: Array<{ name: string; paidWith: "priority" | "grant" }>;
  native?: boolean;
}

export interface SkillGroupAllocation {
  id: string;
  priorityPoints?: number;
  grantedRating?: number;
}

export interface SkillPlan {
  priorityRank: string;
  magicPriorityRank: string;
  magicPathId: string;
  aspectedSkillGroup?: string;
  individualSkills: IndividualSkillAllocation[];
  skillGroups: SkillGroupAllocation[];
  aptitudeSkillId?: string;
  qualities?: QualitySelection[];
}

export type KarmaPurchaseKind =
  | "attribute"
  | "active_skill"
  | "skill_group"
  | "knowledge_skill"
  | "language_skill"
  | "specialization"
  | "complex_form"
  | "spell"
  | "ritual"
  | "preparation"
  | "bound_spirit_service"
  | "registered_sprite_task"
  | "mystic_adept_power_point"
  | "contact_rating_point"
  | "bond_focus";

export interface KarmaPurchase {
  kind: KarmaPurchaseKind;
  targetId?: string;
  currentRating?: number;
  newRating?: number;
  quantity?: number;
  knowledgeCategory?: "academic" | "professional" | "street" | "interests";
  declaredCost?: number;
}

export interface KarmaPlan {
  playLevelId: string;
  metatypeId: string;
  magicPathId: string;
  aspectedSkillGroup?: string;
  qualities: QualitySelection[];
  karmaConvertedToNuyen: number;
  purchases: KarmaPurchase[];
  declaredCarryoverKarma: number;
}

export interface KarmaSummary {
  startingKarma: number;
  positiveQualityCost: number;
  negativeQualityBonus: number;
  availableAfterQualities: number;
  convertedToNuyen: number;
  purchaseCost: number;
  carryoverKarma: number;
  lostKarma: number;
}

export interface StartingNuyenFormula {
  dice: number;
  sides: number;
  multiplier: number;
}

export interface MagicSelectionPlan {
  magicPathId: string;
  magicPriorityRank: string;
  magicRating: number;
  resonanceRating: number;
  logic: number;
  charisma: number;
  aspectedSkillGroup?: string;
  spells?: number;
  rituals?: number;
  preparations?: number;
  complexForms?: number;
  purchasedPowerPoints?: number;
  powerPointsSpent?: number;
  boundSpirits?: Array<{ force: number; services: number }>;
  registeredSprites?: Array<{ level: number; tasks: number }>;
  bondedFocusForces?: number[];
}

export interface ResourcePurchase {
  id: string;
  kind?: "gear" | "weapon" | "augmentation" | "lifestyle";
  cost: number;
  baseCost?: number;
  availability?: number;
  deviceRating?: number;
  augmentationGrade?: string;
  augmentationType?: "cyberware" | "bioware";
  essenceCost?: number;
  attributeBonuses?: Record<string, number>;
}

export interface ResourcePlan {
  playLevelId: string;
  resourcePriorityRank: string;
  metatypeId: string;
  karmaConvertedToNuyen: number;
  carryoverNuyen: number;
  purchases: ResourcePurchase[];
  qualityIds?: string[];
}

export interface ContactPlan {
  playLevelId: string;
  naturalCharisma: number;
  contacts: Array<{ connection: number; loyalty: number }>;
  paidKarmaPoints?: number;
}

export interface DerivedStatisticInput {
  attributesNatural: Record<string, number>;
  attributesAugmented?: Record<string, number>;
  essence?: number;
  resonanceRating?: number;
  matrixDataProcessing?: number;
  overflowBoxBonus?: number;
}

export interface QualityCostSummary {
  positive: number;
  negative: number;
  netKarmaAfterQualities: number;
}

export const characterCreationRules = rulesPayload;

const priorityArray = priorityPayload.priority_array as UnknownRecord;
const playLevels = priorityPayload.play_levels as UnknownRecord;
const rawMetatypes = metatypePayload.metatypes as UnknownRecord;
const rawSkills = skillPayload.skills as UnknownRecord;
const positiveQualities = qualityPayload.positive_qualities as UnknownRecord;
const negativeQualities = qualityPayload.negative_qualities as UnknownRecord;
const matrixActions = matrixPayload.matrix_actions as UnknownRecord;
const spirits = spiritPayload.spirits as UnknownRecord;
const lifestyles = lifestylePayload.lifestyles as UnknownRecord;

export function stableCreationId(value: string): string {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const entriesById = (record: UnknownRecord): Map<string, [string, UnknownRecord]> => new Map(
  Object.entries(record).map(([name, value]) => [stableCreationId(name), [name, value as UnknownRecord]])
);
const metatypesById = entriesById(rawMetatypes);
const skillsById = entriesById(rawSkills);
const positiveQualitiesById = entriesById(positiveQualities);
const negativeQualitiesById = entriesById(negativeQualities);
const matrixActionsById = entriesById(matrixActions);
const spiritsById = entriesById(spirits);
const lifestylesById = entriesById(lifestyles);

const numberValue = (value: unknown): number => typeof value === "number" ? value : Number(value);
const recordValue = (value: unknown): UnknownRecord => value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : [];

function violation(id: string, message: string, path?: string, severity: RuleViolation["severity"] = "error"): RuleViolation {
  return { id, severity, message, ...(path ? { path } : {}) };
}

export function evaluateNumericExpression(expression: NumericExpression, context: UnknownRecord): number {
  if (typeof expression === "number") return expression;
  if (expression.op === "path") {
    const value = ruleValueAtPath(context, expression.path);
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Numeric rule path '${expression.path}' did not resolve to a finite number.`);
    return value;
  }
  const values = expression.args.map((argument) => evaluateNumericExpression(argument, context));
  switch (expression.op) {
    case "add": return values.reduce((total, value) => total + value, 0);
    case "subtract": return values.slice(1).reduce((total, value) => total - value, values[0] || 0);
    case "multiply": return values.reduce((total, value) => total * value, 1);
    case "divide": {
      if (values.slice(1).some((value) => value === 0)) throw new Error("Numeric rule attempted to divide by zero.");
      return values.slice(1).reduce((total, value) => total / value, values[0] || 0);
    }
    case "ceil": return Math.ceil(values[0]);
    case "floor": return Math.floor(values[0]);
    case "min": return Math.min(...values);
    case "max": return Math.max(...values);
  }
}

function resolveMagicPathCapabilities(magicPathId: string, aspectedSkillGroup?: string, capabilityIds: string[] = []): UnknownRecord {
  const path = recordValue((characterCreationRules.magic_paths as UnknownRecord)[magicPathId]);
  const configured = recordValue(path.capabilities);
  return Object.fromEntries(Object.entries(configured).map(([key, value]) => {
    if (value === "only_when_sorcery_is_selected") return [key, aspectedSkillGroup === "sorcery"];
    if (value === "only_with_astral_perception_power") return [key, capabilityIds.includes("astral-perception-adept-power")];
    return [key, value];
  }));
}

function magicOptionAt(rank: string, magicPathId: string): UnknownRecord | null {
  const row = recordValue(priorityArray[rank]);
  const options = recordValue(row.magic_or_resonance);
  const path = recordValue((characterCreationRules.magic_paths as UnknownRecord)[magicPathId]);
  const sourceOption = path.source_option;
  return typeof sourceOption === "string" ? recordValue(options[sourceOption]) : null;
}

export function validatePrioritySelection(input: PrioritySelection): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const configuredCategories = characterCreationRules.priority_system.categories;
  const configuredRanks = characterCreationRules.priority_system.ranks;
  if (!playLevels[input.playLevelId]) errors.push(violation("priority.play-level", `Unknown play level '${input.playLevelId}'.`, "playLevelId"));
  const assigned = configuredCategories.map((category) => input.assignments[category]);
  for (const [index, rank] of assigned.entries()) {
    if (!configuredRanks.includes(rank || "")) errors.push(violation("priority.complete", `Priority category '${configuredCategories[index]}' requires one rank from A through E.`, `assignments.${configuredCategories[index]}`));
  }
  if (assigned.filter(Boolean).length === configuredCategories.length && new Set(assigned).size !== configuredRanks.length) {
    errors.push(violation("priority.unique", "Priority ranks A through E must each be used exactly once.", "assignments"));
  }

  const metatype = metatypesById.get(input.metatypeId);
  const metatypeRank = input.assignments.metatype;
  if (!metatype) errors.push(violation("priority.metatype-known", `Unknown metatype '${input.metatypeId}'.`, "metatypeId"));
  else if (metatypeRank && !(metatype[0] in recordValue(recordValue(priorityArray[metatypeRank]).metatype))) {
    errors.push(violation("priority.metatype-available", `${metatype[0]} is not available at Priority ${metatypeRank}.`, "metatypeId"));
  }

  const path = recordValue((characterCreationRules.magic_paths as UnknownRecord)[input.magicPathId]);
  const magicRank = input.assignments.magic_or_resonance;
  if (!Object.keys(path).length) errors.push(violation("priority.magic-path-known", `Unknown Magic or Resonance path '${input.magicPathId}'.`, "magicPathId"));
  else if (magicRank) {
    if (input.magicPathId === "mundane" && magicRank !== path.required_priority) {
      errors.push(violation("priority.mundane-rank", `Mundane characters must assign Priority ${path.required_priority} to Magic or Resonance.`, "assignments.magic_or_resonance"));
    } else if (input.magicPathId !== "mundane" && !Object.keys(magicOptionAt(magicRank, input.magicPathId) || {}).length) {
      errors.push(violation("priority.magic-path-available", `${String(path.source_option)} is not available at Priority ${magicRank}.`, "magicPathId"));
    }
  }
  return errors;
}

function selectedQuality(selections: QualitySelection[] | undefined, id: string): QualitySelection | undefined {
  return selections?.find((selection) => selection.id === id);
}

export function validatePriorityAttributes(input: AttributePrioritySelection): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const metatypeEntry = metatypesById.get(input.metatypeId);
  if (!metatypeEntry) return [violation("attributes.metatype-known", `Unknown metatype '${input.metatypeId}'.`, "metatypeId")];
  const [metatypeName, metatype] = metatypeEntry;
  const limits = recordValue(metatype.attributes);
  const attributeRow = recordValue(priorityArray[input.attributePriorityRank]);
  const expectedPoints = numberValue(attributeRow.attributes);
  let pointsSpent = 0;
  let attributesAtNaturalMaximum = 0;
  const exceptional = selectedQuality(input.qualities, "exceptional-attribute")?.parameters?.attribute_id;
  const lucky = selectedQuality(input.qualities, "lucky");

  for (const attributeId of characterCreationRules.attribute_rules.physical_and_mental) {
    const rating = input.ratings[attributeId];
    const configured = recordValue(limits[attributeId]);
    const minimum = numberValue(configured.minimum);
    const maximum = numberValue(configured.maximum) + (exceptional === attributeId ? 1 : 0);
    if (!Number.isInteger(rating) || rating < minimum || rating > maximum) {
      errors.push(violation("attributes.rating-range", `${attributeId} must be an integer from ${minimum} to ${maximum}.`, `ratings.${attributeId}`));
      continue;
    }
    pointsSpent += rating - minimum;
    if (rating >= numberValue(configured.maximum)) attributesAtNaturalMaximum += 1;
  }
  if (pointsSpent !== expectedPoints) errors.push(violation("attributes.priority-points", `Priority ${input.attributePriorityRank} requires exactly ${expectedPoints} Physical and Mental Attribute points; ${pointsSpent} are represented.`, "ratings"));
  if (attributesAtNaturalMaximum > characterCreationRules.attribute_rules.maximum_physical_or_mental_attributes_at_natural_limit) {
    errors.push(violation("attributes.natural-maximum-count", "Only one Physical or Mental Attribute may be at its natural maximum during character creation.", "ratings"));
  }

  const metatypeOptions = recordValue(recordValue(priorityArray[input.metatypePriorityRank]).metatype);
  const availableSpecialPoints = numberValue(metatypeOptions[metatypeName]);
  const edgeSpend = input.specialPointSpend.edge || 0;
  const magicSpend = input.specialPointSpend.magic || 0;
  const resonanceSpend = input.specialPointSpend.resonance || 0;
  const spentSpecial = edgeSpend + magicSpend + resonanceSpend;
  if (![edgeSpend, magicSpend, resonanceSpend].every((value) => Number.isInteger(value) && value >= 0) || spentSpecial > availableSpecialPoints) {
    errors.push(violation("attributes.special-points", `Special Attribute point spending must use no more than the ${availableSpecialPoints} points granted by the metatype priority.`, "specialPointSpend"));
  }

  const edgeRange = recordValue(limits.edge);
  const edgeMaximum = numberValue(edgeRange.maximum) + (lucky ? 1 : 0);
  const expectedEdge = numberValue(edgeRange.minimum) + edgeSpend;
  if (input.ratings.edge !== expectedEdge || expectedEdge > edgeMaximum) errors.push(violation("attributes.edge", `Edge must equal its metatype minimum plus allocated Special Attribute points and may not exceed ${edgeMaximum}.`, "ratings.edge"));

  const path = recordValue((characterCreationRules.magic_paths as UnknownRecord)[input.magicPathId]);
  const usedSpecial = path.uses_special_attribute;
  const option = magicOptionAt(input.magicPriorityRank, input.magicPathId);
  for (const specialId of ["magic", "resonance"] as const) {
    const spend = input.specialPointSpend[specialId] || 0;
    const base = usedSpecial === specialId ? numberValue(option?.[specialId]) : 0;
    const expected = base + spend;
    const limit = 6 + (exceptional === specialId ? 1 : 0);
    if (specialId !== usedSpecial && spend > 0) errors.push(violation("attributes.special-target", `${specialId} cannot receive Special Attribute points for the ${input.magicPathId} path.`, `specialPointSpend.${specialId}`));
    if (input.ratings[specialId] !== expected || expected > limit) errors.push(violation(`attributes.${specialId}`, `${specialId} must equal ${expected} after its priority grant and Special Attribute allocation, with a limit of ${limit}.`, `ratings.${specialId}`));
  }
  return errors;
}

function qualityEntry(id: string): { name: string; kind: "positive" | "negative"; raw: UnknownRecord } | null {
  const positive = positiveQualitiesById.get(id);
  if (positive) return { name: positive[0], kind: "positive", raw: positive[1] };
  const negative = negativeQualitiesById.get(id);
  return negative ? { name: negative[0], kind: "negative", raw: negative[1] } : null;
}

function optionEntry(container: unknown, selected: unknown): UnknownRecord | null {
  if (typeof selected !== "string") return null;
  const entries = Object.entries(recordValue(container));
  const match = entries.find(([name]) => name === selected || stableCreationId(name) === stableCreationId(selected));
  return match ? recordValue(match[1]) : null;
}

function numericFromText(value: unknown): number | null {
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function qualityKarmaValue(selection: QualitySelection): { kind: "positive" | "negative"; amount: number } {
  const entry = qualityEntry(selection.id);
  if (!entry) throw new Error(`Unknown quality '${selection.id}'.`);
  const parameters = selection.parameters || {};
  const composites = recordValue(characterCreationRules.quality_rules.cost_resolution.composite_qualities);
  const composite = recordValue(composites[selection.id]);
  if (Object.keys(composite).length) {
    const paths = stringArray(composite.sum_option_paths);
    const amount = paths.reduce((total, path) => {
      const option = optionEntry(entry.raw[path], parameters[path]);
      const value = option?.[String(composite.value_field)];
      if (typeof value !== "number") throw new Error(`Quality '${selection.id}' requires a valid '${path}' option.`);
      return total + value;
    }, 0);
    return { kind: entry.kind, amount };
  }

  const constraint = recordValue(recordValue(characterCreationRules.quality_rules.constraints)[selection.id]);
  const optionSource = constraint.option_source;
  if (typeof optionSource === "string") {
    const optionParameter = typeof constraint.option_parameter === "string" ? constraint.option_parameter : "option";
    const option = optionEntry(entry.raw[optionSource], parameters[optionParameter]);
    if (!option) throw new Error(`Quality '${selection.id}' requires a valid '${optionParameter}' option from '${optionSource}'.`);
    const optionValue = option.karma_cost ?? option.karma_bonus;
    const amount = numericFromText(optionValue);
    if (amount != null) return { kind: entry.kind, amount };
  }

  const fieldValue = entry.kind === "positive" ? entry.raw.karma_cost : entry.raw.karma_bonus;
  const perRating = String(fieldValue ?? "").match(/(\d+)\s+per\s+(?:rating|level)/i);
  if (perRating) {
    if (!Number.isInteger(selection.rating) || (selection.rating || 0) < 1) throw new Error(`Quality '${selection.id}' requires a positive integer rating.`);
    return { kind: entry.kind, amount: Number(perRating[1]) * (selection.rating || 0) };
  }
  const fixed = numericFromText(fieldValue);
  if (fixed == null) throw new Error(`Quality '${selection.id}' has no resolvable structured Karma value.`);
  return { kind: entry.kind, amount: fixed };
}

export function qualityCostSummary(playLevelId: string, selections: QualitySelection[]): QualityCostSummary {
  const level = recordValue(playLevels[playLevelId]);
  if (!Object.keys(level).length) throw new Error(`Unknown play level '${playLevelId}'.`);
  let positive = 0;
  let negative = 0;
  for (const selection of selections) {
    const cost = qualityKarmaValue(selection);
    if (cost.kind === "positive") positive += cost.amount;
    else negative += cost.amount;
  }
  return {
    positive,
    negative,
    netKarmaAfterQualities: numberValue(level.starting_karma) + negative - positive
  };
}

function validateQualityParameterRule(rule: UnknownRecord, selection: QualitySelection, context: QualityValidationContext, selections: QualitySelection[]): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const parameters = selection.parameters || {};
  if (rule.kind === "allocation_sum_equals_rating") {
    const allocation = recordValue(parameters[String(rule.parameter)]);
    const allowedKeys = stringArray(rule.allowed_keys);
    if (Object.keys(allocation).some((key) => !allowedKeys.includes(key)) || Object.values(allocation).some((value) => !Number.isInteger(value) || Number(value) < 0) || Object.values(allocation).reduce<number>((sum, value) => sum + Number(value), 0) !== selection.rating) {
      errors.push(violation("quality.parameter-allocation", `${selection.id} allocations must use only ${allowedKeys.join(", ")} and total its rating.`, `qualities.${selection.id}.parameters.${String(rule.parameter)}`));
    }
  }
  if (rule.kind === "minimum_skill_rating") {
    const skillId = stableCreationId(String(parameters[String(rule.parameter)] || ""));
    if ((context.skillRatings?.[skillId] || 0) < numberValue(rule.minimum)) errors.push(violation("quality.minimum-skill", `${selection.id} requires ${skillId || "the selected skill"} at Rating ${String(rule.minimum)} or higher.`, `qualities.${selection.id}`));
  }
  if (rule.kind === "known_active_skill") {
    const skillId = stableCreationId(String(parameters[String(rule.parameter)] || ""));
    if (!skillsById.has(skillId) || !skillAllowedForPath(skillId, context.magicPathId, context.aspectedSkillGroup)) errors.push(violation("quality.active-skill", `${selection.id} must select an Active skill available to this character.`, `qualities.${selection.id}`));
  }
  if (rule.kind === "tested_matrix_action") {
    const actionId = stableCreationId(String(parameters[String(rule.parameter)] || ""));
    const action = matrixActionsById.get(actionId)?.[1];
    if (!action || /^none\b/i.test(String(action.test || ""))) errors.push(violation("quality.tested-matrix-action", `${selection.id} must select a Matrix action that has an associated test.`, `qualities.${selection.id}`));
  }
  if (rule.kind === "known_spirit_type") {
    const spiritId = stableCreationId(String(parameters[String(rule.parameter)] || ""));
    if (!spiritsById.has(spiritId)) errors.push(violation("quality.spirit-type", `${selection.id} must select a known spirit type.`, `qualities.${selection.id}`));
  }
  if (rule.kind === "eligible_unpurchased_skill_group") {
    const groupId = stableCreationId(String(parameters[String(rule.parameter)] || ""));
    const knownGroups = knownSkillGroups();
    const purchasedGroups = new Set((context.purchasedSkillGroupIds || []).map(stableCreationId));
    if (!knownGroups.has(groupId) || purchasedGroups.has(groupId) || !skillGroupAllowedForPath(groupId, context.magicPathId, context.aspectedSkillGroup)) errors.push(violation("quality.incompetent-group", "Incompetent must target an eligible Active skill group the character could use and has not purchased.", `qualities.${selection.id}`));
  }
  if (rule.kind === "scorched_source_prerequisite") {
    const source = parameters.source;
    const addiction = selections.find((quality) => quality.id === "addiction" && /btl/i.test(String(quality.parameters?.subject || "")));
    if (source === "btl" && (!addiction || !context.capabilityIds?.includes("btl-interface"))) errors.push(violation("quality.scorched-btl", "BTL Scorched requires at least a Mild BTL Addiction and BTL-capable gear.", `qualities.${selection.id}`));
  }
  return errors;
}

export function validateQualitySelections(selections: QualitySelection[], context: QualityValidationContext): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const constraintCatalog = recordValue(characterCreationRules.quality_rules.constraints);
  const selectedIds = selections.map((selection) => selection.id);
  const counts = new Map<string, number>();
  const repeatableSignatures = new Set<string>();
  const capabilities = resolveMagicPathCapabilities(context.magicPathId, context.aspectedSkillGroup, context.capabilityIds);

  for (const selection of selections) {
    const entry = qualityEntry(selection.id);
    if (!entry || !String(entry.raw.source || "").split(/\s*\/\s*/).includes("CRB")) {
      errors.push(violation("quality.core-catalog", `Quality '${selection.id}' is not part of the Core Rulebook creation ruleset.`, `qualities.${selection.id}`));
      continue;
    }
    counts.set(selection.id, (counts.get(selection.id) || 0) + 1);
    const constraint = recordValue(constraintCatalog[selection.id]);
    const maximum = constraint.repeatable === true ? null : typeof constraint.max_selections === "number" ? constraint.max_selections : characterCreationRules.quality_rules.default_max_selections;
    if (maximum != null && (counts.get(selection.id) || 0) > maximum) errors.push(violation("quality.maximum-selections", `${entry.name} may be selected at most ${maximum} time${maximum === 1 ? "" : "s"}.`, `qualities.${selection.id}`));

    const parameters = selection.parameters || {};
    const uniqueParameters = stringArray(constraint.unique_by_parameters);
    if (constraint.repeatable === true && uniqueParameters.length) {
      const signature = `${selection.id}:${uniqueParameters.map((parameter) => stableCreationId(String(parameters[parameter] ?? ""))).join(":")}`;
      if (repeatableSignatures.has(signature)) errors.push(violation("quality.repeatable-duplicate", `${entry.name} must use a different ${uniqueParameters.join(" / ")} for each selection.`, `qualities.${selection.id}`));
      repeatableSignatures.add(signature);
    }
    for (const parameter of stringArray(constraint.required_parameters)) if (parameters[parameter] == null || parameters[parameter] === "") errors.push(violation("quality.required-parameter", `${entry.name} requires '${parameter}'.`, `qualities.${selection.id}.parameters.${parameter}`));
    const allowedValues = recordValue(constraint.allowed_parameter_values);
    for (const [parameter, values] of Object.entries(allowedValues)) if (parameters[parameter] != null && !stringArray(values).includes(String(parameters[parameter]))) errors.push(violation("quality.parameter-value", `${entry.name} has an invalid '${parameter}' value.`, `qualities.${selection.id}.parameters.${parameter}`));

    const ratingRule = recordValue(constraint.rating);
    if (Object.keys(ratingRule).length && (!Number.isInteger(selection.rating) || (selection.rating || 0) < numberValue(ratingRule.minimum) || (selection.rating || 0) > numberValue(ratingRule.maximum))) {
      errors.push(violation("quality.rating", `${entry.name} requires a rating from ${String(ratingRule.minimum)} to ${String(ratingRule.maximum)}.`, `qualities.${selection.id}.rating`));
    }
    if (constraint.eligibility && !evaluateRule(constraint.eligibility as RuleNode, { character: { ...context, metatype_id: context.metatypeId, magic_path_id: context.magicPathId, magic_rating: context.magicRating, resonance_rating: context.resonanceRating, capabilities }, selection })) {
      errors.push(violation("quality.eligibility", `${entry.name} is not available to this character.`, `qualities.${selection.id}`));
    }
    for (const incompatible of stringArray(constraint.incompatible_quality_ids)) if (selectedIds.includes(incompatible)) errors.push(violation("quality.incompatible", `${entry.name} is incompatible with ${qualityEntry(incompatible)?.name || incompatible}.`, `qualities.${selection.id}`));
    for (const capability of stringArray(constraint.incompatible_capability_ids)) if (context.capabilityIds?.includes(capability)) errors.push(violation("quality.incompatible-capability", `${entry.name} is incompatible with ${capability}.`, `qualities.${selection.id}`));
    if (constraint.requires_gamemaster_approval && !context.approvals?.includes(`quality:${selection.id}`)) errors.push(violation("quality.gamemaster-approval", `${entry.name} requires gamemaster approval.`, `qualities.${selection.id}`, "approval"));
    for (const parameterRule of Array.isArray(constraint.parameter_rules) ? constraint.parameter_rules : []) errors.push(...validateQualityParameterRule(recordValue(parameterRule), selection, context, selections));

    try {
      qualityKarmaValue(selection);
    } catch (error) {
      errors.push(violation("quality.karma-value", error instanceof Error ? error.message : String(error), `qualities.${selection.id}`));
    }
  }

  const level = recordValue(playLevels[context.playLevelId]);
  if (!Object.keys(level).length) errors.push(violation("quality.play-level", `Unknown play level '${context.playLevelId}'.`, "playLevelId"));
  else {
    try {
      const summary = qualityCostSummary(context.playLevelId, selections);
      const positiveCap = numberValue(level.starting_karma);
      const negativeCap = numberValue(level.maximum_karma) - numberValue(level.starting_karma);
      if (summary.positive > positiveCap) errors.push(violation("quality.positive-cap", `Positive Qualities cost ${summary.positive} Karma; the ${context.playLevelId} cap is ${positiveCap}.`, "qualities"));
      if (summary.negative > negativeCap) errors.push(violation("quality.negative-cap", `Negative Qualities grant ${summary.negative} Karma; the ${context.playLevelId} cap is ${negativeCap}.`, "qualities"));
    } catch {
      // Individual cost failures are already reported above.
    }
  }
  return errors;
}

function knownSkillGroups(): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const [skillName, raw] of Object.entries(rawSkills)) {
    const group = stableCreationId(String(recordValue(raw).skillgroup || ""));
    if (!group) continue;
    groups.set(group, [...(groups.get(group) || []), stableCreationId(skillName)]);
  }
  return groups;
}

function skillAllowedForPath(skillId: string, magicPathId: string, aspectedSkillGroup?: string): boolean {
  const skill = skillsById.get(skillId)?.[1];
  if (!skill) return false;
  const attribute = String(skill.attribute || "");
  const group = stableCreationId(String(skill.skillgroup || ""));
  if (attribute === "resonance") return magicPathId === "technomancer";
  if (attribute !== "magic") return true;
  if (["magician", "mystic-adept"].includes(magicPathId)) return true;
  if (magicPathId === "aspected-magician") return group === aspectedSkillGroup;
  return false;
}

function skillGroupAllowedForPath(groupId: string, magicPathId: string, aspectedSkillGroup?: string): boolean {
  const normalizedGroup = stableCreationId(groupId);
  if (characterCreationRules.skill_rules.resonance_skill_groups.includes(normalizedGroup)) return magicPathId === "technomancer";
  if (!characterCreationRules.skill_rules.magic_skill_groups.includes(normalizedGroup)) return true;
  if (["magician", "mystic-adept"].includes(magicPathId)) return true;
  return magicPathId === "aspected-magician" && normalizedGroup === stableCreationId(aspectedSkillGroup || "");
}

export function skillAllocationRating(allocation: IndividualSkillAllocation): number | null {
  if (allocation.native) return null;
  return (allocation.grantedRating || 0) + (allocation.priorityPoints || 0) + (allocation.knowledgeLanguagePoints || 0);
}

export function skillRatingsFromPlan(plan: SkillPlan): Record<string, number> {
  return Object.fromEntries(plan.individualSkills.flatMap((allocation) => {
    const rating = skillAllocationRating(allocation);
    return rating == null ? [] : [[stableCreationId(allocation.id), rating]];
  }));
}

export function validateSkillPlan(plan: SkillPlan): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const row = recordValue(priorityArray[plan.priorityRank]);
  const budget = recordValue(row.skills);
  if (!Object.keys(budget).length) return [violation("skills.priority-rank", `Unknown Skills priority '${plan.priorityRank}'.`, "priorityRank")];
  const magicPath = recordValue((characterCreationRules.magic_paths as UnknownRecord)[plan.magicPathId]);
  if (!Object.keys(magicPath).length) return [violation("skills.magic-path", `Unknown Magic or Resonance path '${plan.magicPathId}'.`, "magicPathId")];
  if (plan.magicPathId === "mundane" ? plan.magicPriorityRank !== magicPath.required_priority : !Object.keys(magicOptionAt(plan.magicPriorityRank, plan.magicPathId) || {}).length) errors.push(violation("skills.magic-priority", `${plan.magicPathId} is not available at Magic or Resonance Priority ${plan.magicPriorityRank}.`, "magicPriorityRank"));

  const individualIds = new Set<string>();
  const groupIds = new Set<string>();
  const groups = knownSkillGroups();
  const aptitudeFromQuality = stableCreationId(String(plan.qualities?.find((quality) => quality.id === "aptitude")?.parameters?.skill_id || ""));
  const aptitudeSkillId = aptitudeFromQuality;
  if (plan.aptitudeSkillId && !aptitudeFromQuality) errors.push(violation("skills.aptitude-quality", "A Rating 7 skill requires the Aptitude quality and its selected skill parameter.", "aptitudeSkillId"));
  if (aptitudeFromQuality && plan.aptitudeSkillId && aptitudeFromQuality !== stableCreationId(plan.aptitudeSkillId)) errors.push(violation("skills.aptitude-target", "The Aptitude quality and skill plan must identify the same skill.", "aptitudeSkillId"));

  let priorityPoints = 0;
  let knowledgePoints = 0;
  let nativeLanguages = 0;
  const grantedIndividuals: Array<{ allocation: IndividualSkillAllocation; skill?: UnknownRecord }> = [];

  for (const allocation of plan.individualSkills) {
    const skillId = stableCreationId(allocation.id);
    const skill = skillsById.get(skillId)?.[1];
    const kind = allocation.kind || (skill ? "active" : undefined);
    if (individualIds.has(skillId)) errors.push(violation("skills.duplicate", `Skill '${allocation.id}' is allocated more than once.`, `skills.${skillId}`));
    individualIds.add(skillId);
    if (!kind) errors.push(violation("skills.kind", `Custom Knowledge and Language skills must declare their kind.`, `skills.${skillId}.kind`));
    if (kind === "active" && !skill) errors.push(violation("skills.known", `Unknown Active skill '${allocation.id}'.`, `skills.${skillId}`));
    if (kind !== "active" && skill) errors.push(violation("skills.kind", `${allocation.id} is an Active skill and cannot be allocated as ${kind}.`, `skills.${skillId}.kind`));
    if (skill && !skillAllowedForPath(skillId, plan.magicPathId, plan.aspectedSkillGroup)) errors.push(violation("skills.restricted", `${allocation.id} is not available to the ${plan.magicPathId} path.`, `skills.${skillId}`));

    const numericFields = [allocation.priorityPoints || 0, allocation.knowledgeLanguagePoints || 0, allocation.grantedRating || 0];
    if (numericFields.some((value) => !Number.isInteger(value) || value < 0)) errors.push(violation("skills.point-shape", `${allocation.id} point and grant values must be non-negative integers.`, `skills.${skillId}`));
    if (kind === "active" && (allocation.knowledgeLanguagePoints || 0) > 0) errors.push(violation("skills.knowledge-points-active", "Free Knowledge and Language points cannot purchase Active skills.", `skills.${skillId}.knowledgeLanguagePoints`));
    if (allocation.native && kind !== "language") errors.push(violation("skills.native-kind", "Only a Language skill may be selected as native.", `skills.${skillId}.native`));
    if (allocation.native && ((allocation.priorityPoints || 0) > 0 || (allocation.knowledgeLanguagePoints || 0) > 0 || (allocation.grantedRating || 0) > 0)) errors.push(violation("skills.native-points", "A native language does not receive a numeric rating or consume skill points.", `skills.${skillId}`));

    const rating = skillAllocationRating(allocation);
    const maximum = aptitudeSkillId === skillId ? characterCreationRules.skill_rules.maximum_rating_with_aptitude : kind === "active" ? characterCreationRules.skill_rules.maximum_rating_at_creation : characterCreationRules.skill_rules.maximum_knowledge_or_language_rating;
    if (rating != null && (!Number.isInteger(rating) || rating < 1 || rating > maximum)) errors.push(violation("skills.rating", `${allocation.id} must have a rating from 1 to ${maximum}.`, `skills.${skillId}`));
    if ((allocation.grantedRating || 0) > 0) grantedIndividuals.push({ allocation, skill });
    priorityPoints += allocation.priorityPoints || 0;
    knowledgePoints += allocation.knowledgeLanguagePoints || 0;
    if (allocation.native) nativeLanguages += 1;

    const specializations = allocation.specializations || [];
    if (specializations.some((specialization) => specialization.paidWith !== "priority")) errors.push(violation("skills.specialization-payment", "Core priority creation does not grant free specializations.", `skills.${skillId}.specializations`));
    if (allocation.native && specializations.length) errors.push(violation("skills.native-specialization", "A native language cannot purchase a specialization during creation.", `skills.${skillId}.specializations`));
    if (specializations.length > characterCreationRules.skill_rules.maximum_specializations_per_skill_during_priority_step) errors.push(violation("skills.specialization-count", `${allocation.id} may have at most one specialization during the priority step.`, `skills.${skillId}.specializations`));
    priorityPoints += specializations.filter((specialization) => specialization.paidWith === "priority").length * characterCreationRules.skill_rules.specialization_priority_point_cost;
  }

  let groupPoints = 0;
  const grantedGroups: SkillGroupAllocation[] = [];
  for (const allocation of plan.skillGroups) {
    const groupId = stableCreationId(allocation.id);
    if (!groups.has(groupId)) errors.push(violation("skills.group-known", `Unknown skill group '${allocation.id}'.`, `skillGroups.${groupId}`));
    if (!skillGroupAllowedForPath(groupId, plan.magicPathId, plan.aspectedSkillGroup)) errors.push(violation("skills.group-restricted", `${allocation.id} is not available to the ${plan.magicPathId} path.`, `skillGroups.${groupId}`));
    if (groupIds.has(groupId)) errors.push(violation("skills.group-duplicate", `Skill group '${allocation.id}' is allocated more than once.`, `skillGroups.${groupId}`));
    groupIds.add(groupId);
    const pointValues = [allocation.priorityPoints || 0, allocation.grantedRating || 0];
    if (pointValues.some((value) => !Number.isInteger(value) || value < 0)) errors.push(violation("skills.group-point-shape", `${allocation.id} point and grant values must be non-negative integers.`, `skillGroups.${groupId}`));
    const rating = (allocation.priorityPoints || 0) + (allocation.grantedRating || 0);
    if (!Number.isInteger(rating) || rating < 1 || rating > characterCreationRules.skill_rules.maximum_rating_at_creation) errors.push(violation("skills.group-rating", `${allocation.id} must have a rating from 1 to ${characterCreationRules.skill_rules.maximum_rating_at_creation}.`, `skillGroups.${groupId}`));
    groupPoints += allocation.priorityPoints || 0;
    if ((allocation.grantedRating || 0) > 0) grantedGroups.push(allocation);
    for (const skillId of groups.get(groupId) || []) if (individualIds.has(skillId)) errors.push(violation("skills.group-overlap", `${skillId} cannot be purchased individually while ${allocation.id} remains an intact group in Step Five.`, `skills.${skillId}`));
  }

  const option = magicOptionAt(plan.magicPriorityRank, plan.magicPathId) || {};
  const individualGrantKind = option.magical_skills ? "magic" : option.resonance_skills ? "resonance" : option.active_skill ? "active" : null;
  const individualGrant = recordValue(option.magical_skills || option.resonance_skills || option.active_skill);
  const expectedIndividualCount = numberValue(individualGrant.count || 0);
  const expectedIndividualRating = numberValue(individualGrant.rating || 0);
  if (grantedIndividuals.length !== expectedIndividualCount) errors.push(violation("skills.priority-grants", `The Magic or Resonance priority grants ${expectedIndividualCount} individual skill selection(s); ${grantedIndividuals.length} are marked as grants.`, "individualSkills"));
  for (const { allocation, skill } of grantedIndividuals) {
    if ((allocation.grantedRating || 0) !== expectedIndividualRating) errors.push(violation("skills.priority-grant-rating", `Granted skills from this priority must begin at Rating ${expectedIndividualRating}.`, `skills.${stableCreationId(allocation.id)}.grantedRating`));
    if (individualGrantKind === "magic" && skill?.attribute !== "magic") errors.push(violation("skills.priority-grant-kind", "This priority grant must select a Magic-linked skill.", `skills.${stableCreationId(allocation.id)}`));
    if (individualGrantKind === "resonance" && skill?.attribute !== "resonance") errors.push(violation("skills.priority-grant-kind", "This priority grant must select a Resonance-linked skill.", `skills.${stableCreationId(allocation.id)}`));
    if (individualGrantKind === "active" && !skill) errors.push(violation("skills.priority-grant-kind", "This priority grant must select an Active skill.", `skills.${stableCreationId(allocation.id)}`));
  }

  const groupGrant = recordValue(option.magical_skill_group);
  const expectedGroupCount = numberValue(groupGrant.count || 0);
  const expectedGroupRating = numberValue(groupGrant.rating || 0);
  if (grantedGroups.length !== expectedGroupCount) errors.push(violation("skills.priority-group-grant", `The Magic priority grants ${expectedGroupCount} magical skill group selection(s); ${grantedGroups.length} are marked as grants.`, "skillGroups"));
  for (const allocation of grantedGroups) {
    if ((allocation.grantedRating || 0) !== expectedGroupRating) errors.push(violation("skills.priority-group-rating", `The granted magical skill group must begin at Rating ${expectedGroupRating}.`, `skillGroups.${stableCreationId(allocation.id)}.grantedRating`));
    if (plan.magicPathId === "aspected-magician" && stableCreationId(allocation.id) !== stableCreationId(plan.aspectedSkillGroup || "")) errors.push(violation("skills.aspected-group-grant", "The granted group must be the aspected magician's selected group.", `skillGroups.${stableCreationId(allocation.id)}`));
  }

  if (priorityPoints !== numberValue(budget.skill_points)) errors.push(violation("skills.priority-budget", `Priority ${plan.priorityRank} grants ${String(budget.skill_points)} individual skill points; ${priorityPoints} are allocated.`, "individualSkills"));
  if (groupPoints !== numberValue(budget.skill_group_points)) errors.push(violation("skills.group-budget", `Priority ${plan.priorityRank} grants ${String(budget.skill_group_points)} skill group points; ${groupPoints} are allocated.`, "skillGroups"));
  if (knowledgePoints < 0 || !Number.isInteger(knowledgePoints)) errors.push(violation("skills.knowledge-budget-shape", "Knowledge and Language point allocation must be a non-negative integer.", "individualSkills"));
  const bilingual = plan.qualities?.some((quality) => quality.id === "bilingual");
  const expectedNative = characterCreationRules.skill_rules.free_native_languages + (bilingual ? 1 : 0);
  if (nativeLanguages !== expectedNative) errors.push(violation("skills.native-languages", `This character must select exactly ${expectedNative} native language${expectedNative === 1 ? "" : "s"}.`, "individualSkills"));
  if (plan.qualities?.some((quality) => quality.id === "uncouth") && [...groupIds].some((group) => characterCreationRules.skill_rules.social_skill_groups.includes(group))) errors.push(violation("skills.uncouth-groups", "Uncouth characters may not purchase Social skill groups.", "skillGroups"));
  return errors;
}

export function validateKnowledgeLanguageBudget(plan: SkillPlan, naturalIntuition: number, naturalLogic: number): RuleViolation[] {
  const spent = plan.individualSkills.reduce((total, allocation) => total + (allocation.knowledgeLanguagePoints || 0), 0);
  const expected = evaluateNumericExpression(characterCreationRules.skill_rules.free_knowledge_and_language_points as NumericExpression, { character: { attributes_natural: { intuition: naturalIntuition, logic: naturalLogic } } });
  return spent === expected ? [] : [violation("skills.knowledge-budget", `Natural Intuition ${naturalIntuition} and Logic ${naturalLogic} grant ${expected} Knowledge and Language points; ${spent} are allocated.`, "individualSkills")];
}

function allowedFormulaCategories(path: UnknownRecord, aspectedSkillGroup?: string): string[] {
  if (path.allowed_formula_categories_by_selected_group) return stringArray(recordValue(path.allowed_formula_categories_by_selected_group)[stableCreationId(aspectedSkillGroup || "")]);
  return stringArray(path.allowed_formula_categories);
}

export function validateMagicSelection(plan: MagicSelectionPlan): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const path = recordValue((characterCreationRules.magic_paths as UnknownRecord)[plan.magicPathId]);
  if (!Object.keys(path).length) return [violation("magic.path-known", `Unknown Magic or Resonance path '${plan.magicPathId}'.`, "magicPathId")];
  const selectedGroup = stableCreationId(plan.aspectedSkillGroup || "");
  if (plan.magicPathId === "aspected-magician" && !characterCreationRules.skill_rules.magic_skill_groups.includes(selectedGroup)) errors.push(violation("magic.aspected-group", "An aspected magician must select exactly one of Sorcery, Conjuring or Enchanting.", "aspectedSkillGroup"));
  if (![plan.magicRating, plan.resonanceRating].every((value) => Number.isInteger(value) && value >= 0) || ![plan.logic, plan.charisma].every((value) => Number.isInteger(value) && value >= 1)) errors.push(violation("magic.rating-shape", "Magic and Resonance must be non-negative integers; natural Logic and Charisma must be positive integers.", "magic"));
  if (path.uses_special_attribute !== "magic" && plan.magicRating !== 0) errors.push(violation("magic.unused-magic", `The ${plan.magicPathId} path must have Magic 0.`, "magicRating"));
  if (path.uses_special_attribute !== "resonance" && plan.resonanceRating !== 0) errors.push(violation("magic.unused-resonance", `The ${plan.magicPathId} path must have Resonance 0.`, "resonanceRating"));

  const option = magicOptionAt(plan.magicPriorityRank, plan.magicPathId);
  if (plan.magicPathId === "mundane") {
    if (plan.magicPriorityRank !== path.required_priority) errors.push(violation("magic.mundane-priority", `Mundane characters must use Magic or Resonance Priority ${String(path.required_priority)}.`, "magicPriorityRank"));
  } else if (!option || !Object.keys(option).length) errors.push(violation("magic.priority-option", `${String(path.source_option)} is not available at Priority ${plan.magicPriorityRank}.`, "magicPriorityRank"));

  const formulaFields = ["spells", "rituals", "preparations", "complexForms"] as const;
  for (const field of formulaFields) if (!Number.isInteger(plan[field] || 0) || (plan[field] || 0) < 0) errors.push(violation("magic.formula-shape", `${field} must be a non-negative integer.`, field));
  const allowed = new Set(allowedFormulaCategories(path, selectedGroup).map((category) => category === "complex_forms" ? "complexForms" : category));
  for (const field of formulaFields) if ((plan[field] || 0) > 0 && !allowed.has(field)) errors.push(violation("magic.formula-category", `${field} are not available to the ${plan.magicPathId}${selectedGroup ? ` (${selectedGroup})` : ""} path.`, field));

  const freeSpells = numberValue(option?.spells || 0);
  const freeComplexForms = numberValue(option?.complex_forms || 0);
  if ((plan.spells || 0) < freeSpells) errors.push(violation("magic.free-spells", `Priority ${plan.magicPriorityRank} grants ${freeSpells} spells, so the final spell count cannot be lower.`, "spells"));
  if ((plan.complexForms || 0) < freeComplexForms) errors.push(violation("magic.free-complex-forms", `Priority ${plan.magicPriorityRank} grants ${freeComplexForms} complex forms, so the final count cannot be lower.`, "complexForms"));

  const formulaLimit = path.formula_limit_per_category ? evaluateNumericExpression(path.formula_limit_per_category as NumericExpression, { character: { magic_rating: plan.magicRating } }) : null;
  if (formulaLimit != null) for (const field of ["spells", "rituals", "preparations"] as const) if (allowed.has(field) && (plan[field] || 0) > formulaLimit) errors.push(violation("magic.formula-limit", `${field} may not exceed ${formulaLimit} at character creation.`, field));
  if (plan.magicPathId === "technomancer" && (plan.complexForms || 0) > plan.logic) errors.push(violation("magic.complex-form-limit", `Complex forms may not exceed natural Logic ${plan.logic}.`, "complexForms"));
  if (plan.magicPathId === "mystic-adept") {
    const purchasedPowerPoints = plan.purchasedPowerPoints || 0;
    if (!Number.isInteger(purchasedPowerPoints) || purchasedPowerPoints < 0 || purchasedPowerPoints > plan.magicRating) errors.push(violation("magic.mystic-power-points", `Mystic Adepts may purchase whole Power Points up to Magic ${plan.magicRating}.`, "purchasedPowerPoints"));
  } else if ((plan.purchasedPowerPoints || 0) !== 0) errors.push(violation("magic.purchased-power-points", "Only Mystic Adepts purchase Power Points with Karma at character creation.", "purchasedPowerPoints"));

  const mayBindSpirits = path.may_bind_spirits === true || path.may_bind_spirits_when_selected_group === selectedGroup;
  const mayRegisterSprites = path.may_register_sprites === true;
  if (!mayBindSpirits && (plan.boundSpirits?.length || 0) > 0) errors.push(violation("magic.bound-spirit-path", `The ${plan.magicPathId} path cannot begin with bound spirits.`, "boundSpirits"));
  if ((plan.boundSpirits?.length || 0) > plan.charisma) errors.push(violation("magic.bound-spirit-count", `Bound spirits may not exceed natural Charisma ${plan.charisma}.`, "boundSpirits"));
  for (const [index, spirit] of (plan.boundSpirits || []).entries()) {
    if (spirit.force !== plan.magicRating) errors.push(violation("magic.bound-spirit-force", `A bound spirit acquired at creation has Force equal to Magic ${plan.magicRating}.`, `boundSpirits.${index}.force`));
    if (!Number.isInteger(spirit.services) || spirit.services < 1) errors.push(violation("magic.bound-spirit-services", "Bound spirit services must be a positive integer.", `boundSpirits.${index}.services`));
  }
  if (!mayRegisterSprites && (plan.registeredSprites?.length || 0) > 0) errors.push(violation("magic.registered-sprite-path", `The ${plan.magicPathId} path cannot begin with registered sprites.`, "registeredSprites"));
  if ((plan.registeredSprites?.length || 0) > plan.charisma) errors.push(violation("magic.registered-sprite-count", `Registered sprites may not exceed natural Charisma ${plan.charisma}.`, "registeredSprites"));
  for (const [index, sprite] of (plan.registeredSprites || []).entries()) {
    if (sprite.level !== plan.resonanceRating) errors.push(violation("magic.registered-sprite-level", `A registered sprite acquired at creation has Level equal to Resonance ${plan.resonanceRating}.`, `registeredSprites.${index}.level`));
    if (!Number.isInteger(sprite.tasks) || sprite.tasks < 1) errors.push(violation("magic.registered-sprite-tasks", "Registered sprite tasks must be a positive integer.", `registeredSprites.${index}.tasks`));
  }
  const fociForce = (plan.bondedFocusForces || []).reduce((total, force) => total + force, 0);
  if ((plan.bondedFocusForces || []).some((force) => !Number.isInteger(force) || force < 1)) errors.push(violation("magic.bonded-foci-shape", "Every bonded focus must have a positive integer Force.", "bondedFocusForces"));
  if (plan.magicRating <= 0 && fociForce > 0) errors.push(violation("magic.bonded-foci-path", "A character without a Magic rating cannot bond foci.", "bondedFocusForces"));
  if (fociForce > plan.magicRating * 2) errors.push(violation("magic.bonded-foci-force", `Total bonded focus Force may not exceed twice Magic (${plan.magicRating * 2}).`, "bondedFocusForces"));
  errors.push(...validatePowerPointAllocation(plan));
  return errors;
}

export function magicKarmaCost(plan: MagicSelectionPlan): number {
  const option = magicOptionAt(plan.magicPriorityRank, plan.magicPathId) || {};
  const spellCost = characterCreationRules.karma_purchase_rules.spell_ritual_or_preparation.cost;
  const complexFormCost = characterCreationRules.karma_purchase_rules.complex_form.cost;
  const formulaCost = Math.max(0, (plan.spells || 0) - numberValue(option.spells || 0)) * spellCost
    + (plan.rituals || 0) * spellCost
    + (plan.preparations || 0) * spellCost
    + Math.max(0, (plan.complexForms || 0) - numberValue(option.complex_forms || 0)) * complexFormCost;
  const powerPointCost = plan.magicPathId === "mystic-adept" ? (plan.purchasedPowerPoints || 0) * characterCreationRules.magic_paths["mystic-adept"].purchased_power_point_cost : 0;
  const spiritCost = (plan.boundSpirits || []).reduce((total, spirit) => total + spirit.services, 0);
  const spriteCost = (plan.registeredSprites || []).reduce((total, sprite) => total + sprite.tasks, 0);
  return formulaCost + powerPointCost + spiritCost + spriteCost;
}

export function availablePowerPoints(plan: MagicSelectionPlan): number {
  if (plan.magicPathId === "adept") return plan.magicRating;
  if (plan.magicPathId === "mystic-adept") return plan.purchasedPowerPoints || 0;
  return 0;
}

export function validatePowerPointAllocation(plan: MagicSelectionPlan, spentPowerPoints = plan.powerPointsSpent || 0): RuleViolation[] {
  const available = availablePowerPoints(plan);
  if (!Number.isFinite(spentPowerPoints) || spentPowerPoints < 0 || Math.abs(spentPowerPoints * 4 - Math.round(spentPowerPoints * 4)) > 0.000001) return [violation("magic.power-point-increment", "Adept-power costs must be allocated in quarter-point increments.", "powerPointsSpent")];
  if (spentPowerPoints > available) return [violation("magic.power-point-budget", `Adept powers cost ${spentPowerPoints} Power Points but only ${available} are available.`, "powerPointsSpent")];
  return [];
}

export function parseNuyen(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(parsed)) throw new Error(`Could not parse nuyen value '${String(value)}'.`);
  return parsed;
}

export function lifestyleStartingNuyenFormula(lifestyleId: string): StartingNuyenFormula {
  const lifestyle = lifestylesById.get(stableCreationId(lifestyleId))?.[1];
  if (!lifestyle) throw new Error(`Unknown lifestyle '${lifestyleId}'.`);
  const authored = String(lifestyle.starting_nuyen || "");
  const match = authored.replace(/,/g, "").match(/^(\d+)D(\d+)\s*[×x*]\s*(\d+)/i);
  if (!match) throw new Error(`Lifestyle '${lifestyleId}' does not define a rollable starting-nuyen formula.`);
  return { dice: Number(match[1]), sides: Number(match[2]), multiplier: Number(match[3]) };
}

export function calculateStartingNuyen(lifestyleId: string, dieResults: number[], carryoverNuyen: number): number {
  const formula = lifestyleStartingNuyenFormula(lifestyleId);
  if (dieResults.length !== formula.dice || dieResults.some((result) => !Number.isInteger(result) || result < 1 || result > formula.sides)) throw new Error(`${lifestyleId} starting nuyen requires exactly ${formula.dice} D${formula.sides} result${formula.dice === 1 ? "" : "s"}.`);
  if (!Number.isFinite(carryoverNuyen) || carryoverNuyen < 0 || carryoverNuyen > characterCreationRules.resource_rules.maximum_unspent_nuyen_carryover) throw new Error(`Starting-nuyen carryover must be from 0 to ${characterCreationRules.resource_rules.maximum_unspent_nuyen_carryover}.`);
  return dieResults.reduce((total, result) => total + result, 0) * formula.multiplier + carryoverNuyen;
}

export function validateResourcePlan(plan: ResourcePlan): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const level = recordValue(playLevels[plan.playLevelId]);
  const row = recordValue(priorityArray[plan.resourcePriorityRank]);
  if (!Object.keys(level).length || !Object.keys(row).length) return [violation("resources.configuration", "Resource plan uses an unknown play level or priority rank.")];
  const baseBudget = parseNuyen(recordValue(row.resources)[plan.playLevelId]);
  const maximumKarmaConversion = numberValue(level.maximum_karma_to_nuyen);
  if (!Number.isInteger(plan.karmaConvertedToNuyen) || plan.karmaConvertedToNuyen < 0 || plan.karmaConvertedToNuyen > maximumKarmaConversion) errors.push(violation("resources.karma-conversion", `No more than ${maximumKarmaConversion} Karma may be converted to nuyen for ${plan.playLevelId}.`, "karmaConvertedToNuyen"));
  if (!Number.isFinite(plan.carryoverNuyen) || plan.carryoverNuyen < 0 || plan.carryoverNuyen > characterCreationRules.resource_rules.maximum_unspent_nuyen_carryover) errors.push(violation("resources.carryover", `No more than ${characterCreationRules.resource_rules.maximum_unspent_nuyen_carryover} nuyen may carry into play.`, "carryoverNuyen"));

  const hasSensitiveSystem = plan.qualityIds?.includes("sensitive-system");
  const attributeBonuses: Record<string, number> = {};
  let totalCost = 0;
  let essenceLoss = 0;
  const availabilityLimit = numberValue(level.maximum_availability);
  const deviceLimit = numberValue(level.maximum_device_rating);
  const allowedGrades = characterCreationRules.resource_rules.allowed_augmentation_grades;
  const configuredLifestyleMultiplier = recordValue(characterCreationRules.resource_rules.lifestyle_cost_multipliers)[plan.metatypeId];
  if (configuredLifestyleMultiplier == null) errors.push(violation("resources.metatype", `Unknown core metatype '${plan.metatypeId}'.`, "metatypeId"));
  const lifestyleMultiplier = numberValue(configuredLifestyleMultiplier ?? 1);

  for (const [index, purchase] of plan.purchases.entries()) {
    if (!Number.isFinite(purchase.cost) || purchase.cost < 0) errors.push(violation("resources.cost", `${purchase.id} must have a non-negative numeric cost.`, `purchases.${index}.cost`));
    if (purchase.baseCost != null && (!Number.isFinite(purchase.baseCost) || purchase.baseCost < 0)) errors.push(violation("resources.base-cost", `${purchase.id} must have a non-negative numeric base cost.`, `purchases.${index}.baseCost`));
    if (purchase.availability != null && (!Number.isInteger(purchase.availability) || purchase.availability < 0)) errors.push(violation("resources.availability-shape", `${purchase.id} Availability must be a non-negative integer.`, `purchases.${index}.availability`));
    if (purchase.deviceRating != null && (!Number.isInteger(purchase.deviceRating) || purchase.deviceRating < 0)) errors.push(violation("resources.device-rating-shape", `${purchase.id} Device Rating must be a non-negative integer.`, `purchases.${index}.deviceRating`));
    if (purchase.essenceCost != null && (!Number.isFinite(purchase.essenceCost) || purchase.essenceCost < 0)) errors.push(violation("resources.essence-cost", `${purchase.id} Essence cost must be a non-negative number.`, `purchases.${index}.essenceCost`));
    totalCost += purchase.cost;
    if (purchase.availability != null && purchase.availability > availabilityLimit) errors.push(violation("resources.availability", `${purchase.id} has Availability ${purchase.availability}; the ${plan.playLevelId} limit is ${availabilityLimit}.`, `purchases.${index}.availability`));
    if (purchase.deviceRating != null && purchase.deviceRating > deviceLimit) errors.push(violation("resources.device-rating", `${purchase.id} has Device Rating ${purchase.deviceRating}; the ${plan.playLevelId} limit is ${deviceLimit}.`, `purchases.${index}.deviceRating`));
    if (purchase.augmentationGrade && !allowedGrades.includes(purchase.augmentationGrade)) errors.push(violation("resources.augmentation-grade", `${purchase.augmentationGrade} augmentations are unavailable at character creation.`, `purchases.${index}.augmentationGrade`));
    if (hasSensitiveSystem && purchase.augmentationType === "bioware") errors.push(violation("resources.sensitive-system-bioware", "Sensitive System forbids bioware.", `purchases.${index}`));
    const essenceMultiplier = hasSensitiveSystem && purchase.augmentationType === "cyberware" ? 2 : 1;
    essenceLoss += (purchase.essenceCost || 0) * essenceMultiplier;
    for (const [attribute, bonus] of Object.entries(purchase.attributeBonuses || {})) {
      if (!Number.isFinite(bonus) || bonus < 0) errors.push(violation("resources.augmentation-bonus-shape", `${purchase.id} has an invalid ${attribute} augmentation bonus.`, `purchases.${index}.attributeBonuses.${attribute}`));
      else attributeBonuses[attribute] = (attributeBonuses[attribute] || 0) + bonus;
    }
    if (purchase.kind === "lifestyle" && purchase.baseCost != null && Math.abs(purchase.cost - purchase.baseCost * lifestyleMultiplier) > 0.001) errors.push(violation("resources.lifestyle-multiplier", `${plan.metatypeId} lifestyle purchases use a ${lifestyleMultiplier} cost multiplier.`, `purchases.${index}.cost`));
  }
  for (const [attribute, bonus] of Object.entries(attributeBonuses)) if (bonus > characterCreationRules.resource_rules.maximum_augmentation_bonus_per_attribute) errors.push(violation("resources.augmentation-cap", `${attribute} receives a +${bonus} augmentation bonus; the character-creation cap is +${characterCreationRules.resource_rules.maximum_augmentation_bonus_per_attribute}.`, "purchases"));
  if (characterCreationRules.resource_rules.starting_essence - essenceLoss <= 0) errors.push(violation("resources.essence", "Augmentations must leave the character with positive Essence.", "purchases"));

  const available = baseBudget + plan.karmaConvertedToNuyen * characterCreationRules.resource_rules.karma_to_nuyen_rate;
  if (totalCost + plan.carryoverNuyen > available) errors.push(violation("resources.budget", `Purchases plus carryover total ${totalCost + plan.carryoverNuyen} nuyen, exceeding the ${available} nuyen budget.`, "purchases"));
  if (totalCost + plan.carryoverNuyen < available) errors.push(violation("resources.unallocated", `${available - totalCost - plan.carryoverNuyen} nuyen is neither spent nor carried over and will be lost.`, "purchases", "warning"));
  return errors;
}

export function essenceAfterResources(plan: ResourcePlan): number {
  const hasSensitiveSystem = plan.qualityIds?.includes("sensitive-system");
  const loss = plan.purchases.reduce((total, purchase) => total + (purchase.essenceCost || 0) * (hasSensitiveSystem && purchase.augmentationType === "cyberware" ? 2 : 1), 0);
  return characterCreationRules.resource_rules.starting_essence - loss;
}

export function specialAttributeAfterEssenceLoss(ratingBeforeEssenceLoss: number, essence: number): number {
  const loss = Math.max(0, characterCreationRules.resource_rules.starting_essence - essence);
  return Math.max(0, ratingBeforeEssenceLoss - Math.ceil(loss) * characterCreationRules.resource_rules.magic_or_resonance_loss_per_started_essence_point);
}

export function validateContacts(plan: ContactPlan): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const multiplier = numberValue(recordValue(characterCreationRules.contact_rules.contact_karma_multipliers)[plan.playLevelId]);
  if (!multiplier) return [violation("contacts.play-level", `Unknown contact multiplier for '${plan.playLevelId}'.`, "playLevelId")];
  if (!Number.isInteger(plan.naturalCharisma) || plan.naturalCharisma < 1) errors.push(violation("contacts.charisma", "Natural Charisma must be a positive integer.", "naturalCharisma"));
  const budget = plan.naturalCharisma * multiplier;
  const paidKarmaPoints = plan.paidKarmaPoints || 0;
  if (!Number.isInteger(paidKarmaPoints) || paidKarmaPoints < 0) errors.push(violation("contacts.paid-karma-shape", "Paid contact rating points must be a non-negative integer.", "paidKarmaPoints"));
  let spent = 0;
  for (const [index, contact] of plan.contacts.entries()) {
    if (!Number.isInteger(contact.connection) || contact.connection < characterCreationRules.contact_rules.minimum_connection || !Number.isInteger(contact.loyalty) || contact.loyalty < characterCreationRules.contact_rules.minimum_loyalty) errors.push(violation("contacts.minimum-ratings", "Every contact needs Connection and Loyalty of at least 1.", `contacts.${index}`));
    const cost = contact.connection + contact.loyalty;
    spent += cost;
    if (cost > characterCreationRules.contact_rules.maximum_karma_per_contact) errors.push(violation("contacts.per-contact-cap", `No more than ${characterCreationRules.contact_rules.maximum_karma_per_contact} Karma may be spent on one contact at character creation.`, `contacts.${index}`));
  }
  if (paidKarmaPoints > spent) errors.push(violation("contacts.paid-karma-allocation", `${paidKarmaPoints} paid contact points are declared, but the contacts only contain ${spent} total rating points.`, "paidKarmaPoints"));
  const freeSpent = Math.max(0, spent - paidKarmaPoints);
  if (freeSpent > budget) errors.push(violation("contacts.budget", `Contacts use ${freeSpent} free rating points after paid Karma; natural Charisma ${plan.naturalCharisma} grants ${budget}.`, "contacts"));
  if (freeSpent < budget) errors.push(violation("contacts.unspent", `${budget - freeSpent} free contact Karma remains and will be lost.`, "contacts", "warning"));
  return errors;
}

export function karmaCostToRaise(currentRating: number, desiredRating: number, multiplier: number): number {
  if (!Number.isInteger(currentRating) || !Number.isInteger(desiredRating) || currentRating < 0 || desiredRating <= currentRating || multiplier <= 0) throw new Error("Karma increases require integer ratings and a higher desired rating.");
  let cost = 0;
  for (let rating = currentRating + 1; rating <= desiredRating; rating += 1) cost += rating * multiplier;
  return cost;
}

function skillKarmaMultiplier(purchase: KarmaPurchase, qualities: QualitySelection[]): number {
  const targetId = stableCreationId(purchase.targetId || "");
  let multiplier = 1;
  if (qualities.some((quality) => quality.id === "uncouth") && characterCreationRules.skill_rules.social_skills.includes(targetId)) multiplier *= 2;
  if (qualities.some((quality) => quality.id === "uneducated")) {
    if (purchase.kind === "active_skill" && characterCreationRules.skill_rules.technical_skills.includes(targetId)) multiplier *= 2;
    if (purchase.kind === "knowledge_skill" && ["academic", "professional"].includes(purchase.knowledgeCategory || "")) multiplier *= 2;
  }
  return multiplier;
}

export function karmaPurchaseCost(purchase: KarmaPurchase, qualities: QualitySelection[] = []): number {
  const ratingMultipliers: Partial<Record<KarmaPurchaseKind, number>> = {
    attribute: 5,
    active_skill: 2,
    skill_group: 5,
    knowledge_skill: 1,
    language_skill: 1
  };
  const ratingMultiplier = ratingMultipliers[purchase.kind];
  if (ratingMultiplier) {
    if (!purchase.targetId) throw new Error(`${purchase.kind} rating purchases require a target identifier.`);
    const skillMultiplier = ["active_skill", "knowledge_skill", "language_skill"].includes(purchase.kind) ? skillKarmaMultiplier(purchase, qualities) : 1;
    return karmaCostToRaise(purchase.currentRating ?? -1, purchase.newRating ?? -1, ratingMultiplier * skillMultiplier);
  }

  if (purchase.kind === "bond_focus") {
    if (!Number.isInteger(purchase.declaredCost) || (purchase.declaredCost || 0) < 1) throw new Error("A bonded focus purchase requires its positive integer Karma cost from the selected focus type and Force.");
    return purchase.declaredCost || 0;
  }

  const quantity = purchase.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`${purchase.kind} purchases require a positive integer quantity.`);
  const fixedCosts: Partial<Record<KarmaPurchaseKind, number>> = {
    specialization: characterCreationRules.karma_purchase_rules.specialization.cost,
    complex_form: characterCreationRules.karma_purchase_rules.complex_form.cost,
    spell: characterCreationRules.karma_purchase_rules.spell_ritual_or_preparation.cost,
    ritual: characterCreationRules.karma_purchase_rules.spell_ritual_or_preparation.cost,
    preparation: characterCreationRules.karma_purchase_rules.spell_ritual_or_preparation.cost,
    bound_spirit_service: characterCreationRules.karma_purchase_rules.bound_spirit_service.cost,
    registered_sprite_task: characterCreationRules.karma_purchase_rules.registered_sprite_task.cost,
    mystic_adept_power_point: characterCreationRules.magic_paths["mystic-adept"].purchased_power_point_cost,
    contact_rating_point: 1
  };
  const fixedCost = fixedCosts[purchase.kind];
  if (fixedCost == null) throw new Error(`No Karma rule is configured for '${purchase.kind}'.`);
  const multiplier = purchase.kind === "specialization" ? skillKarmaMultiplier(purchase, qualities) : 1;
  return quantity * fixedCost * multiplier;
}

export function summarizeKarmaPlan(plan: KarmaPlan): KarmaSummary {
  const level = recordValue(playLevels[plan.playLevelId]);
  if (!Object.keys(level).length) throw new Error(`Unknown play level '${plan.playLevelId}'.`);
  const qualitySummary = qualityCostSummary(plan.playLevelId, plan.qualities);
  const purchaseCost = plan.purchases.reduce((total, purchase) => total + karmaPurchaseCost(purchase, plan.qualities), 0);
  const startingKarma = numberValue(level.starting_karma);
  const availableAfterQualities = startingKarma + qualitySummary.negative - qualitySummary.positive;
  const remainingBeforeCarryover = availableAfterQualities - plan.karmaConvertedToNuyen - purchaseCost;
  return {
    startingKarma,
    positiveQualityCost: qualitySummary.positive,
    negativeQualityBonus: qualitySummary.negative,
    availableAfterQualities,
    convertedToNuyen: plan.karmaConvertedToNuyen,
    purchaseCost,
    carryoverKarma: plan.declaredCarryoverKarma,
    lostKarma: Math.max(0, remainingBeforeCarryover - plan.declaredCarryoverKarma)
  };
}

export function validateKarmaPlan(plan: KarmaPlan): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const level = recordValue(playLevels[plan.playLevelId]);
  if (!Object.keys(level).length) return [violation("karma.play-level", `Unknown play level '${plan.playLevelId}'.`, "playLevelId")];
  const magicPath = recordValue((characterCreationRules.magic_paths as UnknownRecord)[plan.magicPathId]);
  if (!Object.keys(magicPath).length) errors.push(violation("karma.magic-path", `Unknown Magic or Resonance path '${plan.magicPathId}'.`, "magicPathId"));
  const metatype = metatypesById.get(plan.metatypeId)?.[1];
  if (!metatype) errors.push(violation("karma.metatype", `Unknown metatype '${plan.metatypeId}'.`, "metatypeId"));

  let qualitySummary: QualityCostSummary | null = null;
  try {
    qualitySummary = qualityCostSummary(plan.playLevelId, plan.qualities);
  } catch (error) {
    errors.push(violation("karma.quality-cost", error instanceof Error ? error.message : String(error), "qualities"));
  }
  if (qualitySummary) {
    const positiveCap = numberValue(level.starting_karma);
    const negativeCap = numberValue(level.maximum_karma) - positiveCap;
    if (qualitySummary.positive > positiveCap) errors.push(violation("karma.positive-quality-cap", `Positive Qualities exceed the ${positiveCap} Karma cap.`, "qualities"));
    if (qualitySummary.negative > negativeCap) errors.push(violation("karma.negative-quality-cap", `Negative Qualities exceed the ${negativeCap} Karma cap.`, "qualities"));
  }

  const maximumConversion = numberValue(level.maximum_karma_to_nuyen);
  if (!Number.isInteger(plan.karmaConvertedToNuyen) || plan.karmaConvertedToNuyen < 0 || plan.karmaConvertedToNuyen > maximumConversion) errors.push(violation("karma.nuyen-conversion", `Karma converted to nuyen must be an integer from 0 to ${maximumConversion}.`, "karmaConvertedToNuyen"));
  const maximumCarryover = numberValue(level.maximum_karma_carryover);
  if (!Number.isInteger(plan.declaredCarryoverKarma) || plan.declaredCarryoverKarma < 0 || plan.declaredCarryoverKarma > maximumCarryover) errors.push(violation("karma.carryover", `No more than ${maximumCarryover} Karma may carry into play.`, "declaredCarryoverKarma"));

  let purchaseCost = 0;
  for (const [index, purchase] of plan.purchases.entries()) {
    try {
      purchaseCost += karmaPurchaseCost(purchase, plan.qualities);
    } catch (error) {
      errors.push(violation("karma.purchase", error instanceof Error ? error.message : String(error), `purchases.${index}`));
    }
    const targetId = stableCreationId(purchase.targetId || "");
    if (purchase.kind === "active_skill" && (!skillsById.has(targetId) || !skillAllowedForPath(targetId, plan.magicPathId, plan.aspectedSkillGroup))) errors.push(violation("karma.active-skill", `'${purchase.targetId || ""}' is not an Active skill available to this character.`, `purchases.${index}.targetId`));
    if (purchase.kind === "skill_group" && (!knownSkillGroups().has(targetId) || !skillGroupAllowedForPath(targetId, plan.magicPathId, plan.aspectedSkillGroup))) errors.push(violation("karma.skill-group", `'${purchase.targetId || ""}' is not a skill group available to this character.`, `purchases.${index}.targetId`));
    if (purchase.kind === "attribute" && ![...characterCreationRules.attribute_rules.physical_and_mental, ...characterCreationRules.attribute_rules.special].includes(targetId)) errors.push(violation("karma.attribute", `'${purchase.targetId || ""}' is not a character Attribute.`, `purchases.${index}.targetId`));
    if (purchase.kind === "attribute" && metatype && purchase.newRating != null) {
      const exceptionalTarget = stableCreationId(String(plan.qualities.find((quality) => quality.id === "exceptional-attribute")?.parameters?.attribute_id || ""));
      const hasLucky = plan.qualities.some((quality) => quality.id === "lucky");
      const metatypeRange = recordValue(recordValue(metatype.attributes)[targetId]);
      const baseMaximum = targetId === "magic" || targetId === "resonance" ? characterCreationRules.attribute_rules.special_attribute_default_maximum : numberValue(metatypeRange.maximum);
      const maximum = baseMaximum + (exceptionalTarget === targetId || (targetId === "edge" && hasLucky) ? 1 : 0);
      if (purchase.newRating > maximum) errors.push(violation("karma.attribute-maximum", `${targetId} cannot exceed ${maximum} for this character.`, `purchases.${index}.newRating`));
      if ((targetId === "magic" || targetId === "resonance") && magicPath.uses_special_attribute !== targetId) errors.push(violation("karma.special-attribute-path", `The ${plan.magicPathId} path cannot purchase ${targetId}.`, `purchases.${index}`));
    }
    if (["active_skill", "skill_group", "knowledge_skill", "language_skill"].includes(purchase.kind) && purchase.newRating != null) {
      const aptitudeTarget = stableCreationId(String(plan.qualities.find((quality) => quality.id === "aptitude")?.parameters?.skill_id || ""));
      const maximum = purchase.kind === "active_skill" && aptitudeTarget === targetId ? characterCreationRules.skill_rules.maximum_rating_with_aptitude : purchase.kind === "active_skill" || purchase.kind === "skill_group" ? characterCreationRules.skill_rules.maximum_rating_at_creation : characterCreationRules.skill_rules.maximum_knowledge_or_language_rating;
      if (purchase.newRating > maximum) errors.push(violation("karma.skill-maximum", `${purchase.kind} '${purchase.targetId || ""}' cannot exceed Rating ${maximum} at creation.`, `purchases.${index}.newRating`));
    }
    if (purchase.kind === "specialization" && !purchase.targetId) errors.push(violation("karma.specialization-target", "A specialization purchase requires its skill identifier.", `purchases.${index}.targetId`));
    if (purchase.kind === "skill_group" && plan.qualities.some((quality) => quality.id === "uncouth") && characterCreationRules.skill_rules.social_skill_groups.includes(targetId)) errors.push(violation("karma.uncouth-social-group", "Uncouth characters may never purchase Social skill groups.", `purchases.${index}`));
    const formulaCategory = purchase.kind === "complex_form" ? "complex_forms" : ["spell", "ritual", "preparation"].includes(purchase.kind) ? `${purchase.kind}${purchase.kind === "spell" ? "s" : "s"}` : null;
    if (formulaCategory && !allowedFormulaCategories(magicPath, plan.aspectedSkillGroup).includes(formulaCategory)) errors.push(violation("karma.formula-path", `${purchase.kind} purchases are not available to the ${plan.magicPathId} path.`, `purchases.${index}`));
    const mayBind = magicPath.may_bind_spirits === true || magicPath.may_bind_spirits_when_selected_group === stableCreationId(plan.aspectedSkillGroup || "");
    if (purchase.kind === "bound_spirit_service" && !mayBind) errors.push(violation("karma.bound-spirit-path", `The ${plan.magicPathId} path cannot purchase bound spirit services.`, `purchases.${index}`));
    if (purchase.kind === "registered_sprite_task" && magicPath.may_register_sprites !== true) errors.push(violation("karma.registered-sprite-path", `The ${plan.magicPathId} path cannot purchase registered sprite tasks.`, `purchases.${index}`));
    if (purchase.kind === "mystic_adept_power_point" && plan.magicPathId !== "mystic-adept") errors.push(violation("karma.power-point-path", "Only Mystic Adepts purchase Power Points with Karma at creation.", `purchases.${index}`));
    if (purchase.kind === "bond_focus" && recordValue(magicPath.capabilities).magic_user !== true) errors.push(violation("karma.focus-path", `The ${plan.magicPathId} path cannot bond a focus.`, `purchases.${index}`));
  }

  if (qualitySummary) {
    const available = numberValue(level.starting_karma) + qualitySummary.negative - qualitySummary.positive;
    const allocated = plan.karmaConvertedToNuyen + purchaseCost + plan.declaredCarryoverKarma;
    if (allocated > available) errors.push(violation("karma.budget", `The plan allocates ${allocated} Karma but only ${available} is available after Qualities.`, "purchases"));
    if (allocated < available) errors.push(violation("karma.unallocated", `${available - allocated} Karma is unallocated and will be lost.`, "purchases", "warning"));
  }
  return errors;
}

export function deriveCreationStatistics(input: DerivedStatisticInput): Record<string, unknown> {
  const natural = input.attributesNatural;
  const augmented = { ...natural, ...input.attributesAugmented };
  const context = {
    character: {
      attributes_natural: natural,
      attributes_augmented: augmented,
      essence: input.essence ?? 6,
      resonance_rating: input.resonanceRating ?? 0,
      matrix: { data_processing: input.matrixDataProcessing ?? 0 },
      quality_effects: { overflow_boxes: input.overflowBoxBonus ?? 0 }
    }
  };
  const definitions = characterCreationRules.derived_statistics as UnknownRecord;
  const result: Record<string, unknown> = {};
  for (const [id, definitionValue] of Object.entries(definitions)) {
    if (id === "source_pages") continue;
    const definition = recordValue(definitionValue);
    if ("value" in definition && "dice" in definition) result[id] = { value: evaluateNumericExpression(definition.value as NumericExpression, context), dice: definition.dice };
    else if (id === "living_persona") result[id] = Object.fromEntries(Object.entries(definition).map(([key, expression]) => [key, evaluateNumericExpression(expression as NumericExpression, context)]));
    else result[id] = evaluateNumericExpression(definitionValue as NumericExpression, context);
  }
  return result;
}
