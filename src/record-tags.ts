import { titleCase, valueText } from "./presentation";
import { supportCompatibilityLabel } from "./relations";
import type { RawRecord, ReferenceData, ReferenceRecord } from "./types";

export interface RecordTag {
  key: string;
  label: string;
  html: string;
}

const strings = (value: unknown): string[] => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
const recordMap = (data: ReferenceData, key: string): RawRecord => {
  const value = data.payload[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {};
};
const legality = (availability: unknown, open = "Legal") => /F$/.test(String(availability || "")) ? "Forbidden" : /R$/.test(String(availability || "")) ? "Restricted" : open;

function traitKey(input: string): string {
  if (input === "Low-Light Vision" || input === "Thermographic Vision") return input;
  if (/pathogen|toxin/i.test(input)) return "Pathogen and Toxin Resistance";
  if (/Reach/i.test(input)) return "Reach";
  if (/Dermal Armor/i.test(input)) return "Dermal Armor";
  if (/Lifestyle cost/i.test(input)) return "Lifestyle Cost";
  return input;
}

export function recordTags(moduleId: string, record: ReferenceRecord, data: ReferenceData): RecordTag[] {
  const raw = record.raw;
  switch (moduleId) {
    case "skills": {
      const attribute = titleCase(raw.attribute);
      const group = raw.skillgroup ? titleCase(raw.skillgroup) : "";
      const groupSkills = group ? data.records.filter((item) => item.raw.skillgroup === raw.skillgroup).map((item) => item.name).sort((a, b) => a.localeCompare(b)) : [];
      const groupList = groupSkills.length ? `<br><br><strong>Skills in this group</strong><ul>${groupSkills.map((name) => `<li>${name}</li>`).join("")}</ul>` : "";
      return [
        { key: "attribute", label: `${attribute} linked`, html: `<strong>Linked attribute</strong><br>This skill is linked to <strong>${attribute}</strong>. A normal skill test uses the linked attribute plus the skill rating, unless a specific rule calls for a different dice pool.` },
        { key: "default", label: raw.default ? "Defaultable" : "No default", html: raw.default ? "<strong>Defaulting</strong><br>This skill may be attempted without a skill rating. Roll the linked attribute with a <strong>–1 dice pool modifier</strong>, before applying any other relevant modifiers." : "<strong>Defaulting</strong><br>This skill <strong>cannot be defaulted</strong>. A character needs an appropriate skill rating before attempting tests that require it." },
        { key: "group", label: group ? `${group} group` : "Standalone skill", html: group ? `<strong>Skill group</strong><br>This skill belongs to the <strong>${group}</strong> skill group. Skill groups allow related skills to be improved together while the group remains intact.${groupList}` : "<strong>Standalone skill</strong><br>This skill is not part of a skill group and is improved individually." }
      ];
    }
    case "actions": {
      const rules = recordMap(data, "action_rules");
      const restriction = valueText(raw.attack_restriction);
      const role = /modifies an attack/i.test(restriction) ? "Attack modifier" : /counts as.*attack/i.test(restriction) ? "Attack action" : /^not an attack/i.test(restriction) ? "Non-attack" : "Conditional";
      const requirementCount = strings(raw.requirements).length;
      return [
        { key: "action-type", label: record.category, html: String(rules[record.category] || `<strong>${record.category}</strong><br>No action-economy definition is available.`) },
        { key: "attack-role", label: role, html: `<strong>${role}</strong><br>${restriction}` },
        { key: "requirements", label: requirementCount ? `${requirementCount} ${requirementCount === 1 ? "requirement" : "requirements"}` : "No requirements", html: requirementCount ? `<strong>Requirements</strong><ul>${strings(raw.requirements).map((requirement) => `<li>${requirement}</li>`).join("")}</ul>` : "<strong>No additional requirements</strong><br>This action has no separate prerequisite in the supplied record." }
      ];
    }
    case "metatypes": {
      const definitions = recordMap(data, "racial_traits");
      return Array.from(new Set(strings(raw.racial_traits).map(traitKey))).map((trait) => ({ key: trait, label: trait, html: String(definitions[trait] || "No racial trait details are available.") }));
    }
    case "qualities": {
      const categories = recordMap(data, "category");
      const qualityTypes = recordMap(data, "quality_types");
      const structuredKeys = ["options", "levels", "variants", "rarity", "severity", "target_prevalence", "degree", "possible_side_effects"];
      const limit = raw.max_rating ?? raw.max_level;
      const qualityType = valueText(raw.quality_type, "");
      const structure = limit != null ? "Rated" : structuredKeys.some((key) => raw[key] && typeof raw[key] === "object") ? "Choice-based" : "Fixed";
      const structureCopy = limit != null
        ? `<strong>Rated quality</strong><br>This quality can be purchased up to Rating <strong>${valueText(limit)}</strong>. Apply the listed Karma value for each rating or level.`
        : structure === "Choice-based"
          ? "<strong>Choice-based quality</strong><br>This record includes selectable levels, variants, degrees, or options. Review the structured choice cards below before applying it to a character."
          : "<strong>Fixed quality</strong><br>This quality has no separate rating or structured variant in the supplied record.";
      return [
        { key: "category", label: record.category, html: String(categories[record.category] || `<strong>${record.category}</strong><br>No category rules are available.`) },
        ...(qualityType ? [{ key: "quality-type", label: qualityType, html: String(qualityTypes[qualityType] || `<strong>${qualityType}</strong><br>No quality type rules are available.`) }] : []),
        { key: "structure", label: limit != null ? `${structure} · Max ${valueText(limit)}` : structure, html: structureCopy }
      ];
    }
    case "lifestyles": {
      if (record.category === "Lifestyles") {
        const rules = recordMap(data, "rules");
        const categories = recordMap(data, "lifestyle_categories");
        const lifestyleType = valueText(raw.lifestyle_type, "Residential");
        const categoryNames = ["Comforts & Necessities", "Security", "Neighborhood", "Entertainment"];
        return [
          { key: "lifestyle-type", label: lifestyleType, html: `<strong>${lifestyleType}</strong><br>This record is classified as a <strong>${lifestyleType}</strong> lifestyle.` },
          { key: "core-lifestyle", label: "Core lifestyle", html: String(rules["Core Lifestyle Selection"] || "No core lifestyle rule is available.") },
          ...categoryNames.map((name) => ({ key: name, label: name, html: String(categories[name] || `<strong>${name}</strong><br>No category guidance is available.`) }))
        ];
      }
      const categories = recordMap(data, "category");
      const subcategories = recordMap(data, "subcategories");
      const variantCount = raw.variants && typeof raw.variants === "object" && !Array.isArray(raw.variants) ? Object.keys(raw.variants).length : 0;
      return [
        { key: "category", label: record.category, html: String(categories[record.category] || `<strong>${record.category}</strong><br>No category rules are available.`) },
        { key: "subcategory", label: valueText(raw.subcategory), html: String(subcategories[String(raw.subcategory)] || `<strong>${valueText(raw.subcategory)}</strong><br>No lifestyle type details are available.`) },
        ...(variantCount ? [{ key: "variants", label: `${variantCount} ${variantCount === 1 ? "variant" : "variants"}`, html: `<strong>Selectable variants</strong><br>This entry has <strong>${variantCount}</strong> configured ${variantCount === 1 ? "variant" : "variants"}. Point cost, monthly cost, minimum lifestyle, and effects may differ by selection.` }] : [])
      ];
    }
    case "cyberdecks": {
      const definitions = recordMap(data, "subcategories");
      return [
        { key: "subcategory", label: valueText(raw.subcategory), html: String(definitions[String(raw.subcategory)] || "No classification details are available.") },
        { key: "legality", label: legality(raw.availability, "Open market"), html: `<strong>Market status</strong><br>This record has an Availability value of <strong>${valueText(raw.availability)}</strong>.` }
      ];
    }
    case "matrixinteraction": {
      const definitions = recordMap(data, "subcategories");
      return Array.from(new Set([valueText(raw.subcategory, ""), ...strings(raw.functions)].filter(Boolean))).map((name) => ({ key: name, label: name, html: String(definitions[name] || "No function details are available.") }));
    }
    case "sprites": {
      const definitions = recordMap(data, "sprite_powers");
      return strings(raw.powers).map((power) => ({ key: power, label: power, html: String((definitions[power] as RawRecord | undefined)?.description || definitions[power] || "No power details are available.") }));
    }
    case "spells": {
      const category = data.payload[record.category.toLowerCase()] as RawRecord | undefined;
      const definitions = category?.keywords as RawRecord | undefined;
      return strings(raw.keywords).map((keyword) => ({ key: keyword, label: titleCase(keyword), html: String(definitions?.[keyword] || "No keyword description is listed for this entry.") }));
    }
    case "adeptpowers": {
      const definitions = recordMap(data, "rules");
      return strings(raw.ruleTags).map((rule) => ({ key: rule, label: titleCase(rule), html: String(definitions[rule] || "No rule details are available.") }));
    }
    case "rituals": {
      const definitions = recordMap(data, "keywords");
      return strings(raw.keywords).map((keyword) => ({ key: keyword, label: keyword, html: String(definitions[keyword] || "No keyword details are available.") }));
    }
    case "weapons": {
      const definitions = recordMap(data, "subcategories");
      const legal = legality(raw.availability);
      if (record.category === "Weapon Support") return [
        { key: "category", label: "Weapon Support", html: "<strong>Weapon Support</strong><br>This record is ammunition or an accessory stored with the weapons it supports rather than in the general equipment market." },
        { key: "type", label: valueText(raw.subcategory), html: `<strong>${valueText(raw.subcategory)}</strong><br>${supportCompatibilityLabel(record)} are listed from the centralized compatibility profile.` },
        { key: "compatibility", label: supportCompatibilityLabel(record), html: `<strong>Compatibility profile</strong><br>${supportCompatibilityLabel(record)} are included when their category, type and ammunition-feed data match. Mounts and specific exceptions still apply.` },
        { key: "legality", label: legal, html: `<strong>Legality</strong><br><strong>${legal}</strong> availability is indicated by <strong>${valueText(raw.availability)}</strong> in this record.` }
      ];
      return [
        { key: "category", label: record.category, html: `<strong>Weapon category</strong><br>This weapon is indexed under <strong>${titleCase(record.category)}</strong>. Use the matching archive tab to browse comparable weapons.` },
        { key: "type", label: valueText(raw.subcategory), html: String(definitions[String(raw.subcategory)] || "<strong>Weapon type</strong><br>No additional rules are available for this subcategory.") },
        { key: "legality", label: legal, html: `<strong>Legality</strong><br><strong>${legal}</strong> availability is indicated by <strong>${valueText(raw.availability)}</strong> in this record.` }
      ];
    }
    case "vehicles": {
      const categories = recordMap(data, "category");
      const definitions = recordMap(data, "subcategories");
      const legal = legality(raw.availability);
      return [
        { key: "category", label: record.category, html: String(categories[record.category] || "<strong>Vehicle category</strong><br>No category rules are available.") },
        { key: "type", label: valueText(raw.subcategory), html: String(definitions[String(raw.subcategory)] || "<strong>Vehicle type</strong><br>No subcategory rules are available.") },
        { key: "legality", label: legal, html: `<strong>Legality</strong><br><strong>${legal}</strong> availability is indicated by <strong>${valueText(raw.availability)}</strong> in this record.` }
      ];
    }
    case "drones": {
      const definitions = recordMap(data, "subcategories");
      return [
        { key: "size", label: valueText(raw.subcategory), html: String(definitions[String(raw.subcategory)] || "No size-class notes available.") },
        { key: "legality", label: legality(raw.availability), html: `<strong>Legality</strong><br>Availability code: <strong>${valueText(raw.availability)}</strong>.` }
      ];
    }
    case "equipment": {
      const definitions = recordMap(data, "subcategories");
      return [
        { key: "subcategory", label: valueText(raw.subcategory), html: String(definitions[String(raw.subcategory)] || "No product-type rules are available.") },
        { key: "legality", label: legality(raw.availability, "Open market"), html: `<strong>Market status</strong><br>This listing has an Availability value of <strong>${valueText(raw.availability)}</strong>.` }
      ];
    }
    default: return [];
  }
}
