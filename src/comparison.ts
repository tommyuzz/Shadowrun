import type { ReferenceRecord } from "./types";

export type ComparisonModule = "weapons" | "cyberdecks" | "vehicles" | "drones";
export type ComparisonDirection = "higher" | "lower";

export interface ComparisonField {
  key: string;
  label: string;
  direction?: ComparisonDirection;
  score?: (value: string) => number;
}

const numberScore = (value: string): number => {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
};

const sumScore = (value: string): number => {
  const values = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  return values.length ? values.reduce((total, item) => total + item, 0) : Number.NaN;
};

export const comparisonFields: Record<ComparisonModule, ComparisonField[]> = {
  weapons: [
    { key: "category", label: "Category" },
    { key: "subcategory", label: "Weapon type" },
    { key: "skill", label: "Associated skill" },
    { key: "accuracy", label: "Accuracy", direction: "higher", score: numberScore },
    { key: "reach", label: "Reach", direction: "higher", score: numberScore },
    { key: "damage", label: "Damage" },
    { key: "ap", label: "Armor penetration", direction: "lower", score: numberScore },
    { key: "mode", label: "Firing mode" },
    { key: "rc", label: "Recoil compensation", direction: "higher", score: numberScore },
    { key: "ammo", label: "Ammunition" },
    { key: "blast", label: "Blast" },
    { key: "availability", label: "Availability" },
    { key: "cost", label: "Cost", direction: "lower", score: numberScore },
    { key: "source", label: "Source" }
  ],
  cyberdecks: [
    { key: "subcategory", label: "Hardware class" },
    { key: "device_rating", label: "Device rating", direction: "higher", score: numberScore },
    { key: "attribute_array", label: "Attribute array", direction: "higher", score: sumScore },
    { key: "programs", label: "Program capacity", direction: "higher", score: numberScore },
    { key: "availability", label: "Availability" },
    { key: "cost", label: "Cost", direction: "lower", score: numberScore },
    { key: "source", label: "Source" }
  ],
  vehicles: [
    { key: "category", label: "Vehicle class" },
    { key: "subcategory", label: "Vehicle type" },
    { key: "skill", label: "Control skill" },
    { key: "handling", label: "Handling" },
    { key: "speed", label: "Speed" },
    { key: "acceleration", label: "Acceleration", direction: "higher", score: numberScore },
    { key: "body", label: "Body", direction: "higher", score: numberScore },
    { key: "armor", label: "Armor", direction: "higher", score: numberScore },
    { key: "pilot", label: "Pilot", direction: "higher", score: numberScore },
    { key: "sensor", label: "Sensor", direction: "higher", score: numberScore },
    { key: "seats", label: "Seats", direction: "higher", score: numberScore },
    { key: "availability", label: "Availability" },
    { key: "cost", label: "Cost", direction: "lower", score: numberScore },
    { key: "source", label: "Source" }
  ],
  drones: [
    { key: "subcategory", label: "Drone class" },
    { key: "skill", label: "Control skill" },
    { key: "handling", label: "Handling", direction: "higher", score: numberScore },
    { key: "speed", label: "Speed", direction: "higher", score: numberScore },
    { key: "acceleration", label: "Acceleration", direction: "higher", score: numberScore },
    { key: "body", label: "Body", direction: "higher", score: numberScore },
    { key: "armor", label: "Armor", direction: "higher", score: numberScore },
    { key: "pilot", label: "Pilot", direction: "higher", score: numberScore },
    { key: "sensor", label: "Sensor", direction: "higher", score: numberScore },
    { key: "availability", label: "Availability" },
    { key: "cost", label: "Cost", direction: "lower", score: numberScore },
    { key: "source", label: "Source" }
  ]
};

export function comparisonValue(record: ReferenceRecord | undefined, key: string): string {
  if (!record) return "—";
  if (key === "category") return record.category || "—";
  if (key === "subcategory") return record.subcategory || "—";
  if (key === "source") return record.source || "—";
  const value = record.raw[key];
  return value == null || value === "" ? "—" : String(value);
}

export function visibleComparisonFields(moduleId: ComparisonModule, records: Array<ReferenceRecord | undefined>): ComparisonField[] {
  return comparisonFields[moduleId].filter((field) =>
    records.some((record) => comparisonValue(record, field.key) !== "—")
  );
}

export function bestComparisonIndexes(field: ComparisonField, values: string[]): number[] {
  if (!field.direction) return [];
  const score = field.score || numberScore;
  const scored = values.map((value, index) => ({ index, score: score(value) }))
    .filter((entry) => Number.isFinite(entry.score));
  if (scored.length < 2 || new Set(scored.map((entry) => entry.score)).size < 2) return [];
  const target = field.direction === "higher"
    ? Math.max(...scored.map((entry) => entry.score))
    : Math.min(...scored.map((entry) => entry.score));
  return scored.filter((entry) => entry.score === target).map((entry) => entry.index);
}
