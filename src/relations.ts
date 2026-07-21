import { slug } from "./data";
import type { RawRecord, ReferenceData, ReferenceRecord } from "./types";

export interface EquipmentEnhancement {
  id: string;
  name: string;
  group: string;
  source: string;
  raw: RawRecord;
}

const asObject = (value: unknown): RawRecord => value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {};
const asStrings = (value: unknown): string[] => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
const text = (value: unknown): string => value == null ? "" : String(value);

function isWeapon(record: ReferenceRecord): boolean {
  return record.category !== "Weapon Support";
}

function weaponText(record: ReferenceRecord): string {
  return [record.name, record.category, record.subcategory, record.raw.skill, record.raw.ammo, record.raw.description, record.raw.features]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .join(" ");
}

function firearmOrHeavy(record: ReferenceRecord): boolean {
  if (!isWeapon(record) || !["Firearms", "Heavy Weapons"].includes(record.category)) return false;
  if (!record.raw.ammo || !record.raw.mode) return false;
  return !["Laser Weapons", "Flamethrowers"].includes(record.subcategory || "");
}

function conventionalFirearm(record: ReferenceRecord): boolean {
  if (!firearmOrHeavy(record)) return false;
  return !["Tasers", "Special Weapons", "Exotic Ranged Weapons", "Laser Weapons", "Flamethrowers", "Cannons/Launchers"].includes(record.subcategory || "");
}

function longGun(record: ReferenceRecord): boolean {
  return firearmOrHeavy(record) && [
    "Submachine Guns",
    "Assault Rifles",
    "Sniper Rifles",
    "Shotguns",
    "Machine Guns",
    "Cannons/Launchers"
  ].includes(record.subcategory || "");
}

function pistol(record: ReferenceRecord): boolean {
  return firearmOrHeavy(record) && (["Tasers", "Hold-Outs", "Light Pistols", "Heavy Pistols", "Machine Pistols"].includes(record.subcategory || "") || /pistol/i.test(record.name));
}

export function supportAppliesToWeapon(support: ReferenceRecord, weapon: ReferenceRecord): boolean {
  if (support.category !== "Weapon Support" || !isWeapon(weapon)) return false;
  const profile = text(support.raw.compatibility_profile);
  const searchable = weaponText(weapon);
  const ammo = text(weapon.raw.ammo);

  switch (profile) {
    case "grenade-launcher": return firearmOrHeavy(weapon) && /grenade launcher|\bmgl\b|underbarrel grenade/i.test(searchable);
    case "pistol": return pistol(weapon);
    case "small-pistol": return firearmOrHeavy(weapon) && ["Hold-Outs", "Light Pistols"].includes(weapon.subcategory || "");
    case "long-gun": return longGun(weapon);
    case "shoulder-fired": return longGun(weapon);
    case "heavy-or-long-gun": return weapon.category === "Heavy Weapons" || longGun(weapon);
    case "conventional-firearm": return conventionalFirearm(weapon);
    case "firearm-or-heavy": return firearmOrHeavy(weapon);
    case "detachable-clip": return firearmOrHeavy(weapon) && /\(c\)|\bclip\b/i.test(ammo);
    case "cylinder": return firearmOrHeavy(weapon) && /\(cy\)|cylinder/i.test(ammo);
    case "bow": return weapon.subcategory === "Bows";
    case "crossbow": return weapon.subcategory === "Crossbows" || /crossbow/i.test(weapon.name);
    case "projectile-weapon": return weapon.category === "Projectile" && ["Bows", "Crossbows", "Projectile Weapons"].includes(weapon.subcategory || "");
    case "assault-cannon": return weapon.subcategory === "Cannons/Launchers" && /assault cannon|\bcannon\b/i.test(searchable);
    case "dart-weapon": return firearmOrHeavy(weapon) && /dart/i.test(searchable);
    case "taser": return weapon.subcategory === "Tasers";
    case "shotgun": return weapon.subcategory === "Shotguns";
    case "ballistic-firearm": return conventionalFirearm(weapon);
    default: return false;
  }
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
  const labels: Record<string, string> = {
    "grenade-launcher": "Grenade launchers",
    pistol: "Pistol-sized weapons",
    "small-pistol": "Hold-outs and light pistols",
    "long-gun": "Long guns",
    "shoulder-fired": "Shoulder-fired weapons",
    "heavy-or-long-gun": "Long guns and heavy weapons",
    "conventional-firearm": "Conventional firearms",
    "firearm-or-heavy": "Firearms and heavy weapons",
    "detachable-clip": "Clip-fed weapons",
    cylinder: "Cylinder-fed weapons",
    bow: "Bows",
    crossbow: "Crossbows",
    "projectile-weapon": "Projectile weapons",
    "assault-cannon": "Assault cannons",
    "dart-weapon": "Dart weapons",
    taser: "Tasers",
    shotgun: "Shotguns",
    "ballistic-firearm": "Ballistic firearms"
  };
  return labels[text(support.raw.compatibility_profile)] || "Compatible weapons";
}

export function equipmentEnhancementsFor(record: ReferenceRecord, data: ReferenceData): EquipmentEnhancement[] {
  const enhancements = asObject(data.payload.enhancements);
  return Object.entries(enhancements).flatMap(([name, value]) => {
    const raw = asObject(value);
    const compatibleItems = asStrings(raw.compatible_items);
    const compatibleSubcategories = asStrings(raw.compatible_subcategories);
    const matches = compatibleItems.includes(record.name) || Boolean(record.subcategory && compatibleSubcategories.includes(record.subcategory));
    if (!matches) return [];
    if (raw.enhancement_group === "Armor modifications" && /shield/i.test(record.name)) return [];
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
