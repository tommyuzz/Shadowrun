import {
  deriveCreationStatistics,
  essenceAfterResources,
  qualityCostSummary,
  skillRatingsFromPlan,
  stableCreationId,
  specialAttributeAfterEssenceLoss,
  summarizeKarmaPlan,
  validateContacts,
  validateKarmaPlan,
  validateKnowledgeLanguageBudget,
  validateMagicSelection,
  validatePriorityAttributes,
  validatePrioritySelection,
  validateQualitySelections,
  validateResourcePlan,
  validateSkillPlan,
  type ContactPlan,
  type DerivedStatisticInput,
  type KarmaPlan,
  type KarmaPurchase,
  type KarmaSummary,
  type MagicSelectionPlan,
  type QualityCostSummary,
  type ResourcePlan,
  type RuleViolation,
  type SkillPlan
} from "../character-creation-engine";
import {
  adeptPowerCatalogue,
  adeptPowerCost,
  complexFormCatalogue,
  magicPathOptions,
  magicPriorityGrant,
  resourceBudget,
  resourceCatalogue,
  resolveResourceSelection,
  ritualCatalogue,
  skillCatalogue,
  skillGroupCatalogue,
  spellCatalogue
} from "./catalogues";
import { naturalAttributeRatings, type CharacterDraft } from "./draft";
import {
  CONFIRMABLE_CREATION_STEPS,
  creationStepIndex,
  type CreationStepId
} from "./workflow";

export { CREATION_STEPS, type CreationStepId } from "./workflow";

export interface StepEvaluation {
  id: CreationStepId;
  violations: RuleViolation[];
  errors: number;
  warnings: number;
  approvals: number;
  mechanicallyClear: boolean;
  confirmed: boolean;
  complete: boolean;
}

export interface CharacterDraftEvaluation {
  steps: Record<CreationStepId, StepEvaluation>;
  allViolations: RuleViolation[];
  ready: boolean;
  naturalAttributes: Record<string, number>;
  augmentedAttributes: Record<string, number>;
  skillRatings: Record<string, number>;
  powerPoints: { available: number; spent: number };
  resources: { budget: number; spent: number; carryover: number; essence: number };
  qualitySummary: QualityCostSummary | null;
  karmaSummary: KarmaSummary | null;
  derivedStatistics: Record<string, unknown>;
  plans: {
    skills: SkillPlan;
    magic: MagicSelectionPlan;
    resources: ResourcePlan;
    contacts: ContactPlan;
    karma: KarmaPlan;
  };
}

function violation(id: string, message: string, path?: string, severity: RuleViolation["severity"] = "error"): RuleViolation {
  return { id, message, severity, ...(path ? { path } : {}) };
}

function runValidator(validator: () => RuleViolation[], id: string, path: string): RuleViolation[] {
  try {
    return validator();
  } catch (error) {
    return [violation(id, error instanceof Error ? error.message : String(error), path)];
  }
}

function formulaCatalogueViolations(draft: CharacterDraft): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const catalogues: Array<[string, string[], Set<string>]> = [
    ["spell", draft.magic.spells, new Set(spellCatalogue.map((entry) => entry.id))],
    ["ritual", draft.magic.rituals, new Set(ritualCatalogue.map((entry) => entry.id))],
    ["complex form", draft.magic.complexForms, new Set(complexFormCatalogue.map((entry) => entry.id))]
  ];
  for (const [label, selections, known] of catalogues) {
    if (new Set(selections).size !== selections.length) errors.push(violation(`catalogue.${label.replace(/\s/g, "-")}-duplicate`, `A ${label} may only be selected once.`, `magic.${label}`));
    for (const selected of selections) if (!known.has(selected)) errors.push(violation(`catalogue.${label.replace(/\s/g, "-")}-known`, `Unknown Core Rulebook ${label} '${selected}'.`, `magic.${label}`));
  }
  if (draft.magic.preparations.some((name) => !name.trim())) errors.push(violation("catalogue.preparation-name", "Preparation formula names cannot be blank.", "magic.preparations"));
  return errors;
}

