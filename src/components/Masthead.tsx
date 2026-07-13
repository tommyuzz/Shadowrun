import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { runArchiveTransition } from "../motion";
import type { ModuleDefinition } from "../types";
import { ArchiveIcon } from "./ArchiveIcon";
import { SourceSelector } from "./SourceSelector";

export function Masthead({ module }: { module?: ModuleDefinition }) {
  const navigate = useNavigate();

  function returnHome(event: MouseEvent<HTMLAnchorElement>) {
    if (!module || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    runArchiveTransition(() => navigate(`/?sector=${module.sector}`));
  }

  return <header className="masthead">
    <ArchiveIcon variant={module?.id} />
    <div>
      <p className="kicker">{module?.kicker || "Runner operations archive"}</p>
      {module ? <Link className="brand-link" to={`/?sector=${module.sector}`} onClick={returnHome} aria-label="Return to Shadowrun home page"><p className="brand-title">Shadowrun</p></Link> : <h1 className="brand-title">Shadowrun</h1>}
      <p className="brand-subtitle">{module?.subtitle || "Fifth edition reference index"}</p>
    </div>
    <div className="masthead-utilities">
      <SourceSelector/>
      <div className="record-id" aria-label="Archive identification">
        <strong>{module?.archiveCode || "RUNNER // 5E"}</strong>
        <span>{module ? `DATASET: ${module.id.toUpperCase()}.JSON` : "INDEX: SHADOWRUNHOME.HTML"}</span>
        <div className="barcode" aria-hidden="true" />
      </div>
    </div>
  </header>;
}
