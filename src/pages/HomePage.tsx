import { useEffect, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { modules, sectors } from "../registry";
import { loadData } from "../data";
import { ArchiveIcon } from "../components/ArchiveIcon";
import { Masthead } from "../components/Masthead";
import { ArchivePageFrame } from "../components/ArchivePageFrame";
import { runArchiveTransition } from "../motion";

export function HomePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = params.get("sector");
  const showArchive = params.get("view") === "matrix" || requested !== null;
  const sector = sectors.some((item) => item.id === requested) ? requested! : "corerules";
  const current = sectors.find((item) => item.id === sector) || sectors[0];

  useEffect(() => { document.title = "Shadowrun 5e // Operations Archive"; }, []);

  function activate(next: string) {
    if (next === sector) return;
    runArchiveTransition(() => {
      setParams({ view: "matrix", sector: next }, { replace: true });
    });
  }

  function followWithTransition(event: MouseEvent<HTMLAnchorElement>, destination: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    runArchiveTransition(() => navigate(destination));
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? sectors.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + sectors.length) % sectors.length;
    activate(sectors[next].id);
    requestAnimationFrame(() => document.getElementById(`${sectors[next].id}-tab`)?.focus());
  }

  function prefetchModule(moduleId: string, mode?: "reference" | "workflow") {
    if (mode === "workflow") void import("./CharacterCreationPage");
    else void loadData(moduleId);
  }

  if (!showArchive) return <ArchivePageFrame className="page-home archive-page" motionKey="home-gateway"><div className="sheet home-gateway-sheet">
    <Masthead />
    <main className="home-gateway">
      <header className="home-gateway-intro">
        <p className="eyebrow">Select operating mode</p>
        <h2>Choose your access point.</h2>
        <p>Build a runner through the guided Core Rulebook workflow, or enter the reference archive and search the Sixth World data files.</p>
      </header>
      <div className="home-gateway-actions">
        <Link className="home-gateway-action home-gateway-action--shadows" to="/charactercreation/priorities" onClick={(event) => followWithTransition(event, "/charactercreation/priorities")} onMouseEnter={() => prefetchModule("charactercreation", "workflow")} onFocus={() => prefetchModule("charactercreation", "workflow")}>
          <span className="home-gateway-action-index">01 // CREATION PROTOCOL</span>
          <ArchiveIcon variant="charactercreation" className="home-gateway-icon"/>
          <span className="home-gateway-action-copy"><strong>Enter the Shadows</strong><span>Create a runner step by step</span></span>
          <b aria-hidden="true">›</b>
        </Link>
        <Link className="home-gateway-action home-gateway-action--matrix" to="/?view=matrix&sector=corerules" onClick={(event) => followWithTransition(event, "/?view=matrix&sector=corerules")}>
          <span className="home-gateway-action-index">02 // ARCHIVE UPLINK</span>
          <ArchiveIcon variant="matrixinteraction" className="home-gateway-icon"/>
          <span className="home-gateway-action-copy"><strong>Matrix Search</strong><span>Browse and filter rules data</span></span>
          <b aria-hidden="true">›</b>
        </Link>
      </div>
      <aside className="home-gateway-status"><span><i aria-hidden="true"/> Local-first interface</span><span>No account required</span><span>Core rules online</span></aside>
    </main>
    <footer><span className="footer-copy">Shadowrun 5E // Runner operations archive</span><span>Choose an access protocol to continue</span></footer>
  </div></ArchivePageFrame>;

  return <ArchivePageFrame className="page-home archive-page" motionKey={`home-${sector}`} key={`home-${sector}`}><div className="sheet">
    <Masthead homeLink showCharacterReturn/>
    <nav className="tabs-wrap archive-category-nav" aria-label="Reference categories"><div className="tabs" role="tablist" aria-label="Shadowrun reference sections">
      {sectors.map((item, index) => <button className="tab" id={`${item.id}-tab`} key={item.id} type="button" role="tab" aria-selected={sector === item.id} tabIndex={sector === item.id ? 0 : -1} onClick={() => activate(item.id)} onKeyDown={(event) => moveTab(event, index)}>{item.label}</button>)}
    </div><div className="archive-category-picker"><label htmlFor="home-sector-picker">Archive sector</label><select id="home-sector-picker" aria-label="Archive sector" value={sector} onChange={(event) => activate(event.target.value)}>{sectors.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></div></nav>
    <main className="workspace">
      <aside className="sidebar" aria-label="Reference archive information">
        <section className="panel"><div className="panel-inner"><h2 className="panel-heading"><span className="crosshair" aria-hidden="true"/>Operations index protocol</h2><p className="protocol-copy">Central access point for the Shadowrun Fifth Edition reference archive. Select a discipline above, then open the relevant data module.</p></div></section>
        <section className="panel"><div className="panel-inner"><h2 className="panel-heading"><span className="crosshair" aria-hidden="true"/>Archive sectors</h2><dl className="archive-index">
          {sectors.map((item) => <div className={`archive-row ${sector === item.id ? "active" : ""}`} key={item.id}><dt>{item.label}</dt><dd>{sector === item.id ? "Online" : "Standby"}</dd></div>)}
        </dl></div></section>
      </aside>
      <article className="panel content-panel" aria-live="polite"><div className="panel-inner"><section className="tab-pane archive-home-view" role="tabpanel" aria-labelledby={`${current.id}-tab`} key={current.id}>
        <header className="content-header"><p className="eyebrow">{current.eyebrow}</p><h2 className="content-title">{current.label}</h2><p className="content-intro">{current.intro}</p></header>
        <div className="module-grid" aria-label={`${current.label} reference modules`}>
          {modules.filter((module) => module.sector === sector).map((module, index) => <Link className="module-button archive-module-button" style={{ "--archive-order": index } as CSSProperties} to={`/${module.id}`} key={module.id} onClick={(event) => followWithTransition(event, `/${module.id}`)} onMouseEnter={() => prefetchModule(module.id, module.mode)} onFocus={() => prefetchModule(module.id, module.mode)}>
            <ArchiveIcon variant={module.id} className="module-symbol" />
            <span className="module-label"><span className="module-code">{module.moduleCode}</span><span className="module-name">{module.name}</span></span>
            <span className="module-status">Open archive</span>
          </Link>)}
        </div>
      </section></div></article>
    </main>
    <footer><span className="footer-copy">Shadowrun 5E // Runner operations archive</span><span>Reference interface // local static index</span></footer>
  </div></ArchivePageFrame>;
}
