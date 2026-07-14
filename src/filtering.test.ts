import { describe, expect, it } from "vitest";
import { loadData, matchesSearch } from "./data";
import { modules, modulesById } from "./registry";

const expectedFilters: Record<string, string[]> = {
  skills: ["skill-group"],
  metatypes: ["racial-trait"],
  qualities: ["structure"],
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
});

describe("qualities dataset", () => {
  it("preserves both quality categories and every supplied record", async () => {
    const data = await loadData("qualities");
    expect(data.records).toHaveLength(243);
    expect(data.records.filter((record) => record.category === "Positive Qualities")).toHaveLength(142);
    expect(data.records.filter((record) => record.category === "Negative Qualities")).toHaveLength(101);
    expect(data.categories.map((category) => category.id)).toEqual(["all", "positive-qualities", "negative-qualities"]);
  });
});
