import { readFile, writeFile } from "node:fs/promises";

const equipmentPath = new URL("../equipment.json", import.meta.url);
const weaponsPath = new URL("../weapons.json", import.meta.url);
const rulesPath = new URL("../relationship_rules.json", import.meta.url);

const equipmentPayload = JSON.parse(await readFile(equipmentPath, "utf8"));
const weaponPayload = JSON.parse(await readFile(weaponsPath, "utf8"));
const relationshipRules = JSON.parse(await readFile(rulesPath, "utf8"));

const equipment = equipmentPayload.equipment || {};
const weaponSupport = { ...weaponPayload.weapon_support };
const enhancements = { ...equipmentPayload.enhancements };
const supportProfiles = relationshipRules.weapon_support?.profiles || {};
const supportProfilePath = relationshipRules.weapon_support?.profile_field?.replace(/^raw\./, "") || "compatibility_profile";

function valueAtPath(root, path) {
  return path.split(".").reduce((value, segment) => value && typeof value === "object" && !Array.isArray(value) ? value[segment] : undefined, root);
}

function validateSupport(name, item) {
  const profile = valueAtPath(item, supportProfilePath);
  if (typeof profile !== "string" || !supportProfiles[profile]) {
    throw new Error(`Weapon Support '${name}' must declare a compatibility_profile from relationship_rules.json before it can be organized.`);
  }
}

function validateEnhancement(name, item) {
  const hasItems = Array.isArray(item.compatible_items) && item.compatible_items.length > 0;
  const hasSubcategories = Array.isArray(item.compatible_subcategories) && item.compatible_subcategories.length > 0;
  if (typeof item.enhancement_group !== "string" || !item.enhancement_group.trim()) {
    throw new Error(`Enhancement '${name}' must declare enhancement_group before it can be organized.`);
  }
  if (!hasItems && !hasSubcategories) {
    throw new Error(`Enhancement '${name}' must declare compatible_items or compatible_subcategories before it can be organized.`);
  }
}

for (const [name, item] of Object.entries(weaponSupport)) validateSupport(name, item);
for (const [name, item] of Object.entries(enhancements)) validateEnhancement(name, item);

let movedSupport = 0;
let movedEnhancements = 0;
for (const [name, item] of Object.entries(equipment)) {
  if (item.category === "Weapon Support") {
    validateSupport(name, item);
    weaponSupport[name] = item;
    delete equipment[name];
    movedSupport += 1;
    continue;
  }
  if (item.enhancement_group) {
    validateEnhancement(name, item);
    enhancements[name] = item;
    delete equipment[name];
    movedEnhancements += 1;
  }
}

const supportDefinition = equipmentPayload.category?.["Weapon Support"];
if (supportDefinition) {
  weaponPayload.category = { ...weaponPayload.category, "Weapon Support": weaponPayload.category?.["Weapon Support"] || supportDefinition };
  delete equipmentPayload.category["Weapon Support"];
}

weaponPayload.weapon_support = weaponSupport;
equipmentPayload.equipment = equipment;
equipmentPayload.enhancements = enhancements;

await Promise.all([
  writeFile(equipmentPath, `${JSON.stringify(equipmentPayload, null, 2)}\n`, "utf8"),
  writeFile(weaponsPath, `${JSON.stringify(weaponPayload, null, 2)}\n`, "utf8")
]);

console.log(`Verified ${Object.keys(weaponSupport).length} weapon-support records and ${Object.keys(enhancements).length} equipment enhancements; moved ${movedSupport + movedEnhancements} structured records.`);
