import { describe, expect, it } from "vitest";
import qualityPayload from "../qualities.json";
import {
  characterCreationRules,
  calculateStartingNuyen,
  availablePowerPoints,
  deriveCreationStatistics,
  essenceAfterResources,
  karmaCostToRaise,
  karmaPurchaseCost,
  lifestyleStartingNuyenFormula,
  magicKarmaCost,
  qualityCostSummary,
  qualityKarmaValue,
  specialAttributeAfterEssenceLoss,
  stableCreationId,
  summarizeKarmaPlan,
  validateContacts,
  validateKarmaPlan,
  validateKnowledgeLanguageBudget,
  validateMagicSelection,
  validatePriorityAttributes,
  validatePrioritySelection,
  validatePowerPointAllocation,
  validateQualitySelections,
  validateResourcePlan,
  validateSkillPlan,
  type MagicSelectionPlan,
  type QualitySelection,
  type QualityValidationContext,
  type ResourcePlan,
  type SkillPlan
} from "./character-creation-engine";

const baseQualityContext: QualityValidationContext = {
  playLevelId: "regular",
  metatypeId: "human",
  magicPathId: "mundane",
  magicRating: 0,
  resonanceRating: 0,
  skillRatings: {},
  purchasedSkillGroupIds: [],
  capabilityIds: [],
  approvals: []
};

const validPriorityAttributes = () => ({
  metatypeId: "human",
  metatypePriorityRank: "D",
  attributePriorityRank: "C",
  magicPriorityRank: "E",
  magicPathId: "mundane",
  ratings: {
    body: 6,
    agility: 4,
    reaction: 3,
    strength: 3,
    willpower: 3,
    logic: 2,
    intuition: 2,
    charisma: 1,
    edge: 5,
    magic: 0,
    resonance: 0
  },
  specialPointSpend: { edge: 3, magic: 0, resonance: 0 },
  qualities: [] as QualitySelection[]
});

function representativeQualitySelection(name: string, raw: Record<string, unknown>): QualitySelection {
  const id = stableCreationId(name);
  const constraint = (characterCreationRules.quality_rules.constraints as Record<string, Record<string, unknown>>)[id] || {};
  const parameters: Record<string, unknown> = {};
  const ratingRule = constraint.rating as { minimum: number } | undefined;
  const selection: QualitySelection = { id, ...(ratingRule ? { rating: ratingRule.minimum } : {}), parameters };
  const composite = (characterCreationRules.quality_rules.cost_resolution.composite_qualities as Record<string, { sum_option_paths: string[] }>)[id];
  if (composite) for (const path of composite.sum_option_paths) parameters[path] = Object.keys(raw[path] as Record<string, unknown>)[0];
  if (constraint.option_source) parameters[String(constraint.option_parameter || "option")] = Object.keys(raw[String(constraint.option_source)] as Record<string, unknown>)[0];
  const defaults: Record<string, unknown> = {
    skill_id: "archery",
    tested_matrix_action_id: "Data Spike",
    attribute_id: "body",
    mentor_id: "Bear",
    subject: "Example",
    home_ground_id: "Seattle",
    spirit_type: "Spirit of Fire",
    protected_group: "Innocents",
    style: "Distinctive tattoos",
    skill_group_id: "firearms",
    target_group: "Corporate wageslaves",
    cause: "Past trauma",
    trigger: "Crowds",
    source: "black-ic",
    side_effect: "Blackout",
    limit_allocations: { mental: 1, physical: 0, social: 0 }
  };
  for (const parameter of (constraint.required_parameters as string[] | undefined) || []) if (parameters[parameter] == null) {
    const allowed = (constraint.allowed_parameter_values as Record<string, string[]> | undefined)?.[parameter];
    parameters[parameter] = allowed?.[0] ?? defaults[parameter] ?? "Example";
  }
  return selection;
}

