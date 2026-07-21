import { slug } from "./data";
import { compileRule, relationshipRules, ruleValueAtPath } from "./rule-engine";
import type { RawRecord, ReferenceData, ReferenceRecord } from "./types";

export interface EquipmentEnhancement {
  id: string;
  name: string;
  group: string;
  source: string;
  raw: RawRecord;
}

const asObject = (value: unknown): RawRecord => value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {};
const text = (value: unknown): string => value == null ? "" : String(value);

const supportConfiguration = relationshipRules.weapon_support;
const supportPredicates = new Map(
  Object.entries(supportConfiguration.profiles).map(([profile, configuration]) => [
    profile,
    compileRule(configuration.rule, supportConfiguration.definitions)
  ])
);
const equipmentMatch = compileRule(relationshipRules.equipment_enhancements.match);
const equipmentExclusions = relationshipRules.equipment_enhancements.exclusions.map((exclusion) => ({
  ...exclusion,
  predicate: compileRule(exclusion.when)
}));

export function supportAppliesToWeapon(support: ReferenceRecord, weapon: ReferenceRecord): boolean {
  if (support.category !== "Weapon Support" || weapon.category === "Weapon Support") return false;
  const profile = text(ruleValueAtPath(support, supportConfiguration.profile_field));
  return supportPredicates.get(profile)?.({ support, weapon }) || false;
}

export function supportForWeapon(weapon: ReferenceRecord, data: ReferenceData): ReferenceRecord[] {
  return data.records
    .filter((record) => supportAppliesToWeapon(record, weapon))
    .sort((left, right) => (left.subcategory || "").localeCompare(right.subcategory || "", "en-GB") || left.name.localeCompare(right.name, "en-GB"));
}

export function weaponsForSupport(support: ReferenceRecord, data: ReferenceData): ReferenceRecord[] {
  return data.records
    .filter((record) => supportAppliesToWeapon(support, record))
    .sort((left, right) => (left.subcategory || "").localeCompare(right.subcategory || "", "en-GB") || left.name.localeCompare(right.name, "en-GB"));
}

export function supportCompatibilityLabel(support: ReferenceRecord): string {
  const profile = text(ruleValueAtPath(support, supportConfiguration.profile_field));
  return supportConfiguration.profiles[profile]?.display_label || supportConfiguration.fallback_label;
}

export function equipmentEnhancementsFor(record: ReferenceRecord, data: ReferenceData): EquipmentEnhancement[] {
  const enhancements = asObject(data.payload.enhancements);
  return Object.entries(enhancements).flatMap(([name, value]) => {
    const raw = asObject(value);
    const context = { equipment: record, enhancement: raw };
    if (!equipmentMatch(context)) return [];
    if (equipmentExclusions.some((exclusion) => exclusion.predicate(context))) return [];
    return [{
      id: slug(name),
      name,
      group: text(raw.enhancement_group) || "Enhancements",
      source: text(raw.source) || "CRB",
      raw
    }];
  }).sort((left, right) => left.group.localeCompare(right.group, "en-GB") || left.name.localeCompare(right.name, "en-GB"));
}

export function parseFixedNuyen(value: unknown): number | null {
  const normalized = text(value).trim().replace(/^\+/, "").replace(/,/g, "");
  const match = normalized.match(/^(\d+(?:\.\d+)?)¥$/);
  return match ? Number(match[1]) : null;
}
