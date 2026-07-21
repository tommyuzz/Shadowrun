import adeptPowerPayload from "../../adeptpowers.json";
import cyberdeckPayload from "../../cyberdecks.json";
import dronePayload from "../../drones.json";
import equipmentPayload from "../../equipment.json";
import lifestylePayload from "../../lifestyles.json";
import matrixPayload from "../../matrixinteraction.json";
import metatypePayload from "../../metatypes.json";
import priorityPayload from "../../priority_array.json";
import qualityPayload from "../../qualities.json";
import ritualPayload from "../../rituals.json";
import skillPayload from "../../skills.json";
import spellPayload from "../../spells.json";
import spiritPayload from "../../spirits.json";
import vehiclePayload from "../../vehicles.json";
import weaponPayload from "../../weapons.json";
import { characterCreationRules, stableCreationId, type ResourcePurchase } from "../character-creation-engine";

export type UnknownRecord = Record<string, unknown>;

export const PRIORITY_RANKS = ["A", "B", "C", "D", "E"] as const;
export type PriorityRank = typeof PRIORITY_RANKS[number];

export const PRIORITY_CATEGORIES = ["metatype", "attributes", "magic_or_resonance", "skills", "resources"] as const;
export type PriorityCategoryId = typeof PRIORITY_CATEGORIES[number];

export const PRIORITY_CATEGORY_LABELS: Record<PriorityCategoryId, string> = {
  metatype: "Metatype",
  attributes: "Attributes",
  magic_or_resonance: "Magic or Resonance",
  skills: "Skills",
  resources: "Resources"
};

export const ATTRIBUTE_IDS = ["body", "agility", "reaction", "strength", "willpower", "logic", "intuition", "charisma"] as const;
export type AttributeId = typeof ATTRIBUTE_IDS[number];
export const SPECIAL_ATTRIBUTE_IDS = ["edge", "magic", "resonance"] as const;
export type SpecialAttributeId = typeof SPECIAL_ATTRIBUTE_IDS[number];

const asRecord = (value: unknown): UnknownRecord => value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
const entries = (value: unknown): [string, UnknownRecord][] => Object.entries(asRecord(value)).map(([name, raw]) => [name, asRecord(raw)]);
const text = (value: unknown): string => value == null ? "" : String(value);
const numberValue = (value: unknown, fallback = 0): number => {
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) ? result : fallback;
};
const sourceCodes = (value: unknown): string[] => text(value || "CRB").split(/\s*(?:\/|,|;|\+)\s*/).map((code) => code.toUpperCase()).filter(Boolean);
const isCore = (raw: UnknownRecord): boolean => sourceCodes(raw.source).includes("CRB");

export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const priorityArray = asRecord(priorityPayload.priority_array);
export const playLevels = asRecord(priorityPayload.play_levels);
export const metatypes = asRecord(metatypePayload.metatypes);

export interface CatalogueOption {
  id: string;
  name: string;
  source: string;
  raw: UnknownRecord;
}

export interface MetatypeOption extends CatalogueOption {
  attributes: Record<string, { minimum: number; maximum: number }>;
}

export const playLevelOptions = entries(playLevels).map(([id, raw]) => ({
  id,
  name: text(raw.name) || titleCase(id),
  description: text(raw.description),
  startingKarma: numberValue(raw.starting_karma),
  maximumAvailability: numberValue(raw.maximum_availability),
  maximumDeviceRating: numberValue(raw.maximum_device_rating)
}));

export const metatypeOptions: MetatypeOption[] = entries(metatypes).filter(([, raw]) => isCore(raw)).map(([name, raw]) => ({
  id: stableCreationId(name),
  name,
  source: text(raw.source) || "CRB",
  raw,
  attributes: Object.fromEntries(Object.entries(asRecord(raw.attributes)).flatMap(([id, range]) => {
    const configured = asRecord(range);
    return configured.minimum == null || configured.maximum == null ? [] : [[id, { minimum: numberValue(configured.minimum), maximum: numberValue(configured.maximum) }]];
  }))
}));

export const magicPathOptions = Object.entries(asRecord(characterCreationRules.magic_paths)).map(([id, rawValue]) => {
  const raw = asRecord(rawValue);
  return {
    id,
    name: id === "mundane" ? "Mundane" : titleCase(id),
    sourceOption: typeof raw.source_option === "string" ? raw.source_option : null,
    specialAttribute: typeof raw.uses_special_attribute === "string" ? raw.uses_special_attribute : null,
    raw
  };
});

export function priorityRow(rank: string): UnknownRecord {
  return asRecord(priorityArray[rank]);
}