export function skillPlanFromDraft(draft: CharacterDraft): SkillPlan {
  const aptitudeSkillId = String(draft.qualities.find((quality) => quality.id === "aptitude")?.parameters?.skill_id || "") || undefined;
  return {
    priorityRank: draft.priorityAssignments.skills,
    magicPriorityRank: draft.priorityAssignments.magic_or_resonance,
    magicPathId: draft.magicPathId,
    ...(draft.aspectedSkillGroup ? { aspectedSkillGroup: draft.aspectedSkillGroup } : {}),
    individualSkills: draft.individualSkills,
    skillGroups: draft.skillGroups,
    ...(aptitudeSkillId ? { aptitudeSkillId } : {}),
    qualities: draft.qualities
  };
}

function expandedSkillRatings(plan: SkillPlan): Record<string, number> {
  const ratings = skillRatingsFromPlan(plan);
  for (const allocation of plan.skillGroups) {
    const group = skillGroupCatalogue.find((entry) => entry.id === allocation.id);
    const rating = (allocation.priorityPoints || 0) + (allocation.grantedRating || 0);
    for (const skillId of group?.skillIds || []) ratings[skillId] = Math.max(ratings[skillId] || 0, rating);
  }
  return ratings;
}

function capabilityIdsFromDraft(draft: CharacterDraft): string[] {
  const capabilities = new Set<string>();
  for (const power of draft.magic.adeptPowers) {
    if (power.powerId === "astral-perception") capabilities.add("astral-perception-adept-power");
    if (power.powerId === "pain-resistance") capabilities.add("pain-resistance-adept-power");
  }
  for (const selection of draft.resources) {
    const entry = resourceCatalogue.find((item) => item.catalogueId === selection.catalogueId);
    entry?.capabilityIds.forEach((id) => capabilities.add(id));
  }
  return [...capabilities];
}

export function magicPlanFromDraft(draft: CharacterDraft, natural = naturalAttributeRatings(draft)): MagicSelectionPlan {
  const powerPointsSpent = draft.magic.adeptPowers.reduce((total, selection) => total + (adeptPowerCost(selection.powerId, selection.rating) || 0), 0);
  const bondedFocusForces = draft.resources.flatMap((selection) => {
    const entry = resourceCatalogue.find((item) => item.catalogueId === selection.catalogueId);
    return entry?.isFocus && selection.bonded && selection.rating ? [selection.rating] : [];
  });
  return {
    magicPathId: draft.magicPathId,
    magicPriorityRank: draft.priorityAssignments.magic_or_resonance,
    magicRating: natural.magic || 0,
    resonanceRating: natural.resonance || 0,
    logic: natural.logic || 0,
    charisma: natural.charisma || 0,
    ...(draft.aspectedSkillGroup ? { aspectedSkillGroup: draft.aspectedSkillGroup } : {}),
    spells: draft.magic.spells.length,
    rituals: draft.magic.rituals.length,
    preparations: draft.magic.preparations.length,
    complexForms: draft.magic.complexForms.length,
    purchasedPowerPoints: draft.magic.purchasedPowerPoints,
    powerPointsSpent,
    boundSpirits: draft.magic.boundSpirits.map((spirit) => ({ force: natural.magic || 0, services: spirit.services })),
    registeredSprites: draft.magic.registeredSprites.map((sprite) => ({ level: natural.resonance || 0, tasks: sprite.tasks })),
    bondedFocusForces
  };
}

