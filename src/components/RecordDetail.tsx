import { sourceBooks } from "../data";
import { titleCase, valueText } from "../presentation";
import type { RawRecord, ReferenceData, ReferenceRecord } from "../types";

interface DetailProps {
  moduleId: string;
  record: ReferenceRecord;
  data: ReferenceData;
  recordNumber: number;
}

const asObject = (value: unknown): RawRecord => value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {};
const asStrings = (value: unknown): string[] => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
const code = (prefix: string, index: number) => `${prefix}-${String(index).padStart(3, "0")}`;

function Source({ value = "CRB" }: { value?: unknown }) {
  const source = valueText(value);
  const sourceCode = source.match(/^[A-Za-z0-9]+/)?.[0]?.toUpperCase() || "—";
  return <section className="section"><div className="source-book"><span className="source-code">{sourceCode}</span><strong className="source-title">{sourceBooks[sourceCode] || source}</strong></div></section>;
}

function Html({ className, value, fallback = "—" }: { className?: string; value: unknown; fallback?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: valueText(value, fallback) }}/>;
}

function TextList({ values, className }: { values: unknown; className?: string }) {
  return <ul className={className}>{asStrings(values).map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul>;
}

export function RecordHeaderExtra({ moduleId, record }: { moduleId: string; record: ReferenceRecord }) {
  if (moduleId === "metatypes") return <p className="scientific-name">{valueText(record.raw.scientific_name, "")}</p>;
  if (moduleId === "attributes") return <p className="attribute-header-code"><strong>{valueText(record.raw.abbreviation)}</strong><span>{record.category} attribute</span></p>;
  return null;
}

function SkillDetail({ record }: { record: ReferenceRecord }) {
  return <>
    <section className="section"><h2 className="section-title" data-index="01">Skill description</h2><Html className="description" value={record.raw.description}/></section>
    <section className="section"><h2 className="section-title" data-index="02">Using this skill</h2><Html className="use-copy" value={record.raw.use}/></section>
    <Source/>
  </>;
}

function AttributeDetail({ record, data, recordNumber }: { record: ReferenceRecord; data: ReferenceData; recordNumber: number }) {
  const raw = record.raw;
  const derivedStatistics = Object.entries(asObject(raw.derived_statistics));
  const linkedSkills = asStrings(raw.common_linked_skills);
  const benchmarks = Object.entries(asObject(raw.benchmarks));
  const benchmarkScale = asObject(data.payload.benchmark_scale);
  const abbreviation = valueText(raw.abbreviation);
  return <>
    <article className="attribute-dossier" aria-labelledby="attribute-dossier-title">
      <header className="attribute-dossier-banner"><div><span>Character capability record</span><h2 id="attribute-dossier-title">Attribute dossier</h2></div><strong>{code("AT", recordNumber)}</strong></header>
      <div className="attribute-dossier-grid">
        <section className="attribute-identity"><span>Attribute code</span><strong>{abbreviation}</strong><p>{record.category} classification</p></section>
        <section className="attribute-definition"><span>Core function</span><p>{valueText(raw.description, "No attribute description is available.")}</p></section>
      </div>
      <div className="attribute-dossier-rule"><span>{abbreviation}</span><strong>{valueText(raw.why_important, "This attribute supports a runner's core capabilities.")}</strong></div>
    </article>
    <section className="section attribute-uses"><h2 className="section-title">Used for</h2><TextList values={raw.used_for} className="attribute-use-list"/></section>
    {derivedStatistics.length ? <section className="section attribute-derived"><h2 className="section-title">Derived statistics and tests</h2><dl className="attribute-formula-grid">{derivedStatistics.map(([name, formula]) => <div key={name}><dt>{titleCase(name)}</dt><dd><code>{valueText(formula)}</code></dd></div>)}</dl></section> : null}
    <section className="section attribute-skills"><h2 className="section-title">Common linked skills</h2>{linkedSkills.length ? <ul className="attribute-skill-list">{linkedSkills.map((skill) => <li key={skill}>{skill}</li>)}</ul> : <p className="attribute-empty-note">No active skills link directly to this Special Attribute.</p>}</section>
    <section className="section attribute-benchmarks"><div className="attribute-benchmark-heading"><div><span>PLAYER-FACING SCALE // {abbreviation}</span><h2 className="section-title">Rating benchmarks</h2></div><p>{valueText(benchmarkScale.basis)}</p></div><div className="attribute-benchmark-grid">{benchmarks.map(([rating, value]) => { const benchmark = asObject(value); return <article className="attribute-benchmark" key={rating}><span>Rating {rating}</span><strong>{valueText(benchmark.label)}</strong><p>{valueText(benchmark.narrative)}</p></article>; })}</div>
      <aside className="attribute-benchmark-note"><strong>Benchmark note //</strong><p>{valueText(benchmarkScale.scope)}</p>{record.category === "Special" ? <p>{valueText(benchmarkScale.special_attribute_note)}</p> : null}</aside>
    </section>
    <Source value={raw.source}/>
  </>;
}

const metatypeAttributes: [string, string, string][] = [["body", "Body", "BOD"], ["agility", "Agility", "AGI"], ["reaction", "Reaction", "REA"], ["strength", "Strength", "STR"], ["willpower", "Willpower", "WIL"], ["logic", "Logic", "LOG"], ["intuition", "Intuition", "INT"], ["charisma", "Charisma", "CHA"], ["edge", "Edge", "EDG"]];

function MetatypeDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  const attributes = asObject(raw.attributes);
  const movement = asObject(raw.movement);
  const priorities = asObject(raw.priority_options);
  return <>
    <article className="metatype-profile" aria-labelledby="profile-title">
      <header className="profile-banner"><div><span>Natural capability ranges</span><h2 id="profile-title">Metatype attribute profile</h2></div><strong>{code("MT", recordNumber)}</strong></header>
      <section className="attribute-section"><div className="range-key"><span>Racial minimum</span><span>Natural maximum</span></div><dl className="attribute-grid">
        {metatypeAttributes.map(([key, label, short]) => {
          const range = asObject(attributes[key]);
          return Object.keys(range).length ? <div key={key}><dt>{label}</dt><dd><span>{valueText(range.minimum)}</span><i>→</i><strong>{valueText(range.maximum)}</strong></dd><small>{short}</small></div> : null;
        })}
        {attributes.essence != null ? <div className="essence-attribute"><dt>Essence</dt><dd>{valueText(attributes.essence)}</dd><small>ESS</small></div> : null}
      </dl></section>
      <dl className="identity-strip"><div><dt>Average height</dt><dd>{valueText(raw.average_height)}</dd></div><div><dt>Average weight</dt><dd>{valueText(raw.average_weight)}</dd></div><div><dt>Average lifespan</dt><dd>{valueText(raw.average_lifespan)}</dd></div></dl>
      <dl className="movement-grid"><div><dt>Initiative</dt><dd>{valueText(raw.initiative)}</dd></div><div><dt>Walk</dt><dd>{valueText(movement.walk)}</dd></div><div><dt>Run</dt><dd>{valueText(movement.run)}</dd></div><div><dt>Sprint increase</dt><dd>{valueText(movement.sprint_increase)}</dd></div></dl>
    </article>
    <section className="section priority-section"><h2 className="section-title">Metatype priority options</h2><dl>{Object.entries(priorities).map(([priority, points]) => <div key={priority}><dt>Priority {priority}</dt><dd>{valueText(points)} Special Attribute Points</dd></div>)}</dl></section>
    <section className="section metatype-description"><h2 className="section-title">Metatype profile</h2><p>{valueText(raw.description, "No description is available.")}</p></section>
    <Source value={raw.source}/>
  </>;
}

