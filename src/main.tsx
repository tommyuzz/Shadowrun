import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ModulePage } from "./pages/ModulePage";
import "../assets/css/shared.css";
import "./styles/original-pages.css";
import "../assets/css/responsive.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:moduleId" element={<ModulePage />} />
        <Route path="/:moduleId/:categoryId" element={<ModulePage />} />
        <Route path="/:moduleId/:categoryId/:recordId" element={<ModulePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);