export function availableMetatypes(rank: string): MetatypeOption[] {
  const available = asRecord(priorityRow(rank).metatype);
  return metatypeOptions.filter((metatype) => metatype.name in available);
}

export function availableMagicPaths(rank: string) {
  const options = asRecord(priorityRow(rank).magic_or_resonance);
  return magicPathOptions.filter((path) => path.id === "mundane"
    ? rank === text(path.raw.required_priority)
    : Boolean(path.sourceOption && path.sourceOption in options));
}

export function metatypeSpecialPointBudget(rank: string, metatypeId: string): number {
  const metatype = metatypeOptions.find((option) => option.id === metatypeId);
  return metatype ? numberValue(asRecord(priorityRow(rank).metatype)[metatype.name]) : 0;
}

export function attributePointBudget(rank: string): number {
  return numberValue(priorityRow(rank).attributes);
}

export function skillPointBudget(rank: string): { individual: number; groups: number } {
  const skills = asRecord(priorityRow(rank).skills);
  return { individual: numberValue(skills.skill_points), groups: numberValue(skills.skill_group_points) };
}

export function resourceBudget(rank: string, playLevelId: string): number {
  return parseNuyenValue(asRecord(priorityRow(rank).resources)[playLevelId]) ?? 0;
}

export function magicPriorityGrant(rank: string, magicPathId: string): UnknownRecord {
  const path = magicPathOptions.find((option) => option.id === magicPathId);
  if (!path?.sourceOption) return {};
  return asRecord(asRecord(priorityRow(rank).magic_or_resonance)[path.sourceOption]);
}

export function metatypeAttributeRange(metatypeId: string, attributeId: string): { minimum: number; maximum: number } {
  return metatypeOptions.find((option) => option.id === metatypeId)?.attributes[attributeId] || { minimum: attributeId === "edge" ? 1 : 0, maximum: 6 };
}

export interface SkillCatalogueEntry extends CatalogueOption {
  attribute: string;
  groupId?: string;
  groupName?: string;
}

export const skillCatalogue: SkillCatalogueEntry[] = entries(skillPayload.skills).filter(([, raw]) => isCore(raw)).map(([name, raw]) => {
  const groupName = text(raw.skillgroup);
  return {
    id: stableCreationId(name),
    name: titleCase(name),
    attribute: text(raw.attribute),
    ...(groupName ? { groupId: stableCreationId(groupName), groupName: titleCase(groupName) } : {}),
    source: text(raw.source) || "CRB",
    raw
  };
});

export interface SkillGroupCatalogueEntry {
  id: string;
  name: string;
  skillIds: string[];
}

export const skillGroupCatalogue: SkillGroupCatalogueEntry[] = Array.from(skillCatalogue.reduce((groups, skill) => {
  if (!skill.groupId || !skill.groupName) return groups;
  const existing = groups.get(skill.groupId) || { id: skill.groupId, name: skill.groupName, skillIds: [] };
  existing.skillIds.push(skill.id);
  groups.set(skill.groupId, existing);
  return groups;
}, new Map<string, SkillGroupCatalogueEntry>()).values()).sort((a, b) => a.name.localeCompare(b.name));

export interface QualityCatalogueEntry extends CatalogueOption {
  kind: "positive" | "negative";
  category: string;
  qualityType: string;
  constraint: UnknownRecord;
}

const qualityConstraints = asRecord(characterCreationRules.quality_rules.constraints);
const qualityEntries = (collection: unknown, kind: QualityCatalogueEntry["kind"]): QualityCatalogueEntry[] => entries(collection)
  .filter(([, raw]) => isCore(raw))
  .map(([name, raw]) => {
    const id = stableCreationId(name);
    return {
      id,
      name,
      kind,
      category: text(raw.category),
      qualityType: text(raw.quality_type),
      source: text(raw.source) || "CRB",
      raw,
      constraint: asRecord(qualityConstraints[id])
    };
  });

export const qualityCatalogue = [
  ...qualityEntries(qualityPayload.positive_qualities, "positive"),
  ...qualityEntries(qualityPayload.negative_qualities, "negative")
];

export function qualityOptions(quality: QualityCatalogueEntry, field: string): Array<{ value: string; label: string }> {
  return Object.keys(asRecord(quality.raw[field])).map((value) => ({ value, label: value }));
}

export const testedMatrixActionOptions = entries(matrixPayload.matrix_actions)
  .filter(([, raw]) => isCore(raw) && !/^none\b/i.test(text(raw.test)))
  .map(([name, raw]) => ({ id: stableCreationId(name), name, source: text(raw.source) || "CRB", raw }));

