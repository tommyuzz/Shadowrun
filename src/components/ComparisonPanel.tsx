import { useEffect, useMemo, useRef, useState } from "react";
import {
  bestComparisonIndexes,
  comparisonValue,
  matchesComparisonSearch,
  visibleComparisonFields,
  type ComparisonModule
} from "../comparison";
import { sourceBooks } from "../data";
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

const slotLetters = ["A", "B", "C"] as const;

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
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(true);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLElement>(null);
  const pickerSearchRef = useRef<HTMLInputElement>(null);
  const controlsToggleRef = useRef<HTMLButtonElement>(null);
  const pickerSlotRef = useRef<number | null>(null);
  const pickerTriggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.name.localeCompare(b.name, "en-GB", { numeric: true })),
    [records]
  );
  const slots = showThird ? 3 : 2;
  const selectedRecords = selectedIds.slice(0, slots).map((id) => records.find((record) => record.id === id));
  const fields = visibleComparisonFields(moduleId, selectedRecords);
  const rows = fields.map((field) => {
    const values = selectedRecords.map((record) => comparisonValue(record, field.key));
    const suppliedValues = values.filter((_, index) => Boolean(selectedRecords[index]));
    return {
      field,
      values,
      best: bestComparisonIndexes(field, values),
      differs: new Set(suppliedValues).size > 1
    };
  });
  const mobileRows = differencesOnly ? rows.filter((row) => row.differs) : rows;
  const noun = comparisonNouns[moduleId];
  const pickerRecords = useMemo(
    () => sortedRecords.filter((record) => matchesComparisonSearch(record, pickerQuery, sourceBooks[record.source] || "")),
    [pickerQuery, sortedRecords]
  );

  useEffect(() => {
    pickerSlotRef.current = pickerSlot;
  }, [pickerSlot]);

  useEffect(() => {
    if (pickerSlot == null) return;
    const frame = requestAnimationFrame(() => pickerSearchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [pickerSlot]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("comparison-is-open");
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        const activePickerSlot = pickerSlotRef.current;
        if (activePickerSlot != null) {
          setPickerSlot(null);
          setPickerQuery("");
          requestAnimationFrame(() => pickerTriggerRefs.current[activePickerSlot]?.focus());
        } else {
          close();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const focusRoot = pickerSlotRef.current == null ? dialogRef.current : pickerRef.current;
      if (!focusRoot) return;
      const focusable = Array.from(focusRoot.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"
      )).filter((element) => element.offsetParent !== null);
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

  function openPicker(index: number) {
    setPickerQuery("");
    setPickerSlot(index);
  }

  function closePicker(returnFocus = true) {
    const activePickerSlot = pickerSlotRef.current;
    setPickerSlot(null);
    setPickerQuery("");
    if (returnFocus && activePickerSlot != null) requestAnimationFrame(() => pickerTriggerRefs.current[activePickerSlot]?.focus());
  }

  function selectFromPicker(id: string) {
    const activePickerSlot = pickerSlotRef.current;
    if (activePickerSlot == null) return;
    choose(activePickerSlot, id);
    setControlsExpanded(false);
    closePicker(false);
    requestAnimationFrame(() => controlsToggleRef.current?.focus());
  }

  function addThirdRecord() {
    setShowThird(true);
    openPicker(2);
  }

  function removeThirdRecord() {
    setShowThird(false);
    choose(2, "");
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

      <section className="comparison-mobile-controls" data-collapsed={!controlsExpanded || undefined} aria-labelledby="comparison-mobile-selection-title">
        <div className="comparison-mobile-section-heading">
          <div>
            <p>Selection matrix</p>
            <h3 id="comparison-mobile-selection-title">Selected records</h3>
          </div>
          <div className="comparison-mobile-section-status">
            <span>{slots} active slots</span>
            <button
              type="button"
              ref={controlsToggleRef}
              aria-expanded={controlsExpanded}
              aria-controls="comparison-mobile-selection-body"
              onClick={() => setControlsExpanded((expanded) => !expanded)}
            >{controlsExpanded ? "Collapse" : "Edit records"}</button>
          </div>
        </div>
        <div className="comparison-mobile-selection-body" id="comparison-mobile-selection-body">
          <div className="comparison-mobile-records">
            {selectedRecords.map((selected, index) => <article className="comparison-mobile-record" key={index} data-empty={!selected || undefined}>
              <span className="comparison-mobile-slot" aria-hidden="true">{slotLetters[index]}</span>
              <div className="comparison-mobile-record-copy">
                <strong>{selected?.name || `Choose ${noun}`}</strong>
                <span>{selected ? `${selected.subcategory || selected.category} // ${selected.source}` : `Slot ${slotLetters[index]} is awaiting a record`}</span>
              </div>
              <div className="comparison-mobile-record-actions">
                <button
                  type="button"
                  ref={(node) => { pickerTriggerRefs.current[index] = node; }}
                  aria-label={`${selected ? "Change" : "Choose"} record in slot ${slotLetters[index]}`}
                  aria-haspopup="dialog"
                  aria-expanded={pickerSlot === index}
                  onClick={() => openPicker(index)}
                >{selected ? "Change" : "Choose"}</button>
                {selected ? <button type="button" onClick={() => openRecord(selected)} aria-label={`Open full record for ${selected.name}`}>Open</button> : null}
              </div>
            </article>)}
          </div>
          <div className="comparison-mobile-options">
            {showThird
              ? <button className="comparison-mobile-third" type="button" onClick={removeThirdRecord}>Remove record C</button>
              : <button className="comparison-mobile-third" type="button" onClick={addThirdRecord}>Add record C</button>}
            <label className="comparison-mobile-differences">
              <input type="checkbox" checked={differencesOnly} onChange={(event) => setDifferencesOnly(event.target.checked)}/>
              <span>Differences only</span>
            </label>
          </div>
          <p className="comparison-mobile-legend"><strong>Analysis key:</strong> red values mark the strongest directly comparable numeric result.</p>
        </div>
        <div className="comparison-mobile-collapsed-summary" aria-label="Selected comparison records">
          {selectedRecords.map((record, index) => <span key={index}><strong>{slotLetters[index]}</strong>{record?.name || "Awaiting selection"}</span>)}
        </div>
      </section>

      <section className="comparison-mobile-results" aria-labelledby="comparison-mobile-results-title">
        <div className="comparison-mobile-results-heading">
          <div>
            <p>Specification feed</p>
            <h3 id="comparison-mobile-results-title">Comparison results</h3>
          </div>
          <span>{mobileRows.length} {mobileRows.length === 1 ? "field" : "fields"}</span>
        </div>
        <div className="comparison-mobile-metrics" key={`${selectedIds.slice(0, slots).join(":")}:${differencesOnly}`}>
          {mobileRows.map(({ field, values, best, differs }, rowIndex) => <article
            className="comparison-mobile-metric"
            data-differs={differs || undefined}
            style={{ "--comparison-mobile-order": Math.min(rowIndex, 10) } as React.CSSProperties}
            aria-labelledby={`comparison-mobile-field-${field.key}`}
            key={field.key}
          >
            <h4 id={`comparison-mobile-field-${field.key}`}>{field.label}</h4>
            <div>
              {selectedRecords.map((record, index) => record ? <div
                className={`comparison-mobile-value${best.includes(index) ? " is-best" : ""}`}
                aria-label={`${record.name}: ${values[index]}${best.includes(index) ? ", optimal value" : ""}`}
                key={index}
              >
                <span className="comparison-mobile-value-slot" aria-hidden="true">{slotLetters[index]}</span>
                <span className="comparison-mobile-value-name">{record.name}</span>
                <span className="comparison-mobile-value-data"><strong>{values[index]}</strong>{best.includes(index) ? <small>OPT</small> : null}</span>
              </div> : null)}
            </div>
          </article>)}
          {!mobileRows.length ? <div className="comparison-mobile-no-differences" role="status">
            <strong>No differences detected</strong>
            <p>The selected records share every visible comparison value.</p>
            <button type="button" onClick={() => setDifferencesOnly(false)}>Show all fields</button>
          </div> : null}
        </div>
      </section>

      <div className="comparison-selectors comparison-desktop-selectors" data-columns={slots}>
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
          <tbody>{rows.map(({ field, values, best, differs }) => <tr key={field.key} data-differs={differs || undefined}>
            <th scope="row">{field.label}</th>
            {values.map((value, index) => <td className={best.includes(index) ? "is-best" : undefined} key={index}>{value}</td>)}
          </tr>)}</tbody>
        </table>
      </div>

      <footer className="comparison-footer">
        <p><strong>Difference key:</strong> changed rows are marked; red indicators identify the strongest directly comparable numeric value.</p>
        {showThird
          ? <button type="button" onClick={removeThirdRecord}>Remove third record</button>
          : <button type="button" onClick={() => setShowThird(true)}>Add third record</button>}
      </footer>

      {pickerSlot != null ? <div className="comparison-picker-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePicker();
      }}>
        <section className="comparison-picker" role="dialog" aria-modal="true" aria-labelledby="comparison-picker-title" ref={pickerRef}>
          <header className="comparison-picker-header">
            <div>
              <p>Archive candidate index // Slot {slotLetters[pickerSlot]}</p>
              <h3 id="comparison-picker-title">Choose {noun}</h3>
            </div>
            <button className="comparison-picker-close" type="button" onClick={() => closePicker()} aria-label="Close record picker">×</button>
          </header>
          <div className="comparison-picker-search">
            <label htmlFor="comparison-picker-query">Search name, category, source or record fields</label>
            <div>
              <input
                id="comparison-picker-query"
                ref={pickerSearchRef}
                type="search"
                value={pickerQuery}
                onChange={(event) => setPickerQuery(event.target.value)}
                placeholder={`Search ${noun} archive`}
                autoComplete="off"
                spellCheck="false"
              />
              <button type="button" onClick={() => setPickerQuery("")} disabled={!pickerQuery} aria-label="Clear comparison search">×</button>
            </div>
            <p role="status">{pickerRecords.length} {pickerRecords.length === 1 ? "record" : "records"} available</p>
          </div>
          <ul className="comparison-picker-results" aria-label={`${noun} search results`}>
            {pickerRecords.map((record) => {
              const selectedIndex = selectedIds.slice(0, slots).findIndex((id) => id === record.id);
              const unavailable = selectedIndex >= 0 && selectedIndex !== pickerSlot;
              const current = selectedIndex === pickerSlot;
              return <li key={record.id}>
                <button
                  type="button"
                  className={current ? "is-current" : undefined}
                  disabled={unavailable}
                  aria-current={current || undefined}
                  onClick={() => selectFromPicker(record.id)}
                >
                  <span>
                    <strong>{record.name}</strong>
                    <small>{unavailable ? `Assigned to slot ${slotLetters[selectedIndex]}` : record.subcategory || record.category}</small>
                  </span>
                  <span>{record.source}</span>
                </button>
              </li>;
            })}
          </ul>
          {!pickerRecords.length ? <div className="comparison-picker-empty" role="status">
            <strong>No matching records</strong>
            <p>Try a name, category, source code or another field value.</p>
            <button type="button" onClick={() => setPickerQuery("")}>Clear search</button>
          </div> : null}
        </section>
      </div> : null}
    </section>
  </div>;
}
