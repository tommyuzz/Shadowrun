import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Masthead } from "../components/Masthead";
import { ModuleFooter, ModuleSidebar } from "../components/ModuleChrome";
import { RecordDetail, RecordHeaderExtra } from "../components/RecordDetail";
import { loadData, matchesSearch, slug } from "../data";
import { presentations, titleCase, valueText } from "../presentation";
import { recordTags } from "../record-tags";
import { modulesById } from "../registry";
import type { PagePresentation } from "../presentation";
import type { ReferenceCategory, ReferenceData, ReferenceRecord } from "../types";

const localListNumbers = new Set(["spells", "cyberdecks", "matrixinteraction", "drones", "equipment"]);
const localDetailNumbers = new Set(["cyberdecks", "matrixinteraction"]);
const titleIds: Record<string, [string | undefined, string | undefined]> = {
  skills: ["skill-list-title", "skill-title"], metatypes: [undefined, "metatype-title"], cyberdecks: ["list-title", "record-title"], matrixinteraction: ["list-title", "record-title"],
  sprites: [undefined, "sprite-title"], spells: ["spell-list-title", "spell-title"], adeptpowers: ["power-list-title", "power-title"], rituals: [undefined, "ritual-title"], spirits: [undefined, "spirit-title"],
  weapons: ["list-title", "weapon-title"], vehicles: ["list-title", "vehicle-title"], drones: ["list-title", "drone-title"], equipment: ["list-title", "item-title"]
};

function compactPowerCost(record: ReferenceRecord) {
  const values = Array.isArray(record.raw.costValues) ? record.raw.costValues.map(Number) : [];
  if (values.length > 1) return `${Math.min(...values)}–${Math.max(...values)} PP`;
  return valueText(record.raw.cost, "").replace(" per level", " / LVL").replace(" each", " EACH");
}

function listMeta(moduleId: string, record: ReferenceRecord, presentation: PagePresentation) {
  const raw = record.raw;
  if (moduleId === "adeptpowers") return <span className={presentation.metaClass}><span className="power-list-cost">{compactPowerCost(record)}</span><span className="power-list-activation">{valueText(raw.activation, "")}</span></span>;
  let value = "";
  switch (moduleId) {
    case "skills": value = raw.skillgroup ? titleCase(raw.skillgroup) : "Standalone"; break;
    case "metatypes": { const body = raw.attributes && typeof raw.attributes === "object" ? (raw.attributes as Record<string, Record<string, unknown>>).body : undefined; value = body ? `BOD ${body.minimum}–${body.maximum}` : "—"; break; }
    case "cyberdecks": value = valueText(raw.cost); break;
    case "matrixinteraction": value = record.category === "Matrix Actions" ? valueText(raw.action_type).replace(/\s+Action$/, "") : valueText(raw.fading_value); break;
    case "sprites": value = "Level"; break;
    case "spells": value = `Drain ${valueText(raw.drain ?? raw.Drain, "")}`.trim(); break;
    case "rituals": value = valueText(raw.ritual_time); break;
    case "spirits": value = `BOD ${valueText(raw.body)}`; break;
    case "weapons": case "vehicles": case "drones": value = record.subcategory || "Uncategorised"; break;
    case "equipment": value = valueText(raw.cost); break;
  }
  return <span className={presentation.metaClass}>{value}</span>;
}

function ArchiveTabs({ moduleId, data, category, chooseCategory, moveCategory }: { moduleId: string; data: ReferenceData; category: ReferenceCategory; chooseCategory: (id: string) => void; moveCategory: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void }) {
  const presentation = presentations[moduleId];
  if (data.categories.length <= 1) return null;
  const equipment = moduleId === "equipment";
  return <nav className={`tabs-wrap${equipment ? " equipment-category-nav" : ""}`} aria-label={`${moduleId} categories`}>
    <div className={`tabs${presentation.tabsClass ? ` ${presentation.tabsClass}` : ""}`} role="tablist" aria-label={`${moduleId} categories`}>
      {data.categories.map((item, index) => {
        const count = item.id === "all" ? data.records.length : data.records.filter((record) => slug(record.category) === item.id).length;
        return <button className="tab" id={`${item.id}-tab`} key={item.id} type="button" role="tab" aria-selected={category.id === item.id} tabIndex={category.id === item.id ? 0 : -1} onClick={() => chooseCategory(item.id)} onKeyDown={(event) => moveCategory(event, index)}>{equipment ? <><span>{item.label}</span><small aria-label={`${count} products`}>{count}</small></> : presentation.tabLabel ? presentation.tabLabel(item) : item.label}</button>;
      })}
    </div>
    {equipment ? <div className="equipment-category-picker"><label htmlFor="category-picker">Product department</label><select id="category-picker" aria-label="Product department" value={category.id} onChange={(event) => chooseCategory(event.target.value)}>{data.categories.map((item) => { const count = item.id === "all" ? data.records.length : data.records.filter((record) => slug(record.category) === item.id).length; return <option value={item.id} key={item.id}>{item.label} ({count})</option>; })}</select></div> : null}
  </nav>;
}

