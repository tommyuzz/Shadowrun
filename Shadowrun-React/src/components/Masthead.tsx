import { Link } from "react-router-dom";
import type { ModuleDefinition } from "../types";
import { ArchiveIcon } from "./ArchiveIcon";

export function Masthead({ module }: { module?: ModuleDefinition }) {
  return <header className="masthead">
    <ArchiveIcon variant={module?.id} />
    <div>
      <p className="kicker">{module?.kicker || "Runner operations archive"}</p>
      {module ? <Link className="brand-link" to={`/?sector=${module.sector}`} aria-label="Return to Shadowrun home page"><p className="brand-title">Shadowrun</p></Link> : <h1 className="brand-title">Shadowrun</h1>}
      <p className="brand-subtitle">{module?.subtitle || "Fifth edition reference index"}</p>
    </div>
    <div className="record-id" aria-label="Archive identification">
      <strong>{module?.archiveCode || "RUNNER // 5E"}</strong>
      <span>{module ? `DATASET: ${module.id.toUpperCase()}.JSON` : "INDEX: DYNAMIC ARCHIVE"}</span>
      <div className="barcode" aria-hidden="true" />
    </div>
  </header>;
}
