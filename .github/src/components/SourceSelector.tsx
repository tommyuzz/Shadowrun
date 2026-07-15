import { useEffect, useId, useRef, useState } from "react";
import { useSourceSelection } from "../source-selection";

export function SourceSelector() {
  const {
    availableSources,
    enabledSourceCount,
    isSourceEnabled,
    toggleSource,
    enableAllSources,
    excludeAllSources
  } = useSourceSelection();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  const total = availableSources.length;
  const status = enabledSourceCount === total
    ? "All sources active"
    : enabledSourceCount === 0
      ? "All sources excluded"
      : `${enabledSourceCount} of ${total} sources active`;

  return <div className="source-selector" data-open={open || undefined} ref={rootRef}>
    <button
      className="source-selector-trigger"
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      aria-haspopup="dialog"
      onClick={() => setOpen((current) => !current)}
      ref={triggerRef}
    >
      <span className="source-selector-signal" aria-hidden="true"/>
      <span className="source-selector-trigger-label">Sources</span>
      <strong>{enabledSourceCount}/{total}</strong>
      <span className="source-selector-chevron" aria-hidden="true">⌄</span>
    </button>

    {open ? <section className="source-selector-panel" id={panelId} role="dialog" aria-label="Source book selection">
      <header>
        <span>Global archive filter</span>
        <strong>Reference sources</strong>
        <p>Choose which books contribute records across every archive.</p>
      </header>
      <div className="source-selector-options">
        {availableSources.map((source) => <label className="source-selector-option" key={source.code}>
          <input type="checkbox" checked={isSourceEnabled(source.code)} onChange={() => toggleSource(source.code)}/>
          <span className="source-selector-check" aria-hidden="true"/>
          <span className="source-selector-copy"><strong>{source.code}</strong><small>{source.name}</small></span>
        </label>)}
      </div>
      <footer>
        <span className="source-selector-status" aria-live="polite">{status}</span>
        <span className="source-selector-actions">
          <button type="button" onClick={enableAllSources} disabled={enabledSourceCount === total}>Include all</button>
          <button type="button" onClick={excludeAllSources} disabled={enabledSourceCount === 0}>Exclude all</button>
        </span>
      </footer>
    </section> : null}
  </div>;
}
