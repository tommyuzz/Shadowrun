import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArchiveIcon } from "../components/ArchiveIcon";
import { ArchivePageFrame } from "../components/ArchivePageFrame";
import { Masthead } from "../components/Masthead";
import { runArchiveTransition } from "../motion";
import {
  CHARACTER_DRAFT_STORAGE_KEY,
  createEmptyCharacterDraft,
  parseCharacterDraft,
  type CharacterDraft
} from "../character-creation/draft";
import {
  accessibleCreationStepIndex,
  CREATION_STEPS,
  evaluateCharacterDraft,
  firstIncompleteCreationStepIndex,
  type CreationStepId
} from "../character-creation/orchestrator";
import { CONFIRMABLE_CREATION_STEPS, creationStepIndex } from "../character-creation/workflow";
import {
  AttributesStep,
  BiographyStep,
  ContactsStep,
  KarmaStep,
  MagicStep,
  PriorityStep,
  QualitiesStep,
  ResourcesStep,
  ReviewStep,
  SkillsStep
} from "../character-creation/steps";
import { modulesById } from "../registry";
import "../styles/character-creation.css";

function loadLocalDraft(): { draft: CharacterDraft; notice: string } {
  if (typeof window === "undefined") return { draft: createEmptyCharacterDraft(), notice: "" };
  const stored = window.localStorage.getItem(CHARACTER_DRAFT_STORAGE_KEY);
  if (!stored) return { draft: createEmptyCharacterDraft(), notice: "New local draft initialized." };
  try {
    return { draft: parseCharacterDraft(JSON.parse(stored)), notice: "Local draft restored." };
  } catch (error) {
    return { draft: createEmptyCharacterDraft(), notice: `Stored draft could not be restored: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export function CharacterCreationPage() {
  const navigate = useNavigate();
  const { stepId } = useParams();
  const initial = useMemo(loadLocalDraft, []);
  const [draft, setDraft] = useState(initial.draft);
  const [notice, setNotice] = useState(initial.notice);
  const [resetArmed, setResetArmed] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const evaluation = useMemo(() => evaluateCharacterDraft(draft), [draft]);
  const activeIndex = accessibleCreationStepIndex(evaluation, stepId);
  const firstIncompleteIndex = firstIncompleteCreationStepIndex(evaluation);
  const activeStep = CREATION_STEPS[activeIndex];
  const module = modulesById.charactercreation;

  useEffect(() => { document.title = "Character Creation // Shadowrun 5e"; }, []);
  useEffect(() => {
    window.localStorage.setItem(CHARACTER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);
  useEffect(() => {
    if (stepId !== activeStep.id) navigate(`/charactercreation/${activeStep.id}`, { replace: true });
  }, [activeStep.id, navigate, stepId]);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeStep.id]);

  function goToStep(id: CreationStepId) {
    const requestedIndex = creationStepIndex(id);
    const targetIndex = Math.min(requestedIndex < 0 ? 0 : requestedIndex, firstIncompleteIndex);
    navigate(`/charactercreation/${CREATION_STEPS[targetIndex].id}`);
  }

  const updateDraft: Dispatch<SetStateAction<CharacterDraft>> = (update) => {
    setDraft((current) => {
      const next = typeof update === "function" ? update(current) : update;
      return {
        ...next,
        confirmedSteps: next.confirmedSteps.filter((id) => creationStepIndex(id) < activeIndex)
      };
    });
  };

  function confirmAndContinue() {
    const result = evaluation.steps[activeStep.id];
    if (activeStep.id === "review" || !result.mechanicallyClear) return;
    setDraft((current) => current.confirmedSteps.includes(activeStep.id)
      ? current
      : { ...current, confirmedSteps: [...current.confirmedSteps, activeStep.id] });
    navigate(`/charactercreation/${CREATION_STEPS[activeIndex + 1].id}`);
  }

  function finishCharacter() {
    if (!evaluation.ready) return;
    runArchiveTransition(() => navigate("/?view=matrix&sector=corerules"));
  }

  function exportDraft() {
    const blob = new Blob([`${JSON.stringify(draft, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shadowrun5e-character-draft.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Draft exported as JSON.");
  }

  async function importDraft(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = parseCharacterDraft(JSON.parse(await file.text()));
      setDraft(imported);
      setNotice(`Imported ${file.name}.`);
      const importedEvaluation = evaluateCharacterDraft(imported);
      navigate(`/charactercreation/${CREATION_STEPS[firstIncompleteCreationStepIndex(importedEvaluation)].id}`);
    } catch (error) {
      setNotice(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function resetDraft() {
    if (!resetArmed) {
      setResetArmed(true);
      setNotice("Select Reset again to discard the local draft.");
      window.setTimeout(() => setResetArmed(false), 5000);
      return;
    }
    setDraft(createEmptyCharacterDraft());
    setResetArmed(false);
    setNotice("A new local draft has been initialized.");
    navigate("/charactercreation/priorities");
  }

  const commonProps = { draft, setDraft: updateDraft, evaluation };
  const content = (() => {
    switch (activeStep.id) {
      case "priorities": return <PriorityStep {...commonProps}/>;
      case "attributes": return <AttributesStep {...commonProps}/>;
      case "qualities": return <QualitiesStep {...commonProps}/>;
      case "skills": return <SkillsStep {...commonProps}/>;
      case "magic": return <MagicStep {...commonProps}/>;
      case "resources": return <ResourcesStep {...commonProps}/>;
      case "contacts": return <ContactsStep {...commonProps}/>;
      case "karma": return <KarmaStep {...commonProps}/>;
      case "biography": return <BiographyStep {...commonProps}/>;
      case "review": return <ReviewStep {...commonProps} goToStep={goToStep} exportDraft={exportDraft} printDraft={() => window.print()}/>;
    }
  })();

  const completedSteps = CONFIRMABLE_CREATION_STEPS.filter((step) => evaluation.steps[step.id].complete).length;
  const errorCount = evaluation.allViolations.filter((item) => item.severity === "error").length;
  const approvalCount = evaluation.allViolations.filter((item) => item.severity === "approval").length;

  return <ArchivePageFrame className="page-charactercreation archive-page" moduleId="charactercreation" motionKey="charactercreation">
    <div className="sheet creation-sheet">
      <Masthead module={module} homeLink showMatrixReturn/>
      <nav className="creation-mobile-nav" aria-label="Character creation step"><label htmlFor="creation-step-picker">Creation step</label><select id="creation-step-picker" value={activeStep.id} onChange={(event) => goToStep(event.target.value as CreationStepId)}>{CREATION_STEPS.map((step, index) => <option value={step.id} key={step.id} disabled={index > firstIncompleteIndex}>{String(index + 1).padStart(2, "0")} // {step.label}{index > firstIncompleteIndex ? " (Locked)" : ""}</option>)}</select></nav>
      <div className="creation-toolbar"><div><span className="creation-live-signal" aria-hidden="true"/><strong>CORE PRIORITY BUILDER // RULESET 1</strong><small>Local character draft</small></div><div className="creation-toolbar-actions"><button type="button" onClick={exportDraft}>Export</button><button type="button" onClick={() => importRef.current?.click()}>Import</button><input ref={importRef} className="creation-file-input" type="file" accept="application/json,.json" onChange={importDraft}/><button type="button" data-armed={resetArmed || undefined} onClick={resetDraft}>{resetArmed ? "Confirm reset" : "Reset"}</button></div></div>
      <div className="creation-layout">
        <aside className="creation-sidebar" aria-label="Character creation progress">
          <header><ArchiveIcon variant="charactercreation"/><div><span>RUNNER BUILD</span><strong>{completedSteps} / {CONFIRMABLE_CREATION_STEPS.length}</strong><small>steps confirmed</small></div></header>
          <nav aria-label="Character creation workflow"><ol>{CREATION_STEPS.map((step, index) => {
            const result = evaluation.steps[step.id];
            const locked = index > firstIncompleteIndex;
            const status = locked ? "Locked" : result.complete ? "Complete" : result.errors ? `${result.errors} error${result.errors === 1 ? "" : "s"}` : result.approvals ? `${result.approvals} approval${result.approvals === 1 ? "" : "s"}` : result.warnings ? `${result.warnings} warning${result.warnings === 1 ? "" : "s"}` : "Ready to confirm";
            const statusType = locked ? "locked" : result.complete ? "complete" : result.errors ? "error" : result.approvals ? "approval" : result.warnings ? "warning" : "ready";
            return <li key={step.id}><button type="button" disabled={locked} aria-current={activeStep.id === step.id ? "step" : undefined} onClick={() => goToStep(step.id)}><span>{String(index + 1).padStart(2, "0")}</span><span><strong>{step.shortLabel}</strong><small>{status}</small></span><b data-status={statusType} aria-hidden="true">{locked ? "×" : result.errors || result.approvals ? "!" : result.warnings ? "•" : result.complete ? "✓" : "→"}</b></button></li>;
          })}</ol></nav>
          <section className="creation-sidebar-summary"><div><span>Blocking errors</span><strong>{errorCount}</strong></div><div><span>Approvals</span><strong>{approvalCount}</strong></div><div><span>Essence</span><strong>{evaluation.resources.essence.toFixed(2)}</strong></div><div><span>Karma available</span><strong>{evaluation.karmaSummary?.availableAfterQualities ?? "—"}</strong></div></section>
        </aside>
        <main className="creation-main">
          <article className="creation-panel" aria-labelledby="creation-step-title"><div ref={headingRef} tabIndex={-1} className="creation-focus-anchor"/><div className="creation-panel-inner" key={activeStep.id}>{content}</div>
            <footer className="creation-step-footer"><button type="button" disabled={activeIndex === 0} onClick={() => goToStep(CREATION_STEPS[activeIndex - 1].id)}>← Previous</button><span>STEP {String(activeIndex + 1).padStart(2, "0")} OF {CREATION_STEPS.length}</span>{activeStep.id === "review" ? <button type="button" disabled={!evaluation.ready} onClick={finishCharacter}>Complete runner &amp; enter Matrix Search →</button> : <button type="button" disabled={!evaluation.steps[activeStep.id].mechanicallyClear} onClick={confirmAndContinue}>Confirm &amp; continue →</button>}</footer>
          </article>
        </main>
      </div>
      <div className="creation-notice" aria-live="polite">{notice}</div>
      <footer className="creation-page-footer"><span>&gt;&gt; BUILD. VERIFY. RUN.</span><span>Core rules stay centralized. Draft data stays local.</span><b aria-hidden="true">Ⅴ</b></footer>
    </div>
  </ArchivePageFrame>;
}
