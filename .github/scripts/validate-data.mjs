import { readFile } from "node:fs/promises";

const collections = {
  adeptpowers: ["powers"],
  cyberdecks: ["cyberdecks", "software"],
  drones: ["drones"],
  equipment: ["equipment"],
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
  weapons: ["weapons"]
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
