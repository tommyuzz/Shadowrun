import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ModulePage } from "./pages/ModulePage";
import { PriorityArrayPage } from "./pages/PriorityArrayPage";
import { SourceSelectionProvider } from "./source-selection";
import "../assets/css/shared.css";
import "./styles/original-pages.css";
import "../assets/css/responsive.css";
import "./styles/app.css";

const CharacterCreationPage = lazy(() => import("./pages/CharacterCreationPage").then((module) => ({ default: module.CharacterCreationPage })));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SourceSelectionProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/charactercreation/:stepId?" element={<Suspense fallback={<main className="loading-panel" aria-live="polite" aria-busy="true"><span className="loading-code">SYNC // BUILD // 5E</span><strong>Opening character builder…</strong></main>}><CharacterCreationPage /></Suspense>} />
          <Route path="/priorityarray" element={<PriorityArrayPage />} />
          <Route path="/:moduleId" element={<ModulePage />} />
          <Route path="/:moduleId/:categoryId" element={<ModulePage />} />
          <Route path="/:moduleId/:categoryId/:recordId" element={<ModulePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </SourceSelectionProvider>
  </StrictMode>
);
