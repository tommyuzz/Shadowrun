import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { runArchiveTransition } from "../motion";
import type { ModuleDefinition } from "../types";
import { ArchiveIcon } from "./ArchiveIcon";
import { SourceSelector } from "./SourceSelector";

export function Masthead({ module, homeLink = false, showCharacterReturn = false, showMatrixReturn = false }: { module?: ModuleDefinition; homeLink?: boolean; showCharacterReturn?: boolean; showMatrixReturn?: boolean }) {
  const navigate = useNavigate();

  function returnHome(event: MouseEvent<HTMLAnchorElement>) {
    if ((!homeLink && !module) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    runArchiveTransition(() => navigate(homeLink ? "/" : `/?view=matrix&sector=${module!.sector}`));
  }

  return <header className="masthead">
    <ArchiveIcon variant={module?.id} />
    <div>
      <p className="kicker">{module?.kicker || "Runner operations archive"}</p>
      {homeLink ? <Link className="brand-link" to="/" onClick={returnHome} aria-label="Return to Shadowrun front page"><p className="brand-title">Shadowrun</p></Link> : module ? <Link className="brand-link" to={`/?view=matrix&sector=${module.sector}`} onClick={returnHome} aria-label={`Return to ${module.sector} Matrix Search`}><p className="brand-title">Shadowrun</p></Link> : <h1 className="brand-title">Shadowrun</h1>}
      <p className="brand-subtitle">{module?.subtitle || "Fifth edition reference index"}</p>
    </div>
    <div className="masthead-utilities">
      <SourceSelector showCharacterReturn={showCharacterReturn} showMatrixReturn={showMatrixReturn}/>
      <div className="record-id" aria-label="Archive identification">
        <strong>{module?.archiveCode || "RUNNER // 5E"}</strong>
        <span>{module ? `DATASET: ${module.id.toUpperCase()}.JSON` : "INDEX: SHADOWRUNHOME.HTML"}</span>
        <div className="barcode" aria-hidden="true" />
      </div>
    </div>
  </header>;
}