function checksum(value: string) {
  let total = 0;
  Array.from(value).forEach((letter, index) => { total = (total + letter.charCodeAt(0) * (index + 1)) % 65535; });
  return total.toString(16).toUpperCase().padStart(4, "0");
}

function CyberdeckDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  if (record.category === "Cyberdecks") {
    const values = valueText(raw.attribute_array, "").split("/").map((value) => value.trim()).filter(Boolean);
    const capacity = Number(raw.programs) || 0;
    return <>
      <article className="deck-console" aria-labelledby="deck-console-title">
        <header className="matrix-record-banner"><div><span>Hardware configuration</span><h2 id="deck-console-title">Cyberdeck control surface</h2></div><strong>{code("CD", recordNumber)}</strong></header>
        <div className="deck-overview"><dl><div><dt>Device rating</dt><dd>{valueText(raw.device_rating)}</dd></div><div><dt>Program capacity</dt><dd>{valueText(raw.programs)}</dd></div><div><dt>Availability</dt><dd>{valueText(raw.availability)}</dd></div><div><dt>Cost</dt><dd>{valueText(raw.cost)}</dd></div></dl></div>
        <section className="attribute-console"><header><span>Matrix attribute array</span><strong>Assignable configuration</strong></header><div className="attribute-slots">{values.map((rating, index) => <div key={`${rating}-${index}`}><span>Slot {String.fromCharCode(65 + index)}</span><strong>{rating}</strong></div>)}</div><p>Assign these values among <strong>Attack</strong>, <strong>Sleaze</strong>, <strong>Data Processing</strong>, and <strong>Firewall</strong> when configuring the cyberdeck.</p><div className="attribute-key" aria-hidden="true"><span>ATT</span><span>SLZ</span><span>DP</span><span>FW</span></div></section>
        <section className="program-capacity"><header><span>Running program capacity</span><strong>{capacity} simultaneous {capacity === 1 ? "program" : "programs"}</strong></header><div aria-hidden="true">{Array.from({ length: capacity }, (_, index) => <i key={index}/>)}</div></section>
      </article>
      <Source value={raw.source}/>
    </>;
  }
  const softwareCode = code("SW", recordNumber);
  const hasRating = raw.rating != null && raw.rating !== "";
  return <>
    <article className="software-manifest" aria-labelledby="manifest-title">
      <header className="matrix-record-banner"><div><span>Executable package manifest</span><h2 id="manifest-title">Program specification</h2></div><strong>{softwareCode}</strong></header>
      <div className="manifest-grid"><section className="package-identity"><span>Package class</span><strong>{valueText(raw.subcategory)}</strong><p>PKG // {softwareCode} // {checksum(record.name)}</p></section><dl>{hasRating ? <div><dt>Configurable rating</dt><dd>{valueText(raw.rating)}</dd></div> : null}<div><dt>Availability</dt><dd>{valueText(raw.availability)}</dd></div><div><dt>Cost</dt><dd>{valueText(raw.cost)}</dd></div></dl></div>
    </article>
    <section className="section record-description"><h2 className="section-title">Execution effect</h2><p>{valueText(raw.description, "No description is available.")}</p></section>
    <Source value={raw.source}/>
  </>;
}

