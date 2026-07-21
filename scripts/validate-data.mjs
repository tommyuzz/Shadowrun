import { readFile } from "node:fs/promises";

const collections = {
  adeptpowers: ["powers"],
  attributes: ["attributes"],
  cyberdecks: ["cyberdecks", "software"],
  drones: ["drones"],
  equipment: ["equipment", "enhancements"],
  generic_actions: ["free_actions", "simple_actions", "complex_actions", "reload_methods"],
  lifestyles: ["lifestyles"],
  lifestyle_extras: ["lifestyle_extras", "lifestyle_options"],
  matrixinteraction: ["matrix_actions", "complex_forms"],
  metatypes: ["metatypes"],
  priority_array: ["priority_array"],
  qualities: ["positive_qualities", "negative_qualities"],
  rituals: ["rituals"],
  skills: ["skills"],
  spirits: ["spirits"],
  sprites: ["sprites"],
  vehicles: ["vehicles"],
  weapons: ["weapons", "weapon_support"]
};

let count = 0;
for (const [file, required] of Object.entries(collections)) {
  const payload = JSON.parse(await readFile(`${file}.json`, "utf8"));
  for (const key of required) {
    if (!payload[key] || typeof payload[key] !== "object" || Array.isArray(payload[key])) throw new Error(`${file}.json: missing object '${key}'`);
    for (const [name, record] of Object.entries(payload[key])) {
      if (!name.trim()) throw new Error(`${file}.json: blank record name in '${key}'`);
      if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error(`${file}.json: '${name}' is not a record object`);
      count += 1;
    }
  }
}

const qualityPayload = JSON.parse(await readFile("qualities.json", "utf8"));
if (!qualityPayload.quality_types || typeof qualityPayload.quality_types !== "object" || Array.isArray(qualityPayload.quality_types)) throw new Error("qualities.json: missing object 'quality_types'");
for (const [name, description] of Object.entries(qualityPayload.quality_types)) {
  if (!name.trim() || typeof description !== "string" || !description.trim()) throw new Error(`qualities.json: invalid quality type definition '${name}'`);
}

const actionPayload = JSON.parse(await readFile("generic_actions.json", "utf8"));
for (const category of ["Free Actions", "Simple Actions", "Complex Actions", "Unlisted Actions", "Scope"]) {
  if (typeof actionPayload.action_rules?.[category] !== "string" || !actionPayload.action_rules[category].trim()) throw new Error(`generic_actions.json: missing action rule '${category}'`);
}
for (const [collection, expectedCategory] of [["free_actions", "Free Actions"], ["simple_actions", "Simple Actions"], ["complex_actions", "Complex Actions"]]) {
  for (const [name, action] of Object.entries(actionPayload[collection])) {
    if (action.category !== expectedCategory) throw new Error(`generic_actions.json: '${name}' has category '${action.category}', expected '${expectedCategory}'`);
    if (!Array.isArray(action.requirements)) throw new Error(`generic_actions.json: '${name}' has no requirements array`);
    for (const field of ["test", "attack_restriction", "description", "source"]) if (typeof action[field] !== "string" || !action[field].trim()) throw new Error(`generic_actions.json: '${name}' is missing '${field}'`);
  }
}

const equipmentPayload = JSON.parse(await readFile("equipment.json", "utf8"));
if (Object.values(equipmentPayload.equipment).some((record) => record.category === "Weapon Support")) throw new Error("equipment.json: Weapon Support must live in weapons.json");
for (const [name, enhancement] of Object.entries(equipmentPayload.enhancements)) {
  const hasItems = Array.isArray(enhancement.compatible_items) && enhancement.compatible_items.length;
  const hasSubcategories = Array.isArray(enhancement.compatible_subcategories) && enhancement.compatible_subcategories.length;
  if (!hasItems && !hasSubcategories) throw new Error(`equipment.json: enhancement '${name}' has no compatibility target`);
  if (typeof enhancement.enhancement_group !== "string" || !enhancement.enhancement_group.trim()) throw new Error(`equipment.json: enhancement '${name}' has no group`);
}

const weaponPayload = JSON.parse(await readFile("weapons.json", "utf8"));
for (const [name, support] of Object.entries(weaponPayload.weapon_support)) {
  if (support.category !== "Weapon Support") throw new Error(`weapons.json: support '${name}' has invalid category`);
  if (typeof support.compatibility_profile !== "string" || !support.compatibility_profile.trim()) throw new Error(`weapons.json: support '${name}' has no compatibility profile`);
}

