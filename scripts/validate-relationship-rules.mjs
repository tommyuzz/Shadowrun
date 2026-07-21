import { readFile } from "node:fs/promises";

const rules = JSON.parse(await readFile(new URL("../relationship_rules.json", import.meta.url), "utf8"));
const allowedOperators = new Set(["equals", "in", "not_in", "present", "matches", "contains"]);

function fail(location, message) {
  throw new Error(`relationship_rules.json: ${location} ${message}`);
}

function valueAtPath(root, path) {
  return path.split(".").reduce((value, segment) => value && typeof value === "object" && !Array.isArray(value) ? value[segment] : undefined, root);
}

function validateCondition(rule, location, fieldPrefixes) {
  const hasField = typeof rule.field === "string" && rule.field.length > 0;
  const hasFields = Array.isArray(rule.fields) && rule.fields.length > 0 && rule.fields.every((field) => typeof field === "string" && field.length > 0);
  if (hasField === hasFields) fail(location, "must declare exactly one of 'field' or 'fields'");
  if (!allowedOperators.has(rule.operator)) fail(location, `uses unknown operator '${rule.operator}'`);

  const fields = hasFields ? rule.fields : [rule.field];
  for (const field of fields) if (!fieldPrefixes.some((prefix) => field.startsWith(prefix))) fail(location, `uses out-of-scope field '${field}'`);
  if (rule.compare_field && !fieldPrefixes.some((prefix) => rule.compare_field.startsWith(prefix))) fail(location, `uses out-of-scope comparison field '${rule.compare_field}'`);

  if (["equals", "matches"].includes(rule.operator) && !("value" in rule)) fail(location, `operator '${rule.operator}' requires a value`);
  if (["in", "not_in"].includes(rule.operator) && (!Array.isArray(rule.value) || !rule.value.length)) fail(location, `operator '${rule.operator}' requires a non-empty value array`);
  if (rule.operator === "contains" && (typeof rule.compare_field !== "string" || !rule.compare_field)) fail(location, "operator 'contains' requires compare_field");
  if (rule.operator === "matches") {
    if (typeof rule.value !== "string") fail(location, "operator 'matches' requires a string pattern");
    try {
      new RegExp(rule.value, rule.flags);
    } catch (error) {
      fail(location, `contains an invalid regular expression (${error.message})`);
    }
  }
}

function validateRule(rule, location, definitions, fieldPrefixes, referenceStack = []) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) fail(location, "must be a rule object");
  const nodeTypes = ["all", "any", "not", "ref"].filter((key) => key in rule);
  const isCondition = "operator" in rule;
  if (nodeTypes.length + Number(isCondition) !== 1) fail(location, "must contain exactly one logical, reference or condition rule");

  if ("all" in rule || "any" in rule) {
    const key = "all" in rule ? "all" : "any";
    if (!Array.isArray(rule[key]) || !rule[key].length) fail(location, `'${key}' must be a non-empty array`);
    rule[key].forEach((child, index) => validateRule(child, `${location}.${key}[${index}]`, definitions, fieldPrefixes, referenceStack));
    return;
  }
  if ("not" in rule) {
    validateRule(rule.not, `${location}.not`, definitions, fieldPrefixes, referenceStack);
    return;
  }
  if ("ref" in rule) {
    if (typeof rule.ref !== "string" || !rule.ref) fail(location, "has a blank reference");
    if (!definitions[rule.ref]) fail(location, `references unknown definition '${rule.ref}'`);
    if (referenceStack.includes(rule.ref)) fail(location, `contains circular reference '${[...referenceStack, rule.ref].join(" -> ")}'`);
    validateRule(definitions[rule.ref], `definitions.${rule.ref}`, definitions, fieldPrefixes, [...referenceStack, rule.ref]);
    return;
  }
  validateCondition(rule, location, fieldPrefixes);
}

if (rules.ruleset !== "shadowrun5e.relationships") fail("ruleset", "must be 'shadowrun5e.relationships'");
if (rules.schema_version !== 1) fail("schema_version", "must be 1");
if (rules.$schema !== "./schemas/relationship_rules.schema.json") fail("$schema", "must point to the checked-in JSON Schema");

const weaponRules = rules.weapon_support;
if (!weaponRules || typeof weaponRules !== "object" || Array.isArray(weaponRules)) fail("weapon_support", "must be an object");
if (typeof weaponRules.profile_field !== "string" || !weaponRules.profile_field) fail("weapon_support.profile_field", "must be a non-empty string");
if (typeof weaponRules.fallback_label !== "string" || !weaponRules.fallback_label) fail("weapon_support.fallback_label", "must be a non-empty string");
if (!weaponRules.definitions || typeof weaponRules.definitions !== "object" || Array.isArray(weaponRules.definitions)) fail("weapon_support.definitions", "must be an object");
if (!weaponRules.profiles || typeof weaponRules.profiles !== "object" || Array.isArray(weaponRules.profiles) || !Object.keys(weaponRules.profiles).length) fail("weapon_support.profiles", "must be a non-empty object");

for (const [name, rule] of Object.entries(weaponRules.definitions)) {
  validateRule(rule, `weapon_support.definitions.${name}`, weaponRules.definitions, ["weapon.", "support."], [name]);
}
for (const [name, profile] of Object.entries(weaponRules.profiles)) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) fail(`weapon_support.profiles.${name}`, "must be an object");
  if (typeof profile.display_label !== "string" || !profile.display_label) fail(`weapon_support.profiles.${name}.display_label`, "must be a non-empty string");
  validateRule(profile.rule, `weapon_support.profiles.${name}.rule`, weaponRules.definitions, ["weapon.", "support."]);
}

const equipmentRules = rules.equipment_enhancements;
if (!equipmentRules || typeof equipmentRules !== "object" || Array.isArray(equipmentRules)) fail("equipment_enhancements", "must be an object");
validateRule(equipmentRules.match, "equipment_enhancements.match", {}, ["equipment.", "enhancement."]);
if (!Array.isArray(equipmentRules.exclusions)) fail("equipment_enhancements.exclusions", "must be an array");
const exclusionIds = new Set();
for (const [index, exclusion] of equipmentRules.exclusions.entries()) {
  const location = `equipment_enhancements.exclusions[${index}]`;
  if (!exclusion || typeof exclusion !== "object" || Array.isArray(exclusion)) fail(location, "must be an object");
  if (typeof exclusion.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(exclusion.id)) fail(`${location}.id`, "must be a kebab-case identifier");
  if (exclusionIds.has(exclusion.id)) fail(`${location}.id`, `duplicates '${exclusion.id}'`);
  exclusionIds.add(exclusion.id);
  if (typeof exclusion.reason !== "string" || !exclusion.reason) fail(`${location}.reason`, "must be a non-empty string");
  validateRule(exclusion.when, `${location}.when`, {}, ["equipment.", "enhancement."]);
}

const weapons = JSON.parse(await readFile(new URL("../weapons.json", import.meta.url), "utf8"));
const sourceProfilePath = weaponRules.profile_field.replace(/^raw\./, "");
for (const [name, support] of Object.entries(weapons.weapon_support || {})) {
  const profile = valueAtPath(support, sourceProfilePath);
  if (!weaponRules.profiles[profile]) fail(`weapons.${name}.compatibility_profile`, `references unknown profile '${profile}'`);
}

console.log(`Validated relationship-rules schema version ${rules.schema_version}: ${Object.keys(weaponRules.profiles).length} weapon profiles and ${equipmentRules.exclusions.length} equipment exclusion.`);
