import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Masthead } from "../components/Masthead";
import { RecordDetail } from "../components/RecordDetail";
import { loadData, matchesSearch, slug } from "../data";
import { modulesById } from "../registry";
import type { ReferenceData } from "../types";

export function ModulePage() {
  const { moduleId = "", categoryId, recordId } = useParams();
  const navigate = useNavigate();
  const module = modulesById[moduleId];
  const [data, setData] = useState<ReferenceData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");

  const category = data?.categories.find((item) => item.id === categoryId) || data?.categories[0];
  const selected = data?.records.find((item) => item.id === recordId);
  const categoryRecords = useMemo(() => !data ? [] : data.records.filter((item) => category?.id === "all" || slug(item.category) === category?.id), [data, category]);
  const availableFilters = useMemo(() => !module ? [] : module.filters.map((filter) => ({
    filter,
    options: Array.from(new Set(categoryRecords.flatMap((record) => filter.values(record)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "en-GB", { numeric: true }))
  })).filter((entry) => entry.options.length > 0), [module, categoryRecords]);
  const records = useMemo(() => {
    return categoryRecords.filter((record) => matchesSearch(record, query) && availableFilters.every(({ filter }) => {
      const selectedValue = filterValues[filter.id];
      return !selectedValue || filter.values(record).includes(selectedValue);
    }));
  }, [categoryRecords, query, filterValues, availableFilters]);

  useEffect(() => {
    if (!module) return;
    document.title = `Shadowrun 5e // ${module.name}`;
    setData(null);
    setLoadError("");
    loadData(module.id).then(setData).catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "The dataset could not be loaded."));
  }, [module]);

  useEffect(() => {
    if (module && data && !categoryId && data.categories[0]) navigate(`/${module.id}/${data.categories[0].id}`, { replace: true });
  }, [module, data, categoryId, navigate]);

  useEffect(() => { setQuery(""); setFilterValues({}); setSelectedTag(""); }, [category?.id]);

  if (!module) return <Navigate to="/" replace />;
  if (loadError) return <div className="sheet module-sheet"><Masthead module={module}/><main className="loading-panel"><strong>Archive load failure</strong><p>{loadError}</p></main></div>;
  if (!data) return <div className="sheet module-sheet"><Masthead module={module}/><main className="loading-panel" aria-live="polite"><span className="loading-code">SYNC // DATASET</span><strong>Opening {module.name} archive…</strong></main></div>;
  if (!category) return <Navigate to={`/${module.id}/${data.categories[0]?.id || "all"}`} replace />;
  const categories = data.categories;

  function chooseCategory(id: string) { navigate(`/${module.id}/${id}`); }
  function moveCategory(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? categories.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + categories.length) % categories.length;
    chooseCategory(categories[next].id);
    requestAnimationFrame(() => document.getElementById(`${module.id}-${categories[next].id}-tab`)?.focus());
  }
  function openRecord(id: string) { navigate(`/${module.id}/${category!.id}/${id}`); window.scrollTo({ top: 0, behavior: "auto" }); }
  function showList() { navigate(`/${module.id}/${category!.id}`); setSelectedTag(""); }
  function setFilter(id: string, nextValue: string) { setFilterValues((current) => ({ ...current, [id]: nextValue })); }

  const categoryCopy = category.description || module.intro;
  const Detail = module.Detail || RecordDetail;
  const definition = selectedTag ? data.definitions[selectedTag] || data.definitions[selectedTag.toLowerCase()] : "";

  return <div className={`sheet module-sheet module-${module.id}`}>
    <Masthead module={module} />
    {data.categories.length > 1 ? <nav className="tabs-wrap" aria-label={`${module.name} categories`}><div className="tabs" role="tablist">
      {data.categories.map((item, index) => <button className="tab" id={`${module.id}-${item.id}-tab`} key={item.id} type="button" role="tab" aria-selected={category.id === item.id} tabIndex={category.id === item.id ? 0 : -1} onClick={() => chooseCategory(item.id)} onKeyDown={(event) => moveCategory(event, index)}>{item.label === "All" ? `All ${module.name}` : item.label}</button>)}
    </div></nav> : null}
    <main className="workspace reference-workspace">
      <aside className="sidebar" aria-label={`${module.name} rules and archive key`}>
        <section className="panel category-panel"><div className="panel-inner"><h2 className="panel-heading"><span className="crosshair" aria-hidden="true"/>{category.label} protocol</h2><div className="category-description" dangerouslySetInnerHTML={{ __html: categoryCopy }} /></div></section>
        <section className="panel legend-panel"><div className="panel-inner"><h2 className="panel-heading"><span className="crosshair" aria-hidden="true"/>Archive key</h2><dl className="legend-grid"><div className="legend-row"><dt>IDX</dt><dd>Stable record index</dd></div><div className="legend-row"><dt>TAG</dt><dd>Click for rule details</dd></div><div className="legend-row"><dt>SRC</dt><dd>Source book code</dd></div></dl></div></section>
      </aside>
      <article className="panel reference-panel" aria-live="polite"><div className="panel-inner">
        {!selected ? <section id="list-view">
          <header className="reference-header reference-list-header"><button className="filter-toggle-button" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>Filter</button><p className="eyebrow">{module.archiveCode} // {category.label} list</p><h1>{category.label === "All" ? module.name : category.label}</h1></header>
          {filtersOpen ? <div className="filter-panel app-filter-panel"><div className="app-filter-field"><label className="search-label" htmlFor="record-search">Search all record fields</label><div className="filter-control"><input className="search" id="record-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search names, rules, statistics and descriptions…`} autoFocus/><button className="filter-clear-button" type="button" disabled={!query} onClick={() => setQuery("")} aria-label="Clear search">×</button></div></div>{availableFilters.map(({ filter, options }) => {
            const filterLabel = typeof filter.label === "function" ? filter.label(category) : filter.label;
            const allLabel = typeof filter.allLabel === "function" ? filter.allLabel(category) : filter.allLabel;
            const selectedValue = filterValues[filter.id] || "";
            return <div className="app-filter-field" key={filter.id}><label className="search-label" htmlFor={`${module.id}-${filter.id}-filter`}>{filterLabel}</label><div className="filter-control"><select className="search keyword-filter" id={`${module.id}-${filter.id}-filter`} value={selectedValue} onChange={(event) => setFilter(filter.id, event.target.value)}><option value="">{allLabel}</option>{options.map((option) => <option value={option} key={option}>{filter.formatValue ? filter.formatValue(option) : option}</option>)}</select><button className="filter-clear-button" type="button" disabled={!selectedValue} onClick={() => setFilter(filter.id, "")} aria-label={`Clear ${filterLabel.toLowerCase()} filter`}>×</button></div></div>;
          })}</div> : null}
          <div className="reference-list-summary"><span>{module.listInstruction}</span><strong>{records.length === categoryRecords.length ? `${records.length} records` : `${records.length} of ${categoryRecords.length} records`}</strong></div>
          <div className="reference-list">{records.map((item) => <button className="reference-list-item" type="button" key={item.id} onClick={() => openRecord(item.id)}><span className="reference-list-index" aria-hidden="true">{module.id.slice(0, 2).toUpperCase()}-{String(data.records.indexOf(item) + 1).padStart(3, "0")}</span><span className="reference-list-name">{item.name}</span><span className="reference-list-meta">{module.listMeta(item)}</span></button>)}{!records.length ? <div className="empty-message">No records match the current filters.</div> : null}</div>
        </section> : <section id="record-view">
          <header className="reference-header reference-record-header"><button className="back-button" type="button" onClick={showList}>Back to list</button><p className="eyebrow">{module.archiveCode} // {module.singular} record</p><h1>{selected.name}</h1>{selected.tags.length ? <div className="tag-row">{selected.tags.map((tag) => <button type="button" className="tag-toggle" aria-pressed={selectedTag === tag} key={tag} onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}>{tag}</button>)}</div> : null}</header>
          {selectedTag ? <section className="tag-detail" aria-live="polite"><strong className="tag-detail-title">{selectedTag}</strong><div dangerouslySetInnerHTML={{ __html: definition || "This classification has no additional rules text in the current dataset." }} /></section> : null}
          <Detail record={selected} definitions={data.definitions} />
        </section>}
      </div></article>
    </main>
    <footer><span className="footer-copy">Shadowrun 5E // {module.name} archive</span><span>Reference interface // locally bundled data</span></footer>
  </div>;
}
