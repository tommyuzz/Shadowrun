import type { ModuleDefinition } from "../types";

export function ArchiveAtmosphere({ module, motionKey }: { module: ModuleDefinition; motionKey: string }) {
  return <div
    className="archive-atmosphere"
    data-sector={module.sector}
    data-module={module.id}
    key={motionKey}
    aria-hidden="true"
  >
    <span className="archive-motif archive-motif-primary"/>
    <span className="archive-motif archive-motif-secondary"/>
  </div>;
}
