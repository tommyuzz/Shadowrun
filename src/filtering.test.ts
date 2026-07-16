import { describe, expect, it } from "vitest";
import { loadData, matchesSearch } from "./data";
import { modules, modulesById } from "./registry";
import { recordTags } from "./record-tags";

const expectedFilters: Record<string, string[]> = {
  skills: ["skill-group"],
  attributes: ["linked-skill"],
  metatypes: ["racial-trait"],
  qualities: ["quality-type", "structure"],
  lifestyles: ["lifestyle-type", "subcategory", "minimum-lifestyle"],
  priorityarray: [],
  cyberdecks: ["subcategory"],
  matrixinteraction: ["function", "context"],
  sprites: ["power", "skill"],
  spells: ["keyword"],
  adeptpowers: ["cost-type", "pp-cost", "activation"],
  rituals: ["keyword"],
  spirits: ["power", "skill"],
  weapons: ["subcategory", "legality"],
  vehicles: ["subcategory"],
  drones: ["control-skill"],
  equipment: ["subcategory"]
};

describe("module-specific filters", () => {
  it("registers the complete expected filter set", () => {
    expect(Object.fromEntries(modules.map((module) => [module.id, module.filters.map((filter) => filter.id)]))).toEqual(expectedFilters);
  });

  for (const [moduleId, filterIds] of Object.entries(expectedFilters)) {
    it(`${moduleId} produces usable options for every configured filter`, async () => {
      const data = await loadData(moduleId);
      const module = modulesById[moduleId];
      expect(module.filters.map((filter) => filter.id)).toEqual(filterIds);
      for (const filter of module.filters) {
        const options = Array.from(new Set(data.records.flatMap((record) => filter.values(record)).filter(Boolean)));
        expect(options.length, `${moduleId}:${filter.id} should have options`).toBeGreaterThan(0);
        expect(data.records.some((record) => filter.values(record).includes(options[0]))).toBe(true);
      }
    });
  }
});

describe("full-record search", () => {
  it("matches description text absent from the record title", async () => {
    const data = await loadData("skills");
    const archery = data.records.find((record) => record.id === "archery");
    expect(archery).toBeDefined();
    expect(matchesSearch(archery!, "muscle-powered projectile")).toBe(true);
  });

  it("matches field names and nested statistical values", async () => {
    const data = await loadData("metatypes");
    const human = data.records.find((record) => record.id === "human");
    expect(human).toBeDefined();
    expect(matchesSearch(human!, "scientific name homo sapiens")).toBe(true);
    expect(matchesSearch(human!, "attributes body minimum")).toBe(true);
  });

  it("requires every search term while ignoring letter case", async () => {
    const data = await loadData("matrixinteraction");
    const bruteForce = data.records.find((record) => record.id === "brute-force");
    expect(bruteForce).toBeDefined();
    expect(matchesSearch(bruteForce!, "CYBERCOMBAT firewall")).toBe(true);
    expect(matchesSearch(bruteForce!, "cybercombat nonexistent-value")).toBe(false);
  });

  it("matches nested quality levels and fields outside the title", async () => {
    const data = await loadData("qualities");
    const addiction = data.records.find((record) => record.id === "addiction");
    expect(addiction).toBeDefined();
    expect(matchesSearch(addiction!, "withdrawal penalty daily")).toBe(true);
    expect(matchesSearch(addiction!, "social penalty -3")).toBe(true);
  });

  it("matches nested lifestyle ratings and special rules", async () => {
    const data = await loadData("lifestyles");
    const boltHole = data.records.find((record) => record.id === "bolt-hole");
    const commercial = data.records.find((record) => record.id === "commercial");
    const garage = data.records.find((record) => record.id === "garage");
    const safehouse = data.records.find((record) => record.id === "safehouse");
    expect(boltHole).toBeDefined();
    expect(commercial).toBeDefined();
    expect(garage).toBeDefined();
    expect(safehouse).toBeDefined();
    expect(matchesSearch(boltHole!, "security limit 4 track resident")).toBe(true);
    expect(matchesSearch(commercial!, "charisma etiquette corporate net hit")).toBe(true);
    expect(matchesSearch(garage!, "helicopter pad access luxury")).toBe(true);
    expect(matchesSearch(safehouse!, "cannot purchase entertainment assets")).toBe(true);
  });

  it("matches nested attribute tests, formulas and rating benchmarks", async () => {
    const data = await loadData("attributes");
    const body = data.records.find((record) => record.id === "body");
    const resonance = data.records.find((record) => record.id === "resonance");
    expect(body).toBeDefined();
    expect(resonance).toBeDefined();
    expect(matchesSearch(body!, "lifting and carrying test")).toBe(true);
    expect(matchesSearch(body!, "physical condition monitor ceil")).toBe(true);
    expect(matchesSearch(resonance!, "barely emergent")).toBe(true);
  });
});