const matrixAttributeCodes: Record<string, string> = { Attack: "ATT", Sleaze: "SLZ", "Data Processing": "DP", Firewall: "FW" };

function MatrixDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  const action = record.category === "Matrix Actions";
  return <>
    {action ? <article className="action-protocol" aria-labelledby="action-profile-title"><header className="protocol-banner"><div><span>Executable Matrix procedure</span><h2 id="action-profile-title">Action profile</h2></div><strong>{code("MA", recordNumber)}</strong></header><dl className="profile-grid"><div><dt>Action type</dt><dd>{valueText(raw.action_type)}</dd></div><div><dt>Marks required</dt><dd>{valueText(raw.marks_required)}</dd></div><div className="attribute-profile"><dt>Matrix attribute</dt><dd><span>{matrixAttributeCodes[String(raw.matrix_attribute)] || "VAR"}</span><strong>{valueText(raw.matrix_attribute)}</strong></dd></div></dl><section className="test-strip"><span>Action test</span><strong>{valueText(raw.test)}</strong></section></article>
      : <article className="form-protocol" aria-labelledby="form-profile-title"><header className="protocol-banner"><div><span>Resonance threading procedure</span><h2 id="form-profile-title">Complex form profile</h2></div><strong>{code("CF", recordNumber)}</strong></header><dl className="profile-grid form-profile-grid"><div><dt>Target</dt><dd>{valueText(raw.target)}</dd></div><div><dt>Duration</dt><dd>{valueText(raw.duration)}</dd></div><div className="fading-profile"><dt>Fading value</dt><dd>{valueText(raw.fading_value)}</dd></div></dl><section className="test-strip resonance-test"><span>Threading test</span><strong>{valueText(raw.test)}</strong></section></article>}
    <section className="section interaction-description"><h2 className="section-title">{action ? "Action resolution" : "Resonance effect"}</h2><p>{valueText(raw.description, "No description is available.")}</p></section>
    <Source value={raw.source}/>
  </>;
}

function SpriteDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  return <>
    <article className="sprite-profile" aria-labelledby="profile-title"><header className="profile-banner"><div><span>Level-derived Matrix entity</span><h2 id="profile-title">Resonance profile</h2></div><strong>{code("SR", recordNumber)}</strong></header>
      <section className="matrix-attribute-section"><h3>Matrix attributes</h3><dl className="matrix-attribute-grid"><div data-attribute="attack"><dt>Attack</dt><dd>{valueText(raw.attack)}</dd><span>ATT</span></div><div data-attribute="sleaze"><dt>Sleaze</dt><dd>{valueText(raw.sleaze)}</dd><span>SLZ</span></div><div data-attribute="data-processing"><dt>Data Processing</dt><dd>{valueText(raw.data_processing)}</dd><span>DP</span></div><div data-attribute="firewall"><dt>Firewall</dt><dd>{valueText(raw.firewall)}</dd><span>FW</span></div></dl></section>
      <dl className="resonance-strip"><div><dt>Resonance</dt><dd>{valueText(raw.resonance)}</dd></div><div><dt>Device Rating</dt><dd>{valueText(raw.device_rating)}</dd></div><div><dt>Condition Monitor</dt><dd>{valueText(raw.matrix_condition_monitor)}</dd></div></dl>
      <dl className="initiative-strip"><div><dt>Initiative</dt><dd>{valueText(raw.initiative)}</dd></div><div><dt>Initiative dice</dt><dd>{valueText(raw.initiative_dice)}</dd></div></dl>
    </article>
    <section className="section sprite-description"><h2 className="section-title">Operational profile</h2><p>{valueText(raw.description, "No description is available.")}</p></section>
    <section className="section skill-section"><h2 className="section-title">Skills</h2><TextList values={raw.skills}/></section>
    <Source value={raw.source}/>
  </>;
}

const typeLabels: Record<string, string> = { M: "Mana", P: "Physical" };
const durationLabels: Record<string, string> = { I: "Instant", S: "Sustained", P: "Permanent" };
const damageLabels: Record<string, string> = { S: "Stun", P: "Physical" };
const rangeMeaning = (value: unknown) => value === "T" ? "Touch" : value === "LOS" ? "Line of sight" : value === "LOS (A)" ? "Line of sight · Area" : "";

