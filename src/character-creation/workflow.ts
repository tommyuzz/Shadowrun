export const CREATION_STEPS = [
  { id: "priorities", label: "Priorities", shortLabel: "Priority" },
  { id: "attributes", label: "Attributes", shortLabel: "Attributes" },
  { id: "qualities", label: "Qualities", shortLabel: "Qualities" },
  { id: "magic", label: "Magic & Resonance", shortLabel: "Magic" },
  { id: "skills", label: "Skills", shortLabel: "Skills" },
  { id: "resources", label: "Resources", shortLabel: "Gear" },
  { id: "contacts", label: "Contacts", shortLabel: "Contacts" },
  { id: "karma", label: "Karma", shortLabel: "Karma" },
  { id: "biography", label: "Biography", shortLabel: "Biography" },
  { id: "review", label: "Review", shortLabel: "Review" }
] as const;

export type CreationStepId = typeof CREATION_STEPS[number]["id"];
export type ConfirmableCreationStepId = Exclude<CreationStepId, "review">;

export const CONFIRMABLE_CREATION_STEPS = CREATION_STEPS.filter(
  (step): step is typeof CREATION_STEPS[number] & { id: ConfirmableCreationStepId } => step.id !== "review"
);

export function creationStepIndex(stepId: string | undefined): number {
  return CREATION_STEPS.findIndex((step) => step.id === stepId);
}
