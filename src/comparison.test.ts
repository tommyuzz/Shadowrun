import { describe, expect, it } from "vitest";
import { bestComparisonIndexes, comparisonFields, comparisonValue, visibleComparisonFields } from "./comparison";
import type { ReferenceRecord } from "./types";

function record(id: string, raw: Record<string, unknown>): ReferenceRecord {
  return {
    id,
    name: id,
    category: String(raw.category || "Firearms"),
    subcategory: String(raw.subcategory || "Heavy Pistols"),
    source: String(raw.source || "CRB"),
    tags: [],
    searchText: "",
    raw
  };
}

describe("archive comparison", () => {
  it("exposes the expected specifications for every supported archive", () => {
    expect(comparisonFields.weapons.map((field) => field.key)).toContain("damage");
    expect(comparisonFields.weapons.map((field) => field.key)).toContain("ap");
    expect(comparisonFields.cyberdecks.map((field) => field.key)).toEqual([
      "subcategory", "device_rating", "attribute_array", "programs", "availability", "cost", "source"
    ]);
    expect(comparisonFields.vehicles.map((field) => field.key)).toEqual([
      "category", "subcategory", "skill", "handling", "speed", "acceleration", "body", "armor", "pilot", "sensor", "seats", "availability", "cost", "source"
    ]);
    expect(comparisonFields.drones.map((field) => field.key)).toEqual([
      "subcategory", "skill", "handling", "speed", "acceleration", "body", "armor", "pilot", "sensor", "availability", "cost", "source"
    ]);
  });

  it("reads common and raw record values without mutating data", () => {
    const item = record("A", { accuracy: "5", source: "CRB" });
    expect(comparisonValue(item, "subcategory")).toBe("Heavy Pistols");
    expect(comparisonValue(item, "accuracy")).toBe("5");
    expect(comparisonValue(item, "missing")).toBe("—");
  });

  it("omits comparison rows that contain no supplied values", () => {
    const fields = visibleComparisonFields("weapons", [record("A", { accuracy: "5" }), record("B", { accuracy: "6" })]);
    expect(fields.map((field) => field.key)).toContain("accuracy");
    expect(fields.map((field) => field.key)).not.toContain("blast");
  });

  it("marks the best numeric value using each field's direction", () => {
    const accuracy = comparisonFields.weapons.find((field) => field.key === "accuracy")!;
    const penetration = comparisonFields.weapons.find((field) => field.key === "ap")!;
    const cost = comparisonFields.cyberdecks.find((field) => field.key === "cost")!;
    const vehicleBody = comparisonFields.vehicles.find((field) => field.key === "body")!;
    const droneSpeed = comparisonFields.drones.find((field) => field.key === "speed")!;
    expect(bestComparisonIndexes(accuracy, ["5", "7", "6"])).toEqual([1]);
    expect(bestComparisonIndexes(penetration, ["-2", "-4", "—"])).toEqual([1]);
    expect(bestComparisonIndexes(cost, ["49,500¥", "58,000¥"])).toEqual([0]);
    expect(bestComparisonIndexes(vehicleBody, ["5", "12", "8"])).toEqual([1]);
    expect(bestComparisonIndexes(droneSpeed, ["2", "4", "3"])).toEqual([1]);
  });

  it("does not imply a winner when comparable values are tied or incomplete", () => {
    const rating = comparisonFields.cyberdecks.find((field) => field.key === "device_rating")!;
    expect(bestComparisonIndexes(rating, ["3", "3"])).toEqual([]);
    expect(bestComparisonIndexes(rating, ["3", "—"])).toEqual([]);
  });
});
