import type { RawRecord, ReferenceCategory, ReferenceData, ReferenceRecord } from "./types";

const jsonLoaders = import.meta.glob<Record<string, unknown>>([
  "../adeptpowers.json", "../attributes.json", "../cyberdecks.json", "../drones.json", "../equipment.json",
  "../matrixinteraction.json", "../metatypes.json", "../rituals.json", "../skills.json",
  "../qualities.json", "../lifestyles.json", "../lifestyle_extras.json", "../priority_array.json", "../spells.json", "../spirits.json", "../sprites.json", "../vehicles.json", "../weapons.json"
], { import: "default" });
const dataCache = new Map<string, Promise<ReferenceData>>();

export const sourceBooks: Record<string, string> = {
  CRB: "Shadowrun Fifth Edition Core Rulebook",
  SRF: "Shadowrun Run Faster",
  SRG: "Shadowrun Run and Gun",
};

export function slug(value: string): string {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const objectEntries = (value: unknown): [string, RawRecord][] =>
  value && typeof value === "object"
    ? Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, RawRecord] => Boolean(entry[1]) && typeof entry[1] === "object" && !Array.isArray(entry[1]))
    : [];

const text = (value: unknown): string => value == null ? "" : String(value);
const strings = (value: unknown): string[] => Array.isArray(value) ? value.map(text).filter(Boolean) : value ? [text(value)] : [];
const titleCase = (value: string): string => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const weaponNames: Record<string, string> = {
  ak_97: "AK-97", ares_s_iii_super_squirt: "Ares S-III Super Squirt", beretta_201t: "Beretta 201T", cavalier_arms_crockett_ebr: "Cavalier Arms Crockett EBR",
  colt_america_l36: "Colt America L36", colt_cobra_tz_120: "Colt Cobra TZ-120", colt_government_2066: "Colt Government 2066", defiance_t_250: "Defiance T-250",
  enfield_as_7: "Enfield AS-7", fn_har: "FN HAR", fn_p93_praetor: "FN P93 Praetor", hk_227: "HK-227", pjss_model_55: "PJSS Model 55",
  ranger_arms_sm_5: "Ranger Arms SM-5", rpk_hmg: "RPK HMG", sck_model_100: "SCK Model 100", steyr_tmp: "Steyr TMP", stoner_ares_m202: "Stoner-Ares M202",
  uzi_iv: "Uzi IV", panther_xxl: "Panther XXL"
};

function flattenSearchValues(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(flattenSearchValues);
  if (typeof value === "object") return Object.entries(value as RawRecord).flatMap(([key, nested]) => [key.replace(/_/g, " "), ...flattenSearchValues(nested)]);
  return [String(value)];
}

function normaliseSearchText(values: unknown[]): string {
  return flattenSearchValues(values)
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-GB");
}

function record(name: string, raw: RawRecord, category: string, extraTags: string[] = [], subcategoryOverride?: string): ReferenceRecord {
  const description = text(raw.description || raw.use || raw.effect);
  const displayName = titleCase(name);
  const subcategory = subcategoryOverride ?? text(raw.subcategory);
  const tags = [
    ...extraTags,
    ...strings(raw.keywords),
    ...strings(raw.ruleTags),
    ...strings(raw.racial_traits)
  ].filter(Boolean);
  return {
    id: slug(name),
    name: displayName,
    category,
    subcategory: subcategory || undefined,
    source: text(raw.source) || "CRB",
    description,
    tags: Array.from(new Set(tags)),
    searchText: normaliseSearchText([displayName, category, subcategory, raw.source, tags, raw]),
    raw
  };
}

export function matchesSearch(record: ReferenceRecord, query: string): boolean {
  const terms = query.trim().toLocaleLowerCase("en-GB").split(/\s+/).filter(Boolean);
  return terms.length === 0 || terms.every((term) => record.searchText.includes(term));
}

function lookupDefinitions(...values: unknown[]): Record<string, string> {
  return Object.assign({}, ...values.filter((value) => value && typeof value === "object" && !Array.isArray(value)));
}

function categoriesFrom(records: ReferenceRecord[], descriptions: Record<string, string> = {}, includeAll = true): ReferenceCategory[] {
  const labels = Array.from(new Set(records.map((item) => item.category).filter(Boolean)));
  const rows = labels.map((label) => ({ id: slug(label), label, description: descriptions[label] || descriptions[label.toLowerCase()] || "" }));
  return includeAll && rows.length > 1 ? [{ id: "all", label: "All", description: "Browse every record in this archive." }, ...rows] : rows;
}