function SpellDetail({ record }: { record: ReferenceRecord }) {
  const raw = record.raw;
  return <>
    <div className="stat-grid" aria-label="Spell statistics">
      <div className="stat"><span className="field-label">Type</span><strong className="stat-value">{valueText(raw.type)}</strong><span className="stat-meaning">{typeLabels[String(raw.type)] || ""}</span></div>
      <div className="stat"><span className="field-label">Range</span><strong className="stat-value">{valueText(raw.range)}</strong><span className="stat-meaning">{rangeMeaning(raw.range)}</span></div>
      {Object.prototype.hasOwnProperty.call(raw, "damage") ? <div className="stat"><span className="field-label">Damage</span><strong className="stat-value">{valueText(raw.damage)}</strong><span className="stat-meaning">{damageLabels[String(raw.damage)] || ""}</span></div> : null}
      <div className="stat"><span className="field-label">Duration</span><strong className="stat-value">{valueText(raw.duration)}</strong><span className="stat-meaning">{durationLabels[String(raw.duration)] || ""}</span></div>
      <div className="stat"><span className="field-label">Drain</span><strong className="stat-value">{valueText(raw.drain ?? raw.Drain)}</strong><span className="stat-meaning">Drain Value</span></div>
    </div>
    <section className="section"><h2 className="section-title">Spell effect</h2><Html className="description" value={raw.description}/></section>
    <Source value={raw.source}/>
  </>;
}

function AdeptDetail({ record, data }: { record: ReferenceRecord; data: ReferenceData }) {
  const raw = record.raw;
  const related = asObject(data.payload.relatedRules);
  const relatedKeys = asStrings(raw.relatedRules);
  return <>
    <div className="stat-grid" aria-label="Adept power statistics">
      <div className="stat"><span className="field-label">Power Point cost</span><strong className="stat-value">{valueText(raw.cost)}</strong><span className="stat-meaning">Purchase cost</span></div>
      <div className="stat"><span className="field-label">Activation</span><strong className="stat-value">{valueText(raw.activation)}</strong><span className="stat-meaning">{raw.activation === "Intrinsic" ? "No activation action required" : "Listed activation cost"}</span></div>
      <div className="stat"><span className="field-label">Rating structure</span><strong className="stat-value">{valueText(raw.rating)}</strong><span className="stat-meaning">How the power is purchased</span></div>
      <div className="stat"><span className="field-label">Maximum</span><strong className="stat-value">{valueText(raw.maximum)}</strong><span className="stat-meaning">Power-specific or general limit</span></div>
    </div>
    <section className="section"><h2 className="section-title">Power effect</h2><Html className="description" value={raw.description}/></section>
    {relatedKeys.length ? <section className="section"><h2 className="section-title">Related core rules</h2><div className="protocols">{relatedKeys.map((key) => <article className="protocol" key={key}><strong className="protocol-key">{titleCase(key)}</strong><Html className="protocol-copy" value={related[key]}/></article>)}</div></section> : null}
    <Source value={raw.source}/>
  </>;
}

const ritualStats: [string, string][] = [["body", "Body"], ["agility", "Agility"], ["reaction", "Reaction"], ["strength", "Strength"], ["willpower", "Willpower"], ["logic", "Logic"], ["intuition", "Intuition"], ["charisma", "Charisma"], ["initiative", "Initiative"], ["movement", "Movement"]];

function RitualDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  const stats = asObject(raw.stats);
  const hasStats = Object.keys(stats).length > 0;
  const minionSections: [string, unknown][] = [["Skills", stats.skills], ["Powers", stats.powers], ["Notes", stats.notes]];
  return <>
    <article className="ritual-procedure" aria-labelledby="procedure-title"><header className="procedure-banner"><div><span>Extended magical operation</span><h2 id="procedure-title">Ritual procedure</h2></div><strong>{code("RT", recordNumber)}</strong></header><dl className="procedure-grid"><div><dt>Ritual time</dt><dd>{valueText(raw.ritual_time)}</dd></div><div><dt>Duration</dt><dd>{valueText(raw.duration)}</dd></div>{raw.area ? <div><dt>Area</dt><dd>{valueText(raw.area)}</dd></div> : null}</dl>{raw.spell_requirement ? <section className="spell-requirement"><span>Incorporated spell requirement</span><strong>{valueText(raw.spell_requirement)}</strong></section> : null}</article>
    <section className="section ritual-description"><h2 className="section-title">Ritual effect</h2><p>{valueText(raw.description, "No description is available.")}</p></section>
    {hasStats ? <section className="minion-profile" aria-labelledby="minion-title"><header><span>Created entity // Force-derived profile</span><h2 id="minion-title">Minion statistics</h2></header><dl className="minion-stat-grid">{ritualStats.filter(([key]) => stats[key] != null && stats[key] !== "").map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{valueText(stats[key])}</dd></div>)}</dl><div className="minion-capabilities">{minionSections.filter(([, values]) => asStrings(values).length).map(([label, values]) => <section key={label}><h3>{label}</h3><TextList values={values}/></section>)}</div></section> : null}
    <Source value={raw.source}/>
  </>;
}

const spiritAttributes: [string, string, string][] = [["body", "Body", "BOD"], ["agility", "Agility", "AGI"], ["reaction", "Reaction", "REA"], ["strength", "Strength", "STR"], ["willpower", "Willpower", "WIL"], ["logic", "Logic", "LOG"], ["intuition", "Intuition", "INT"], ["charisma", "Charisma", "CHA"]];

function SpiritDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  const special = asStrings(raw.special);
  const weaknesses = asStrings(raw.weaknesses);
  return <>
    <article className="force-profile" aria-labelledby="force-profile-title"><header className="force-banner"><div><span>Force-derived manifestation data</span><h2 id="force-profile-title">Spirit Force profile</h2></div><strong>{code("ST", recordNumber)}</strong></header><section className="attribute-section"><h3>Manifested attributes</h3><dl className="attribute-grid">{spiritAttributes.map(([key, label, short]) => <div key={key}><dt>{label}</dt><dd>{valueText(raw[key])}</dd><span>{short}</span></div>)}</dl></section><dl className="essence-strip"><div><dt>Edge</dt><dd>{valueText(raw.edge)}</dd></div><div><dt>Essence</dt><dd>{valueText(raw.essence)}</dd></div><div><dt>Magic</dt><dd>{valueText(raw.magic)}</dd></div></dl><dl className="initiative-grid"><div><dt>Physical Initiative</dt><dd>{valueText(raw.initiative)}</dd></div><div><dt>Astral Initiative</dt><dd>{valueText(raw.astral_initiative)}</dd></div></dl></article>
    <section className="section spirit-description"><h2 className="section-title">Manifestation profile</h2><p>{valueText(raw.description, "No description is available.")}</p></section>
    <div className="capability-grid"><section className="capability-panel"><h2 className="section-title">Skills</h2><TextList values={raw.skills}/></section><section className="capability-panel"><h2 className="section-title">Standard powers</h2><TextList values={raw.powers}/></section><section className="capability-panel"><h2 className="section-title">Optional powers</h2><TextList values={raw.optional_powers}/></section></div>
    {special.length ? <section className="section exception-section"><h2 className="section-title">Special rules</h2><TextList values={special}/></section> : null}
    {weaknesses.length ? <section className="section exception-section weakness-section"><h2 className="section-title">Weaknesses</h2><TextList values={weaknesses}/></section> : null}
    <Source value={raw.source}/>
  </>;
}

const qualityStructureLabels: [string, string][] = [
  ["options", "Available options"],
  ["levels", "Quality levels"],
  ["variants", "Quality variants"],
  ["rarity", "Target rarity"],
  ["severity", "Severity"],
  ["target_prevalence", "Target prevalence"],
  ["degree", "Degree"],
  ["possible_side_effects", "Possible side effects"]
];

function QualityDescription({ value }: { value: unknown }) {
  const parts = valueText(value, "No quality description is available.").split(/\s*•\s*/).map((part) => part.trim()).filter(Boolean);
  return <div className="quality-description-copy"><p>{parts[0]}</p>{parts.length > 1 ? <ul>{parts.slice(1).map((part, index) => <li key={`${part.slice(0, 32)}-${index}`}>{part}</li>)}</ul> : null}</div>;
}

function QualityChoice({ name, value }: { name: string; value: unknown }) {
  const fields = asObject(value);
  if (!Object.keys(fields).length) return <article className="quality-choice"><h3>{name}</h3><p>{valueText(value)}</p></article>;
  return <article className="quality-choice"><h3>{name}</h3><dl>{Object.entries(fields).map(([field, fieldValue]) => <div key={field}><dt>{titleCase(field)}</dt><dd>{valueText(fieldValue)}</dd></div>)}</dl></article>;
}

function QualityDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  const positive = record.category === "Positive Qualities";
  const karma = positive ? raw.karma_cost : raw.karma_bonus;
  const maximum = raw.max_rating ?? raw.max_level;
  const sections = qualityStructureLabels.map(([key, label]) => ({ key, label, entries: Object.entries(asObject(raw[key])) })).filter((section) => section.entries.length);
  const structure = maximum != null ? "Rated" : sections.length ? "Choice-based" : "Fixed";
  return <>
    <article className="quality-ledger" data-polarity={positive ? "positive" : "negative"} aria-labelledby="quality-ledger-title">
      <header className="quality-ledger-banner"><div><span>Character creation dossier</span><h2 id="quality-ledger-title">Quality ledger</h2></div><strong>{code(positive ? "PQ" : "NQ", recordNumber)}</strong></header>
      <div className="quality-ledger-grid">
        <section className="quality-polarity"><span>Quality class</span><strong>{positive ? "Positive" : "Negative"}</strong><p>{positive ? "Character advantage" : "Character complication"}</p></section>
        <section className="quality-karma"><span>{positive ? "Purchase cost" : "Karma bonus"}</span><strong>{valueText(karma)}</strong><p>Karma</p></section>
        <dl className="quality-ledger-stats"><div><dt>Structure</dt><dd>{structure}</dd></div>{maximum != null ? <div><dt>Maximum rating</dt><dd>{valueText(maximum)}</dd></div> : <div><dt>Selection</dt><dd>{sections.length ? `${sections.length} option ${sections.length === 1 ? "group" : "groups"}` : "Single quality"}</dd></div>}</dl>
      </div>
      <div className="quality-ledger-rule"><span>{positive ? "+" : "−"}</span><strong>{positive ? "Benefit acquired with Karma" : "Disadvantage awarded with bonus Karma"}</strong></div>
    </article>
    <section className="section quality-description"><h2 className="section-title">Quality effect</h2><QualityDescription value={raw.description}/></section>
    {sections.map((section) => <section className="section quality-structure" key={section.key}><h2 className="section-title">{section.label}</h2><div className="quality-choice-grid">{section.entries.map(([name, value]) => <QualityChoice name={name} value={value} key={name}/>)}</div></section>)}
    <Source value={raw.source}/>
  </>;
}

