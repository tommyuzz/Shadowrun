import { sourceBooks } from "../data";
import type { RawRecord, ReferenceRecord } from "../types";

const excluded = new Set(["category", "subcategory", "description", "use", "effect", "source", "keywords", "ruleTags", "racial_traits"]);

const label = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function display(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", ");
  if (typeof value === "object") return Object.entries(value as RawRecord).map(([key, nested]) => `${label(key)}: ${display(nested)}`).join(" · ");
  return String(value);
}

function FieldGrid({ record }: { record: ReferenceRecord }) {
  const entries = Object.entries(record.raw).filter(([key, value]) => !excluded.has(key) && value != null && value !== "");
  if (!entries.length) return null;
  return <section className="section specification-section">
    <h2 className="section-title">Record specifications</h2>
    <dl className="record-field-grid">
      {entries.map(([key, value]) => <div key={key} className={typeof value === "object" ? "field-wide" : undefined}>
        <dt>{label(key)}</dt><dd>{display(value)}</dd>
      </div>)}
    </dl>
  </section>;
}

function RichSection({ title, html }: { title: string; html?: string }) {
  if (!html) return null;
  return <section className="section record-description"><h2 className="section-title">{title}</h2><div className="rich-copy" dangerouslySetInnerHTML={{ __html: html }} /></section>;
}

export function RecordDetail({ record }: { record: ReferenceRecord; definitions: Record<string, string> }) {
  const primary = typeof record.raw.description === "string" ? record.raw.description : "";
  const usage = typeof record.raw.use === "string" ? record.raw.use : "";
  const effect = typeof record.raw.effect === "string" ? record.raw.effect : "";
  const sourceCode = record.source.match(/^[A-Za-z0-9]+/)?.[0]?.toUpperCase() || "—";
  return <>
    <FieldGrid record={record} />
    <RichSection title={usage ? "Skill application" : effect ? "Rules and effect" : "Record description"} html={usage || effect || primary} />
    {primary && (usage || effect) ? <RichSection title="Description" html={primary} /> : null}
    <section className="section"><div className="source-book"><span className="source-code">{sourceCode}</span><strong className="source-title">{sourceBooks[sourceCode] || record.source}</strong></div></section>
  </>;
}