function simpleData(payload: Record<string, unknown>, collection: string, categoryMode: "category" | "subcategory" | "single" = "category", includeAll = true): ReferenceData {
  const rawRecords = objectEntries(payload[collection]);
  const records = rawRecords.map(([name, raw]) => {
    const category = categoryMode === "subcategory" ? text(raw.subcategory) : categoryMode === "single" ? titleCase(collection) : text(raw.category) || titleCase(collection);
    return record(collection === "weapons" ? weaponNames[name] || name : name, raw, category, raw.subcategory ? [text(raw.subcategory)] : []);
  });
  const descriptions = lookupDefinitions(payload.category) as Record<string, string>;
  const definitions = lookupDefinitions(payload.subcategories, payload.keywords, payload.racial_traits, payload.sprite_powers);
  return { records, categories: categoriesFrom(records, descriptions, includeAll), definitions, payload };
}

function spellData(payload: Record<string, unknown>): ReferenceData {
  const records: ReferenceRecord[] = [];
  const categories: ReferenceCategory[] = [];
  const definitions: Record<string, string> = {};
  Object.entries(payload).forEach(([categoryName, categoryValue]) => {
    const category = categoryValue as Record<string, unknown>;
    const label = categoryName.replace(/\b\w/g, (letter) => letter.toUpperCase());
    categories.push({ id: slug(categoryName), label, description: text(category.description) });
    Object.assign(definitions, category.keywords || {});
    objectEntries(category.spells).forEach(([name, raw]) => records.push(record(name, raw, label)));
  });
  return { records, categories, definitions, payload };
}

function skillData(payload: Record<string, unknown>): ReferenceData {
  const records = objectEntries(payload.skills).map(([name, raw]) => record(name, raw, text(raw.attribute) || "Other", raw.skillgroup ? [text(raw.skillgroup)] : []));
  const order = ["all", "agility", "body", "charisma", "intuition", "logic", "magic", "reaction", "resonance", "strength", "willpower"];
  const available = new Set(records.map((item) => slug(item.category)));
  const categories = order.filter((id) => id === "all" || available.has(id)).map((id) => ({ id, label: id === "all" ? "All" : titleCase(id) }));
  return { records, categories, definitions: {}, payload };
}

function attributeData(payload: Record<string, unknown>): ReferenceData {
  const records = objectEntries(payload.attributes).map(([name, raw]) => record(
    name,
    raw,
    text(raw.category) || "Attributes",
    raw.abbreviation ? [text(raw.abbreviation)] : []
  ));
  const definitions = lookupDefinitions(payload.categories);
  return {
    records,
    categories: categoriesFrom(records, definitions, true),
    definitions,
    payload
  };
}

function adeptData(payload: Record<string, unknown>): ReferenceData {
  const records = objectEntries(payload.powers).map(([name, raw]) => record(name, raw, "Adept Powers", strings(raw.activation)));
  return {
    records,
    categories: [{ id: "adept-powers", label: "Adept Powers", description: "Adept abilities purchased with Power Points." }],
    definitions: lookupDefinitions(payload.rules, payload.relatedRules),
    payload
  };
}

function cyberdeckData(payload: Record<string, unknown>): ReferenceData {
  const records = [
    ...objectEntries(payload.cyberdecks).map(([name, raw]) => record(name, raw, "Cyberdecks", raw.subcategory ? [text(raw.subcategory)] : [])),
    ...objectEntries(payload.software).map(([name, raw]) => record(name, raw, "Software", raw.subcategory ? [text(raw.subcategory)] : []))
  ];
  return { records, categories: categoriesFrom(records, lookupDefinitions(payload.category) as Record<string, string>, false), definitions: lookupDefinitions(payload.subcategories), payload };
}

function matrixData(payload: Record<string, unknown>): ReferenceData {
  const records = [
    ...objectEntries(payload.matrix_actions).map(([name, raw]) => record(name, raw, "Matrix Actions", raw.subcategory ? [text(raw.subcategory)] : [])),
    ...objectEntries(payload.complex_forms).map(([name, raw]) => record(name, raw, "Complex Forms", raw.subcategory ? [text(raw.subcategory)] : []))
  ];
  return { records, categories: categoriesFrom(records, lookupDefinitions(payload.category) as Record<string, string>, false), definitions: lookupDefinitions(payload.subcategories), payload };
}

