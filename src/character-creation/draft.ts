import type {
  IndividualSkillAllocation,
  KarmaPurchase,
  QualitySelection,
  SkillGroupAllocation
} from "../character-creation-engine";
import { CONFIRMABLE_CREATION_STEPS, type ConfirmableCreationStepId } from "./workflow";
import {
  ATTRIBUTE_IDS,
  PRIORITY_CATEGORIES,
  PRIORITY_RANKS,
  availableMagicPaths,
  availableMetatypes,
  magicPathOptions,
  magicPriorityGrant,
  metatypeAttributeRange,
  metatypeOptions,
  type AttributeId,
  type PriorityCategoryId,
  type PriorityRank,
  type ResourceSelectionShape,
  type SpecialAttributeId
} from "./catalogues";

export const CHARACTER_DRAFT_SCHEMA_VERSION = 3;
export const CHARACTER_DRAFT_STORAGE_KEY = "shadowrun5e-character-draft-v4";

export interface CharacterBiography {
  legalName: string;
  streetName: string;
  age: string;
  gender: string;
  ethnicity: string;
  height: string;
  weight: string;
  description: string;
  background: string;
  lifestyleId: string;
}

export interface DraftAdeptPowerSelection {
  instanceId: string;
  powerId: string;
  rating: number;
  choice?: string;
}

export interface DraftBoundSpirit {
  instanceId: string;
  spiritId: string;
  services: number;
}

export interface DraftRegisteredSprite {
  instanceId: string;
  spriteName: string;
  tasks: number;
}

export interface CharacterMagicDraft {
  spells: string[];
  rituals: string[];
  preparations: string[];
  complexForms: string[];
  adeptPowers: DraftAdeptPowerSelection[];
  purchasedPowerPoints: number;
  boundSpirits: DraftBoundSpirit[];
  registeredSprites: DraftRegisteredSprite[];
}

export interface DraftContact {
  instanceId: string;
  name: string;
  connection: number;
  loyalty: number;
  notes: string;
}

export interface DraftKarmaPurchase extends KarmaPurchase {
  instanceId: string;
}

export interface CharacterDraft {
  schemaVersion: number;
  ruleset: "shadowrun5e.character-creation";
  playLevelId: string;
  priorityAssignments: Record<PriorityCategoryId, PriorityRank | "">;
  metatypeId: string;
  magicPathId: string;
  aspectedSkillGroup?: string;
  attributeRatings: Record<AttributeId, number>;
  specialPointSpend: Record<SpecialAttributeId, number>;
  qualities: QualitySelection[];
  individualSkills: IndividualSkillAllocation[];
  skillGroups: SkillGroupAllocation[];
  magic: CharacterMagicDraft;
  resources: ResourceSelectionShape[];
  karmaConvertedToNuyen: number;
  contacts: DraftContact[];
  karmaPurchases: DraftKarmaPurchase[];
  karmaCarryover: number;
  approvals: string[];
  biography: CharacterBiography;
  confirmedSteps: ConfirmableCreationStepId[];
}

const defaultPriorities: CharacterDraft["priorityAssignments"] = {
  metatype: "",
  attributes: "",
  magic_or_resonance: "",
  skills: "",
  resources: ""
};

function startingAttributeRatings(metatypeId: string): Record<AttributeId, number> {
  return Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, metatypeId ? metatypeAttributeRange(metatypeId, id).minimum : 0])) as Record<AttributeId, number>;
}

export function createEmptyCharacterDraft(): CharacterDraft {
  return {
    schemaVersion: CHARACTER_DRAFT_SCHEMA_VERSION,
    ruleset: "shadowrun5e.character-creation",
    playLevelId: "",
    priorityAssignments: { ...defaultPriorities },
    metatypeId: "",
    magicPathId: "",
    attributeRatings: startingAttributeRatings(""),
    specialPointSpend: { edge: 0, magic: 0, resonance: 0 },
    qualities: [],
    individualSkills: [],
    skillGroups: [],
    magic: {
      spells: [],
      rituals: [],
      preparations: [],
      complexForms: [],
      adeptPowers: [],
      purchasedPowerPoints: 0,
      boundSpirits: [],
      registeredSprites: []
    },
    resources: [],
    karmaConvertedToNuyen: 0,
    contacts: [],
    karmaPurchases: [],
    karmaCarryover: 0,
    approvals: [],
    biography: { legalName: "", streetName: "", age: "", gender: "", ethnicity: "", height: "", weight: "", description: "", background: "", lifestyleId: "" },
    confirmedSteps: []
  };
}