export const spiritTypeOptions = entries(spiritPayload.spirits).filter(([, raw]) => isCore(raw)).map(([name, raw]) => ({ id: stableCreationId(name), name, source: text(raw.source) || "CRB", raw }));

export interface FormulaCatalogueEntry extends CatalogueOption {
  category: string;
  detail?: string;
}

export const spellCatalogue: FormulaCatalogueEntry[] = Object.entries(asRecord(spellPayload)).flatMap(([category, categoryValue]) => entries(asRecord(categoryValue).spells)
  .filter(([, raw]) => isCore(raw))
  .map(([name, raw]) => ({ id: stableCreationId(`${category}-${name}`), name: titleCase(name), category: titleCase(category), detail: text(raw.drain), source: text(raw.source) || "CRB", raw })));

export const ritualCatalogue: FormulaCatalogueEntry[] = entries(ritualPayload.rituals).filter(([, raw]) => isCore(raw)).map(([name, raw]) => ({
  id: stableCreationId(name), name, category: "Ritual", detail: text(raw.ritual_time), source: text(raw.source) || "CRB", raw
}));

export const complexFormCatalogue: FormulaCatalogueEntry[] = entries(matrixPayload.complex_forms).filter(([, raw]) => isCore(raw)).map(([name, raw]) => ({
  id: stableCreationId(name), name, category: "Complex Form", detail: text(raw.fading_value), source: text(raw.source) || "CRB", raw
}));

export interface AdeptPowerCatalogueEntry extends CatalogueOption {
  unitCosts: number[];
  rated: boolean;
  maximum: string;
}

export const adeptPowerCatalogue: AdeptPowerCatalogueEntry[] = entries(adeptPowerPayload.powers).filter(([, raw]) => isCore(raw)).map(([name, raw]) => ({
  id: stableCreationId(name),
  name: titleCase(name),
  source: text(raw.source) || "CRB",
  raw,
  unitCosts: Array.isArray(raw.costValues) ? raw.costValues.map((value) => numberValue(value)).filter((value) => value > 0) : [],
  rated: /per level|3 levels|per sense/i.test(`${text(raw.cost)} ${text(raw.rating)}`),
  maximum: text(raw.maximum)
}));

export function adeptPowerCost(powerId: string, rating = 1): number | null {
  const power = adeptPowerCatalogue.find((entry) => entry.id === powerId);
  if (!power || !power.unitCosts.length || !Number.isInteger(rating) || rating < 1) return null;
  if (power.unitCosts.length > 1) return power.unitCosts[Math.min(rating, power.unitCosts.length) - 1] ?? null;
  return power.rated ? power.unitCosts[0] * rating : power.unitCosts[0];
}

export type ResourceKind = "gear" | "weapon" | "augmentation" | "lifestyle" | "vehicle" | "drone";

export interface ResourceCatalogueEntry extends CatalogueOption {
  catalogueId: string;
  collection: string;
  category: string;
  subcategory: string;
  kind: ResourceKind;
  ratingMinimum?: number;
  ratingMaximum?: number;
  isFocus: boolean;
  augmentationType?: "cyberware" | "bioware";
  capabilityIds: string[];
}

export interface ResourceSelectionShape {
  instanceId: string;
  catalogueId: string;
  quantity: number;
  rating?: number;
  grade?: "standard" | "alphaware";
  manualCost?: number;
  manualAvailability?: number;
  manualEssence?: number;
  attributeBonuses?: Record<string, number>;
  bonded?: boolean;
  bondKarmaCost?: number;
}

export interface ResolvedResourceSelection {
  entry?: ResourceCatalogueEntry;
  purchase: ResourcePurchase;
  issues: Array<{ id: string; message: string; field: "cost" | "availability" | "essence" | "rating" }>;
}

function ratingRange(raw: UnknownRecord): { minimum?: number; maximum?: number } {
  const authored = text(raw.rating || raw.force);
  const range = authored.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return { minimum: Number(range[1]), maximum: Number(range[2]) };
  if (/variable/i.test(authored)) return { minimum: 1, maximum: 6 };
  return {};
}

