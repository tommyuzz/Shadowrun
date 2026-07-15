import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArchiveAtmosphere } from "../components/ArchiveAtmosphere";
import { ArchivePageFrame } from "../components/ArchivePageFrame";
import { ArchiveError, ArchiveLoading, ArchiveSourceEmpty } from "../components/ArchiveStates";
import { Masthead } from "../components/Masthead";
import { ModuleFooter, ModuleSidebar } from "../components/ModuleChrome";
import { loadData, sourceBooks } from "../data";
import { modulesById } from "../registry";
import { sourceRecordIsVisible, useSourceSelection } from "../source-selection";
import type { RawRecord, ReferenceData, ReferenceRecord } from "../types";

type PlayLevelId = "street_level" | "regular" | "prime_runner";

const playLevelOptions: { id: PlayLevelId; label: string; code: string }[] = [
  { id: "street_level", label: "Street-Level Play", code: "STREET" },
  { id: "regular", label: "Regular Play — Experienced Runner", code: "REGULAR" },
  { id: "prime_runner", label: "Prime Runner Play", code: "PRIME" }
];

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {};
}

function recordEntries(value: unknown): [string, RawRecord][] {
  return Object.entries(asRecord(value)).filter((entry): entry is [string, RawRecord] => Boolean(entry[1]) && typeof entry[1] === "object" && !Array.isArray(entry[1]));
}