const lifestyleVariantOrder = ["point_cost", "monthly_cost", "minimum_lifestyle"];

function textValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return value == null || value === "" ? [] : [String(value)];
}

function LifestyleVariant({ name, value }: { name: string; value: unknown }) {
  const variant = asObject(value);
  const details = [
    ...lifestyleVariantOrder.filter((key) => variant[key] != null && variant[key] !== "").map((key) => [key, variant[key]] as const),
    ...Object.entries(variant).filter(([key, fieldValue]) => !lifestyleVariantOrder.includes(key) && key !== "effect" && key !== "notes" && fieldValue != null && fieldValue !== "")
  ];
  const notes = textValues(variant.notes);
  return <article className="lifestyle-variant">
    <header><span>Selectable configuration</span><h3>{name}</h3></header>
    {details.length ? <dl>{details.map(([key, fieldValue]) => <div key={key}><dt>{titleCase(key)}</dt><dd>{valueText(fieldValue)}</dd></div>)}</dl> : null}
    {variant.effect ? <Html className="lifestyle-variant-effect" value={variant.effect}/> : null}
    {notes.length ? <ul className="lifestyle-variant-notes">{notes.map((note, index) => <li key={`${note.slice(0, 32)}-${index}`}>{note}</li>)}</ul> : null}
  </article>;
}

function LifestyleDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  const entertainment = record.category === "Entertainment";
  const positive = record.subcategory === "Positive";
  const variants = Object.entries(asObject(raw.variants));
  const notes = textValues(raw.notes);
  const classification = valueText(raw.subcategory, entertainment ? "Extra" : "Option");
  return <>
    <article className="lifestyle-dossier" data-kind={entertainment ? "extra" : positive ? "positive" : "negative"} aria-labelledby="lifestyle-dossier-title">
      <header className="lifestyle-dossier-banner"><div><span>{entertainment ? "Residential resource configuration" : "Lifestyle-wide modifier"}</span><h2 id="lifestyle-dossier-title">Lifestyle dossier</h2></div><strong>{code(entertainment ? "EX" : "LO", recordNumber)}</strong></header>
      <div className="lifestyle-dossier-grid">
        <section className="lifestyle-classification"><span>Entry class</span><strong>{classification}</strong><p>{entertainment ? "Entertainment extra" : `${classification} lifestyle option`}</p></section>
        <dl className="lifestyle-cost-grid">
          <div><dt>{entertainment ? "Point cost" : "Point adjustment"}</dt><dd>{valueText(entertainment ? raw.point_cost : raw.point_adjustment)}</dd><small>Lifestyle points</small></div>
          <div><dt>{entertainment ? "Monthly cost" : "Monthly adjustment"}</dt><dd>{valueText(raw.monthly_cost)}</dd><small>Nuyen per month</small></div>
          <div><dt>{entertainment ? "Minimum lifestyle" : "Option class"}</dt><dd>{entertainment ? valueText(raw.minimum_lifestyle) : classification}</dd><small>{entertainment ? "Cost-waiver threshold" : "Lifestyle modifier"}</small></div>
        </dl>
      </div>
      <div className="lifestyle-dossier-rule"><span>{entertainment ? "⌂" : positive ? "+" : "−"}</span><strong>{entertainment ? "Points always apply // Monthly cost is waived only at the listed lifestyle threshold" : "Apply the lifestyle-wide benefit, cost adjustment, and restriction exactly as listed"}</strong></div>
    </article>
    <section className="section lifestyle-description"><h2 className="section-title">{entertainment ? "Extra effect" : "Option effect"}</h2><Html className="lifestyle-description-copy" value={raw.description} fallback="No lifestyle description is available."/></section>
    {!entertainment ? <section className="section lifestyle-restriction"><h2 className="section-title">Restrictions</h2><Html className="lifestyle-restriction-copy" value={raw.restriction} fallback="No specific restriction is listed."/></section> : null}
    {variants.length ? <section className="section lifestyle-variants"><h2 className="section-title">Available configurations</h2><div className="lifestyle-variant-grid">{variants.map(([name, value]) => <LifestyleVariant name={name} value={value} key={name}/>)}</div></section> : null}
    {notes.length ? <section className="section lifestyle-notes"><h2 className="section-title">Operational notes</h2><ul>{notes.map((note, index) => <li key={`${note.slice(0, 32)}-${index}`}>{note}</li>)}</ul></section> : null}
    <Source value={raw.source}/>
  </>;
}