export function draftInstanceId(prefix: string, existingIds: string[]): string {
  let index = 1;
  while (existingIds.includes(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

export function naturalAttributeRatings(draft: CharacterDraft): Record<string, number> {
  if (!draft.metatypeId) return { ...draft.attributeRatings, edge: 0, magic: 0, resonance: 0 };
  const grant = magicPriorityGrant(draft.priorityAssignments.magic_or_resonance, draft.magicPathId);
  const path = magicPathOptions.find((option) => option.id === draft.magicPathId);
  const edge = metatypeAttributeRange(draft.metatypeId, "edge").minimum + (draft.specialPointSpend.edge || 0);
  const magic = path?.specialAttribute === "magic" ? Number(grant.magic || 0) + (draft.specialPointSpend.magic || 0) : 0;
  const resonance = path?.specialAttribute === "resonance" ? Number(grant.resonance || 0) + (draft.specialPointSpend.resonance || 0) : 0;
  return { ...draft.attributeRatings, edge, magic, resonance };
}

export function rebaseDraftCoreChoices(
  draft: CharacterDraft,
  updates: Partial<Pick<CharacterDraft, "priorityAssignments" | "metatypeId" | "magicPathId">>
): CharacterDraft {
  const next = { ...draft, ...updates };
  const metatypeRank = next.priorityAssignments.metatype;
  const magicRank = next.priorityAssignments.magic_or_resonance;
  const allowedMetatypes = availableMetatypes(metatypeRank);
  const metatypeId = allowedMetatypes.some((option) => option.id === next.metatypeId) ? next.metatypeId : "";
  const allowedPaths = availableMagicPaths(magicRank);
  const magicPathId = allowedPaths.some((option) => option.id === next.magicPathId) ? next.magicPathId : "";
  const attributesChanged = metatypeId !== draft.metatypeId || next.priorityAssignments.attributes !== draft.priorityAssignments.attributes;
  const specialChanged = metatypeId !== draft.metatypeId
    || next.priorityAssignments.metatype !== draft.priorityAssignments.metatype
    || magicRank !== draft.priorityAssignments.magic_or_resonance
    || magicPathId !== draft.magicPathId;
  const magicChanged = magicRank !== draft.priorityAssignments.magic_or_resonance || magicPathId !== draft.magicPathId;
  const individualSkills = magicChanged ? next.individualSkills.flatMap((skill) => {
    if (!(skill.grantedRating || 0)) return [skill];
    const withoutGrant = { ...skill, grantedRating: undefined };
    return (skill.priorityPoints || 0) > 0 || (skill.specializations || []).length ? [withoutGrant] : [];
  }) : next.individualSkills;
  const skillGroups = magicChanged ? next.skillGroups.flatMap((group) => {
    if (!(group.grantedRating || 0)) return [group];
    const withoutGrant = { ...group, grantedRating: undefined };
    return (group.priorityPoints || 0) > 0 ? [withoutGrant] : [];
  }) : next.skillGroups;
  return {
    ...next,
    metatypeId,
    magicPathId,
    ...(magicPathId !== "aspected-magician" ? { aspectedSkillGroup: undefined } : {}),
    attributeRatings: attributesChanged ? startingAttributeRatings(metatypeId) : next.attributeRatings,
    specialPointSpend: specialChanged ? { edge: 0, magic: 0, resonance: 0 } : next.specialPointSpend,
    individualSkills,
    skillGroups,
    magic: magicChanged ? {
      ...next.magic,
      spells: [], rituals: [], preparations: [], complexForms: [], adeptPowers: [],
      purchasedPowerPoints: 0, boundSpirits: [], registeredSprites: []
    } : next.magic
  };
}

export function assignPriority(draft: CharacterDraft, category: PriorityCategoryId, rank: PriorityRank): CharacterDraft {
  const currentRank = draft.priorityAssignments[category];
  const assignments = { ...draft.priorityAssignments };
  if (currentRank === rank) {
    assignments[category] = "";
  } else {
    const otherCategory = PRIORITY_CATEGORIES.find((candidate) => candidate !== category && assignments[candidate] === rank);
    if (otherCategory) assignments[otherCategory] = "";
    assignments[category] = rank;
  }
  return rebaseDraftCoreChoices(draft, { priorityAssignments: assignments });
}

function isPriorityAssignments(value: unknown): value is CharacterDraft["priorityAssignments"] {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const assignments = PRIORITY_CATEGORIES.map((category) => raw[category]);
  const selected = assignments.filter((rank): rank is PriorityRank => PRIORITY_RANKS.includes(rank as PriorityRank));
  return assignments.every((rank) => rank === "" || PRIORITY_RANKS.includes(rank as PriorityRank))
    && new Set(selected).size === selected.length;
}

function confirmedStepPrefix(value: unknown): ConfirmableCreationStepId[] {
  if (!Array.isArray(value)) return [];
  const selected = new Set(value.filter((step): step is ConfirmableCreationStepId =>
    CONFIRMABLE_CREATION_STEPS.some((candidate) => candidate.id === step)
  ));
  const prefix: ConfirmableCreationStepId[] = [];
  for (const step of CONFIRMABLE_CREATION_STEPS) {
    if (!selected.has(step.id)) break;
    prefix.push(step.id);
  }
  return prefix;
}

export function parseCharacterDraft(value: unknown): CharacterDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The selected file does not contain a character draft object.");
  const raw = value as Partial<CharacterDraft> & { schemaVersion?: number };
  if (raw.ruleset !== "shadowrun5e.character-creation") throw new Error("This file belongs to a different ruleset.");
  if (![1, 2, CHARACTER_DRAFT_SCHEMA_VERSION].includes(Number(raw.schemaVersion))) throw new Error(`Draft schema ${String(raw.schemaVersion)} is not supported by this version.`);
  if (!isPriorityAssignments(raw.priorityAssignments)) throw new Error("The draft does not contain a valid A–E priority assignment state.");
  const fallback = createEmptyCharacterDraft();
  const merged: CharacterDraft = {
    ...fallback,
    schemaVersion: CHARACTER_DRAFT_SCHEMA_VERSION,
    playLevelId: typeof raw.playLevelId === "string" ? raw.playLevelId : "",
    priorityAssignments: raw.priorityAssignments,
    metatypeId: typeof raw.metatypeId === "string" ? raw.metatypeId : "",
    magicPathId: typeof raw.magicPathId === "string" ? raw.magicPathId : "",
    ...(typeof raw.aspectedSkillGroup === "string" ? { aspectedSkillGroup: raw.aspectedSkillGroup } : {}),
    attributeRatings: { ...fallback.attributeRatings, ...raw.attributeRatings },
    specialPointSpend: { ...fallback.specialPointSpend, ...raw.specialPointSpend },
    magic: { ...fallback.magic, ...raw.magic },
    qualities: Array.isArray(raw.qualities) ? raw.qualities : [],
    individualSkills: Array.isArray(raw.individualSkills) ? raw.individualSkills : [],
    skillGroups: Array.isArray(raw.skillGroups) ? raw.skillGroups : [],
    resources: Array.isArray(raw.resources) ? raw.resources : [],
    contacts: Array.isArray(raw.contacts) ? raw.contacts : [],
    karmaPurchases: Array.isArray(raw.karmaPurchases) ? raw.karmaPurchases : [],
    approvals: Array.isArray(raw.approvals) ? raw.approvals : [],
    karmaConvertedToNuyen: Number(raw.karmaConvertedToNuyen) || 0,
    karmaCarryover: Number(raw.karmaCarryover) || 0,
    biography: { ...fallback.biography, ...(raw.biography && typeof raw.biography === "object" ? raw.biography : {}) },
    confirmedSteps: Number(raw.schemaVersion) >= 2 ? confirmedStepPrefix(raw.confirmedSteps) : []
  };
  if (merged.metatypeId && !metatypeOptions.some((option) => option.id === merged.metatypeId)) throw new Error(`Unknown metatype '${merged.metatypeId}'.`);
  if (merged.magicPathId && !magicPathOptions.some((option) => option.id === merged.magicPathId)) throw new Error(`Unknown Magic or Resonance path '${merged.magicPathId}'.`);
  return merged;
}
