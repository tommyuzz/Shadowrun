import { readFile } from "node:fs/promises";

const collections = {
  adeptpowers: ["powers"],
  cyberdecks: ["cyberdecks", "software"],
  drones: ["drones"],
  equipment: ["equipment"],
  matrixinteraction: ["matrix_actions", "complex_forms"],
  metatypes: ["metatypes"],
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

const spellPayload = JSON.parse(await readFile("spells.json", "utf8"));
for (const [category, value] of Object.entries(spellPayload)) {
  if (!value.spells || typeof value.spells !== "object") throw new Error(`spells.json: '${category}' has no spells object`);
  count += Object.keys(value.spells).length;
}

console.log(`Validated 13 datasets and ${count} reference records.`);
