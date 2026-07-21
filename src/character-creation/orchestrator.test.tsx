import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SourceSelectionProvider } from "../source-selection";
import { CharacterCreationPage } from "../pages/CharacterCreationPage";
import { AttributesStep, BiographyStep, ResourcesStep, SkillsStep } from "./steps";
import {
  ATTRIBUTE_IDS,
  adeptPowerCost,
  resourceCatalogue,
  resolveCatalogueAvailability,
  resolveCatalogueCost,
  resolveCatalogueEssence,
  resolveResourceSelection
} from "./catalogues";
import {
  CHARACTER_DRAFT_SCHEMA_VERSION,
  CHARACTER_DRAFT_STORAGE_KEY,
  assignPriority,
  createEmptyCharacterDraft,
  naturalAttributeRatings,
  parseCharacterDraft,
  type CharacterDraft
} from "./draft";
import {
  accessibleCreationStepIndex,
  evaluateCharacterDraft,
  firstIncompleteCreationStepIndex
} from "./orchestrator";
import { CONFIRMABLE_CREATION_STEPS, CREATION_STEPS } from "./workflow";

function createConfiguredDraft(): CharacterDraft {
  const draft = createEmptyCharacterDraft();
  draft.playLevelId = "regular";
  draft.priorityAssignments = {
    metatype: "D",
    attributes: "A",
    magic_or_resonance: "E",
    skills: "B",
    resources: "C"
  };
  draft.metatypeId = "human";
  draft.magicPathId = "mundane";
  draft.attributeRatings = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, 4])) as CharacterDraft["attributeRatings"];
  draft.specialPointSpend = { edge: 3, magic: 0, resonance: 0 };
  draft.biography = { ...draft.biography, streetName: "Test Runner", age: "28", lifestyleId: "middle" };
  return draft;
}

describe("2.0 catalogue adapters", () => {
  it("normalises fixed, rated, listed, lifestyle, focus, and augmentation values", () => {
    const deck = resourceCatalogue.find((entry) => entry.catalogueId === "cyberdecks:erika-mcd-1")!;
    const fakeSin = resourceCatalogue.find((entry) => entry.catalogueId === "equipment:fake-sin")!;
    const cybereyes = resourceCatalogue.find((entry) => entry.catalogueId === "equipment:cybereyes-basic-system")!;
    const powerFocus = resourceCatalogue.find((entry) => entry.catalogueId === "equipment:power-focus")!;
    const middle = resourceCatalogue.find((entry) => entry.catalogueId === "lifestyles:middle")!;
    const clothing = resourceCatalogue.find((entry) => entry.catalogueId === "equipment:clothing")!;
    expect([resolveCatalogueCost(deck), resolveCatalogueAvailability(deck)]).toEqual([49500, 3]);
    expect([resolveCatalogueCost(fakeSin, 4), resolveCatalogueAvailability(fakeSin, 4)]).toEqual([10000, 12]);
    expect([resolveCatalogueCost(cybereyes, 3), resolveCatalogueAvailability(cybereyes, 3), resolveCatalogueEssence(cybereyes, 3)]).toEqual([10000, 9, 0.4]);
    expect([resolveCatalogueCost(powerFocus, 2), resolveCatalogueAvailability(powerFocus, 2)]).toEqual([36000, 8]);
    expect(resolveCatalogueCost(middle)).toBe(5000);
    expect(resolveCatalogueCost(clothing)).toBeNull();
  });

  it("applies grade and metatype adjustments once when mapping a purchase", () => {
    const alphaEyes = resolveResourceSelection({ instanceId: "eyes", catalogueId: "equipment:cybereyes-basic-system", quantity: 1, rating: 3, grade: "alphaware" }, "human");
    const trollLifestyle = resolveResourceSelection({ instanceId: "home", catalogueId: "lifestyles:middle", quantity: 1 }, "troll");
    expect(alphaEyes.issues).toEqual([]);
    expect(alphaEyes.purchase).toMatchObject({ cost: 12000, essenceCost: 0.32, availability: 9, augmentationGrade: "alphaware" });
    expect(trollLifestyle.purchase).toMatchObject({ baseCost: 5000, cost: 10000, kind: "lifestyle" });
  });

  it("resolves every adept power cost in quarter-point increments", () => {
    expect(adeptPowerCost("adrenaline-boost", 3)).toBe(0.75);
    expect(adeptPowerCost("improved-reflexes", 2)).toBe(2.5);
    expect(adeptPowerCost("astral-perception", 1)).toBe(1);
  });
});