function WeaponDetail({ record }: { record: ReferenceRecord }) {
  const raw = record.raw;
  const fields: [string, unknown][] = [["Accuracy", raw.accuracy], ["Damage", raw.damage], ["Armor penetration", raw.ap], [raw.blast ? "Blast" : "Reach", raw.blast || raw.reach], ["Firing mode", raw.mode], ["Recoil compensation", raw.rc], ["Ammunition", raw.ammo], ["Rating", raw.rating], ["Availability", raw.availability], ["Cost", raw.cost]];
  const features = asStrings(raw.features);
  return <>
    <div className="weapon-data-grid">{fields.filter(([, value]) => value != null && value !== "").map(([label, value]) => <div className="weapon-data-field" key={label}><span className="field-label">{label}</span><strong>{valueText(value)}</strong></div>)}</div>
    <section className="weapon-description"><h2 className="section-title">Description</h2><p className="weapon-skill-note"><span>Associated skill</span><strong>{valueText(raw.skill, "Special")}</strong></p><p>{valueText(raw.description, "No description is available for this weapon.")}</p></section>
    {features.length ? <section className="section"><h2 className="section-title">Special features</h2><TextList className="feature-list" values={features}/></section> : null}
    <Source value={raw.source}/>
  </>;
}

function numericRatings(value: unknown): number[] {
  return valueText(value, "").match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
}

function Instrument({ label, value }: { label: string; value: unknown }) {
  const ratings = numericRatings(value);
  if (!ratings.length) return <div className="instrument-lanes">No rating available</div>;
  return <div className="instrument-lanes">{ratings.map((rating, laneIndex) => <div className="instrument-lane" key={`${rating}-${laneIndex}`}><span>{ratings.length > 1 ? laneIndex === 0 ? "Road" : "Off-road" : "Rating"}</span><span className="instrument-track" role="meter" aria-label={`${label}${ratings.length > 1 ? laneIndex === 0 ? " on road" : " off road" : ""} rating`} aria-valuemin={0} aria-valuemax={10} aria-valuenow={rating}>{Array.from({ length: 10 }, (_, index) => <i className={`instrument-segment${index < rating ? " is-active" : ""}`} aria-hidden="true" key={index}/>)}</span></div>)}</div>;
}

function VehicleDetail({ record }: { record: ReferenceRecord }) {
  const raw = record.raw;
  const acceleration = numericRatings(raw.acceleration)[0] || 0;
  const features = asStrings(raw.features);
  return <>
    <section className="vehicle-dashboard" aria-labelledby="dashboard-title">
      <header className="dashboard-status"><div><p>Rigger interface // Live archive feed</p><h2 id="dashboard-title">Operational dashboard</h2></div><dl className="dashboard-identity"><div><dt>Class</dt><dd>{record.category} // {valueText(raw.subcategory)}</dd></div><div><dt>Control skill</dt><dd>{valueText(raw.skill, "Special")}</dd></div></dl></header>
      <div className="dashboard-primary"><section className="gauge-card"><div className="gauge-heading"><span>01 // Handling</span><strong>{valueText(raw.handling)}</strong></div><Instrument label="Handling" value={raw.handling}/></section><section className="gauge-card"><div className="gauge-heading"><span>02 // Speed</span><strong>{valueText(raw.speed)}</strong></div><Instrument label="Speed" value={raw.speed}/></section><section className="acceleration-card"><span>03 // Acceleration</span><strong>{valueText(raw.acceleration)}</strong><div className="acceleration-chevrons" role="meter" aria-label="Acceleration rating" aria-valuemin={0} aria-valuemax={6} aria-valuenow={acceleration}>{Array.from({ length: 6 }, (_, index) => <i className={index < acceleration ? "is-active" : ""} aria-hidden="true" key={index}/>)}</div></section></div>
      <div className="dashboard-secondary"><section className="chassis-panel"><header><span>Chassis integrity</span><b>Physical platform</b></header><dl><div><dt>Body</dt><dd>{valueText(raw.body)}</dd></div><div><dt>Armor</dt><dd>{valueText(raw.armor)}</dd></div><div><dt>Seats</dt><dd>{valueText(raw.seats)}</dd></div></dl></section><section className="systems-panel"><header><span>Onboard systems</span><b>Archive ratings</b></header><dl><div><dt>Pilot</dt><dd>{valueText(raw.pilot)}</dd></div><div><dt>Sensor</dt><dd>{valueText(raw.sensor)}</dd></div></dl></section></div>
      <dl className="acquisition-strip"><div><dt>Acquisition // Availability</dt><dd>{valueText(raw.availability)}</dd></div><div><dt>Market cost</dt><dd>{valueText(raw.cost)}</dd></div></dl>
    </section>
    <section className="vehicle-description"><h2 className="section-title">Description</h2><p>{valueText(raw.description, "No description is available for this vehicle.")}</p></section>
    {features.length ? <section className="section"><h2 className="section-title">Special features</h2><TextList className="feature-list" values={features}/></section> : null}
    <Source value={raw.source}/>
  </>;
}

function DroneDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  const features = asStrings(raw.features);
  return <>
    <section className="drone-system" aria-labelledby="systems-title"><header className="system-header"><div><span>Remote asset // System diagnostic</span><h2 id="systems-title">Drone control stack</h2></div><strong>{code("DR", recordNumber)}</strong></header><div className="system-grid">
      <section className="control-kernel"><header><span>01</span><h3>Control kernel</h3></header><dl><div><dt>Pilot</dt><dd>{valueText(raw.pilot)}</dd><small>Device rating</small></div><div><dt>Sensor</dt><dd>{valueText(raw.sensor)}</dd><small>Perception limit</small></div></dl><p><span>Control skill</span><strong>{valueText(raw.skill)}</strong></p></section>
      <section className="movement-array"><header><span>02</span><h3>Movement vector</h3></header><dl><div><dt>Handling</dt><dd>{valueText(raw.handling)}</dd></div><div><dt>Speed</dt><dd>{valueText(raw.speed)}</dd></div><div><dt>Acceleration</dt><dd>{valueText(raw.acceleration)}</dd></div></dl></section>
      <section className="chassis-array"><header><span>03</span><h3>Chassis integrity</h3></header><dl><div><dt>Body</dt><dd>{valueText(raw.body)}</dd></div><div><dt>Armor</dt><dd>{valueText(raw.armor)}</dd></div></dl></section>
    </div><dl className="procurement-strip"><div><dt>Availability</dt><dd>{valueText(raw.availability)}</dd></div><div><dt>Cost</dt><dd>{valueText(raw.cost)}</dd></div></dl></section>
    <section className="section description-section"><h2 className="section-title">Operational profile</h2><p>{valueText(raw.description)}</p></section>
    {features.length ? <section className="section"><h2 className="section-title">Integrated systems and features</h2><TextList className="feature-list" values={features}/></section> : null}
    <Source value={raw.source}/>
  </>;
}

const equipmentLabels: [string, string][] = [["vector", "Vector"], ["speed", "Speed"], ["penetration", "Penetration"], ["power", "Power"], ["effect", "Effect"], ["duration", "Duration"], ["addiction_type", "Addiction type"], ["addiction_rating", "Addiction rating"], ["addiction_threshold", "Addiction threshold"], ["mount", "Mount"], ["rating", "Rating"], ["damage_modifier", "Damage modifier"], ["ap_modifier", "AP modifier"], ["armor", "Armor"], ["capacity", "Capacity"], ["device_rating", "Device rating"], ["attribute_array", "Attribute array"], ["programs", "Programs"], ["structure", "Structure"], ["essence", "Essence"], ["maximum_value", "Maximum value"], ["force", "Force"]];
const marketStatus = (value: unknown) => /F$/.test(String(value || "")) ? "Forbidden" : /R$/.test(String(value || "")) ? "Restricted" : "Open market";

function EquipmentDetail({ record, recordNumber }: { record: ReferenceRecord; recordNumber: number }) {
  const raw = record.raw;
  const specs = equipmentLabels.filter(([key]) => raw[key] != null && raw[key] !== "");
  const status = marketStatus(raw.availability);
  return <>
    <article className="market-listing" aria-labelledby="listing-title"><header className="listing-banner"><div><span>Verified catalogue entry</span><h2 id="listing-title">Product specification</h2></div><strong>{code("EQ", recordNumber)}</strong></header><div className="listing-grid"><div className="product-summary"><p className="stock-label" data-status={status.toLowerCase().replace(/ /g, "-")}>{status}</p><div className="price-block"><span>Advertised price</span><strong>{valueText(raw.cost)}</strong></div><dl><div><dt>Availability</dt><dd>{valueText(raw.availability)}</dd></div><div><dt>Product class</dt><dd>{valueText(raw.subcategory)}</dd></div></dl></div><section className="product-specifications"><h3>Technical specifications</h3><dl>{specs.length ? specs.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{valueText(raw[key])}</dd></div>) : <div className="spec-empty">No additional specifications supplied.</div>}</dl></section></div><div className="seller-strip"><span>Seller note</span><strong>Reference listing only // Transaction disabled</strong></div></article>
    <section className="section product-description"><h2 className="section-title">Product description</h2><p>{valueText(raw.description, "No product description is available.")}</p></section>
    <Source value={raw.source}/>
  </>;
}

export function RecordDetail({ moduleId, record, data, recordNumber }: DetailProps) {
  switch (moduleId) {
    case "skills": return <SkillDetail record={record}/>;
    case "attributes": return <AttributeDetail record={record} data={data} recordNumber={recordNumber}/>;
    case "metatypes": return <MetatypeDetail record={record} recordNumber={recordNumber}/>;
    case "qualities": return <QualityDetail record={record} recordNumber={recordNumber}/>;
    case "lifestyles": return <LifestyleDetail record={record} recordNumber={recordNumber}/>;
    case "cyberdecks": return <CyberdeckDetail record={record} recordNumber={recordNumber}/>;
    case "matrixinteraction": return <MatrixDetail record={record} recordNumber={recordNumber}/>;
    case "sprites": return <SpriteDetail record={record} recordNumber={recordNumber}/>;
    case "spells": return <SpellDetail record={record}/>;
    case "adeptpowers": return <AdeptDetail record={record} data={data}/>;
    case "rituals": return <RitualDetail record={record} recordNumber={recordNumber}/>;
    case "spirits": return <SpiritDetail record={record} recordNumber={recordNumber}/>;
    case "weapons": return <WeaponDetail record={record}/>;
    case "vehicles": return <VehicleDetail record={record}/>;
    case "drones": return <DroneDetail record={record} recordNumber={recordNumber}/>;
    case "equipment": return <EquipmentDetail record={record} recordNumber={recordNumber}/>;
    default: return null;
  }
}