describe("attributes dataset", () => {
  it("preserves every supplied Physical, Mental and Special Attribute", async () => {
    const data = await loadData("attributes");
    expect(data.records).toHaveLength(12);
    expect(data.records.filter((record) => record.category === "Physical")).toHaveLength(4);
    expect(data.records.filter((record) => record.category === "Mental")).toHaveLength(4);
    expect(data.records.filter((record) => record.category === "Special")).toHaveLength(4);
    expect(data.categories.map((category) => category.id)).toEqual(["all", "physical", "mental", "special"]);
    expect(data.records.every((record) => record.source === "CRB")).toBe(true);
  });

  it("exposes linked skills as a usable filter without inventing links", async () => {
    const data = await loadData("attributes");
    const linkedSkillFilter = modulesById.attributes.filters.find((filter) => filter.id === "linked-skill")!;
    const options = Array.from(new Set(data.records.flatMap((record) => linkedSkillFilter.values(record))));
    expect(options).toEqual(expect.arrayContaining(["Hacking", "Perception", "Spellcasting", "Unarmed Combat"]));
    expect(data.records.filter((record) => linkedSkillFilter.values(record).length === 0).map((record) => record.name)).toEqual(["Edge", "Essence"]);
  });

  it("retains supplied category definitions and benchmark guidance", async () => {
    const data = await loadData("attributes");
    const benchmarkScale = data.payload.benchmark_scale as Record<string, unknown>;
    expect(data.definitions.Physical).toContain("Body, Agility, Reaction, and Strength");
    expect(benchmarkScale.scope).toContain("not an official Core Rulebook rating table");
    expect(benchmarkScale.special_attribute_note).toContain("dedicated benchmarks");
  });
});

describe("qualities dataset", () => {
  it("preserves both quality categories and every supplied record", async () => {
    const data = await loadData("qualities");
    expect(data.records).toHaveLength(243);
    expect(data.records.filter((record) => record.category === "Positive Qualities")).toHaveLength(142);
    expect(data.records.filter((record) => record.category === "Negative Qualities")).toHaveLength(101);
    expect(data.categories.map((category) => category.id)).toEqual(["all", "positive-qualities", "negative-qualities"]);
  });

  it("exposes supplied quality types as filters and record definition tags", async () => {
    const data = await loadData("qualities");
    const typeFilter = modulesById.qualities.filters.find((filter) => filter.id === "quality-type")!;
    const options = Array.from(new Set(data.records.flatMap((record) => typeFilter.values(record)))).sort();
    const metagenic = data.records.find((record) => record.id === "360-degree-eyesight")!;
    const typeTag = recordTags("qualities", metagenic, data).find((tag) => tag.key === "quality-type");
    expect(options).toEqual(["General", "Infected", "Lifestyle", "Metagenic"]);
    expect(data.records.filter((record) => typeFilter.values(record).length === 0)).toHaveLength(31);
    expect(typeTag?.label).toBe("Metagenic");
    expect(typeTag?.html).toContain("SURGE mutations");
  });
});

