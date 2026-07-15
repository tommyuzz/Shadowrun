import { useCallback, useDeferredValue, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArchiveAtmosphere } from "../components/ArchiveAtmosphere";
import { ArchivePageFrame } from "../components/ArchivePageFrame";
import { ArchiveEmpty, ArchiveError, ArchiveLoading, ArchiveSourceEmpty, ArchiveSourceExcluded } from "../components/ArchiveStates";
import { ComparisonPanel } from "../components/ComparisonPanel";
import { Masthead } from "../components/Masthead";
import { ModuleFooter, ModuleSidebar } from "../components/ModuleChrome";
import { RecordDetail, RecordHeaderExtra } from "../components/RecordDetail";
import { loadData, matchesSearch, slug } from "../data";
import { runArchiveTransition } from "../motion";
import { presentations, titleCase, valueText } from "../presentation";
import { recordTags } from "../record-tags";
import { modulesById } from "../registry";
import { sourceRecordIsVisible, useSourceSelection } from "../source-selection";
import type { ComparisonModule } from "../comparison";
import type { PagePresentation } from "../presentation";
import type { ReferenceCategory, ReferenceData, ReferenceRecord } from "../types";

const localListNumbers = new Set(["spells", "cyberdecks", "matrixinteraction", "qualities", "lifestyles", "drones", "equipment"]);
const localDetailNumbers = new Set(["cyberdecks", "matrixinteraction"]);
const comparisonModules = new Set<ComparisonModule>(["weapons", "cyberdecks", "vehicles", "drones"]);
const comparisonLabels: Record<ComparisonModule, string> = {
  weapons: "weapons",
  cyberdecks: "cyberdecks",
  vehicles: "vehicles",
  drones: "drones"
};
const titleIds: Record<string, [string | undefined, string | undefined]> = {
  skills: ["skill-list-title", "skill-title"], attributes: ["attribute-list-title", "attribute-title"], metatypes: [undefined, "metatype-title"], cyberdecks: ["list-title", "record-title"], matrixinteraction: ["list-title", "record-title"],
  qualities: ["quality-list-title", "quality-title"], lifestyles: ["lifestyle-list-title", "lifestyle-title"],
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
  if (moduleId === "adeptpowers") return <span className={`${presentation.metaClass} archive-list-meta`.trim()}><span className="power-list-cost">{compactPowerCost(record)}</span><span className="power-list-activation">{valueText(raw.activation, "")}</span></span>;
  let value = "";
  switch (moduleId) {
    case "skills": value = raw.skillgroup ? titleCase(raw.skillgroup) : "Standalone"; break;
    case "attributes": value = valueText(raw.abbreviation); break;
    case "metatypes": { const body = raw.attributes && typeof raw.attributes === "object" ? (raw.attributes as Record<string, Record<string, unknown>>).body : undefined; value = body ? `BOD ${body.minimum}–${body.maximum}` : "—"; break; }
    case "cyberdecks": value = valueText(raw.cost); break;
    case "matrixinteraction": value = record.category === "Matrix Actions" ? valueText(raw.action_type).replace(/\s+Action$/, "") : valueText(raw.fading_value); break;
    case "qualities": value = `${valueText(record.category === "Positive Qualities" ? raw.karma_cost : raw.karma_bonus)} Karma ${record.category === "Positive Qualities" ? "cost" : "bonus"}`; break;
    case "lifestyles": value = record.category === "Entertainment"
      ? `${valueText(raw.point_cost)} PT · ${valueText(raw.monthly_cost)}`
      : `${valueText(raw.point_adjustment)} · ${valueText(raw.monthly_cost)}`;
      break;
    case "sprites": value = "Level"; break;
    case "spells": value = `Drain ${valueText(raw.drain ?? raw.Drain, "")}`.trim(); break;
    case "rituals": value = valueText(raw.ritual_time); break;
    case "spirits": value = `BOD ${valueText(raw.body)}`; break;
    case "weapons": case "vehicles": case "drones": value = record.subcategory || "Uncategorised"; break;
    case "equipment": value = valueText(raw.cost); break;
  }
  return <span className={`${presentation.metaClass} archive-list-meta`.trim()}>{value}</span>;
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const terms = Array.from(new Set(query.trim().split(/\s+/).filter((term) => term && name.toLocaleLowerCase("en-GB").includes(term.toLocaleLowerCase("en-GB")))));
  if (!terms.length) return <>{name}</>;
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const expression = new RegExp(`(${escaped.join("|")})`, "gi");
  const matches = new Set(terms.map((term) => term.toLocaleLowerCase("en-GB")));
  return <>{name.split(expression).map((part, index) => matches.has(part.toLocaleLowerCase("en-GB")) ? <mark key={`${part}-${index}`}>{part}</mark> : part)}</>;
}

