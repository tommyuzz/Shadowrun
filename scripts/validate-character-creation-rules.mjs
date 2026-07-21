import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const rules = JSON.parse(await readFile(new URL("character_creation_rules.json", root), "utf8"));
const schema = JSON.parse(await readFile(new URL("schemas/character_creation_rules.schema.json", root), "utf8"));
const priorityData = JSON.parse(await readFile(new URL("priority_array.json", root), "utf8"));
const metatypeData = JSON.parse(await readFile(new URL("metatypes.json", root), "utf8"));
const qualityData = JSON.parse(await readFile(new URL("qualities.json", root), "utf8"));
const skillData = JSON.parse(await readFile(new URL("skills.json", root), "utf8"));
const matrixData = JSON.parse(await readFile(new URL("matrixinteraction.json", root), "utf8"));
const spiritData = JSON.parse(await readFile(new URL("spirits.json", root), "utf8"));
const lifestyleData = JSON.parse(await readFile(new URL("lifestyles.json", root), "utf8"));
const adeptPowerData = JSON.parse(await readFile(new URL("adeptpowers.json", root), "utf8"));

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const slug = (value) => String(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

function fail(location, message) {
  throw new Error(`character_creation_rules.json: ${location} ${message}`);
}

function assert(condition, location, message) {
  if (!condition) fail(location, message);
}

function unique(values, location) {
  assert(new Set(values).size === values.length, location, "must not contain duplicates");
}

function sourceIncludes(record, code) {
  return String(record.source || "").split(/\s*\/\s*/).includes(code);
}

function resolvePointer(document, pointer, location) {
  if (!pointer) return document;
  assert(pointer.startsWith("/"), location, `uses invalid JSON Pointer '#${pointer}'`);
  return pointer.slice(1).split("/").reduce((value, rawSegment) => {
    const segment = rawSegment.replace(/~1/g, "/").replace(/~0/g, "~");
    assert(isRecord(value) || Array.isArray(value), location, `cannot resolve segment '${segment}'`);
    assert(segment in value, location, `references missing segment '${segment}'`);
    return value[segment];
  }, document);
}

function validatePages(pages, location) {
  assert(Array.isArray(pages) && pages.length > 0, location, "must be a non-empty page array");
  for (const page of pages) assert(Number.isInteger(page) && page >= rules.source.printed_pages.from && page <= rules.source.printed_pages.to, location, `contains out-of-scope printed page '${page}'`);
  unique(pages, location);
}

const numericOperators = new Set(["add", "subtract", "multiply", "divide", "min", "max", "ceil", "floor"]);
function validateNumericExpression(expression, location) {
  if (typeof expression === "number" && Number.isFinite(expression)) return;
  assert(isRecord(expression), location, "must be a finite number or numeric expression object");
  if (expression.op === "path") {
    assert(typeof expression.path === "string" && expression.path.length > 0, `${location}.path`, "must be a non-empty path");
    return;
  }
  assert(numericOperators.has(expression.op), `${location}.op`, `uses unknown numeric operator '${expression.op}'`);
  assert(Array.isArray(expression.args) && expression.args.length > 0, `${location}.args`, "must be a non-empty array");
  if (["ceil", "floor"].includes(expression.op)) assert(expression.args.length === 1, `${location}.args`, `operator '${expression.op}' requires one argument`);
  if (["subtract", "divide"].includes(expression.op)) assert(expression.args.length >= 2, `${location}.args`, `operator '${expression.op}' requires at least two arguments`);
  expression.args.forEach((argument, index) => validateNumericExpression(argument, `${location}.args[${index}]`));
}

const ruleOperators = new Set(["equals", "not_equals", "in", "not_in", "present", "matches", "contains", "greater_than", "greater_or_equal", "less_than", "less_or_equal"]);
function validateRuleNode(rule, location) {
  assert(isRecord(rule), location, "must be a rule object");
  const logicalKeys = ["all", "any", "not"].filter((key) => key in rule);
  const isCondition = "operator" in rule;
  assert(logicalKeys.length + Number(isCondition) === 1, location, "must contain exactly one logical or condition node");
  if ("all" in rule || "any" in rule) {
    const key = "all" in rule ? "all" : "any";
    assert(Array.isArray(rule[key]) && rule[key].length > 0, `${location}.${key}`, "must be a non-empty array");
    rule[key].forEach((child, index) => validateRuleNode(child, `${location}.${key}[${index}]`));
    return;
  }
  if ("not" in rule) {
    validateRuleNode(rule.not, `${location}.not`);
    return;
  }
  assert(typeof rule.field === "string" && /^(character|selection)\./.test(rule.field), `${location}.field`, "must use a scoped character or selection path");
  assert(ruleOperators.has(rule.operator), `${location}.operator`, `uses unknown operator '${rule.operator}'`);
  if (rule.operator !== "present") assert("value" in rule, location, `operator '${rule.operator}' requires a value`);
  if (["in", "not_in"].includes(rule.operator)) assert(Array.isArray(rule.value) && rule.value.length > 0, `${location}.value`, `operator '${rule.operator}' requires a non-empty array`);
}

assert(rules.ruleset === "shadowrun5e.character-creation", "ruleset", "must be 'shadowrun5e.character-creation'");
assert(rules.schema_version === 1, "schema_version", "must be 1");
assert(rules.$schema === "./schemas/character_creation_rules.schema.json", "$schema", "must point to the checked-in JSON Schema");
assert(schema.$id === "urn:shadowrun-reference:character-creation-rules:v1", "$schema", "must identify schema version 1");
for (const requiredProperty of schema.required) assert(requiredProperty in rules, requiredProperty, "is required by the versioned schema");
for (const property of Object.keys(rules)) assert(property in schema.properties, property, "is not declared by the versioned schema");
assert(rules.source.book_code === "CRB", "source.book_code", "must be CRB");
assert(rules.source.printed_pages.from === 62 && rules.source.printed_pages.to === 107, "source.printed_pages", "must cover the character-creation chapter on printed pages 62–107");
assert(rules.source.pdf_page_offset === 2, "source.pdf_page_offset", "must preserve the verified PDF-to-print offset");

assert(Array.isArray(rules.workflow) && rules.workflow.length === 9, "workflow", "must contain the nine creation steps");
unique(rules.workflow.map((step) => step.id), "workflow.id");
for (const [index, step] of rules.workflow.entries()) {
  assert(step.order === index + 1, `workflow[${index}].order`, `must be ${index + 1}`);
  assert(typeof step.mechanically_enforced === "boolean", `workflow[${index}].mechanically_enforced`, "must be boolean");
  validatePages(step.source_pages, `workflow[${index}].source_pages`);
}

for (const [name, reference] of Object.entries(rules.data_sources)) {
  assert(typeof reference === "string" && reference.length > 0, `data_sources.${name}`, "must be a non-empty reference");
  const [filename, pointer = ""] = reference.split("#");
  let document;
  try {
    document = JSON.parse(await readFile(new URL(filename, root), "utf8"));
  } catch (error) {
    fail(`data_sources.${name}`, `cannot load '${filename}' (${error.message})`);
  }
  resolvePointer(document, pointer, `data_sources.${name}`);
}

const expectedRanks = ["A", "B", "C", "D", "E"];
const expectedPriorityCategories = ["metatype", "attributes", "magic_or_resonance", "skills", "resources"];
assert(JSON.stringify(rules.priority_system.ranks) === JSON.stringify(expectedRanks), "priority_system.ranks", "must be A through E in order");
assert(JSON.stringify(rules.priority_system.categories) === JSON.stringify(expectedPriorityCategories), "priority_system.categories", "must use the five Core priority categories");
assert(rules.priority_system.assignment === "bijection", "priority_system.assignment", "must be a bijection");
validatePages(rules.priority_system.source_pages, "priority_system.source_pages");
assert(JSON.stringify(Object.keys(priorityData.priority_array)) === JSON.stringify(expectedRanks), "priority_system.ranks", "must match priority_array.json");

const playLevelIds = Object.keys(priorityData.play_levels);
assert(new Set(rules.play_level_rules.level_ids).size === playLevelIds.length && rules.play_level_rules.level_ids.every((id) => playLevelIds.includes(id)), "play_level_rules.level_ids", "must match priority_array.json play levels");
for (const [rank, row] of Object.entries(priorityData.priority_array)) {
  for (const category of expectedPriorityCategories) assert(category in row, `priority_array.${rank}`, `is missing '${category}'`);
  for (const levelId of playLevelIds) assert(levelId in row.resources, `priority_array.${rank}.resources`, `is missing '${levelId}'`);
}
for (const [levelId, level] of Object.entries(priorityData.play_levels)) {
  for (const field of ["starting_karma", "maximum_karma", "maximum_device_rating", "maximum_availability", "maximum_karma_to_nuyen", "maximum_karma_carryover"]) assert(Number.isInteger(level[field]) && level[field] >= 0, `play_levels.${levelId}.${field}`, "must be a non-negative integer");
  assert(level.maximum_karma >= level.starting_karma, `play_levels.${levelId}.maximum_karma`, "must not be lower than starting Karma");
}
validateNumericExpression(rules.play_level_rules.positive_quality_karma_cap, "play_level_rules.positive_quality_karma_cap");
validateNumericExpression(rules.play_level_rules.negative_quality_karma_cap, "play_level_rules.negative_quality_karma_cap");

const metatypeIds = new Map(Object.keys(metatypeData.metatypes).map((name) => [slug(name), name]));
const priorityMetatypeIds = new Set(Object.values(priorityData.priority_array).flatMap((row) => Object.keys(row.metatype)).map(slug));
for (const [rank, options] of Object.entries(priorityData.priority_array).map(([rank, row]) => [rank, row.metatype])) {
  for (const [name, specialPoints] of Object.entries(options)) {
    assert(metatypeIds.has(slug(name)), `priority_array.${rank}.metatype.${name}`, "does not exist in metatypes.json");
    assert(Number.isInteger(specialPoints) && specialPoints >= 0, `priority_array.${rank}.metatype.${name}`, "must grant non-negative integer Special Attribute points");
    assert(metatypeData.metatypes[name].priority_options[rank] === specialPoints, `metatypes.${name}.priority_options.${rank}`, "must match priority_array.json");
  }
}
for (const metatypeId of priorityMetatypeIds) {
  const name = metatypeIds.get(metatypeId);
  const metatype = metatypeData.metatypes[name];
  for (const attributeId of [...rules.attribute_rules.physical_and_mental, "edge"]) {
    const range = metatype.attributes[attributeId];
    assert(isRecord(range) && Number.isInteger(range.minimum) && Number.isInteger(range.maximum) && range.minimum <= range.maximum, `metatypes.${name}.attributes.${attributeId}`, "must define an integer minimum and maximum");
  }
}
unique(rules.attribute_rules.physical_and_mental, "attribute_rules.physical_and_mental");
unique(rules.attribute_rules.special, "attribute_rules.special");
validatePages(rules.attribute_rules.source_pages, "attribute_rules.source_pages");

const expectedMagicPaths = ["mundane", "adept", "magician", "aspected-magician", "mystic-adept", "technomancer"];
assert(expectedMagicPaths.every((id) => isRecord(rules.magic_paths[id])) && Object.keys(rules.magic_paths).length === expectedMagicPaths.length, "magic_paths", "must define exactly the six Core creation paths");
const formulaCategories = new Set(["spells", "rituals", "preparations", "complex_forms"]);
for (const [pathId, path] of Object.entries(rules.magic_paths)) {
  assert([null, "magic", "resonance"].includes(path.uses_special_attribute), `magic_paths.${pathId}.uses_special_attribute`, "must be null, magic or resonance");
  if (pathId === "mundane") {
    assert(path.source_option === null && path.required_priority === "E", `magic_paths.${pathId}`, "must select Magic or Resonance Priority E without a source option");
  } else {
    assert(typeof path.source_option === "string" && path.source_option.length > 0, `magic_paths.${pathId}.source_option`, "must identify a priority-table option");
    assert(expectedRanks.some((rank) => path.source_option in priorityData.priority_array[rank].magic_or_resonance), `magic_paths.${pathId}.source_option`, `references unknown option '${path.source_option}'`);
  }
  assert(isRecord(path.capabilities), `magic_paths.${pathId}.capabilities`, "must be an object");
  const declaredCategories = path.allowed_formula_categories || Object.values(path.allowed_formula_categories_by_selected_group || {}).flat();
  for (const category of declaredCategories) assert(formulaCategories.has(category), `magic_paths.${pathId}`, `uses unknown formula category '${category}'`);
  if (path.formula_limit_per_category) validateNumericExpression(path.formula_limit_per_category, `magic_paths.${pathId}.formula_limit_per_category`);
  if (path.maximum_complex_forms) validateNumericExpression(path.maximum_complex_forms, `magic_paths.${pathId}.maximum_complex_forms`);
}
assert(rules.magic_paths["mystic-adept"].purchased_power_point_cost === 5, "magic_paths.mystic-adept.purchased_power_point_cost", "must use the selected 5 Karma ruling");
const coreAdeptPowers = Object.entries(adeptPowerData.powers).filter(([, power]) => sourceIncludes(power, "CRB"));
assert(coreAdeptPowers.length > 0, "data_sources.adept_powers", "must expose Core adept powers");
for (const [name, power] of coreAdeptPowers) assert(Array.isArray(power.costValues) && power.costValues.length > 0 && power.costValues.every((cost) => typeof cost === "number" && cost > 0 && Number.isInteger(cost * 4)), `adept_powers.${name}.costValues`, "must use positive quarter-point costs");

const coreQualities = new Map();
for (const [kind, collectionName] of [["positive", rules.quality_rules.positive_collection], ["negative", rules.quality_rules.negative_collection]]) {
  const collection = qualityData[collectionName];
  assert(isRecord(collection), `quality_rules.${collectionName}`, "must name a quality collection");
  for (const [name, record] of Object.entries(collection)) if (sourceIncludes(record, "CRB")) coreQualities.set(slug(name), { name, kind, record });
}
assert(coreQualities.size === 59, "quality_rules.catalog_filter", `must resolve all 59 Core qualities; found ${coreQualities.size}`);
assert(rules.quality_rules.default_max_selections === 1, "quality_rules.default_max_selections", "must make non-repeatable qualities single-select by default");
const constraints = rules.quality_rules.constraints;
const parameterRuleKinds = new Set(["allocation_sum_equals_rating", "minimum_skill_rating", "known_active_skill", "tested_matrix_action", "known_spirit_type", "eligible_unpurchased_skill_group", "scorched_source_prerequisite"]);
for (const [qualityId, constraint] of Object.entries(constraints)) {
  assert(coreQualities.has(qualityId), `quality_rules.constraints.${qualityId}`, "does not identify a Core quality");
  if (constraint.eligibility) validateRuleNode(constraint.eligibility, `quality_rules.constraints.${qualityId}.eligibility`);
  if (constraint.required_parameters) unique(constraint.required_parameters, `quality_rules.constraints.${qualityId}.required_parameters`);
  if (constraint.unique_by_parameters) {
    unique(constraint.unique_by_parameters, `quality_rules.constraints.${qualityId}.unique_by_parameters`);
    assert(constraint.repeatable === true, `quality_rules.constraints.${qualityId}.unique_by_parameters`, "is only valid for a repeatable quality");
    for (const parameter of constraint.unique_by_parameters) assert(constraint.required_parameters?.includes(parameter), `quality_rules.constraints.${qualityId}.unique_by_parameters`, `uses non-required parameter '${parameter}'`);
  }
  if (constraint.incompatible_quality_ids) for (const incompatibleId of constraint.incompatible_quality_ids) assert(coreQualities.has(incompatibleId), `quality_rules.constraints.${qualityId}.incompatible_quality_ids`, `references unknown Core quality '${incompatibleId}'`);
  if (constraint.option_source) {
    const record = coreQualities.get(qualityId).record;
    assert(isRecord(record[constraint.option_source]) && Object.keys(record[constraint.option_source]).length > 0, `quality_rules.constraints.${qualityId}.option_source`, `references missing option collection '${constraint.option_source}'`);
    const optionParameter = constraint.option_parameter || "option";
    assert(constraint.required_parameters?.includes(optionParameter), `quality_rules.constraints.${qualityId}.required_parameters`, `must include option parameter '${optionParameter}'`);
  }
  if (constraint.rating) {
    assert(Number.isInteger(constraint.rating.minimum) && Number.isInteger(constraint.rating.maximum) && constraint.rating.minimum >= 1 && constraint.rating.maximum >= constraint.rating.minimum, `quality_rules.constraints.${qualityId}.rating`, "must define a valid integer range");
    const record = coreQualities.get(qualityId).record;
    const dataMaximum = record.max_rating ?? record.max_level;
    assert(dataMaximum === constraint.rating.maximum, `quality_rules.constraints.${qualityId}.rating.maximum`, "must match the quality dataset maximum");
  }
  for (const [index, parameterRule] of (constraint.parameter_rules || []).entries()) assert(parameterRuleKinds.has(parameterRule.kind), `quality_rules.constraints.${qualityId}.parameter_rules[${index}]`, `uses unknown kind '${parameterRule.kind}'`);
}

const compositeQualities = rules.quality_rules.cost_resolution.composite_qualities;
for (const [qualityId, { record }] of coreQualities) {
  const constraint = constraints[qualityId] || {};
  const costField = coreQualities.get(qualityId).kind === "positive" ? "karma_cost" : "karma_bonus";
  const rawCost = String(record[costField] ?? "");
  if (compositeQualities[qualityId]) {
    for (const path of compositeQualities[qualityId].sum_option_paths) {
      assert(isRecord(record[path]) && Object.keys(record[path]).length > 0, `quality_rules.cost_resolution.composite_qualities.${qualityId}`, `references missing option collection '${path}'`);
      for (const option of Object.values(record[path])) assert(typeof option[compositeQualities[qualityId].value_field] === "number", `qualities.${qualityId}.${path}`, `must provide numeric '${compositeQualities[qualityId].value_field}' values`);
    }
  } else if (/\bper\s+(rating|level)\b/i.test(rawCost)) {
    assert(isRecord(constraint.rating), `quality_rules.constraints.${qualityId}.rating`, "is required for a rated Karma value");
    assert(/\d+/.test(rawCost), `qualities.${qualityId}.${costField}`, "must contain a numeric per-rating value");
  } else if (/\b(?:or|to)\b|,/.test(rawCost)) {
    assert(typeof constraint.option_source === "string", `quality_rules.constraints.${qualityId}.option_source`, "is required for a variable Karma value");
    const options = Object.values(record[constraint.option_source]);
    assert(options.every((option) => /-?\d+/.test(String(option.karma_cost ?? option.karma_bonus ?? ""))), `qualities.${qualityId}.${constraint.option_source}`, "must expose numeric option Karma values");
  } else assert(/-?\d+/.test(rawCost), `qualities.${qualityId}.${costField}`, "must contain a numeric Karma value");
}
validatePages(rules.quality_rules.source_pages, "quality_rules.source_pages");

const skillIds = new Set(Object.keys(skillData.skills).map(slug));
const skillGroups = new Set(Object.values(skillData.skills).map((skill) => slug(skill.skillgroup || "")).filter(Boolean));
for (const [classification, ids] of Object.entries({ social_skills: rules.skill_rules.social_skills, technical_skills: rules.skill_rules.technical_skills })) {
  unique(ids, `skill_rules.${classification}`);
  for (const id of ids) assert(skillIds.has(id), `skill_rules.${classification}`, `references unknown skill '${id}'`);
}
for (const [classification, ids] of Object.entries({ social_skill_groups: rules.skill_rules.social_skill_groups, magic_skill_groups: rules.skill_rules.magic_skill_groups, resonance_skill_groups: rules.skill_rules.resonance_skill_groups })) {
  unique(ids, `skill_rules.${classification}`);
  for (const id of ids) assert(skillGroups.has(id), `skill_rules.${classification}`, `references unknown group '${id}'`);
}
for (const [skillName, skill] of Object.entries(skillData.skills)) if (["magic", "resonance"].includes(skill.attribute)) assert(skillGroups.has(slug(skill.skillgroup)), `skills.${skillName}.skillgroup`, "must belong to a known restricted group");
validateNumericExpression(rules.skill_rules.free_knowledge_and_language_points, "skill_rules.free_knowledge_and_language_points");
validatePages(rules.skill_rules.source_pages, "skill_rules.source_pages");

assert(rules.resource_rules.karma_to_nuyen_rate === rules.play_level_rules.karma_to_nuyen_rate, "resource_rules.karma_to_nuyen_rate", "must match the play-level conversion rate");
assert(new Set(Object.keys(rules.resource_rules.lifestyle_cost_multipliers)).size === priorityMetatypeIds.size && [...priorityMetatypeIds].every((id) => id in rules.resource_rules.lifestyle_cost_multipliers), "resource_rules.lifestyle_cost_multipliers", "must cover every Core metatype exactly once");
assert(JSON.stringify(rules.resource_rules.allowed_augmentation_grades) === JSON.stringify(["standard", "alphaware"]), "resource_rules.allowed_augmentation_grades", "must allow only standard and alphaware at creation");
for (const [name, lifestyle] of Object.entries(lifestyleData.lifestyles).filter(([, lifestyle]) => sourceIncludes(lifestyle, "CRB"))) assert(/^\d+D\d+\s*[×x*]\s*[\d,]+/i.test(String(lifestyle.starting_nuyen || "")), `lifestyles.${name}.starting_nuyen`, "must provide a rollable Core starting-nuyen formula");
validatePages(rules.resource_rules.source_pages, "resource_rules.source_pages");

for (const [purchaseId, purchaseRule] of Object.entries(rules.karma_purchase_rules)) {
  if (["source_pages", "maximum_carryover_source", "creation_restrictions_continue_to_apply"].includes(purchaseId)) continue;
  if ("cost" in purchaseRule) validateNumericExpression(purchaseRule.cost, `karma_purchase_rules.${purchaseId}.cost`);
  for (const field of ["force", "maximum_entities", "level"]) if (field in purchaseRule) validateNumericExpression(purchaseRule[field], `karma_purchase_rules.${purchaseId}.${field}`);
}
validatePages(rules.karma_purchase_rules.source_pages, "karma_purchase_rules.source_pages");
validateNumericExpression(rules.contact_rules.budget, "contact_rules.budget");
assert(Object.keys(rules.contact_rules.contact_karma_multipliers).every((id) => playLevelIds.includes(id)), "contact_rules.contact_karma_multipliers", "must use known play levels");
validatePages(rules.contact_rules.source_pages, "contact_rules.source_pages");

for (const [statId, definition] of Object.entries(rules.derived_statistics)) {
  if (statId === "source_pages") continue;
  if (isRecord(definition) && "value" in definition && "dice" in definition) {
    validateNumericExpression(definition.value, `derived_statistics.${statId}.value`);
    assert(Number.isInteger(definition.dice) && definition.dice >= 0, `derived_statistics.${statId}.dice`, "must be a non-negative integer");
  } else if (statId === "living_persona") {
    for (const [field, expression] of Object.entries(definition)) validateNumericExpression(expression, `derived_statistics.${statId}.${field}`);
  } else validateNumericExpression(definition, `derived_statistics.${statId}`);
}
validatePages(rules.derived_statistics.source_pages, "derived_statistics.source_pages");

const conflictIds = rules.source_conflicts.map((conflict) => conflict.id);
unique(conflictIds, "source_conflicts.id");
assert(conflictIds.includes("mystic-adept-power-point-cost") && conflictIds.includes("troll-and-dwarf-purchase-modifiers"), "source_conflicts", "must retain both verified Core Rulebook conflicts");
for (const [index, conflict] of rules.source_conflicts.entries()) {
  validatePages(conflict.selected_source_pages, `source_conflicts[${index}].selected_source_pages`);
  validatePages(conflict.conflicting_source_pages, `source_conflicts[${index}].conflicting_source_pages`);
  assert(typeof conflict.resolution === "string" && conflict.resolution.length > 0, `source_conflicts[${index}].resolution`, "must explain the selected ruling");
}

const testedMatrixActionRules = Object.values(constraints).flatMap((constraint) => constraint.parameter_rules || []).filter((rule) => rule.kind === "tested_matrix_action");
assert(testedMatrixActionRules.length === 2, "quality_rules.constraints", "must validate Codeslinger and Codeblock Matrix action choices");
assert(Object.values(matrixData.matrix_actions).some((action) => action.test && !/^none\b/i.test(action.test)), "data_sources.matrix_actions", "must expose tested Matrix actions");
assert(Object.keys(spiritData.spirits).length > 0, "data_sources.spirits", "must expose spirit types for quality parameters");

console.log(`Validated character-creation rules schema version ${rules.schema_version}: ${coreQualities.size} Core qualities, ${expectedMagicPaths.length} paths, ${Object.keys(rules.derived_statistics).length - 1} derived mechanics, and ${rules.source_conflicts.length} documented source conflicts.`);