const attributePayload = JSON.parse(await readFile("attributes.json", "utf8"));
const attributeCategories = ["Physical", "Mental", "Special"];
if (!attributePayload.categories || typeof attributePayload.categories !== "object" || Array.isArray(attributePayload.categories)) throw new Error("attributes.json: missing object 'categories'");
if (!attributePayload.benchmark_scale || typeof attributePayload.benchmark_scale !== "object" || Array.isArray(attributePayload.benchmark_scale)) throw new Error("attributes.json: missing object 'benchmark_scale'");
for (const category of attributeCategories) {
  if (typeof attributePayload.categories[category] !== "string" || !attributePayload.categories[category].trim()) throw new Error(`attributes.json: missing category definition '${category}'`);
}
for (const [name, attribute] of Object.entries(attributePayload.attributes)) {
  if (typeof attribute.abbreviation !== "string" || !attribute.abbreviation.trim()) throw new Error(`attributes.json: '${name}' has no abbreviation`);
  if (!attributeCategories.includes(attribute.category)) throw new Error(`attributes.json: '${name}' has invalid category '${attribute.category}'`);
  for (const field of ["used_for", "common_linked_skills"]) if (!Array.isArray(attribute[field])) throw new Error(`attributes.json: '${name}' has no '${field}' array`);
  for (const field of ["derived_statistics", "benchmarks"]) if (!attribute[field] || typeof attribute[field] !== "object" || Array.isArray(attribute[field])) throw new Error(`attributes.json: '${name}' has no '${field}' object`);
}

const lifestylePayload = JSON.parse(await readFile("lifestyles.json", "utf8"));
const lifestyleRatingKeys = ["comforts_and_necessities", "security", "neighborhood"];
for (const key of ["rules", "lifestyle_categories"]) {
  if (!lifestylePayload[key] || typeof lifestylePayload[key] !== "object" || Array.isArray(lifestylePayload[key])) throw new Error(`lifestyles.json: missing object '${key}'`);
}
for (const [name, lifestyle] of Object.entries(lifestylePayload.lifestyles)) {
  for (const field of ["category", "lifestyle_type", "monthly_cost", "starting_nuyen", "lifestyle_points", "description", "source"]) {
    if (lifestyle[field] == null || lifestyle[field] === "") throw new Error(`lifestyles.json: '${name}' is missing '${field}'`);
  }
  for (const field of ["built_in_options", "special_rules"]) {
    if (!Array.isArray(lifestyle[field])) throw new Error(`lifestyles.json: '${name}' has no '${field}' array`);
  }
  for (const field of lifestyleRatingKeys) {
    const rating = lifestyle[field];
    if (!rating || typeof rating !== "object" || Array.isArray(rating)) throw new Error(`lifestyles.json: '${name}' has no '${field}' rating object`);
    if (!Number.isFinite(rating.base) || !Number.isFinite(rating.limit) || rating.base > rating.limit) throw new Error(`lifestyles.json: '${name}' has invalid '${field}' base/limit values`);
  }
}

const priorityPayload = JSON.parse(await readFile("priority_array.json", "utf8"));
const priorityNames = Object.keys(priorityPayload.priority_array || {});
if (priorityNames.join(",") !== "A,B,C,D,E") throw new Error("priority_array.json: priorities must be A through E");
const playLevelNames = ["regular", "street_level", "prime_runner"];
if (!priorityPayload.play_levels || typeof priorityPayload.play_levels !== "object" || Array.isArray(priorityPayload.play_levels)) throw new Error("priority_array.json: missing object 'play_levels'");
for (const level of playLevelNames) {
  const rules = priorityPayload.play_levels[level];
  if (!rules || typeof rules !== "object" || Array.isArray(rules)) throw new Error(`priority_array.json: missing play level '${level}'`);
  if (typeof rules.name !== "string" || !rules.name.trim()) throw new Error(`priority_array.json: play level '${level}' has no name`);
}
for (const priority of priorityNames) {
  const resources = priorityPayload.priority_array[priority].resources;
  if (!resources || typeof resources !== "object" || Array.isArray(resources)) throw new Error(`priority_array.json: priority '${priority}' has no resources object`);
  for (const level of playLevelNames) if (resources[level] == null || resources[level] === "") throw new Error(`priority_array.json: priority '${priority}' is missing '${level}' resources`);
}

const spellPayload = JSON.parse(await readFile("spells.json", "utf8"));
for (const [category, value] of Object.entries(spellPayload)) {
  if (!value.spells || typeof value.spells !== "object") throw new Error(`spells.json: '${category}' has no spells object`);
  count += Object.keys(value.spells).length;
}

console.log(`Validated ${Object.keys(collections).length + 1} datasets and ${count} reference records.`);