function powerCatalogueViolations(draft: CharacterDraft, plan: MagicSelectionPlan): RuleViolation[] {
  const errors: RuleViolation[] = [];
  if (draft.magic.adeptPowers.length && !["adept", "mystic-adept"].includes(draft.magicPathId)) {
    errors.push(violation("catalogue.adept-path", "Only adepts and mystic adepts may select adept powers.", "magic.adeptPowers"));
  }
  const seen = new Set<string>();
  for (const selection of draft.magic.adeptPowers) {
    const power = adeptPowerCatalogue.find((entry) => entry.id === selection.powerId);
    if (!power) {
      errors.push(violation("catalogue.adept-power-known", `Unknown adept power '${selection.powerId}'.`, `magic.adeptPowers.${selection.instanceId}`));
      continue;
    }
    if (!Number.isInteger(selection.rating) || selection.rating < 1) errors.push(violation("catalogue.adept-power-rating", `${power.name} needs a positive integer rating.`, `magic.adeptPowers.${selection.instanceId}.rating`));
    if (!power.rated && selection.rating !== 1) errors.push(violation("catalogue.adept-power-fixed", `${power.name} is a fixed-cost power and must use Rating 1.`, `magic.adeptPowers.${selection.instanceId}.rating`));
    if (power.unitCosts.length > 1 && selection.rating > power.unitCosts.length) errors.push(violation("catalogue.adept-power-levels", `${power.name} has ${power.unitCosts.length} configured level costs.`, `magic.adeptPowers.${selection.instanceId}.rating`));
    if (power.rated && /Magic Rating/i.test(power.maximum) && selection.rating > plan.magicRating) errors.push(violation("catalogue.adept-power-maximum", `${power.name} cannot exceed Magic ${plan.magicRating}.`, `magic.adeptPowers.${selection.instanceId}.rating`));
    if (adeptPowerCost(power.id, selection.rating) == null) errors.push(violation("catalogue.adept-power-cost", `${power.name} does not resolve to a structured Power Point cost.`, `magic.adeptPowers.${selection.instanceId}`));
    const signature = `${power.id}:${selection.choice || ""}`;
    if (seen.has(signature)) errors.push(violation("catalogue.adept-power-duplicate", `${power.name}${selection.choice ? ` (${selection.choice})` : ""} is selected more than once.`, `magic.adeptPowers.${selection.instanceId}`));
    seen.add(signature);
  }
  return errors;
}

export function resourcePlanFromDraft(draft: CharacterDraft): { plan: ResourcePlan; violations: RuleViolation[] } {
  const purchases = [];
  const errors: RuleViolation[] = [];
  for (const selection of draft.resources) {
    const resolved = resolveResourceSelection(selection, draft.metatypeId);
    purchases.push(resolved.purchase);
    errors.push(...resolved.issues.map((issue) => violation(issue.id, issue.message, `resources.${selection.instanceId}.${issue.field}`)));
    if (selection.bonded && !resolved.entry?.isFocus) errors.push(violation("catalogue.focus-bond", `${resolved.entry?.name || selection.catalogueId} is not a focus and cannot be bonded.`, `resources.${selection.instanceId}.bonded`));
    if (selection.bonded && (!Number.isInteger(selection.bondKarmaCost) || (selection.bondKarmaCost || 0) < 1)) errors.push(violation("catalogue.focus-karma", `A bonded ${resolved.entry?.name || "focus"} needs its positive bonding Karma cost.`, `resources.${selection.instanceId}.bondKarmaCost`));
  }
  return {
    plan: {
      playLevelId: draft.playLevelId,
      resourcePriorityRank: draft.priorityAssignments.resources,
      metatypeId: draft.metatypeId,
      karmaConvertedToNuyen: draft.karmaConvertedToNuyen,
      carryoverNuyen: draft.nuyenCarryover,
      purchases,
      qualityIds: draft.qualities.map((quality) => quality.id)
    },
    violations: errors
  };
}

function generatedKarmaPurchases(draft: CharacterDraft): KarmaPurchase[] {
  const grant = magicPriorityGrant(draft.priorityAssignments.magic_or_resonance, draft.magicPathId);
  const purchases: KarmaPurchase[] = [];
  const addQuantity = (kind: KarmaPurchase["kind"], quantity: number) => { if (quantity > 0) purchases.push({ kind, quantity }); };
  addQuantity("spell", Math.max(0, draft.magic.spells.length - Number(grant.spells || 0)));
  addQuantity("ritual", draft.magic.rituals.length);
  addQuantity("preparation", draft.magic.preparations.length);
  addQuantity("complex_form", Math.max(0, draft.magic.complexForms.length - Number(grant.complex_forms || 0)));
  if (draft.magicPathId === "mystic-adept") addQuantity("mystic_adept_power_point", draft.magic.purchasedPowerPoints);
  addQuantity("bound_spirit_service", draft.magic.boundSpirits.reduce((sum, spirit) => sum + spirit.services, 0));
  addQuantity("registered_sprite_task", draft.magic.registeredSprites.reduce((sum, sprite) => sum + sprite.tasks, 0));
  for (const selection of draft.resources) {
    const entry = resourceCatalogue.find((item) => item.catalogueId === selection.catalogueId);
    if (entry?.isFocus && selection.bonded) purchases.push({ kind: "bond_focus", targetId: entry.id, declaredCost: selection.bondKarmaCost });
  }
  return [...purchases, ...draft.karmaPurchases.map(({ instanceId: _instanceId, ...purchase }) => purchase)];
}