function resourceEntries(collection: string, value: unknown, fallbackCategory: string, kindFor: (raw: UnknownRecord) => ResourceKind): ResourceCatalogueEntry[] {
  return entries(value).filter(([, raw]) => isCore(raw)).map(([name, raw]) => {
    const category = text(raw.category) || fallbackCategory;
    const subcategory = text(raw.subcategory);
    const kind = kindFor(raw);
    const range = ratingRange(raw);
    const id = stableCreationId(name);
    const augmentationType = kind === "augmentation" ? (/bioware/i.test(subcategory) ? "bioware" : "cyberware") : undefined;
    const capabilityIds: string[] = [];
    if (collection === "cyberdecks") capabilityIds.push("decker");
    if (/sim module|trodes|simrig/i.test(name)) capabilityIds.push("btl-interface");
    if (/pain editor/i.test(name)) capabilityIds.push("pain-editor-bioware");
    if (/damage compensator/i.test(name)) capabilityIds.push("damage-compensator-bioware");
    return {
      id,
      catalogueId: `${collection}:${id}`,
      name: titleCase(name),
      source: text(raw.source) || "CRB",
      raw,
      collection,
      category,
      subcategory,
      kind,
      ...range,
      isFocus: /foci/i.test(subcategory),
      ...(augmentationType ? { augmentationType } : {}),
      capabilityIds
    };
  });
}

export const resourceCatalogue: ResourceCatalogueEntry[] = [
  ...resourceEntries("equipment", equipmentPayload.equipment, "Equipment", (raw) => text(raw.category) === "Augmentations" ? "augmentation" : "gear"),
  ...resourceEntries("weapons", weaponPayload.weapons, "Weapons", () => "weapon"),
  ...resourceEntries("cyberdecks", cyberdeckPayload.cyberdecks, "Cyberdecks", () => "gear"),
  ...resourceEntries("vehicles", vehiclePayload.vehicles, "Vehicles", () => "vehicle"),
  ...resourceEntries("drones", dronePayload.drones, "Drones", () => "drone"),
  ...resourceEntries("lifestyles", lifestylePayload.lifestyles, "Lifestyles", () => "lifestyle")
].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

export function parseNuyenValue(value: unknown): number | null {
  const authored = text(value).trim();
  if (/^free$/i.test(authored)) return 0;
  const match = authored.replace(/,/g, "").match(/(?:^|[^\d])([0-9]+(?:\.[0-9]+)?)(?=\s*¥|\s*$)/);
  return match ? Number(match[1]) : null;
}

function labelledRatingValue(authored: string, rating: number): number | null {
  const matcher = /Rating\s+(\d+)\s*:\s*([\d,]+(?:\.\d+)?)/gi;
  for (const match of authored.matchAll(matcher)) if (Number(match[1]) === rating) return Number(match[2].replace(/,/g, ""));
  return null;
}

function slashRatingValue(authored: string, rating: number): number | null {
  const values = authored.split(/\s*\/\s*/).map((part) => Number(part.replace(/,/g, "").match(/[\d.]+/)?.[0])).filter(Number.isFinite);
  return values.length >= rating ? values[rating - 1] : null;
}

function multipliedRatingValue(authored: string, rating: number, variable: "Rating" | "Force"): number | null {
  const normalized = authored.replace(/,/g, "").replace(/×/g, "x");
  const direct = normalized.match(new RegExp(`${variable}\\s*x\\s*([0-9]+(?:\\.[0-9]+)?)`, "i"));
  if (direct) return rating * Number(direct[1]);
  const reverse = normalized.match(new RegExp(`([0-9]+(?:\\.[0-9]+)?)\\s*x\\s*${variable}`, "i"));
  if (reverse) return rating * Number(reverse[1]);
  if (new RegExp(`^\\(?${variable}\\)?(?:\\s*[RF])?$`, "i").test(normalized.trim())) return rating;
  return null;
}