describe("lifestyles dataset", () => {
  it("preserves all three requested collections and their tab order", async () => {
    const data = await loadData("lifestyles");
    expect(data.records).toHaveLength(49);
    expect(data.records.filter((record) => record.category === "Lifestyles")).toHaveLength(9);
    expect(data.records.filter((record) => record.category === "Entertainment")).toHaveLength(26);
    expect(data.records.filter((record) => record.category === "Lifestyle Options")).toHaveLength(14);
    expect(data.categories.map((category) => category.id)).toEqual(["lifestyles", "entertainment", "lifestyle-options"]);
    expect(data.records.slice(0, 9).map((record) => record.name)).toEqual(["Street", "Squatter", "Low", "Middle", "High", "Luxury", "Bolt Hole", "Traveler", "Commercial"]);
    const street = data.records.find((record) => record.id === "street")!;
    expect(street.raw.comforts_and_necessities).toEqual({ base: 0, limit: 1 });
    expect(street.raw.built_in_options).toEqual([]);
  });

  it("exposes lifestyle types as a filter and category guidance as record tags", async () => {
    const data = await loadData("lifestyles");
    const typeFilter = modulesById.lifestyles.filters.find((filter) => filter.id === "lifestyle-type")!;
    const types = Array.from(new Set(data.records.flatMap((record) => typeFilter.values(record)))).sort();
    const boltHole = data.records.find((record) => record.id === "bolt-hole")!;
    const tags = recordTags("lifestyles", boltHole, data);
    expect(types).toEqual(["Business Premises", "Hideout", "Mobile Lodging", "Residential"]);
    expect(tags.find((tag) => tag.key === "lifestyle-type")?.label).toBe("Hideout");
    expect(tags.find((tag) => tag.key === "Security")?.html).toContain("locks, surveillance, guards");
  });

  it("keeps the restored subtype and minimum-lifestyle filters scoped to the original tabs", async () => {
    const data = await loadData("lifestyles");
    const garage = data.records.find((record) => record.id === "garage")!;
    const safehouse = data.records.find((record) => record.id === "safehouse")!;
    const street = data.records.find((record) => record.id === "street")!;
    const subtypeFilter = modulesById.lifestyles.filters.find((filter) => filter.id === "subcategory")!;
    const minimumFilter = modulesById.lifestyles.filters.find((filter) => filter.id === "minimum-lifestyle")!;
    expect(subtypeFilter.values(garage)).toEqual(["Asset"]);
    expect(subtypeFilter.values(safehouse)).toEqual(["Positive"]);
    expect(subtypeFilter.values(street)).toEqual([]);
    expect(minimumFilter.values(garage)).toEqual(expect.arrayContaining(["Medium", "High", "Luxury"]));
    expect(minimumFilter.values(street)).toEqual([]);
  });
});

describe("priority array dataset", () => {
  it("preserves every priority and all three play-level resource arrays", async () => {
    const data = await loadData("priorityarray");
    expect(data.records.map((record) => record.name)).toEqual(["Priority A", "Priority B", "Priority C", "Priority D", "Priority E"]);
    expect(data.categories.map((category) => category.id)).toEqual(["priority-array"]);
    for (const record of data.records) {
      expect(Object.keys(record.raw.resources as Record<string, unknown>)).toEqual(["regular", "street_level", "prime_runner"]);
    }
  });

  it("retains the selectable regular, street-level and prime-runner creation rules", async () => {
    const data = await loadData("priorityarray");
    const levels = data.payload.play_levels as Record<string, Record<string, unknown>>;
    expect(Object.keys(levels)).toEqual(["regular", "street_level", "prime_runner"]);
    expect(levels.regular.name).toBe("Experienced Runner");
    expect(levels.street_level.maximum_device_rating).toBe(4);
    expect(levels.prime_runner.maximum_availability).toBe(15);
  });
});
