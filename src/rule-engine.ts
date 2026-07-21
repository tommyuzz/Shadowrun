import rulesPayload from "../relationship_rules.json";

export type RuleScalar = string | number | boolean | null;
export type RuleValue = RuleScalar | RuleScalar[];

export type RuleCondition = {
  field?: string;
  fields?: string[];
  operator: "equals" | "not_equals" | "in" | "not_in" | "present" | "matches" | "contains" | "greater_than" | "greater_or_equal" | "less_than" | "less_or_equal";
  value?: RuleValue;
  compare_field?: string;
  flags?: string;
};

export type RuleNode =
  | { all: RuleNode[] }
  | { any: RuleNode[] }
  | { not: RuleNode }
  | { ref: string }
  | RuleCondition;

export type RuleContext = Record<string, unknown>;
export type RuleDefinitions = Record<string, RuleNode>;
export type RulePredicate = (context: RuleContext) => boolean;

export interface RelationshipRuleSet {
  $schema?: string;
  ruleset: "shadowrun5e.relationships";
  schema_version: 1;
  weapon_support: {
    profile_field: string;
    fallback_label: string;
    definitions: RuleDefinitions;
    profiles: Record<string, {
      display_label: string;
      rule: RuleNode;
    }>;
  };
  equipment_enhancements: {
    match: RuleNode;
    exclusions: Array<{
      id: string;
      reason: string;
      when: RuleNode;
    }>;
  };
}

export const relationshipRules = rulesPayload as unknown as RelationshipRuleSet;

export function ruleValueAtPath(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return (value as Record<string, unknown>)[segment];
  }, root);
}

function valuesForCondition(condition: RuleCondition, context: RuleContext): unknown[] {
  if (condition.fields) return condition.fields.map((path) => ruleValueAtPath(context, path));
  return [ruleValueAtPath(context, condition.field || "")];
}

function textFragments(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(textFragments);
  return value == null || value === false || value === "" ? [] : [String(value)];
}

function compileCondition(condition: RuleCondition): RulePredicate {
  const regex = condition.operator === "matches" ? new RegExp(String(condition.value ?? ""), condition.flags) : null;

  return (context) => {
    const values = valuesForCondition(condition, context);
    const left = values[0];
    const compared = condition.compare_field ? ruleValueAtPath(context, condition.compare_field) : condition.value;

    switch (condition.operator) {
      case "equals":
        return left === compared;
      case "not_equals":
        return left !== compared;
      case "in":
        return Array.isArray(compared) && compared.includes(left as never);
      case "not_in":
        return Array.isArray(compared) && !compared.includes(left as never);
      case "present":
        return values.some(Boolean);
      case "matches": {
        if (!regex) return false;
        regex.lastIndex = 0;
        return regex.test(values.flatMap(textFragments).join(" "));
      }
      case "contains":
        return Array.isArray(left) && left.some((value) => value === compared);
      case "greater_than":
        return typeof left === "number" && typeof compared === "number" && left > compared;
      case "greater_or_equal":
        return typeof left === "number" && typeof compared === "number" && left >= compared;
      case "less_than":
        return typeof left === "number" && typeof compared === "number" && left < compared;
      case "less_or_equal":
        return typeof left === "number" && typeof compared === "number" && left <= compared;
      default:
        return false;
    }
  };
}

export function compileRule(rule: RuleNode, definitions: RuleDefinitions = {}, referenceStack: string[] = []): RulePredicate {
  if ("all" in rule) {
    const predicates = rule.all.map((child) => compileRule(child, definitions, referenceStack));
    return (context) => predicates.every((predicate) => predicate(context));
  }
  if ("any" in rule) {
    const predicates = rule.any.map((child) => compileRule(child, definitions, referenceStack));
    return (context) => predicates.some((predicate) => predicate(context));
  }
  if ("not" in rule) {
    const predicate = compileRule(rule.not, definitions, referenceStack);
    return (context) => !predicate(context);
  }
  if ("ref" in rule) {
    if (referenceStack.includes(rule.ref)) throw new Error(`Circular rule reference: ${[...referenceStack, rule.ref].join(" -> ")}`);
    const referenced = definitions[rule.ref];
    if (!referenced) throw new Error(`Unknown rule reference: ${rule.ref}`);
    return compileRule(referenced, definitions, [...referenceStack, rule.ref]);
  }
  return compileCondition(rule);
}

export function evaluateRule(rule: RuleNode, context: RuleContext, definitions: RuleDefinitions = {}): boolean {
  return compileRule(rule, definitions)(context);
}
