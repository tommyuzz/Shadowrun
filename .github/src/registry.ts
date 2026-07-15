import type { FilterDefinition, ModuleDefinition, ReferenceRecord } from "./types";

const value = (record: ReferenceRecord, key: string): string => {
  const result = record.raw[key];
  return result == null || result === "" ? "—" : String(result);
};

const values = (record: ReferenceRecord, key: string): string[] => {
  const result = record.raw[key];
  if (Array.isArray(result)) return result.map(String).filter(Boolean);
  return result == null || result === "" ? [] : [String(result)];
};

const titleCase = (value: string): string => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const fieldFilter = (id: string, label: string, allLabel: string, key: string): FilterDefinition => ({ id, label, allLabel, values: (record) => values(record, key) });
const subcategoryFilter = (label: string, allLabel: string, category?: string): FilterDefinition => ({ id: "subcategory", label, allLabel, values: (record) => !category || record.category === category ? record.subcategory ? [record.subcategory] : [] : [] });

const traitKey = (input: string): string => {
  if (input === "Low-Light Vision" || input === "Thermographic Vision") return input;
  if (/pathogen|toxin/i.test(input)) return "Pathogen and Toxin Resistance";
  if (/Reach/i.test(input)) return "Reach";
  if (/Dermal Armor/i.test(input)) return "Dermal Armor";
  if (/Lifestyle cost/i.test(input)) return "Lifestyle Cost";
  return input;
};

const legality = (availability: unknown): string => /F$/.test(String(availability || "")) ? "Forbidden" : /R$/.test(String(availability || "")) ? "Restricted" : "Legal";
const costTypes = ["fixed cost", "per level", "variable cost"];
const qualityStructures = ["options", "levels", "variants", "rarity", "severity", "target_prevalence", "degree", "possible_side_effects"];

const lifestyleMinimums = (record: ReferenceRecord): string[] => {
  const minimums = values(record, "minimum_lifestyle").filter((minimum) => minimum !== "*");
  const variants = record.raw.variants;
  if (variants && typeof variants === "object" && !Array.isArray(variants)) {
    Object.values(variants).forEach((variant) => {
      if (!variant || typeof variant !== "object" || Array.isArray(variant)) return;
      const minimum = (variant as Record<string, unknown>).minimum_lifestyle;
      if (minimum != null && minimum !== "" && minimum !== "*") minimums.push(String(minimum));
    });
  }
  return Array.from(new Set(minimums));
};

const filterDefinitions: Record<string, FilterDefinition[]> = {
  skills: [{ ...fieldFilter("skill-group", "Skill group", "All skill groups", "skillgroup"), formatValue: titleCase }],
  metatypes: [{ id: "racial-trait", label: "Racial trait", allLabel: "All racial traits", values: (record) => values(record, "racial_traits").map(traitKey) }],
  qualities: [
    fieldFilter("quality-type", "Quality type", "All quality types", "quality_type"),
    { id: "structure", label: "Quality structure", allLabel: "All structures", values: (record) => {
      if (record.raw.max_rating != null || record.raw.max_level != null || /per (?:rating|level)/i.test(String(record.raw.karma_cost || record.raw.karma_bonus || ""))) return ["Rated"];
      if (qualityStructures.some((key) => record.raw[key] && typeof record.raw[key] === "object")) return ["Choice-based"];
      return ["Fixed"];
    } }
  ],
  lifestyles: [
    subcategoryFilter("Lifestyle type", "All lifestyle types"),
    { id: "minimum-lifestyle", label: "Minimum lifestyle", allLabel: "All minimum lifestyles", values: lifestyleMinimums }
  ],
  cyberdecks: [subcategoryFilter("Software type", "All software types", "Software")],
  matrixinteraction: [
    { id: "function", label: "Function", allLabel: "All functions", values: (record) => Array.from(new Set([...(record.subcategory ? [record.subcategory] : []), ...values(record, "functions")])) },
    { id: "context", label: (category) => category.label === "Matrix Actions" ? "Matrix attribute" : "Target", allLabel: (category) => category.label === "Matrix Actions" ? "All Matrix attributes" : "All targets", values: (record) => values(record, record.category === "Matrix Actions" ? "matrix_attribute" : "target") }
  ],
  sprites: [fieldFilter("power", "Power", "All powers", "powers"), fieldFilter("skill", "Skill", "All skills", "skills")],
  spells: [{ id: "keyword", label: "Keyword", allLabel: "All keywords", values: (record) => values(record, "keywords") }],
  adeptpowers: [
    { id: "cost-type", label: "Cost type", allLabel: "All cost types", values: (record) => record.tags.filter((tag) => costTypes.includes(tag)), formatValue: titleCase },
    { id: "pp-cost", label: "PP cost", allLabel: "All PP costs", values: (record) => values(record, "costValues"), formatValue: (cost) => `${cost} PP` },
    { id: "activation", label: "Activation", allLabel: "All activation types", values: (record) => [value(record, "activation") === "Intrinsic" ? "Intrinsic" : "Activated"] }
  ],
  rituals: [{ id: "keyword", label: "Keyword", allLabel: "All keywords", values: (record) => values(record, "keywords") }],
  spirits: [
    { id: "power", label: "Power", allLabel: "All powers", values: (record) => [...values(record, "powers"), ...values(record, "optional_powers")] },
    fieldFilter("skill", "Skill", "All skills", "skills")
  ],
  weapons: [
    subcategoryFilter("Weapon type", "All weapon types"),
    { id: "legality", label: "Legality", allLabel: "All legality", values: (record) => [legality(record.raw.availability)] }
  ],
  vehicles: [subcategoryFilter("Vehicle type", "All vehicle types")],
  drones: [fieldFilter("control-skill", "Control skill", "All control skills", "skill")],
  equipment: [subcategoryFilter("Product type", "All product types")]
};