export function ModulePage() {
  const { moduleId = "", categoryId, recordId } = useParams();
  const navigate = useNavigate();
  const module = modulesById[moduleId];
  const presentation = presentations[moduleId];
  const [data, setData] = useState<ReferenceData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");

  const defaultCategory = data?.categories.find((item) => item.id === module?.defaultCategoryId) || data?.categories[0];
  const category = data?.categories.find((item) => item.id === categoryId) || defaultCategory;
  const categoryRecords = useMemo(() => !data ? [] : data.records.filter((item) => category?.id === "all" || slug(item.category) === category?.id), [data, category]);
  const selected = categoryRecords.find((item) => item.id === recordId);
  const availableFilters = useMemo(() => !module ? [] : module.filters.map((filter) => ({
    filter,
    options: Array.from(new Set(categoryRecords.flatMap((record) => filter.values(record)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "en-GB", { numeric: true }))
  })).filter((entry) => entry.options.length > 0), [module, categoryRecords]);
  const records = useMemo(() => categoryRecords.filter((record) => matchesSearch(record, query) && availableFilters.every(({ filter }) => {
    const selectedValue = filterValues[filter.id];
    return !selectedValue || filter.values(record).includes(selectedValue);
  })), [categoryRecords, query, filterValues, availableFilters]);

  useEffect(() => {
    if (!module) return;
    document.title = `Shadowrun 5e // ${module.name}`;
    setData(null);
    setLoadError("");
    loadData(module.id).then(setData).catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "The dataset could not be loaded."));
  }, [module]);

  useEffect(() => {
    if (!module || !data || categoryId) return;
    const target = data.categories.find((item) => item.id === module.defaultCategoryId) || data.categories[0];
    if (target) navigate(`/${module.id}/${target.id}`, { replace: true });
  }, [module, data, categoryId, navigate]);

  useEffect(() => { setQuery(""); setFilterValues({}); setFiltersOpen(false); setSelectedTag(""); }, [category?.id]);
  useEffect(() => { setSelectedTag(""); }, [recordId]);

  if (!module || !presentation) return <Navigate to="/" replace />;
  if (loadError) return <div className={presentation.pageClass}><div className="sheet"><Masthead module={module}/><main className="loading-panel"><strong>Archive load failure</strong><p>{loadError}</p></main></div></div>;
  if (!data) return <div className={presentation.pageClass}><div className="sheet"><Masthead module={module}/><main className="loading-panel" aria-live="polite"><span className="loading-code">SYNC // DATASET</span><strong>Opening {module.name} archive…</strong></main></div></div>;
  if (!category) return <Navigate to="/" replace />;

  function chooseCategory(id: string) { navigate(`/${module!.id}/${id}`); }
  function moveCategory(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? data!.categories.length - 1 : (index + direction + data!.categories.length) % data!.categories.length;
    chooseCategory(data!.categories[next].id);
    requestAnimationFrame(() => document.getElementById(`${data!.categories[next].id}-tab`)?.focus());
  }
  function openRecord(id: string) { navigate(`/${module!.id}/${category!.id}/${id}`); window.scrollTo({ top: 0, behavior: "auto" }); }
  function showList() { navigate(`/${module!.id}/${category!.id}`); setSelectedTag(""); }
  function setFilter(id: string, nextValue: string) { setFilterValues((current) => ({ ...current, [id]: nextValue })); }

  const hasFilters = Boolean(query || Object.values(filterValues).some(Boolean));
  const tags = selected ? recordTags(module.id, selected, data) : [];
  const activeTag = tags.find((tag) => tag.key === selectedTag);
  const detailNumber = selected ? (localDetailNumbers.has(module.id) ? categoryRecords.indexOf(selected) : data.records.indexOf(selected)) + 1 : 0;

  return <div className={presentation.pageClass}><div className="sheet">
    <Masthead module={module}/>
    <ArchiveTabs moduleId={module.id} data={data} category={category} chooseCategory={chooseCategory} moveCategory={moveCategory}/>
    <main className={presentation.workspaceClass}>
      <ModuleSidebar module={module} category={category} data={data}/>
      <article className={`panel ${presentation.panelClass}`} role="tabpanel" aria-live="polite"><div className="panel-inner">
        {!selected ? <section className={presentation.listViewClass}>
          <header className={`${presentation.headerClass} ${presentation.listHeaderClass}`.trim()}><button className="filter-toggle-button" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>Filter</button><p className="eyebrow">{presentation.listEyebrow(category)}</p><h1 id={titleIds[module.id]?.[0]}>{presentation.listTitle(category)}</h1></header>
          {filtersOpen ? <div className={presentation.filtersClass}>
            <div className={presentation.filterFieldClass}><label className="search-label" htmlFor={`${module.id}-record-search`}>{presentation.searchLabel}</label><div className="filter-control"><input className="search" id={`${module.id}-record-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={presentation.searchPlaceholder} autoFocus/><button className="filter-clear-button" type="button" disabled={!query} onClick={() => setQuery("")} aria-label="Clear search">×</button></div></div>
            {availableFilters.map(({ filter, options }) => {
              const filterLabel = typeof filter.label === "function" ? filter.label(category) : filter.label;
              const allLabel = typeof filter.allLabel === "function" ? filter.allLabel(category) : filter.allLabel;
              const selectedValue = filterValues[filter.id] || "";
              return <div className={presentation.filterFieldClass} key={filter.id}><label className="search-label" htmlFor={`${module.id}-${filter.id}-filter`}>{filterLabel}</label><div className="filter-control"><select className="search keyword-filter" id={`${module.id}-${filter.id}-filter`} value={selectedValue} onChange={(event) => setFilter(filter.id, event.target.value)}><option value="">{allLabel}</option>{options.map((option) => <option value={option} key={option}>{filter.formatValue ? filter.formatValue(option) : option}</option>)}</select><button className="filter-clear-button" type="button" disabled={!selectedValue} onClick={() => setFilter(filter.id, "")} aria-label={`Clear ${filterLabel.toLowerCase()} filter`}>×</button></div></div>;
            })}
          </div> : null}
          <div className={presentation.summaryClass}><span>{module.listInstruction}</span><strong>{hasFilters ? `${records.length} of ${categoryRecords.length} records` : `${records.length} ${records.length === 1 ? "record" : "records"}`}</strong></div>
          <div className={presentation.listClass}>{records.map((item) => {
            const listNumber = (localListNumbers.has(module.id) ? categoryRecords.indexOf(item) : data.records.indexOf(item)) + 1;
            return <button className={presentation.itemClass} type="button" key={item.id} onClick={() => openRecord(item.id)} aria-label={`Open ${item.name} ${module.singular.toLowerCase()} record`}><span className={presentation.indexClass} aria-hidden="true">{presentation.indexPrefix(category)}-{String(listNumber).padStart(3, "0")}</span><span className={presentation.nameClass}>{item.name}</span>{listMeta(module.id, item, presentation)}</button>;
          })}{!records.length ? <div className="empty-message">No records match the current filters.</div> : null}</div>
        </section> : <section className={presentation.recordViewClass} data-category={module.id === "vehicles" ? slug(selected.category) : undefined}>
          <header className={`${presentation.headerClass} ${presentation.recordHeaderClass}`.trim()}><button className="back-button" type="button" onClick={showList}>{presentation.backLabel || "Back to list"}</button><p className="eyebrow">{presentation.recordEyebrow(selected)}</p><h1 id={titleIds[module.id]?.[1]}>{selected.name}</h1><RecordHeaderExtra moduleId={module.id} record={selected}/>{tags.length ? <div className="tag-row" aria-label={`${module.singular} classifications`}>{tags.map((tag) => <button type="button" className={presentation.tagButtonClass} aria-pressed={selectedTag === tag.key} key={tag.key} onClick={() => setSelectedTag(selectedTag === tag.key ? "" : tag.key)}>{tag.label}</button>)}</div> : null}</header>
          {activeTag ? <section className={presentation.tagDetailClass} aria-live="polite"><strong className={presentation.tagDetailTitleClass}>{activeTag.label}</strong><div className={presentation.tagDetailCopyClass} dangerouslySetInnerHTML={{ __html: activeTag.html }}/></section> : null}
          <RecordDetail moduleId={module.id} record={selected} data={data} recordNumber={detailNumber}/>
        </section>}
      </div></article>
    </main>
    <ModuleFooter moduleId={module.id}/>
  </div></div>;
}