function qualityData(payload: Record<string, unknown>): ReferenceData {
  const records = [
    ...objectEntries(payload.positive_qualities).map(([name, raw]) => record(name, raw, text(raw.category) || "Positive Qualities")),
    ...objectEntries(payload.negative_qualities).map(([name, raw]) => record(name, raw, text(raw.category) || "Negative Qualities"))
  ];
  return {
    records,
    categories: categoriesFrom(records, lookupDefinitions(payload.category) as Record<string, string>, true),
    definitions: lookupDefinitions(payload.quality_types),
    payload
  };
}

function lifestyleData(payload: Record<string, unknown>, extrasPayload: Record<string, unknown>): ReferenceData {
  const lifestyleRecords = objectEntries(payload.lifestyles).map(([name, raw]) => {
    const lifestyleType = text(raw.lifestyle_type);
    return record(name, raw, text(raw.category) || "Lifestyles", lifestyleType ? [lifestyleType] : [], lifestyleType);
  });
  const extraRecords = objectEntries(extrasPayload.lifestyle_extras).map(([name, raw]) => record(name, raw, text(raw.category) || "Entertainment", raw.subcategory ? [text(raw.subcategory)] : []));
  const optionRecords = objectEntries(extrasPayload.lifestyle_options).map(([name, raw]) => record(name, raw, text(raw.category) || "Lifestyle Options", raw.subcategory ? [text(raw.subcategory)] : []));
  const records = [...lifestyleRecords, ...extraRecords, ...optionRecords];
  const rules = lookupDefinitions(payload.rules);
  const categoryDescriptions = lookupDefinitions(extrasPayload.category);
  const combinedPayload = { ...extrasPayload, ...payload };
  return {
    records,
    categories: [
      { id: "lifestyles", label: "Lifestyles", description: text(rules["Core Lifestyle Selection"]) },
      { id: "entertainment", label: "Entertainment", description: text(categoryDescriptions.Entertainment) },
      { id: "lifestyle-options", label: "Lifestyle Options", description: text(categoryDescriptions["Lifestyle Options"]) }
    ],
    definitions: lookupDefinitions(payload.lifestyle_categories, payload.rules, extrasPayload.subcategories),
    payload: combinedPayload
  };
}

function priorityData(payload: Record<string, unknown>): ReferenceData {
  const records = objectEntries(payload.priority_array).map(([priority, raw]) => record(`Priority ${priority}`, raw, "Priority Array", [priority]));
  const categories = lookupDefinitions(payload.category);
  return {
    records,
    categories: [{ id: "priority-array", label: "Priority Array", description: text(categories["Priority Array"]) }],
    definitions: categories,
    payload
  };
}

export async function loadData(moduleId: string): Promise<ReferenceData> {
  const existing = dataCache.get(moduleId);
  if (existing) return existing;
  const pending = loadUncached(moduleId);
  dataCache.set(moduleId, pending);
  pending.catch(() => dataCache.delete(moduleId));
  return pending;
}

async function loadUncached(moduleId: string): Promise<ReferenceData> {
  if (moduleId === "lifestyles") {
    const lifestyleLoader = jsonLoaders["../lifestyles.json"];
    const extrasLoader = jsonLoaders["../lifestyle_extras.json"];
    if (!lifestyleLoader || !extrasLoader) throw new Error("The Lifestyle datasets are not registered.");
    const [payload, extrasPayload] = await Promise.all([lifestyleLoader(), extrasLoader()]);
    return lifestyleData(payload, extrasPayload);
  }
  const path = moduleId === "priorityarray" ? "../priority_array.json" : `../${moduleId}.json`;
  const loader = jsonLoaders[path];
  if (!loader) throw new Error(`No dataset is registered for '${moduleId}'.`);
  const payload = await loader();
  switch (moduleId) {
    case "spells": return spellData(payload);
    case "skills": return skillData(payload);
    case "attributes": return attributeData(payload);
    case "adeptpowers": return adeptData(payload);
    case "cyberdecks": return cyberdeckData(payload);
    case "matrixinteraction": return matrixData(payload);
    case "qualities": return qualityData(payload);
    case "priorityarray": return priorityData(payload);
    case "weapons": return simpleData(payload, "weapons", "category", true);
    case "vehicles": return simpleData(payload, "vehicles", "category", true);
    case "drones": return simpleData(payload, "drones", "subcategory", true);
    case "equipment": return simpleData(payload, "equipment", "category", true);
    case "metatypes": return simpleData(payload, "metatypes", "single", false);
    case "rituals": return simpleData(payload, "rituals", "single", false);
    case "spirits": return simpleData(payload, "spirits", "single", false);
    case "sprites": return simpleData(payload, "sprites", "single", false);
    default: throw new Error(`Unsupported dataset '${moduleId}'.`);
  }
}
