import { describe, expect, it } from "vitest";
import { compileRule, evaluateRule, relationshipRules, ruleValueAtPath, type RuleNode } from "./rule-engine";

describe("structured relationship rules", () => {
  it("exposes a versioned ruleset whose weapon profiles carry both logic and unchanged display labels", () => {
    expect(relationshipRules.ruleset).toBe("shadowrun5e.relationships");
    expect(relationshipRules.schema_version).toBe(1);
    expect(relationshipRules.weapon_support.profile_field).toBe("raw.compatibility_profile");
    expect(Object.keys(relationshipRules.weapon_support.profiles)).toHaveLength(18);
    expect(relationshipRules.weapon_support.profiles["firearm-or-heavy"].display_label).toBe("Firearms and heavy weapons");
  });

  it("evaluates reusable logical definitions, multi-field patterns and negation", () => {
    const definitions = {
      firearm: {
        all: [
          { field: "weapon.category", operator: "equals", value: "Firearms" },
          { field: "weapon.raw.ammo", operator: "present" }
        ]
      }
    } satisfies Record<string, RuleNode>;
    const rule = {
      all: [
        { ref: "firearm" },
        { not: { field: "weapon.subcategory", operator: "equals", value: "Laser Weapons" } },
        { fields: ["weapon.name", "weapon.raw.features"], operator: "matches", value: "smart|predator", flags: "i" }
      ]
    } satisfies RuleNode;
    const weapon = { category: "Firearms", subcategory: "Heavy Pistols", name: "Ares Predator V", raw: { ammo: "15 (c)", features: "Smartgun" } };
    expect(evaluateRule(rule, { weapon }, definitions)).toBe(true);
  });

  it("compares arrays to another context field for data-declared equipment targets", () => {
    const predicate = compileRule({
      field: "enhancement.compatible_items",
      operator: "contains",
      compare_field: "equipment.name"
    });
    expect(predicate({ enhancement: { compatible_items: ["Camera", "Binoculars"] }, equipment: { name: "Camera" } })).toBe(true);
    expect(predicate({ enhancement: { compatible_items: ["Camera"] }, equipment: { name: "Audio Recorder" } })).toBe(false);
  });

  it("reads configured paths without depending on a particular record type", () => {
    expect(ruleValueAtPath({ raw: { compatibility_profile: "pistol" } }, "raw.compatibility_profile")).toBe("pistol");
    expect(ruleValueAtPath({ raw: {} }, "raw.missing")).toBeUndefined();
  });

  it("supports numeric comparisons for headless creation eligibility rules", () => {
    const context = { character: { magic_rating: 4 } };
    expect(evaluateRule({ field: "character.magic_rating", operator: "greater_than", value: 0 }, context)).toBe(true);
    expect(evaluateRule({ field: "character.magic_rating", operator: "greater_or_equal", value: 4 }, context)).toBe(true);
    expect(evaluateRule({ field: "character.magic_rating", operator: "less_than", value: 5 }, context)).toBe(true);
    expect(evaluateRule({ field: "character.magic_rating", operator: "less_or_equal", value: 4 }, context)).toBe(true);
    expect(evaluateRule({ field: "character.magic_rating", operator: "not_equals", value: 3 }, context)).toBe(true);
  });

  it("rejects missing and circular rule references", () => {
    expect(() => compileRule({ ref: "missing" })).toThrow("Unknown rule reference");
    expect(() => compileRule({ ref: "a" }, { a: { ref: "b" }, b: { ref: "a" } })).toThrow("Circular rule reference");
  });
});