const moduleRows: Omit<ModuleDefinition, "filters">[] = [
  { id: "skills", name: "Skills", singular: "Skill", sector: "corerules", kicker: "Operational capability archive", subtitle: "Fifth edition active skill index", archiveCode: "SKILLS // 5E", moduleCode: "Competency // Skill index", intro: "Active skills, linked attributes, groups, defaulting and common tests.", listInstruction: "Select a skill to open its full record", listMeta: (r) => value(r, "skillgroup") !== "—" ? value(r, "skillgroup") : "Standalone", defaultCategoryId: "all" },
  { id: "metatypes", name: "Metatypes", singular: "Metatype", sector: "corerules", kicker: "Population records archive", subtitle: "Fifth edition metatype index", archiveCode: "DEMOGRAPHIC // 5E", moduleCode: "Demographic // Metatype index", intro: "Metatype attributes, movement, racial traits and priority options.", listInstruction: "Select a metatype to open its full profile", listMeta: (r) => { const a = r.raw.attributes as Record<string, Record<string, unknown>> | undefined; return a?.body ? `BOD ${a.body.minimum}–${a.body.maximum}` : "Profile"; } },
  { id: "qualities", name: "Qualities", singular: "Quality", sector: "corerules", kicker: "Character profile archive", subtitle: "Fifth edition quality index", archiveCode: "QUALITIES // 5E", moduleCode: "Character // Quality ledger", intro: "Positive and Negative Qualities, Karma values, requirements, ratings and variants.", listInstruction: "Select a quality to open its full character record", listMeta: (r) => value(r, r.category === "Positive Qualities" ? "karma_cost" : "karma_bonus"), defaultCategoryId: "all" },
  { id: "lifestyles", name: "Lifestyles", singular: "Lifestyle", sector: "corerules", kicker: "Safehouse configuration archive", subtitle: "Fifth edition lifestyle extras index", archiveCode: "LIFESTYLE // 5E", moduleCode: "Lifestyle // Extras & options", intro: "Lifestyle assets, services, outings, positive options and negative options.", listInstruction: "Select a lifestyle entry to open its full configuration record", listMeta: (r) => value(r, r.category === "Entertainment" ? "monthly_cost" : "point_adjustment"), defaultCategoryId: "all" },
  { id: "priorityarray", name: "Priority Array", singular: "Priority", sector: "corerules", kicker: "Character creation archive", subtitle: "Fifth edition priority assignment matrix", archiveCode: "PRIORITY // 5E", moduleCode: "Creation // Priority array", intro: "Priority levels, metatype options, attributes, Magic or Resonance, skills, resources, Karma and gear limits.", listInstruction: "Assign one priority from A to E to each creation category", listMeta: (r) => value(r, "attributes") },
  { id: "cyberdecks", name: "Cyberdecks", singular: "Matrix Record", sector: "hacking", kicker: "Matrix operations archive", subtitle: "Fifth edition Matrix catalogue", archiveCode: "GRID-SCAN // 5E", moduleCode: "Grid-scan // Matrix catalogue", intro: "Cyberdeck hardware, Matrix attributes and executable software.", listInstruction: "Select a record to open its full specification", listMeta: (r) => value(r, "cost") },
  { id: "matrixinteraction", name: "Matrix Interaction", singular: "Interaction", sector: "hacking", kicker: "Matrix operations archive", subtitle: "Fifth edition interaction index", archiveCode: "PROTOCOL // 5E", moduleCode: "Protocol // Interaction index", intro: "Matrix actions and technomancer complex forms.", listInstruction: "Select an interaction to open its complete protocol", listMeta: (r) => value(r, r.category === "Complex Forms" ? "fading_value" : "action_type") },
  { id: "sprites", name: "Sprites", singular: "Sprite", sector: "hacking", kicker: "Resonance operations archive", subtitle: "Fifth edition sprite index", archiveCode: "RESONANCE // 5E", moduleCode: "Resonance // Sprite index", intro: "Sprite Matrix attributes, skills, powers and Resonance capabilities.", listInstruction: "Select a sprite to open its full Resonance profile", listMeta: () => "Level" },
  { id: "spells", name: "Spells", singular: "Spell", sector: "magic", kicker: "Awakened operations archive", subtitle: "Fifth edition spell index", archiveCode: "GRIMOIRE // 5E", moduleCode: "Grimoire // Spell index", intro: "Combat, detection, health, illusion and manipulation spells.", listInstruction: "Select a spell to open its full formula", listMeta: (r) => value(r, "drain") },
  { id: "adeptpowers", name: "Adept Powers", singular: "Adept Power", sector: "magic", kicker: "Awakened somatic archive", subtitle: "Fifth edition adept power index", archiveCode: "ADEPT // 5E", moduleCode: "Adept // Power index", intro: "Adept powers, Power Point costs, activation and related rules.", listInstruction: "Select a power to open its full record", listMeta: (r) => value(r, "cost") },
  { id: "rituals", name: "Rituals", singular: "Ritual", sector: "magic", kicker: "Awakened operations archive", subtitle: "Fifth edition ritual index", archiveCode: "CEREMONY // 5E", moduleCode: "Ceremony // Ritual index", intro: "Ritual spellcasting procedures, keywords and requirements.", listInstruction: "Select a ritual to open its full procedure", listMeta: (r) => value(r, "ritual_time") },
  { id: "spirits", name: "Spirits", singular: "Spirit", sector: "magic", kicker: "Conjuring operations archive", subtitle: "Fifth edition spirit index", archiveCode: "METAPLANE // 5E", moduleCode: "Metaplane // Spirit index", intro: "Spirit attributes, skills, powers and optional powers.", listInstruction: "Select a spirit to open its full Force profile", listMeta: (r) => `BOD ${value(r, "body")}` },
  { id: "weapons", name: "Weapons", singular: "Weapon", sector: "equipment", kicker: "Street armament archive", subtitle: "Fifth edition weapon index", archiveCode: "ARSENAL // 5E", moduleCode: "Arsenal // Weapon index", intro: "Melee, projectile, firearm, heavy and explosive weapons.", listInstruction: "Select a weapon to open its full record", listMeta: (r) => r.subcategory || "Uncategorised" },
  { id: "vehicles", name: "Vehicles", singular: "Vehicle", sector: "equipment", kicker: "Mobility and transport archive", subtitle: "Fifth edition vehicle index", archiveCode: "TRANSIT // 5E", moduleCode: "Transit // Vehicle index", intro: "Groundcraft, watercraft and aircraft specifications.", listInstruction: "Select a vehicle to open its full record", listMeta: (r) => r.subcategory || "Uncategorised" },
  { id: "drones", name: "Drones", singular: "Drone", sector: "equipment", kicker: "Autonomous systems archive", subtitle: "Fifth edition drone index", archiveCode: "DRONE-NET // 5E", moduleCode: "Autonomous // Drone index", intro: "Drone platforms, handling, sensors, Pilot ratings and features.", listInstruction: "Select a drone to open its system record", listMeta: (r) => r.subcategory || "Uncategorised" },
  { id: "equipment", name: "Equipment", singular: "Equipment Record", sector: "equipment", kicker: "Shadow-market procurement network", subtitle: "Fifth edition equipment exchange", archiveCode: "MARKET // 5E", moduleCode: "Market // Equipment exchange", intro: "General equipment, augmentations, electronics, survival gear and services.", listInstruction: "Select a product to inspect its full listing", listMeta: (r) => value(r, "cost") }
];

export const modules: ModuleDefinition[] = moduleRows.map((module) => ({ ...module, filters: filterDefinitions[module.id] || [] }));

export const modulesById = Object.fromEntries(modules.map((module) => [module.id, module]));

export const sectors = [
  { id: "corerules", label: "Core Rules", eyebrow: "Runner operations archive // Core rules index", intro: "Access the available Fifth Edition core rules reference modules." },
  { id: "hacking", label: "Hacking", eyebrow: "Matrix operations archive // Hacking index", intro: "Access Matrix hardware, software, interaction, and Resonance reference modules." },
  { id: "magic", label: "Magic", eyebrow: "Awakened operations archive // Magic index", intro: "Access the available Fifth Edition magical, conjuring, and ritual reference modules." },
  { id: "equipment", label: "Items", eyebrow: "Runner equipment archive // Item index", intro: "Access weapon, vehicle, drone, and equipment reference modules." }
] as const;
