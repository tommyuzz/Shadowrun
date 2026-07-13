import { useEffect, useMemo, useRef, useState } from "react";
import {
  bestComparisonIndexes,
  comparisonValue,
  visibleComparisonFields,
  type ComparisonModule
} from "../comparison";
import type { ReferenceRecord } from "../types";

interface ComparisonPanelProps {
  moduleId: ComparisonModule;
  records: ReferenceRecord[];
  initialRecord?: ReferenceRecord;
  close: () => void;
  openRecord: (record: ReferenceRecord) => void;
}

const comparisonNouns: Record<ComparisonModule, string> = {
  weapons: "weapon",
  cyberdecks: "cyberdeck",
  vehicles: "vehicle",
  drones: "drone"
};

function initialSelection(records: ReferenceRecord[], initialRecord?: ReferenceRecord): string[] {
  const first = initialRecord && records.some((record) => record.id === initialRecord.id)
    ? initialRecord
    : records[0];
  const second = records.find((record) => record.id !== first?.id);
  return [first?.id || "", second?.id || "", ""];
}

export function ComparisonPanel({ moduleId, records, initialRecord, close, openRecord }: ComparisonPanelProps) {
  const [selectedIds, setSelectedIds] = useState(() => initialSelection(records, initialRecord));
  const [showThird, setShowThird] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.name.localeCompare(b.name, "en-GB", { numeric: true })),
    [records]
  );
  const slots = showThird ? 3 : 2;
  const selectedRecords = selectedIds.slice(0, slots).map((id) => records.find((record) => record.id === id));
  const fields = visibleComparisonFields(moduleId, selectedRecords);
  const noun = comparisonNouns[moduleId];

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("comparison-is-open");
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("comparison-is-open");
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [close]);

  function choose(index: number, id: string) {
    setSelectedIds((current) => current.map((value, itemIndex) => itemIndex === index ? id : value));
  }

  return <div className="comparison-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) close();
  }}>
    <section
      className="comparison-dialog"
      data-module={moduleId}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
      ref={dialogRef}
    >
      <header className="comparison-header">
        <div>
          <p className="comparison-kicker">Cross-reference protocol // Live analysis</p>
          <h2 id="comparison-title">{noun} comparison</h2>
          <p>Inspect two or three archive records without leaving the current reference page.</p>
        </div>
        <button className="comparison-close" type="button" onClick={close} ref={closeRef} aria-label="Close comparison">×</button>
      </header>

      <div className="comparison-selectors" data-columns={slots}>
        {Array.from({ length: slots }, (_, index) => {
          const selected = selectedRecords[index];
          return <section className="comparison-selector" key={index}>
            <label htmlFor={`comparison-record-${index}`}>Slot {String(index + 1).padStart(2, "0")}</label>
            <select id={`comparison-record-${index}`} value={selectedIds[index]} onChange={(event) => choose(index, event.target.value)}>
              <option value="">Select {noun}</option>
              {sortedRecords.map((record) => <option
                value={record.id}
                key={record.id}
                disabled={selectedIds.some((id, selectedIndex) => selectedIndex !== index && id === record.id)}
              >{record.name}</option>)}
            </select>
            {selected ? <button type="button" onClick={() => openRecord(selected)}>Open full record</button> : <span>Awaiting record selection</span>}
          </section>;
        })}
      </div>

      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <thead><tr><th scope="col">Specification</th>{selectedRecords.map((record, index) => <th scope="col" key={index}>{record?.name || `Slot ${index + 1}`}</th>)}</tr></thead>
          <tbody>{fields.map((field) => {
            const values = selectedRecords.map((record) => comparisonValue(record, field.key));
            const best = bestComparisonIndexes(field, values);
            const suppliedValues = values.filter((_, index) => Boolean(selectedRecords[index]));
            const differs = new Set(suppliedValues).size > 1;
            return <tr key={field.key} data-differs={differs || undefined}>
              <th scope="row">{field.label}</th>
              {values.map((value, index) => <td className={best.includes(index) ? "is-best" : undefined} key={index}>{value}</td>)}
            </tr>;
          })}</tbody>
        </table>
      </div>

      <footer className="comparison-footer">
        <p><strong>Difference key:</strong> changed rows are marked; red indicators identify the strongest directly comparable numeric value.</p>
        {showThird
          ? <button type="button" onClick={() => { setShowThird(false); choose(2, ""); }}>Remove third record</button>
          : <button type="button" onClick={() => setShowThird(true)}>Add third record</button>}
      </footer>
    </section>
  </div>;
}