describe("2.0 unified CharacterDraft", () => {
  it("starts as a genuinely blank, entirely incomplete draft", () => {
    const draft = createEmptyCharacterDraft();
    const evaluation = evaluateCharacterDraft(draft);
    expect(draft.playLevelId).toBe("");
    expect(Object.values(draft.priorityAssignments)).toEqual(["", "", "", "", ""]);
    expect(Object.values(draft.attributeRatings)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(draft.confirmedSteps).toEqual([]);
    expect(naturalAttributeRatings(draft)).toMatchObject({ edge: 0, magic: 0, resonance: 0 });
    expect(evaluation.steps.priorities.errors).toBeGreaterThan(0);
    expect(CONFIRMABLE_CREATION_STEPS.every((step) => !evaluation.steps[step.id].complete)).toBe(true);
    expect(firstIncompleteCreationStepIndex(evaluation)).toBe(0);
    expect(accessibleCreationStepIndex(evaluation, "review")).toBe(0);
    expect(evaluation.ready).toBe(false);
  });

  it("moves an occupied priority without silently assigning the displaced category", () => {
    const draft = createConfiguredDraft();
    draft.magic.preparations = ["Test preparation"];
    const next = assignPriority(draft, "resources", "B");
    expect(next.priorityAssignments).toMatchObject({ resources: "B", skills: "" });
    expect(Object.values(next.priorityAssignments).filter(Boolean)).toHaveLength(4);
    expect(next.magic.preparations).toEqual(["Test preparation"]);
  });

  it("deselects a priority when its selected cell is clicked again", () => {
    const draft = createConfiguredDraft();
    const next = assignPriority(draft, "resources", "C");
    expect(next.priorityAssignments.resources).toBe("");
    expect(next.priorityAssignments.skills).toBe("B");
  });

  it("can reach a mechanically clear final audit after every step is confirmed", () => {
    const draft = createConfiguredDraft();
    draft.individualSkills = [
      { id: "automatics", kind: "active", priorityPoints: 6 },
      { id: "blades", kind: "active", priorityPoints: 6 },
      { id: "computer", kind: "active", priorityPoints: 6 },
      { id: "perception", kind: "active", priorityPoints: 6 },
      { id: "sneaking", kind: "active", priorityPoints: 6 },
      { id: "first-aid", kind: "active", priorityPoints: 6 },
      { id: "English", kind: "language", native: true },
      { id: "Seattle Gangs", kind: "knowledge", knowledgeLanguagePoints: 6 },
      { id: "Corporate Politics", kind: "knowledge", knowledgeLanguagePoints: 6 },
      { id: "Smuggling Routes", kind: "knowledge", knowledgeLanguagePoints: 4 }
    ];
    draft.skillGroups = [{ id: "athletics", priorityPoints: 5 }];
    draft.contacts = [
      { instanceId: "contact-1", name: "Fixer", connection: 3, loyalty: 3, notes: "" },
      { instanceId: "contact-2", name: "Street doc", connection: 3, loyalty: 3, notes: "" }
    ];
    draft.confirmedSteps = CONFIRMABLE_CREATION_STEPS.map((step) => step.id);
    const evaluation = evaluateCharacterDraft(draft);
    expect(evaluation.steps.skills.violations).toEqual([]);
    expect(evaluation.steps.contacts.violations).toEqual([]);
    expect(evaluation.ready).toBe(true);
    expect(evaluation.steps.review.violations).toEqual([]);
  });

  it("rejects out-of-sequence Karma ratings and levels on fixed adept powers", () => {
    const draft = createConfiguredDraft();
    const currentBody = naturalAttributeRatings(draft).body;
    draft.karmaPurchases = [{ instanceId: "karma-1", kind: "attribute", targetId: "body", currentRating: currentBody - 1, newRating: currentBody + 1 }];
    draft.magic.adeptPowers = [{ instanceId: "power-1", powerId: "astral-perception", rating: 2 }];
    const evaluation = evaluateCharacterDraft(draft);
    expect(evaluation.steps.karma.violations.map((item) => item.id)).toContain("karma.purchase-sequence");
    expect(evaluation.steps.magic.violations.map((item) => item.id)).toContain("catalogue.adept-power-fixed");
  });

  it("isolates new drafts from the former prefilled storage key and safely migrates schema 1 exports", () => {
    expect(CHARACTER_DRAFT_STORAGE_KEY).toBe("shadowrun5e-character-draft-v4");
    const legacy = { ...createConfiguredDraft(), schemaVersion: 1, characterName: "Old test runner", concept: "Legacy", notes: "Legacy" };
    delete (legacy as Partial<CharacterDraft> & { characterName?: string }).confirmedSteps;
    const migrated = parseCharacterDraft(legacy);
    expect(migrated.schemaVersion).toBe(CHARACTER_DRAFT_SCHEMA_VERSION);
    expect(migrated.confirmedSteps).toEqual([]);
    expect(migrated).not.toHaveProperty("characterName");
    expect(migrated).not.toHaveProperty("concept");
  });

  it("unlocks exactly one step at a time after explicit confirmation", () => {
    const draft = createConfiguredDraft();
    let evaluation = evaluateCharacterDraft(draft);
    expect(accessibleCreationStepIndex(evaluation, "review")).toBe(0);
    draft.confirmedSteps = ["priorities"];
    evaluation = evaluateCharacterDraft(draft);
    expect(firstIncompleteCreationStepIndex(evaluation)).toBe(1);
    expect(accessibleCreationStepIndex(evaluation, "review")).toBe(1);
    expect(evaluation.steps.attributes.confirmed).toBe(false);
  });

  it("normalizes imported confirmation state to a contiguous step prefix", () => {
    const serialized = { ...createConfiguredDraft(), confirmedSteps: ["priorities", "qualities", "karma"] };
    expect(parseCharacterDraft(serialized).confirmedSteps).toEqual(["priorities"]);
  });
});

describe("Character Creation page contract", () => {
  function renderStep(step: string) {
    return renderToStaticMarkup(
      <SourceSelectionProvider>
        <MemoryRouter initialEntries={[`/charactercreation/${step}`]}>
          <Routes><Route path="/charactercreation/:stepId?" element={<CharacterCreationPage/>}/></Routes>
        </MemoryRouter>
      </SourceSelectionProvider>
    );
  }

  it("renders a landmark-based, mobile-selectable workflow without replacing reference routes", () => {
    const html = renderStep("concept");
    expect(html).toContain("Priority assignment");
    expect(html).not.toContain("Runner concept");
    expect(html).toContain("aria-label=\"Character creation workflow\"");
    expect(html).toContain("id=\"creation-step-picker\"");
    expect(html).toContain("CORE PRIORITY BUILDER // RULESET 1");
    expect(html).toContain('aria-label="Return to Shadowrun front page"');
    expect(html).toContain('href="/"');
  });

  it("renders priority assignment as a 5 by 5 button matrix", () => {
    const html = renderStep("priorities");
    expect(html).toContain('class="priority-table"');
    expect(html.match(/creation-priority-choice/g)).toHaveLength(50);
    expect(html).not.toContain('id="priority-metatype"');
    expect(html).not.toContain("Choose priority…");
    expect(html).not.toContain("Selecting a chosen cell again clears it");
    expect(html).not.toContain('<th scope="col">Category</th>');
  });

  it("places Magic before Skills and presents grants as protected baselines", () => {
    expect(CREATION_STEPS.findIndex((step) => step.id === "magic")).toBeLessThan(CREATION_STEPS.findIndex((step) => step.id === "skills"));
    const draft = createConfiguredDraft();
    draft.priorityAssignments = { metatype: "D", attributes: "C", magic_or_resonance: "A", skills: "B", resources: "E" };
    draft.magicPathId = "magician";
    draft.individualSkills = [{ id: "spellcasting", kind: "active", grantedRating: 5 }];
    const html = renderToStaticMarkup(<SkillsStep draft={draft} setDraft={() => undefined} evaluation={evaluateCharacterDraft(draft)}/>);
    expect(html).toContain("Granted skills");
    expect(html).toContain("Cannot be lower than the granted Rating 5");
    expect(html).not.toContain("Granted rating</span><input");
    expect(html).toContain("Native Language (no rating)");
  });

  it("renders Resources as a departmental store and keeps derived fields out of the form", () => {
    const draft = createConfiguredDraft();
    const html = renderToStaticMarkup(<ResourcesStep draft={draft} setDraft={() => undefined} evaluation={evaluateCharacterDraft(draft)}/>);
    expect(html).toContain("Store departments");
    expect(html).toContain("Add to cart");
    expect(html).toContain("Shopping cart");
    expect(html).toContain("Automatic carryover");
    expect(html).not.toContain("Nuyen carried into play");
    expect(html).not.toContain("Matrix Data Processing");
  });

  it("collects the final biography and lifestyle before review", () => {
    const draft = createConfiguredDraft();
    const html = renderToStaticMarkup(<BiographyStep draft={draft} setDraft={() => undefined} evaluation={evaluateCharacterDraft(draft)}/>);
    expect(CREATION_STEPS.at(-2)?.id).toBe("biography");
    expect(html).toContain("Street name / primary alias");
    expect(html).toContain("Starting lifestyle");
    expect(html).toContain("Middle // 5,000¥ per month");
  });

  it("enforces Attribute budget and natural-maximum restrictions in the controls", () => {
    const budgetDraft = createConfiguredDraft();
    const budgetHtml = renderToStaticMarkup(<AttributesStep draft={budgetDraft} setDraft={() => undefined} evaluation={evaluateCharacterDraft(budgetDraft)}/>);
    expect(budgetHtml).toContain("Attribute pool fully allocated");
    expect(budgetHtml).toContain("All Attribute points are allocated. Lower another Attribute first.");

    const naturalLimitDraft = createConfiguredDraft();
    naturalLimitDraft.attributeRatings = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, 1])) as CharacterDraft["attributeRatings"];
    naturalLimitDraft.attributeRatings.body = 6;
    naturalLimitDraft.attributeRatings.agility = 5;
    const naturalLimitHtml = renderToStaticMarkup(<AttributesStep draft={naturalLimitDraft} setDraft={() => undefined} evaluation={evaluateCharacterDraft(naturalLimitDraft)}/>);
    expect(naturalLimitHtml).toContain("Natural maximum: Body");
    expect(naturalLimitHtml).toContain("Only one Attribute may reach its natural maximum. Lower Body first.");
    expect(naturalLimitHtml.match(/data-at-maximum/g)).toHaveLength(1);
    expect(naturalLimitHtml).toContain('class="creation-attribute-value"');
    expect(naturalLimitHtml).toContain("Max 6");
    expect(naturalLimitHtml).not.toContain('type="number"');
  });

  it("clamps every premature direct link to the first incomplete step", () => {
    for (const step of ["attributes", "qualities", "skills", "magic", "resources", "contacts", "karma", "review"]) {
      const html = renderStep(step);
      expect(html, step).toContain("Priority assignment");
      expect(html, step).toContain("value=" + '"priorities" selected=""');
      expect(html, step).toContain(`value="${step}" disabled=""`);
      expect(html, step).not.toContain("undefined //");
    }
  });
});