function finalNaturalAttributes(draft: CharacterDraft, base: Record<string, number>, essence: number): Record<string, number> {
  const ratings = { ...base };
  const path = magicPathOptions.find((option) => option.id === draft.magicPathId);
  if (path?.specialAttribute === "magic") ratings.magic = specialAttributeAfterEssenceLoss(ratings.magic || 0, essence);
  if (path?.specialAttribute === "resonance") ratings.resonance = specialAttributeAfterEssenceLoss(ratings.resonance || 0, essence);
  for (const purchase of draft.karmaPurchases) if (purchase.kind === "attribute" && purchase.targetId && purchase.newRating != null) ratings[purchase.targetId] = Math.max(ratings[purchase.targetId] || 0, purchase.newRating);
  return ratings;
}

function karmaSequenceViolations(draft: CharacterDraft, baseNatural: Record<string, number>, essence: number, skillRatings: Record<string, number>): RuleViolation[] {
  const errors: RuleViolation[] = [];
  const path = magicPathOptions.find((option) => option.id === draft.magicPathId);
  const attributeRatings = { ...baseNatural };
  if (path?.specialAttribute === "magic") attributeRatings.magic = specialAttributeAfterEssenceLoss(attributeRatings.magic || 0, essence);
  if (path?.specialAttribute === "resonance") attributeRatings.resonance = specialAttributeAfterEssenceLoss(attributeRatings.resonance || 0, essence);
  const groupRatings = Object.fromEntries(draft.skillGroups.map((group) => [group.id, (group.priorityPoints || 0) + (group.grantedRating || 0)]));
  const ratingKinds = new Set(["attribute", "active_skill", "skill_group", "knowledge_skill", "language_skill"]);
  for (const purchase of draft.karmaPurchases) {
    if (!ratingKinds.has(purchase.kind) || !purchase.targetId) continue;
    const targetId = stableCreationId(purchase.targetId);
    const ledger = purchase.kind === "attribute" ? attributeRatings : purchase.kind === "skill_group" ? groupRatings : skillRatings;
    const expected = ledger[targetId] || 0;
    if (purchase.currentRating !== expected) errors.push(violation("karma.purchase-sequence", `${purchase.targetId} is currently Rating ${expected}; this purchase declares Rating ${String(purchase.currentRating)}.`, `karmaPurchases.${purchase.instanceId}.currentRating`));
    if (purchase.newRating != null && purchase.newRating > expected) ledger[targetId] = purchase.newRating;
  }
  return errors;
}

function makeStep(id: CreationStepId, violations: RuleViolation[], confirmed: boolean): StepEvaluation {
  const errors = violations.filter((item) => item.severity === "error").length;
  const warnings = violations.filter((item) => item.severity === "warning").length;
  const approvals = violations.filter((item) => item.severity === "approval").length;
  const mechanicallyClear = errors === 0 && approvals === 0;
  return { id, violations, errors, warnings, approvals, mechanicallyClear, confirmed, complete: mechanicallyClear && confirmed };
}