const validMundaneSkillPlan = (): SkillPlan => ({
  priorityRank: "E",
  magicPriorityRank: "E",
  magicPathId: "mundane",
  individualSkills: [
    { id: "archery", kind: "active", priorityPoints: 6 },
    { id: "automatics", kind: "active", priorityPoints: 4 },
    { id: "computer", kind: "active", priorityPoints: 4 },
    { id: "perception", kind: "active", priorityPoints: 4 },
    { id: "English", kind: "language", native: true }
  ],
  skillGroups: [],
  qualities: []
});

const validMagicianPlan = (): MagicSelectionPlan => ({
  magicPathId: "magician",
  magicPriorityRank: "B",
  magicRating: 4,
  resonanceRating: 0,
  logic: 5,
  charisma: 3,
  spells: 7,
  rituals: 1,
  preparations: 1,
  complexForms: 0,
  purchasedPowerPoints: 0,
  boundSpirits: [],
  registeredSprites: [],
  bondedFocusForces: []
});

describe("Core Rulebook character-creation contract", () => {
  it("is versioned, traceable to the complete chapter and records both source conflicts", () => {
    expect(characterCreationRules.ruleset).toBe("shadowrun5e.character-creation");
    expect(characterCreationRules.schema_version).toBe(1);
    expect(characterCreationRules.source.printed_pages).toEqual({ from: 62, to: 107 });
    expect(characterCreationRules.workflow.map((step) => step.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(characterCreationRules.source_conflicts.map((conflict) => conflict.id)).toEqual([
      "mystic-adept-power-point-cost",
      "troll-and-dwarf-purchase-modifiers"
    ]);
    expect(characterCreationRules.magic_paths["mystic-adept"].purchased_power_point_cost).toBe(5);
  });

  it("enforces a complete one-to-one A–E priority assignment and table availability", () => {
    const valid = validatePrioritySelection({
      playLevelId: "regular",
      assignments: { metatype: "D", attributes: "A", magic_or_resonance: "E", skills: "B", resources: "C" },
      metatypeId: "human",
      magicPathId: "mundane"
    });
    expect(valid).toEqual([]);
    expect(validatePrioritySelection({
      playLevelId: "regular",
      assignments: { metatype: "D", attributes: "A", magic_or_resonance: "A", skills: "B", resources: "C" },
      metatypeId: "troll",
      magicPathId: "mundane"
    }).map((error) => error.id)).toEqual(expect.arrayContaining(["priority.unique", "priority.metatype-available", "priority.mundane-rank"]));
  });

  it("spends Physical and Mental points exactly, limits natural maxima and allocates Special points", () => {
    expect(validatePriorityAttributes(validPriorityAttributes())).toEqual([]);
    const invalid = validPriorityAttributes();
    invalid.ratings = { ...invalid.ratings, body: 6, agility: 6, reaction: 4, strength: 4, willpower: 1, logic: 1, intuition: 1, charisma: 1 };
    expect(validatePriorityAttributes(invalid).map((error) => error.id)).toContain("attributes.natural-maximum-count");
  });

  it("applies Exceptional Attribute and Lucky to their declared targets without merging their roles", () => {
    const exceptional = validPriorityAttributes();
    exceptional.ratings = { ...exceptional.ratings, body: 7, agility: 4, reaction: 3, strength: 3, willpower: 3, logic: 1, intuition: 2, charisma: 1 };
    exceptional.qualities = [{ id: "exceptional-attribute", parameters: { attribute_id: "body" } }];
    expect(validatePriorityAttributes(exceptional)).toEqual([]);
    const lucky = validPriorityAttributes();
    lucky.ratings.edge = 8;
    lucky.qualities = [{ id: "lucky" }];
    expect(validatePriorityAttributes(lucky).map((error) => error.id)).toContain("attributes.edge");
  });
});

describe("qualities and quality Karma", () => {
  it("resolves a positive numeric Karma value for every one of the 59 Core qualities", () => {
    const selections = [
      ...Object.entries(qualityPayload.positive_qualities),
      ...Object.entries(qualityPayload.negative_qualities)
    ].filter(([, raw]) => String(raw.source).split(/\s*\/\s*/).includes("CRB"));
    expect(selections).toHaveLength(59);
    for (const [name, raw] of selections) expect(qualityKarmaValue(representativeQualitySelection(name, raw as Record<string, unknown>)).amount, name).toBeGreaterThanOrEqual(0);
  });

  it("matches the worked quality ledger and enforces play-level positive and negative caps", () => {
    const selections: QualitySelection[] = [
      { id: "analytical-mind" },
      { id: "natural-hardening" },
      { id: "resistance-to-pathogens-toxins", parameters: { option: "Toxins only" } },
      { id: "addiction", parameters: { option: "Moderate", subject: "BTLs" } },
      { id: "dependent-s", parameters: { option: "Regular inconvenience" } },
      { id: "prejudiced", parameters: { target_prevalence: "Common target group", degree: "Biased", target_group: "Corporate wageslaves" } }
    ];
    expect(qualityCostSummary("regular", selections)).toEqual({ positive: 19, negative: 20, netKarmaAfterQualities: 26 });
    expect(validateQualitySelections([...selections, { id: "exceptional-attribute", parameters: { attribute_id: "body" } }], baseQualityContext).map((error) => error.id)).toContain("quality.positive-cap");
  });

  it("enforces eligibility, incompatibilities, tested choices and default single selection", () => {
    const selections: QualitySelection[] = [
      { id: "human-looking" },
      { id: "magic-resistance", rating: 1 },
      { id: "lucky" },
      { id: "exceptional-attribute", parameters: { attribute_id: "body" } },
      { id: "codeslinger", parameters: { tested_matrix_action_id: "Change Icon" } },
      { id: "ambidextrous" },
      { id: "ambidextrous" }
    ];
    const errors = validateQualitySelections(selections, { ...baseQualityContext, magicPathId: "magician", magicRating: 3 });
    expect(errors.map((error) => error.id)).toEqual(expect.arrayContaining(["quality.eligibility", "quality.incompatible", "quality.tested-matrix-action", "quality.maximum-selections"]));
  });

  it("keeps repeatable qualities distinct and treats IC-based Scorched as a GM-approved choice", () => {
    const allergies: QualitySelection[] = [
      { id: "allergy", parameters: { rarity: "Uncommon", severity: "Mild", subject: "Pollen" } },
      { id: "allergy", parameters: { rarity: "Common", severity: "Moderate", subject: "Pollen" } }
    ];
    expect(validateQualitySelections(allergies, baseQualityContext).map((error) => error.id)).toContain("quality.repeatable-duplicate");
    expect(validateQualitySelections([{ id: "incompetent", parameters: { skill_group_id: "sorcery" } }], baseQualityContext).map((error) => error.id)).toContain("quality.incompetent-group");
    expect(validateQualitySelections([{ id: "scorched", parameters: { source: "btl", side_effect: "Blackout" } }], baseQualityContext).map((error) => error.id)).toContain("quality.scorched-btl");
    const icScorched = { id: "scorched", parameters: { source: "black-ic", side_effect: "Blackout" } };
    expect(validateQualitySelections([icScorched], baseQualityContext).map((error) => error.id)).toEqual(["quality.gamemaster-approval"]);
    expect(validateQualitySelections([icScorched], { ...baseQualityContext, approvals: ["quality:scorched"] })).toEqual([]);
  });
});

describe("priority skills", () => {
  it("validates exact individual/group budgets and native-language grants", () => {
    expect(validateSkillPlan(validMundaneSkillPlan())).toEqual([]);
    const short = validMundaneSkillPlan();
    short.individualSkills[0].priorityPoints = 5;
    expect(validateSkillPlan(short).map((error) => error.id)).toContain("skills.priority-budget");
  });

  it("keeps free magical grants separate from paid points and validates grant type and rating", () => {
    const plan: SkillPlan = {
      ...validMundaneSkillPlan(),
      magicPriorityRank: "A",
      magicPathId: "magician",
      individualSkills: [
        { id: "spellcasting", kind: "active", grantedRating: 5, priorityPoints: 1 },
        { id: "summoning", kind: "active", grantedRating: 5 },
        { id: "archery", kind: "active", priorityPoints: 5 },
        { id: "automatics", kind: "active", priorityPoints: 4 },
        { id: "computer", kind: "active", priorityPoints: 4 },
        { id: "perception", kind: "active", priorityPoints: 4 },
        { id: "English", kind: "language", native: true }
      ]
    };
    expect(validateSkillPlan(plan)).toEqual([]);
    plan.individualSkills[1].grantedRating = 4;
    expect(validateSkillPlan(plan).map((error) => error.id)).toContain("skills.priority-grant-rating");
  });

  it("blocks restricted skills, group overlap and ratings above six without Aptitude", () => {
    const plan = validMundaneSkillPlan();
    plan.individualSkills[0] = { id: "spellcasting", kind: "active", priorityPoints: 7 };
    plan.skillGroups = [{ id: "sorcery", priorityPoints: 1 }];
    expect(validateSkillPlan(plan).map((error) => error.id)).toEqual(expect.arrayContaining(["skills.restricted", "skills.rating", "skills.group-restricted", "skills.group-overlap", "skills.group-budget"]));
  });

  it("uses only natural Intuition and Logic for the free Knowledge/Language budget", () => {
    const plan = validMundaneSkillPlan();
    plan.individualSkills.push({ id: "Seattle History", kind: "knowledge", knowledgeLanguagePoints: 6 }, { id: "Japanese", kind: "language", knowledgeLanguagePoints: 4 });
    expect(validateKnowledgeLanguageBudget(plan, 3, 2)).toEqual([]);
    expect(validateKnowledgeLanguageBudget(plan, 2, 2).map((error) => error.id)).toEqual(["skills.knowledge-budget"]);
  });
});

describe("Magic, Resonance, resources and contacts", () => {
  it("enforces path-specific formula access, priority grants and category limits", () => {
    expect(validateMagicSelection(validMagicianPlan())).toEqual([]);
    const aspected: MagicSelectionPlan = { ...validMagicianPlan(), magicPathId: "aspected-magician", magicPriorityRank: "C", magicRating: 3, aspectedSkillGroup: "enchanting", spells: 1, rituals: 0, preparations: 2 };
    expect(validateMagicSelection(aspected).map((error) => error.id)).toContain("magic.formula-category");
    const technomancer: MagicSelectionPlan = { ...validMagicianPlan(), magicPathId: "technomancer", magicPriorityRank: "A", magicRating: 0, resonanceRating: 6, logic: 4, spells: 0, rituals: 0, preparations: 0, complexForms: 5 };
    expect(validateMagicSelection(technomancer).map((error) => error.id)).toContain("magic.complex-form-limit");
  });

  it("uses the detailed 5-Karma Mystic Adept rule and includes extra formulas in Magic Karma", () => {
    const mystic: MagicSelectionPlan = { ...validMagicianPlan(), magicPathId: "mystic-adept", magicPriorityRank: "C", magicRating: 3, spells: 5, rituals: 0, preparations: 0, purchasedPowerPoints: 2 };
    expect(validateMagicSelection(mystic)).toEqual([]);
    expect(magicKarmaCost(mystic)).toBe(10);
    expect(magicKarmaCost(validMagicianPlan())).toBe(10);
  });

  it("provides one shared Power Point pool rule for adepts and Mystic Adepts", () => {
    const adept: MagicSelectionPlan = { ...validMagicianPlan(), magicPathId: "adept", magicPriorityRank: "B", magicRating: 6, spells: 0, rituals: 0, preparations: 0 };
    expect(availablePowerPoints(adept)).toBe(6);
    expect(validatePowerPointAllocation(adept, 5.75)).toEqual([]);
    expect(validatePowerPointAllocation(adept, 6.5).map((error) => error.id)).toEqual(["magic.power-point-budget"]);
    expect(validatePowerPointAllocation(adept, 1.1).map((error) => error.id)).toEqual(["magic.power-point-increment"]);
  });

  it("enforces bound-spirit/sprite counts, ratings and bonded-focus Force", () => {
    const invalid = validMagicianPlan();
    invalid.boundSpirits = [{ force: 3, services: 0 }, { force: 4, services: 1 }, { force: 4, services: 1 }, { force: 4, services: 1 }];
    invalid.registeredSprites = [{ level: 0, tasks: 1 }];
    invalid.bondedFocusForces = [5, 4];
    expect(validateMagicSelection(invalid).map((error) => error.id)).toEqual(expect.arrayContaining(["magic.bound-spirit-count", "magic.bound-spirit-force", "magic.bound-spirit-services", "magic.registered-sprite-path", "magic.bonded-foci-force"]));
  });

  it("enforces budgets, play-level gear limits, augmentation rules and metatype Lifestyle multipliers", () => {
    const valid: ResourcePlan = {
      playLevelId: "regular",
      resourcePriorityRank: "E",
      metatypeId: "human",
      karmaConvertedToNuyen: 2,
      carryoverNuyen: 5000,
      purchases: [{ id: "gear", cost: 5000, availability: 12, deviceRating: 6 }]
    };
    expect(validateResourcePlan(valid)).toEqual([]);
    const invalid: ResourcePlan = {
      ...valid,
      metatypeId: "troll",
      carryoverNuyen: 0,
      qualityIds: ["sensitive-system"],
      purchases: [
        { id: "home", kind: "lifestyle", baseCost: 2000, cost: 2000 },
        { id: "ware", kind: "augmentation", cost: 8000, availability: 13, deviceRating: 7, augmentationGrade: "betaware", augmentationType: "bioware", essenceCost: 1, attributeBonuses: { body: 5 } }
      ]
    };
    expect(validateResourcePlan(invalid).map((error) => error.id)).toEqual(expect.arrayContaining(["resources.lifestyle-multiplier", "resources.availability", "resources.device-rating", "resources.augmentation-grade", "resources.sensitive-system-bioware", "resources.augmentation-cap"]));
  });

  it("calculates Essence loss and Special Attribute reduction per started point", () => {
    const plan: ResourcePlan = { playLevelId: "regular", resourcePriorityRank: "E", metatypeId: "human", karmaConvertedToNuyen: 0, carryoverNuyen: 0, purchases: [{ id: "ware", cost: 6000, augmentationType: "cyberware", essenceCost: 1.1 }] };
    expect(essenceAfterResources(plan)).toBeCloseTo(4.9);
    expect(specialAttributeAfterEssenceLoss(6, 4.9)).toBe(4);
  });

  it("parses the existing Lifestyle formula once and calculates rolled starting nuyen", () => {
    expect(lifestyleStartingNuyenFormula("Low")).toEqual({ dice: 3, sides: 6, multiplier: 60 });
    expect(calculateStartingNuyen("Low", [4, 4, 4], 2785)).toBe(3505);
    expect(() => calculateStartingNuyen("Low", [4, 4], 0)).toThrow("exactly 3 D6");
  });

  it("enforces free contact Karma, minimum ratings and the seven-Karma contact cap", () => {
    expect(validateContacts({ playLevelId: "regular", naturalCharisma: 3, contacts: [{ connection: 3, loyalty: 2 }, { connection: 2, loyalty: 2 }] })).toEqual([]);
    expect(validateContacts({ playLevelId: "regular", naturalCharisma: 2, contacts: [{ connection: 7, loyalty: 1 }] }).map((error) => error.id)).toEqual(expect.arrayContaining(["contacts.per-contact-cap", "contacts.budget"]));
  });

  it("keeps paid contact points separate from the free Charisma budget", () => {
    expect(validateContacts({
      playLevelId: "regular",
      naturalCharisma: 2,
      contacts: [{ connection: 3, loyalty: 3 }, { connection: 2, loyalty: 2 }],
      paidKarmaPoints: 4
    })).toEqual([]);
    expect(validateContacts({
      playLevelId: "regular",
      naturalCharisma: 2,
      contacts: [{ connection: 1, loyalty: 1 }],
      paidKarmaPoints: 3
    }).map((error) => error.id)).toContain("contacts.paid-karma-allocation");
  });
});

describe("leftover Karma and final calculations", () => {
  it("calculates cumulative rating costs and the worked technomancer expenditure", () => {
    expect(karmaCostToRaise(0, 2, 2)).toBe(6);
    expect(karmaCostToRaise(4, 6, 5)).toBe(55);
    const qualities: QualitySelection[] = [
      { id: "analytical-mind" },
      { id: "natural-hardening" },
      { id: "resistance-to-pathogens-toxins", parameters: { option: "Toxins only" } },
      { id: "addiction", parameters: { option: "Moderate", subject: "BTLs" } },
      { id: "dependent-s", parameters: { option: "Regular inconvenience" } },
      { id: "prejudiced", parameters: { target_prevalence: "Common target group", degree: "Biased", target_group: "Corporate wageslaves" } }
    ];
    const plan = {
      playLevelId: "regular",
      metatypeId: "human",
      magicPathId: "technomancer",
      qualities,
      karmaConvertedToNuyen: 0,
      purchases: [
        { kind: "active_skill" as const, targetId: "cybercombat", currentRating: 0, newRating: 2 },
        { kind: "active_skill" as const, targetId: "software", currentRating: 0, newRating: 2 },
        { kind: "active_skill" as const, targetId: "electronic-warfare", currentRating: 1, newRating: 2 },
        { kind: "complex_form" as const },
        { kind: "registered_sprite_task" as const, quantity: 6 }
      ],
      declaredCarryoverKarma: 0
    };
    expect(summarizeKarmaPlan(plan)).toMatchObject({ availableAfterQualities: 26, purchaseCost: 26, carryoverKarma: 0, lostKarma: 0 });
    expect(validateKarmaPlan(plan)).toEqual([]);
  });

  it("applies Uncouth and Uneducated Karma multipliers and rejects excess carryover", () => {
    expect(karmaPurchaseCost({ kind: "active_skill", targetId: "con", currentRating: 0, newRating: 1 }, [{ id: "uncouth" }])).toBe(4);
    expect(karmaPurchaseCost({ kind: "active_skill", targetId: "hardware", currentRating: 0, newRating: 1 }, [{ id: "uneducated" }])).toBe(4);
    expect(validateKarmaPlan({ playLevelId: "regular", metatypeId: "human", magicPathId: "mundane", qualities: [], karmaConvertedToNuyen: 0, purchases: [], declaredCarryoverKarma: 8 }).map((error) => error.id)).toContain("karma.carryover");
  });

  it("keeps Step Seven skill and formula purchases inside the selected path", () => {
    const errors = validateKarmaPlan({
      playLevelId: "regular",
      metatypeId: "human",
      magicPathId: "mundane",
      qualities: [],
      karmaConvertedToNuyen: 0,
      purchases: [
        { kind: "active_skill", targetId: "spellcasting", currentRating: 0, newRating: 1 },
        { kind: "complex_form" },
        { kind: "bound_spirit_service" }
      ],
      declaredCarryoverKarma: 7
    });
    expect(errors.map((error) => error.id)).toEqual(expect.arrayContaining(["karma.active-skill", "karma.formula-path", "karma.bound-spirit-path"]));
  });

  it("evaluates every final calculation from one expression tree", () => {
    const result = deriveCreationStatistics({
      attributesNatural: { body: 3, agility: 4, reaction: 3, strength: 2, willpower: 4, logic: 5, intuition: 4, charisma: 6 },
      attributesAugmented: { reaction: 5, strength: 4 },
      essence: 5.4,
      resonanceRating: 6,
      matrixDataProcessing: 5,
      overflowBoxBonus: 2
    });
    expect(result).toMatchObject({
      initiative: { value: 9, dice: 1 },
      astral_initiative: { value: 8, dice: 2 },
      mental_limit: 6,
      physical_limit: 6,
      social_limit: 8,
      physical_condition_monitor: 10,
      stun_condition_monitor: 10,
      overflow_boxes: 5,
      living_persona: { attack: 6, data_processing: 5, device_rating: 6, firewall: 4, sleaze: 4 }
    });
  });
});
