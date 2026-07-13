import { useEffect, useState, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { modules, sectors } from "../registry";
import { loadData } from "../data";
import { ArchiveIcon } from "../components/ArchiveIcon";
import { Masthead } from "../components/Masthead";

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("sector");
  const [sector, setSector] = useState(sectors.some((item) => item.id === requested) ? requested! : "magic");
  const current = sectors.find((item) => item.id === sector) || sectors[2];

  useEffect(() => { document.title = "Shadowrun 5e // Operations Archive"; }, []);

  function activate(next: string) {
    setSector(next);
    setParams({ sector: next }, { replace: true });
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? sectors.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + sectors.length) % sectors.length;
    activate(sectors[next].id);
    requestAnimationFrame(() => document.getElementById(`${sectors[next].id}-tab`)?.focus());
  }

  return <div className="sheet home-sheet">
    <Masthead />
    <nav className="tabs-wrap" aria-label="Reference categories"><div className="tabs" role="tablist" aria-label="Shadowrun reference sections">
      {sectors.map((item, index) => <button className="tab" id={`${item.id}-tab`} key={item.id} type="button" role="tab" aria-selected={sector === item.id} tabIndex={sector === item.id ? 0 : -1} onClick={() => activate(item.id)} onKeyDown={(event) => moveTab(event, index)}>{item.label}</button>)}
    </div></nav>
    <main className="workspace">
      <aside className="sidebar" aria-label="Reference archive information">
        <section className="panel"><div className="panel-inner"><h2 className="panel-heading"><span className="crosshair" aria-hidden="true"/>Operations index protocol</h2><p className="protocol-copy">Central access point for the Shadowrun Fifth Edition reference archive. Select a discipline above, then open the relevant data module.</p></div></section>
        <section className="panel"><div className="panel-inner"><h2 className="panel-heading"><span className="crosshair" aria-hidden="true"/>Archive sectors</h2><dl className="archive-index">
          {sectors.map((item) => <div className={`archive-row ${sector === item.id ? "active" : ""}`} key={item.id}><dt>{item.label}</dt><dd>{sector === item.id ? "Online" : "Standby"}</dd></div>)}
        </dl></div></section>
      </aside>
      <article className="panel content-panel" aria-live="polite"><div className="panel-inner"><section className="tab-pane" role="tabpanel" aria-labelledby={`${current.id}-tab`}>
        <header className="content-header"><p className="eyebrow">{current.eyebrow}</p><h2 className="content-title">{current.label}</h2><p className="content-intro">{current.intro}</p></header>
        <div className="module-grid" aria-label={`${current.label} reference modules`}>
          {modules.filter((module) => module.sector === sector).map((module) => <Link className="module-button" to={`/${module.id}`} key={module.id} onMouseEnter={() => void loadData(module.id)} onFocus={() => void loadData(module.id)}>
            <ArchiveIcon variant={module.id} className="module-symbol" />
            <span className="module-label"><span className="module-code">{module.moduleCode}</span><span className="module-name">{module.name}</span></span>
            <span className="module-status">Open archive</span>
          </Link>)}
        </div>
      </section></div></article>
    </main>
    <footer><span className="footer-copy">Shadowrun 5E // Runner operations archive</span><span>Reference interface // dynamic static index</span></footer>
  </div>;
}