function display(value: unknown, fallback = "—"): string {
  return value == null || value === "" ? fallback : String(value);
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function skillAllocation(value: unknown, label: string): string {
  const allocation = asRecord(value);
  const count = Number(allocation.count || 0);
  const rating = Number(allocation.rating || 0);
  return count && rating ? `${plural(count, label)} at Rating ${rating}` : "";
}

function MetatypeOptions({ value }: { value: unknown }) {
  const entries = Object.entries(asRecord(value));
  return <ul className="priority-metatype-list">{entries.map(([name, points]) => <li key={name}><span>{name}</span><strong>{display(points)} SAP</strong></li>)}</ul>;
}

function MagicOptions({ value }: { value: unknown }) {
  const options = recordEntries(value);
  if (!options.length) return <span className="priority-mundane">Mundane only</span>;
  return <ul className="priority-magic-list">{options.map(([name, detail]) => {
    const features = [
      skillAllocation(detail.magical_skills, "Magical Skill"),
      skillAllocation(detail.resonance_skills, "Resonance Skill"),
      skillAllocation(detail.active_skill, "Active Skill"),
      skillAllocation(detail.magical_skill_group, "Magical Skill Group"),
      detail.spells == null ? "" : plural(Number(detail.spells), "Spell"),
      detail.complex_forms == null ? "" : plural(Number(detail.complex_forms), "Complex Form")
    ].filter(Boolean);
    const attribute = detail.magic == null ? `RES ${display(detail.resonance)}` : `MAG ${display(detail.magic)}`;
    return <li key={name}><strong>{name}</strong><span><b>{attribute}</b>{features.length ? ` · ${features.join(" · ")}` : ""}</span></li>;
  })}</ul>;
}

function SkillAllocation({ value }: { value: unknown }) {
  const skills = asRecord(value);
  return <dl className="priority-skill-grid"><div><dt>Skill points</dt><dd>{display(skills.skill_points)}</dd></div><div><dt>Group points</dt><dd>{display(skills.skill_group_points)}</dd></div></dl>;
}

function ResourceValue({ record, level }: { record: ReferenceRecord; level: PlayLevelId }) {
  const resources = asRecord(record.raw.resources);
  return <strong className="priority-resource-value" key={`${record.id}-${level}`}>{display(resources[level])}</strong>;
}

function PriorityTable({ records, level }: { records: ReferenceRecord[]; level: PlayLevelId }) {
  return <div className="priority-table-frame">
    <table className="priority-table">
      <caption className="priority-sr-only">Priority A through E character-creation options for the selected play level.</caption>
      <colgroup><col className="priority-col-level"/><col className="priority-col-metatype"/><col className="priority-col-attributes"/><col className="priority-col-magic"/><col className="priority-col-skills"/><col className="priority-col-resources"/></colgroup>
      <thead><tr><th scope="col">Priority</th><th scope="col">Metatype</th><th scope="col">Attributes</th><th scope="col">Magic or Resonance</th><th scope="col">Skills</th><th scope="col">Resources</th></tr></thead>
      <tbody>{records.map((record) => <tr key={record.id} data-priority={record.name.slice(-1)}>
        <th scope="row"><span>Priority</span><strong>{record.name.slice(-1)}</strong></th>
        <td><MetatypeOptions value={record.raw.metatype}/></td>
        <td className="priority-attribute-cell"><strong>{display(record.raw.attributes)}</strong><span>Attribute points</span></td>
        <td><MagicOptions value={record.raw.magic_or_resonance}/></td>
        <td><SkillAllocation value={record.raw.skills}/></td>
        <td className="priority-resource-cell"><ResourceValue record={record} level={level}/><span>Starting nuyen</span></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function PriorityCards({ records, level }: { records: ReferenceRecord[]; level: PlayLevelId }) {
  return <div className="priority-card-list">{records.map((record) => <article className="priority-card" key={record.id} data-priority={record.name.slice(-1)}>
    <header><span>Creation tier</span><h2>Priority {record.name.slice(-1)}</h2><div className="priority-card-resource"><span>Selected resources</span><ResourceValue record={record} level={level}/></div></header>
    <div className="priority-card-field priority-card-metatype"><h3>Metatype <small>Special Attribute Points</small></h3><MetatypeOptions value={record.raw.metatype}/></div>
    <div className="priority-card-field priority-card-attributes"><h3>Attributes</h3><strong>{display(record.raw.attributes)}</strong><span>Attribute points</span></div>
    <div className="priority-card-field"><h3>Magic or Resonance</h3><MagicOptions value={record.raw.magic_or_resonance}/></div>
    <div className="priority-card-field"><h3>Skills</h3><SkillAllocation value={record.raw.skills}/></div>
  </article>)}</div>;
}

function PlayLevelDossier({ level, data }: { level: PlayLevelId; data: RawRecord }) {
  const option = playLevelOptions.find((item) => item.id === level)!;
  const stats: [string, unknown, string?][] = [
    ["Starting Karma", data.starting_karma],
    ["Maximum Karma", data.maximum_karma],
    ["Maximum Device Rating", data.maximum_device_rating, "DR"],
    ["Maximum Availability", data.maximum_availability],
    ["Karma convertible to nuyen", data.maximum_karma_to_nuyen],
    ["Maximum nuyen from Karma", data.maximum_nuyen_from_karma],
    ["Free Contact Karma", data.free_contact_karma],
    ["Maximum Karma carryover", data.maximum_karma_carryover]
  ];
  return <section className="play-level-dossier" key={level} aria-labelledby="play-level-title">
    <header><div><span>PLAY LEVEL // {option.code}</span><h2 id="play-level-title">{display(data.name)}</h2></div><strong>{option.label}</strong></header>
    <p className="play-level-description">{display(data.description)}</p>
    <dl className="play-level-stats">{stats.map(([label, value, prefix]) => <div key={label}><dt>{label}</dt><dd>{prefix ? <small>{prefix}</small> : null}{display(value)}</dd></div>)}</dl>
    {data.maximum_karma_note ? <p className="play-level-note"><strong>Karma limit note //</strong> {display(data.maximum_karma_note)}</p> : null}
  </section>;
}

export function PriorityArrayPage() {
  const module = modulesById.priorityarray;
  const { isSourceEnabled, registerSources, enableAllSources } = useSourceSelection();
  const [data, setData] = useState<ReferenceData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [level, setLevel] = useState<PlayLevelId>("regular");

  useEffect(() => {
    let active = true;
    document.title = "Shadowrun 5e // Priority Array";
    setLoadError("");
    loadData(module.id)
      .then((nextData) => { if (active) setData(nextData); })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : "The Priority Array could not be loaded."); });
    return () => { active = false; };
  }, [loadAttempt, module.id]);

  useEffect(() => {
    if (!data) return;
    const levels = Object.values(asRecord(data.payload.play_levels)).map((item) => display(asRecord(item).source, "CRB"));
    registerSources([...data.records.map((record) => record.source), ...levels]);
  }, [data, registerSources]);

  const visibleRecords = useMemo(() => data?.records.filter((record) => sourceRecordIsVisible(module.id, record.source, isSourceEnabled)) || [], [data, isSourceEnabled, module.id]);

  const frame = (content: ReactNode, key: string) => <ArchivePageFrame className="page-priorityarray archive-page" moduleId={module.id} motionKey={key} key={key}>
    <ArchiveAtmosphere module={module} motionKey={key}/><div className="sheet"><Masthead module={module}/>{content}<ModuleFooter moduleId={module.id}/></div>
  </ArchivePageFrame>;

  if (loadError) return frame(<ArchiveError module={module} message={loadError} retry={() => setLoadAttempt((attempt) => attempt + 1)}/>, `priorityarray-error-${loadAttempt}`);
  if (!data) return frame(<ArchiveLoading module={module}/>, `priorityarray-loading-${loadAttempt}`);

  const category = data.categories[0];
  const playLevels = asRecord(data.payload.play_levels);
  const selectedLevel = asRecord(playLevels[level]);
  const selectedSource = display(selectedLevel.source, "CRB");
  const sourcesAvailable = visibleRecords.length > 0 && sourceRecordIsVisible(module.id, selectedSource, isSourceEnabled);

  return <ArchivePageFrame className="page-priorityarray archive-page" moduleId={module.id} motionKey="priorityarray" key="priorityarray">
    <ArchiveAtmosphere module={module} motionKey="priorityarray"/>
    <div className="sheet">
      <Masthead module={module}/>
      <main className="workspace priority-workspace">
        <ModuleSidebar module={module} category={category} data={data}/>
        <article className="panel priority-panel" aria-live="polite"><div className="panel-inner archive-view">
          <header className="priority-header">
            <div><p className="eyebrow">Character creation protocol // Assignment matrix</p><h1>Priority Array</h1><p id="priority-array-instruction">Assign one priority level from A to E to each of Metatype, Attributes, Magic or Resonance, Skills, and Resources. Each level can be used only once.</p></div>
            <div className="priority-level-control"><label htmlFor="priority-play-level">Creation level</label><div className="priority-select-frame"><select id="priority-play-level" value={level} onChange={(event) => setLevel(event.target.value as PlayLevelId)}>{playLevelOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select><span aria-hidden="true">⌄</span></div><small>Updates resources and creation limits instantly</small></div>
          </header>
          {sourcesAvailable ? <>
            <PlayLevelDossier level={level} data={selectedLevel}/>
            <section className="priority-array-section" aria-labelledby="priority-array-heading"><div className="priority-section-heading"><div><span>ASSIGNMENT GRID // A–E</span><h2 id="priority-array-heading">Creation priorities</h2></div><p>Use every priority exactly once.</p></div><PriorityTable records={visibleRecords} level={level}/><PriorityCards records={visibleRecords} level={level}/></section>
            <section className="section priority-source-section"><div className="source-book"><span className="source-code">{selectedSource}</span><strong className="source-title">{sourceBooks[selectedSource] || selectedSource}</strong></div></section>
          </> : <ArchiveSourceEmpty module={module} hiddenCount={data.records.length} includeAll={enableAllSources}/>} 
        </div></article>
      </main>
      <ModuleFooter moduleId={module.id}/>
    </div>
  </ArchivePageFrame>;
}