export function evaluateCharacterDraft(draft: CharacterDraft): CharacterDraftEvaluation {
  const baseNatural = naturalAttributeRatings(draft);
  const skillPlan = skillPlanFromDraft(draft);
  const skillRatings = expandedSkillRatings(skillPlan);
  const magicPlan = magicPlanFromDraft(draft, baseNatural);
  const resolvedResources = resourcePlanFromDraft(draft);
  const resourcePlan = resolvedResources.plan;
  const essence = essenceAfterResources(resourcePlan);
  const natural = finalNaturalAttributes(draft, baseNatural, essence);
  const paidContactPoints = draft.karmaPurchases.filter((purchase) => purchase.kind === "contact_rating_point").reduce((sum, purchase) => sum + (purchase.quantity || 1), 0);
  const contactPlan: ContactPlan = {
    playLevelId: draft.playLevelId,
    naturalCharisma: natural.charisma,
    contacts: draft.contacts.map((contact) => ({ connection: contact.connection, loyalty: contact.loyalty })),
    paidKarmaPoints: paidContactPoints
  };
  const karmaPlan: KarmaPlan = {
    playLevelId: draft.playLevelId,
    metatypeId: draft.metatypeId,
    magicPathId: draft.magicPathId,
    ...(draft.aspectedSkillGroup ? { aspectedSkillGroup: draft.aspectedSkillGroup } : {}),
    qualities: draft.qualities,
    karmaConvertedToNuyen: draft.karmaConvertedToNuyen,
    purchases: generatedKarmaPurchases(draft),
    declaredCarryoverKarma: draft.karmaCarryover
  };

  const priorityViolations = runValidator(() => validatePrioritySelection({
    playLevelId: draft.playLevelId,
    assignments: draft.priorityAssignments,
    metatypeId: draft.metatypeId,
    magicPathId: draft.magicPathId
  }), "priority.validator", "priorityAssignments");

  const attributeViolations = runValidator(() => validatePriorityAttributes({
    metatypeId: draft.metatypeId,
    metatypePriorityRank: draft.priorityAssignments.metatype,
    attributePriorityRank: draft.priorityAssignments.attributes,
    magicPriorityRank: draft.priorityAssignments.magic_or_resonance,
    magicPathId: draft.magicPathId,
    ratings: baseNatural,
    specialPointSpend: draft.specialPointSpend,
    qualities: draft.qualities
  }), "attributes.validator", "attributeRatings");

  const qualityViolations = runValidator(() => validateQualitySelections(draft.qualities, {
    playLevelId: draft.playLevelId,
    metatypeId: draft.metatypeId,
    magicPathId: draft.magicPathId,
    magicRating: baseNatural.magic || 0,
    resonanceRating: baseNatural.resonance || 0,
    ...(draft.aspectedSkillGroup ? { aspectedSkillGroup: draft.aspectedSkillGroup } : {}),
    skillRatings,
    purchasedSkillGroupIds: draft.skillGroups.map((group) => group.id),
    capabilityIds: capabilityIdsFromDraft(draft),
    approvals: draft.approvals
  }), "qualities.validator", "qualities");

  const skillViolations = [
    ...runValidator(() => validateSkillPlan(skillPlan), "skills.validator", "individualSkills"),
    ...runValidator(() => validateKnowledgeLanguageBudget(skillPlan, baseNatural.intuition, baseNatural.logic), "skills.knowledge-validator", "individualSkills")
  ];

  const magicViolations = [
    ...formulaCatalogueViolations(draft),
    ...powerCatalogueViolations(draft, magicPlan),
    ...runValidator(() => validateMagicSelection(magicPlan), "magic.validator", "magic")
  ];

  const resourceViolations = [
    ...resolvedResources.violations,
    ...runValidator(() => validateResourcePlan(resourcePlan), "resources.validator", "resources")
  ];
  const contactViolations = runValidator(() => validateContacts(contactPlan), "contacts.validator", "contacts");
  const karmaViolations = [
    ...karmaSequenceViolations(draft, baseNatural, essence, { ...skillRatings }),
    ...runValidator(() => validateKarmaPlan(karmaPlan), "karma.validator", "karmaPurchases")
  ];

  const preReview = {
    priorities: makeStep("priorities", priorityViolations, draft.confirmedSteps.includes("priorities")),
    attributes: makeStep("attributes", attributeViolations, draft.confirmedSteps.includes("attributes")),
    qualities: makeStep("qualities", qualityViolations, draft.confirmedSteps.includes("qualities")),
    skills: makeStep("skills", skillViolations, draft.confirmedSteps.includes("skills")),
    magic: makeStep("magic", magicViolations, draft.confirmedSteps.includes("magic")),
    resources: makeStep("resources", resourceViolations, draft.confirmedSteps.includes("resources")),
    contacts: makeStep("contacts", contactViolations, draft.confirmedSteps.includes("contacts")),
    karma: makeStep("karma", karmaViolations, draft.confirmedSteps.includes("karma"))
  };
  const allViolations = Object.values(preReview).flatMap((step) => step.violations);
  const reviewViolations = allViolations.filter((item) => item.severity !== "warning");
  const incompleteSteps = CONFIRMABLE_CREATION_STEPS.filter((step) => !preReview[step.id].complete);
  if (incompleteSteps.length) reviewViolations.push(violation("workflow.incomplete", `Complete each preceding step before review: ${incompleteSteps.map((step) => step.label).join(", ")}.`, "confirmedSteps"));
  const steps: CharacterDraftEvaluation["steps"] = { ...preReview, review: makeStep("review", reviewViolations, true) };

  const bonuses = resourcePlan.purchases.reduce<Record<string, number>>((result, purchase) => {
    for (const [attribute, bonus] of Object.entries(purchase.attributeBonuses || {})) result[attribute] = (result[attribute] || 0) + bonus;
    return result;
  }, {});
  const augmented = Object.fromEntries(Object.entries(natural).map(([id, rating]) => [id, rating + (bonuses[id] || 0)]));
  const overflowBonus = draft.qualities.filter((quality) => quality.id === "will-to-live").reduce((sum, quality) => sum + (quality.rating || 0), 0);
  const derivedInput: DerivedStatisticInput = {
    attributesNatural: natural,
    attributesAugmented: augmented,
    essence,
    resonanceRating: natural.resonance,
    matrixDataProcessing: draft.matrixDataProcessing,
    overflowBoxBonus: overflowBonus
  };
  let derivedStatistics: Record<string, unknown> = {};
  try { derivedStatistics = deriveCreationStatistics(derivedInput); } catch { /* Attribute validation reports incomplete values. */ }
  let qualitySummary: QualityCostSummary | null = null;
  let karmaSummary: KarmaSummary | null = null;
  try { qualitySummary = qualityCostSummary(draft.playLevelId, draft.qualities); } catch { /* Quality validation owns the error. */ }
  try { karmaSummary = summarizeKarmaPlan(karmaPlan); } catch { /* Karma validation owns the error. */ }

  const spent = resourcePlan.purchases.reduce((sum, purchase) => sum + purchase.cost, 0);
  const totalBudget = resourceBudget(draft.priorityAssignments.resources, draft.playLevelId) + draft.karmaConvertedToNuyen * 2000;
  return {
    steps,
    allViolations,
    ready: reviewViolations.length === 0,
    naturalAttributes: natural,
    augmentedAttributes: augmented,
    skillRatings,
    powerPoints: { available: draft.magicPathId === "adept" ? baseNatural.magic : draft.magicPathId === "mystic-adept" ? draft.magic.purchasedPowerPoints : 0, spent: magicPlan.powerPointsSpent || 0 },
    resources: { budget: totalBudget, spent, carryover: draft.nuyenCarryover, essence },
    qualitySummary,
    karmaSummary,
    derivedStatistics,
    plans: { skills: skillPlan, magic: magicPlan, resources: resourcePlan, contacts: contactPlan, karma: karmaPlan }
  };
}