function resolveRatedValue(value: unknown, rating: number | undefined, variable: "Rating" | "Force"): number | null {
  const authored = text(value).trim();
  if (!authored || authored === "—" || authored === "-") return 0;
  if (rating != null) {
    const labelled = labelledRatingValue(authored, rating);
    if (labelled != null) return labelled;
    const multiplied = multipliedRatingValue(authored, rating, variable);
    if (multiplied != null) return multiplied;
    if (authored.includes("/")) {
      const slashed = slashRatingValue(authored, rating);
      if (slashed != null) return slashed;
    }
  }
  if (/\b(?:Rating|Force|Capacity|variable|upward)\b|\bto\b|\bor more\b|\+\s*[^\d]/i.test(authored)) return null;
  const parsed = parseNuyenValue(authored) ?? Number(authored.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveCatalogueCost(entry: ResourceCatalogueEntry, rating?: number): number | null {
  const value = entry.kind === "lifestyle" ? entry.raw.monthly_cost : entry.raw.cost;
  return resolveRatedValue(value, rating, entry.isFocus ? "Force" : "Rating");
}

export function resolveCatalogueAvailability(entry: ResourceCatalogueEntry, rating?: number): number | null {
  const authored = text(entry.raw.availability);
  if (!authored || authored === "—") return 0;
  return resolveRatedValue(authored.replace(/[RF]\s*$/i, ""), rating, entry.isFocus ? "Force" : "Rating");
}

export function resolveCatalogueEssence(entry: ResourceCatalogueEntry, rating?: number): number | null {
  if (entry.kind !== "augmentation") return 0;
  return resolveRatedValue(entry.raw.essence, rating, "Rating");
}

export function resolveCatalogueDeviceRating(entry: ResourceCatalogueEntry, rating?: number): number | undefined {
  const authored = entry.raw.device_rating;
  if (authored == null || authored === "") return undefined;
  const value = resolveRatedValue(authored, rating, "Rating");
  return value == null ? undefined : value;
}

export function lifestyleCostMultiplier(metatypeId: string): number {
  return numberValue(asRecord(characterCreationRules.resource_rules.lifestyle_cost_multipliers)[metatypeId], 1);
}

export function resolveResourceSelection(selection: ResourceSelectionShape, metatypeId: string): ResolvedResourceSelection {
  const entry = resourceCatalogue.find((item) => item.catalogueId === selection.catalogueId);
  const issues: ResolvedResourceSelection["issues"] = [];
  const quantity = Number.isInteger(selection.quantity) && selection.quantity > 0 ? selection.quantity : 1;
  if (!entry) return {
    purchase: { id: selection.instanceId, cost: Number(selection.manualCost) || 0 },
    issues: [{ id: "catalogue.resource-known", message: `The selected catalogue record '${selection.catalogueId}' is no longer available.`, field: "cost" }]
  };
  if (entry.ratingMinimum != null && (selection.rating == null || selection.rating < entry.ratingMinimum || (entry.ratingMaximum != null && selection.rating > entry.ratingMaximum))) {
    issues.push({ id: "catalogue.resource-rating", message: `${entry.name} requires a rating from ${entry.ratingMinimum} to ${entry.ratingMaximum}.`, field: "rating" });
  }
  const rawCost = selection.manualCost ?? resolveCatalogueCost(entry, selection.rating);
  if (rawCost == null || !Number.isFinite(rawCost)) issues.push({ id: "catalogue.resource-cost", message: `${entry.name} has authored variable pricing. Enter the configured per-item cost.`, field: "cost" });
  const rawAvailability = selection.manualAvailability ?? resolveCatalogueAvailability(entry, selection.rating);
  if (rawAvailability == null || !Number.isFinite(rawAvailability)) issues.push({ id: "catalogue.resource-availability", message: `${entry.name} has variable Availability. Enter the configured numeric value.`, field: "availability" });
  const rawEssence = selection.manualEssence ?? resolveCatalogueEssence(entry, selection.rating);
  if (entry.kind === "augmentation" && (rawEssence == null || !Number.isFinite(rawEssence))) issues.push({ id: "catalogue.resource-essence", message: `${entry.name} has variable Essence. Enter the configured per-item Essence cost.`, field: "essence" });

  const grade = entry.kind === "augmentation" ? selection.grade || "standard" : undefined;
  const gradeCostMultiplier = grade === "alphaware" ? 1.2 : 1;
  const gradeEssenceMultiplier = grade === "alphaware" ? 0.8 : 1;
  const baseLineCost = (rawCost || 0) * quantity;
  const metatypeMultiplier = entry.kind === "lifestyle" ? lifestyleCostMultiplier(metatypeId) : 1;
  const cost = Math.round(baseLineCost * gradeCostMultiplier * metatypeMultiplier);
  const essenceCost = entry.kind === "augmentation" ? Math.round((rawEssence || 0) * quantity * gradeEssenceMultiplier * 1_000_000) / 1_000_000 : undefined;
  const deviceRating = resolveCatalogueDeviceRating(entry, selection.rating);
  const purchase: ResourcePurchase = {
    id: selection.instanceId,
    kind: entry.kind === "augmentation" ? "augmentation" : entry.kind === "lifestyle" ? "lifestyle" : entry.kind === "weapon" ? "weapon" : "gear",
    cost,
    ...(entry.kind === "lifestyle" ? { baseCost: baseLineCost } : {}),
    ...(rawAvailability != null ? { availability: rawAvailability } : {}),
    ...(deviceRating != null ? { deviceRating } : {}),
    ...(grade ? { augmentationGrade: grade } : {}),
    ...(entry.augmentationType ? { augmentationType: entry.augmentationType } : {}),
    ...(essenceCost != null ? { essenceCost } : {}),
    ...(selection.attributeBonuses && Object.keys(selection.attributeBonuses).length ? { attributeBonuses: selection.attributeBonuses } : {})
  };
  return { entry, purchase, issues };
}