function ArchiveTitle({ id, title }: { id?: string; title: string }) {
  const longestWord = Math.max(1, ...title.split(/[^\p{L}\p{N}]+/u).map((word) => word.length));
  const mobileScale = Math.max(6, Math.min(11, 108 / longestWord));
  const style = { "--archive-title-mobile-scale": `${mobileScale}vw` } as CSSProperties;
  return <h1 className="archive-title" id={id} style={style}>{title}</h1>;
}

function ArchiveTabs({ moduleId, data, records, category, chooseCategory, moveCategory }: { moduleId: string; data: ReferenceData; records: ReferenceRecord[]; category: ReferenceCategory; chooseCategory: (id: string) => void; moveCategory: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void }) {
  const presentation = presentations[moduleId];
  if (data.categories.length <= 1) return null;
  const equipment = moduleId === "equipment";
  const pickerId = `${moduleId}-category-picker`;
  const pickerLabel = equipment ? "Product department" : "Archive category";
  return <nav className={`tabs-wrap archive-category-nav${equipment ? " equipment-category-nav" : ""}`} aria-label={`${moduleId} categories`}>
    <div className={`tabs${presentation.tabsClass ? ` ${presentation.tabsClass}` : ""}`} role="tablist" aria-label={`${moduleId} categories`}>
      {data.categories.map((item, index) => {
        const count = item.id === "all" ? records.length : records.filter((record) => slug(record.category) === item.id).length;
        return <button className="tab" id={`${item.id}-tab`} key={item.id} type="button" role="tab" aria-selected={category.id === item.id} tabIndex={category.id === item.id ? 0 : -1} onClick={() => chooseCategory(item.id)} onKeyDown={(event) => moveCategory(event, index)}>{equipment ? <><span>{item.label}</span><small aria-label={`${count} products`}>{count}</small></> : presentation.tabLabel ? presentation.tabLabel(item) : item.label}</button>;
      })}
    </div>
    <div className={`archive-category-picker${equipment ? " equipment-category-picker" : ""}`}><label htmlFor={pickerId}>{pickerLabel}</label><select id={pickerId} aria-label={pickerLabel} value={category.id} onChange={(event) => chooseCategory(event.target.value)}>{data.categories.map((item) => { const count = item.id === "all" ? records.length : records.filter((record) => slug(record.category) === item.id).length; return <option value={item.id} key={item.id}>{item.label} ({count})</option>; })}</select></div>
  </nav>;
}