export function firstIncompleteCreationStepIndex(evaluation: CharacterDraftEvaluation): number {
  const firstIncomplete = CONFIRMABLE_CREATION_STEPS.find((step) => !evaluation.steps[step.id].complete);
  return firstIncomplete ? creationStepIndex(firstIncomplete.id) : creationStepIndex("review");
}

export function accessibleCreationStepIndex(evaluation: CharacterDraftEvaluation, requestedStepId: string | undefined): number {
  const requestedIndex = creationStepIndex(requestedStepId);
  const normalizedRequested = requestedIndex < 0 ? 0 : requestedIndex;
  return Math.min(normalizedRequested, firstIncompleteCreationStepIndex(evaluation));
}

export function suggestedKarmaCurrentRating(draft: CharacterDraft, kind: KarmaPurchase["kind"], targetId: string): number {
  const evaluation = evaluateCharacterDraft({ ...draft, karmaPurchases: [] });
  if (kind === "attribute") return evaluation.naturalAttributes[targetId] || 0;
  if (kind === "active_skill" || kind === "knowledge_skill" || kind === "language_skill") return evaluation.skillRatings[targetId] || 0;
  if (kind === "skill_group") {
    const allocation = draft.skillGroups.find((group) => group.id === targetId);
    return (allocation?.priorityPoints || 0) + (allocation?.grantedRating || 0);
  }
  return 0;
}

export function searchableKarmaTargets(kind: KarmaPurchase["kind"]): Array<{ id: string; name: string }> {
  if (kind === "attribute") return ["body", "agility", "reaction", "strength", "willpower", "logic", "intuition", "charisma", "edge", "magic", "resonance"].map((id) => ({ id, name: id.replace(/\b\w/g, (letter) => letter.toUpperCase()) }));
  if (kind === "active_skill") return skillCatalogue.map(({ id, name }) => ({ id, name }));
  if (kind === "skill_group") return skillGroupCatalogue.map(({ id, name }) => ({ id, name }));
  return [];
}
