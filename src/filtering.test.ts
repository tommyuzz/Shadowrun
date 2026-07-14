import { describe, expect, it } from "vitest";
import { loadData, matchesSearch } from "./data";
import { modules, modulesById } from "./registry";
import { recordTags } from "./record-tags";

const expectedFilters: Record<string, string[]> = {
  skills: ["skill-group"],
  metatypes: ["racial-trait"],
  qualities: ["quality-type", "structure"],
  lifestyles: ["subcategory", "minimum-lifestyle"],
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

  it("matches nested lifestyle variants and restrictions", async () => {
    const data = await loadData("lifestyles");
    const garage = data.records.find((record) => record.id === "garage");
    const safehouse = data.records.find((record) => record.id === "safehouse");
    expect(garage).toBeDefined();
    expect(safehouse).toBeDefined();
    expect(matchesSearch(garage!, "helicopter pad access luxury")).toBe(true);
    expect(matchesSearch(safehouse!, "cannot purchase entertainment assets")).toBe(true);
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
  it("preserves both lifestyle collections and every supplied record", async () => {
    const data = await loadData("lifestyles");
    expect(data.records).toHaveLength(40);
    expect(data.records.filter((record) => record.category === "Entertainment")).toHaveLength(26);
    expect(data.records.filter((record) => record.category === "Lifestyle Options")).toHaveLength(14);
    expect(data.categories.map((category) => category.id)).toEqual(["all", "entertainment", "lifestyle-options"]);
  });

  it("exposes minimum lifestyles declared by selectable variants", async () => {
    const data = await loadData("lifestyles");
    const garage = data.records.find((record) => record.id === "garage")!;
    const minimumFilter = modulesById.lifestyles.filters.find((filter) => filter.id === "minimum-lifestyle")!;
    expect(minimumFilter.values(garage)).toEqual(expect.arrayContaining(["Medium", "High", "Luxury"]));
    expect(minimumFilter.values(garage)).not.toContain("*");
  });
});