export function ModulePage() {
  const { moduleId = "", categoryId, recordId } = useParams();
  const navigate = useNavigate();
  const { isSourceEnabled, includeSource, registerSources, enableAllSources } = useSourceSelection();
  const module = modulesById[moduleId];
  const presentation = presentations[moduleId];
  const [loadedData, setLoadedData] = useState<{ moduleId: string; data: ReferenceData } | null>(null);
  const [loadError, setLoadError] = useState<{ moduleId: string; message: string } | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const data = loadedData?.moduleId === moduleId ? loadedData.data : null;
  const currentLoadError = loadError?.moduleId === moduleId ? loadError.message : "";
  const deferredQuery = useDeferredValue(query);
  const deferredFilterValues = useDeferredValue(filterValues);

  const defaultCategory = data?.categories.find((item) => item.id === module?.defaultCategoryId) || data?.categories[0];
  const category = data?.categories.find((item) => item.id === categoryId) || defaultCategory;
  const sourceRecords = useMemo(() => !data ? [] : data.records.filter((item) => sourceRecordIsVisible(moduleId, item.source, isSourceEnabled)), [data, isSourceEnabled, moduleId]);
  const allCategoryRecords = useMemo(() => !data ? [] : data.records.filter((item) => category?.id === "all" || slug(item.category) === category?.id), [data, category]);
  const categoryRecords = useMemo(() => sourceRecords.filter((item) => category?.id === "all" || slug(item.category) === category?.id), [sourceRecords, category]);
  const selected = categoryRecords.find((item) => item.id === recordId);
  const excludedSelected = !selected && recordId ? allCategoryRecords.find((item) => item.id === recordId) : undefined;
  const availableFilters = useMemo(() => !module ? [] : module.filters.map((filter) => ({
    filter,
    options: Array.from(new Set(categoryRecords.flatMap((record) => filter.values(record)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "en-GB", { numeric: true }))
  })).filter((entry) => entry.options.length > 0), [module, categoryRecords]);
  const records = useMemo(() => categoryRecords.filter((record) => matchesSearch(record, deferredQuery) && availableFilters.every(({ filter }) => {
    const selectedValue = deferredFilterValues[filter.id];
    return !selectedValue || filter.values(record).includes(selectedValue);
  })), [categoryRecords, deferredQuery, deferredFilterValues, availableFilters]);

  useEffect(() => {
    if (!module) return;
    let active = true;
    document.title = `Shadowrun 5e // ${module.name}`;
    setLoadError(null);
    loadData(module.id)
      .then((nextData) => { if (active) setLoadedData({ moduleId: module.id, data: nextData }); })
      .catch((error: unknown) => { if (active) setLoadError({ moduleId: module.id, message: error instanceof Error ? error.message : "The dataset could not be loaded." }); });
    return () => { active = false; };
  }, [module, loadAttempt]);

  useEffect(() => {
    if (data) registerSources(data.records.map((record) => record.source));
  }, [data, registerSources]);

  useEffect(() => {
    if (!module || !data || categoryId) return;
    const target = data.categories.find((item) => item.id === module.defaultCategoryId) || data.categories[0];
    if (target) navigate(`/${module.id}/${target.id}`, { replace: true });
  }, [module, data, categoryId, navigate]);

  useEffect(() => { setQuery(""); setFilterValues({}); setFiltersOpen(false); setSelectedTag(""); setComparisonOpen(false); }, [category?.id]);
  useEffect(() => { setSelectedTag(""); }, [recordId]);

  const closeComparison = useCallback(() => setComparisonOpen(false), []);

  if (!module || !presentation) return <Navigate to="/" replace />;
  if (currentLoadError) return <ArchivePageFrame className={`${presentation.pageClass} archive-page`} moduleId={module.id} motionKey={`${module.id}-error-${loadAttempt}`} key={`${module.id}-error-${loadAttempt}`}>
    <ArchiveAtmosphere module={module} motionKey={`${module.id}-error-${loadAttempt}`}/>
    <div className="sheet"><Masthead module={module}/><ArchiveError module={module} message={currentLoadError} retry={() => setLoadAttempt((attempt) => attempt + 1)}/><ModuleFooter moduleId={module.id}/></div>
  </ArchivePageFrame>;
  if (!data) return <ArchivePageFrame className={`${presentation.pageClass} archive-page`} moduleId={module.id} motionKey={`${module.id}-loading-${loadAttempt}`} key={`${module.id}-loading-${loadAttempt}`}>
    <ArchiveAtmosphere module={module} motionKey={`${module.id}-loading-${loadAttempt}`}/>
    <div className="sheet"><Masthead module={module}/><ArchiveLoading module={module}/><ModuleFooter moduleId={module.id}/></div>
  </ArchivePageFrame>;
  if (!category) return <Navigate to="/" replace />;

  function chooseCategory(id: string) { runArchiveTransition(() => navigate(`/${module!.id}/${id}`)); }
  function moveCategory(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? data!.categories.length - 1 : (index + direction + data!.categories.length) % data!.categories.length;
    chooseCategory(data!.categories[next].id);
    requestAnimationFrame(() => document.getElementById(`${data!.categories[next].id}-tab`)?.focus());
  }
  function openRecord(id: string) { runArchiveTransition(() => navigate(`/${module!.id}/${category!.id}/${id}`)); window.scrollTo({ top: 0, behavior: "auto" }); }
  function showList() { runArchiveTransition(() => navigate(`/${module!.id}/${category!.id}`)); setSelectedTag(""); }
  function setFilter(id: string, nextValue: string) { setFilterValues((current) => ({ ...current, [id]: nextValue })); }
  function clearFilters() { setQuery(""); setFilterValues({}); }

  const hasFilters = Boolean(query || Object.values(filterValues).some(Boolean));
  const isFiltering = query !== deferredQuery || filterValues !== deferredFilterValues;
  const tags = selected ? recordTags(module.id, selected, data) : [];
  const activeTag = tags.find((tag) => tag.key === selectedTag);
  const detailNumber = selected ? (module.id === "qualities" || module.id === "lifestyles"
    ? data.records.filter((record) => record.category === selected.category).indexOf(selected)
    : localDetailNumbers.has(module.id) ? allCategoryRecords.indexOf(selected) : data.records.indexOf(selected)) + 1 : 0;
  const comparisonModule: ComparisonModule | null = comparisonModules.has(module.id as ComparisonModule) ? module.id as ComparisonModule : null;
  const comparisonRecords = module.id === "cyberdecks" ? sourceRecords.filter((record) => record.category === "Cyberdecks") : comparisonModule ? sourceRecords : [];
  const canCompare = Boolean(comparisonModule && comparisonRecords.length > 1 && (module.id !== "cyberdecks" || category.label === "Cyberdecks"));
  const filterMotionKey = `${deferredQuery}|${Object.entries(deferredFilterValues).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}:${value}`).join("|")}`;
  const viewMotionKey = `${module.id}-${category.id}-${selected?.id || excludedSelected?.id || "list"}`;

  function openComparedRecord(record: ReferenceRecord) {
    setComparisonOpen(false);
    runArchiveTransition(() => navigate(`/${module!.id}/${slug(record.category)}/${record.id}`));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  return <ArchivePageFrame className={`${presentation.pageClass} archive-page`} moduleId={module.id} motionKey={viewMotionKey} key={viewMotionKey}>
    <ArchiveAtmosphere module={module} motionKey={viewMotionKey}/>
    <div className="sheet">
    <Masthead module={module}/>
    <ArchiveTabs moduleId={module.id} data={data} records={sourceRecords} category={category} chooseCategory={chooseCategory} moveCategory={moveCategory}/>
    <main className={presentation.workspaceClass}>
      <ModuleSidebar module={module} category={category} data={data}/>
      <article className={`panel ${presentation.panelClass}`} role="tabpanel" aria-live="polite"><div className="panel-inner archive-view" key={viewMotionKey}>
        {!selected ? (excludedSelected ? <ArchiveSourceExcluded module={module} recordName={excludedSelected.name} source={excludedSelected.source} include={() => includeSource(excludedSelected.source)} back={showList}/> : <section className={presentation.listViewClass} aria-busy={isFiltering || undefined} data-filtering={isFiltering || undefined}>
          <header className={`${presentation.headerClass} ${presentation.listHeaderClass} archive-list-header`.trim()}><button className="filter-toggle-button" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>Filter</button><p className="eyebrow">{presentation.listEyebrow(category)}</p><ArchiveTitle id={titleIds[module.id]?.[0]} title={presentation.listTitle(category)}/></header>
          {filtersOpen ? <div className={`${presentation.filtersClass} archive-filter-panel`.trim()}>
            <div className={presentation.filterFieldClass}><label className="search-label" htmlFor={`${module.id}-record-search`}>{presentation.searchLabel}</label><div className="filter-control"><input className="search" id={`${module.id}-record-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={presentation.searchPlaceholder} autoFocus/><button className="filter-clear-button" type="button" disabled={!query} onClick={() => setQuery("")} aria-label="Clear search">×</button></div></div>
            {availableFilters.map(({ filter, options }) => {
              const filterLabel = typeof filter.label === "function" ? filter.label(category) : filter.label;
              const allLabel = typeof filter.allLabel === "function" ? filter.allLabel(category) : filter.allLabel;
              const selectedValue = filterValues[filter.id] || "";
              return <div className={presentation.filterFieldClass} key={filter.id}><label className="search-label" htmlFor={`${module.id}-${filter.id}-filter`}>{filterLabel}</label><div className="filter-control"><select className="search keyword-filter" id={`${module.id}-${filter.id}-filter`} value={selectedValue} onChange={(event) => setFilter(filter.id, event.target.value)}><option value="">{allLabel}</option>{options.map((option) => <option value={option} key={option}>{filter.formatValue ? filter.formatValue(option) : option}</option>)}</select><button className="filter-clear-button" type="button" disabled={!selectedValue} onClick={() => setFilter(filter.id, "")} aria-label={`Clear ${filterLabel.toLowerCase()} filter`}>×</button></div></div>;
            })}
          </div> : null}
          <div className={`${presentation.summaryClass} archive-list-summary`.trim()}><span>{module.listInstruction}</span><span className="archive-summary-tools"><strong className="archive-result-count" key={`${records.length}-${isFiltering}`}>{hasFilters ? `${records.length} of ${categoryRecords.length} records` : `${records.length} ${records.length === 1 ? "record" : "records"}`}</strong>{canCompare && comparisonModule ? <button className="compare-launch-button" type="button" onClick={() => setComparisonOpen(true)}>Compare {comparisonLabels[comparisonModule]}</button> : null}</span></div>
          <div className={`${presentation.listClass} archive-record-list`.trim()}>{records.map((item, index) => {
            const listNumber = (localListNumbers.has(module.id) ? allCategoryRecords.indexOf(item) : data.records.indexOf(item)) + 1;
            const motionStyle = { "--archive-order": Math.min(index, 12) } as CSSProperties;
            return <button className={`${presentation.itemClass} archive-list-item`.trim()} data-category={module.id === "qualities" || module.id === "lifestyles" || module.id === "attributes" ? slug(item.category) : undefined} data-subcategory={module.id === "lifestyles" ? slug(item.subcategory || "") : undefined} style={motionStyle} type="button" key={`${filterMotionKey}:${item.id}`} onClick={() => openRecord(item.id)} aria-label={`Open ${item.name} ${module.singular.toLowerCase()} record`}><span className={`${presentation.indexClass} archive-list-index`.trim()} aria-hidden="true">{presentation.indexPrefix(category)}-{String(listNumber).padStart(3, "0")}</span><span className={`${presentation.nameClass} archive-list-name`.trim()}><HighlightedName name={item.name} query={deferredQuery}/></span>{listMeta(module.id, item, presentation)}</button>;
          })}{!records.length ? categoryRecords.length ? <ArchiveEmpty module={module} reset={clearFilters}/> : <ArchiveSourceEmpty module={module} hiddenCount={allCategoryRecords.length} includeAll={enableAllSources}/> : null}</div>
        </section>) : <section className={presentation.recordViewClass} data-category={module.id === "vehicles" || module.id === "qualities" || module.id === "lifestyles" || module.id === "attributes" ? slug(selected.category) : undefined} data-subcategory={module.id === "lifestyles" ? slug(selected.subcategory || "") : undefined}>
          <header className={`${presentation.headerClass} ${presentation.recordHeaderClass} archive-record-header`.trim()}><button className="back-button" type="button" onClick={showList}>{presentation.backLabel || "Back to list"}</button>{canCompare ? <button className="compare-launch-button compare-record-button" type="button" onClick={() => setComparisonOpen(true)}>Compare</button> : null}<p className="eyebrow">{presentation.recordEyebrow(selected)}</p><ArchiveTitle id={titleIds[module.id]?.[1]} title={selected.name}/><RecordHeaderExtra moduleId={module.id} record={selected}/>{tags.length ? <div className="tag-row" aria-label={`${module.singular} classifications`}>{tags.map((tag) => <button type="button" className={presentation.tagButtonClass} aria-pressed={selectedTag === tag.key} key={tag.key} onClick={() => setSelectedTag(selectedTag === tag.key ? "" : tag.key)}>{tag.label}</button>)}</div> : null}</header>
          {activeTag ? <section className={presentation.tagDetailClass} aria-live="polite"><strong className={presentation.tagDetailTitleClass}>{activeTag.label}</strong><div className={presentation.tagDetailCopyClass} dangerouslySetInnerHTML={{ __html: activeTag.html }}/></section> : null}
          <RecordDetail moduleId={module.id} record={selected} data={data} recordNumber={detailNumber}/>
        </section>}
      </div></article>
    </main>
    <ModuleFooter moduleId={module.id}/>
    </div>
    {comparisonOpen && comparisonModule ? <ComparisonPanel moduleId={comparisonModule} records={comparisonRecords} initialRecord={selected} close={closeComparison} openRecord={openComparedRecord}/> : null}
  </ArchivePageFrame>;
}
