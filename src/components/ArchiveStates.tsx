import type { ModuleDefinition } from "../types";

export function ArchiveLoading({ module }: { module: ModuleDefinition }) {
  return <main className="archive-loading-shell" aria-live="polite" aria-busy="true">
    <aside className="archive-loading-sidebar" aria-hidden="true">
      <span className="skeleton-line skeleton-line-short"/>
      <span className="skeleton-line skeleton-line-title"/>
      <span className="skeleton-line"/>
      <span className="skeleton-line"/>
      <span className="skeleton-line skeleton-line-medium"/>
    </aside>
    <section className="archive-loading-dossier">
      <div className="archive-loading-status">
        <span className="loading-code">SYNC // {module.archiveCode}</span>
        <strong>Opening {module.name} archive…</strong>
      </div>
      <div className="skeleton-heading" aria-hidden="true"/>
      <div className="skeleton-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <span key={index}/>) }
      </div>
    </section>
  </main>;
}

export function ArchiveError({ module, message, retry }: { module: ModuleDefinition; message: string; retry: () => void }) {
  return <main className="archive-state-panel archive-error-state" role="alert">
    <span className="archive-state-code">SIGNAL LOST // {module.id.toUpperCase()}</span>
    <span className="archive-state-symbol" aria-hidden="true">×</span>
    <h1>Archive unavailable</h1>
    <p>{message}</p>
    <button type="button" className="archive-state-action" onClick={retry}>Retry data link</button>
  </main>;
}

export function ArchiveEmpty({ module, reset }: { module: ModuleDefinition; reset: () => void }) {
  return <section className="archive-empty-state" aria-live="polite">
    <span className="archive-state-code">FILTER // NULL // {module.archiveCode}</span>
    <span className="archive-empty-reticle" aria-hidden="true"/>
    <h2>No matching records</h2>
    <p>The archive received the request, but no records satisfy every active search term and filter.</p>
    <button type="button" className="archive-state-action" onClick={reset}>Clear active filters</button>
  </section>;
}
