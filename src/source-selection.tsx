import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sourceBooks } from "./data";

export const SOURCE_SELECTION_STORAGE_KEY = "shadowrun-reference-source-exclusions-v1";

export interface SourceBookOption {
  code: string;
  name: string;
}

interface SourceSelectionValue {
  availableSources: SourceBookOption[];
  excludedSources: string[];
  enabledSourceCount: number;
  isSourceEnabled: (source: string) => boolean;
  toggleSource: (source: string) => void;
  includeSource: (source: string) => void;
  registerSources: (sources: string[]) => void;
  enableAllSources: () => void;
  excludeAllSources: () => void;
}

const SourceSelectionContext = createContext<SourceSelectionValue | null>(null);

export function normaliseSourceCode(source: string): string {
  return String(source || "CRB").trim().toLocaleUpperCase("en-GB") || "CRB";
}

export function recordSourceCodes(source: string): string[] {
  const codes = String(source || "CRB")
    .split(/\s*(?:\/|,|;|\+)\s*/)
    .map(normaliseSourceCode)
    .filter(Boolean);
  return Array.from(new Set(codes.length ? codes : ["CRB"]));
}

export function parseSourceExclusions(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((item): item is string => typeof item === "string").map(normaliseSourceCode)));
  } catch {
    return [];
  }
}

export function sourceIsEnabled(source: string, excludedSources: readonly string[]): boolean {
  const sourceCode = normaliseSourceCode(source);
  return !excludedSources.some((excluded) => normaliseSourceCode(excluded) === sourceCode);
}

export const CORE_RULES_ALWAYS_VISIBLE_MODULES = new Set(["skills", "attributes", "priorityarray", "charactercreation"]);

export function sourceRecordIsVisible(moduleId: string, source: string, isSourceEnabled: (source: string) => boolean): boolean {
  return recordSourceCodes(source).some((sourceCode) =>
    (sourceCode === "CRB" && CORE_RULES_ALWAYS_VISIBLE_MODULES.has(moduleId)) || isSourceEnabled(sourceCode)
  );
}

function initialSourceCodes(): string[] {
  return Object.keys(sourceBooks).map(normaliseSourceCode);
}

function storedExclusions(): string[] {
  if (typeof window === "undefined") return [];
  return parseSourceExclusions(window.localStorage.getItem(SOURCE_SELECTION_STORAGE_KEY));
}

export function SourceSelectionProvider({ children }: { children: ReactNode }) {
  const [sourceCodes, setSourceCodes] = useState(initialSourceCodes);
  const [excludedSources, setExcludedSources] = useState(storedExclusions);

  const registerSources = useCallback((sources: string[]) => {
    const additions = sources.map(normaliseSourceCode).filter(Boolean);
    if (!additions.length) return;
    setSourceCodes((current) => {
      const next = Array.from(new Set([...current, ...additions]));
      return next.length === current.length ? current : next;
    });
  }, []);

  const includeSource = useCallback((source: string) => {
    const code = normaliseSourceCode(source);
    setExcludedSources((current) => current.includes(code) ? current.filter((item) => item !== code) : current);
  }, []);

  const toggleSource = useCallback((source: string) => {
    const code = normaliseSourceCode(source);
    registerSources([code]);
    setExcludedSources((current) => current.includes(code)
      ? current.filter((item) => item !== code)
      : [...current, code]);
  }, [registerSources]);

  const enableAllSources = useCallback(() => setExcludedSources([]), []);
  const excludeAllSources = useCallback(() => {
    setExcludedSources((current) => Array.from(new Set([...current, ...sourceCodes])));
  }, [sourceCodes]);

  useEffect(() => {
    window.localStorage.setItem(SOURCE_SELECTION_STORAGE_KEY, JSON.stringify(excludedSources));
  }, [excludedSources]);

  useEffect(() => {
    function synchroniseSelection(event: StorageEvent) {
      if (event.key === SOURCE_SELECTION_STORAGE_KEY) setExcludedSources(parseSourceExclusions(event.newValue));
    }
    window.addEventListener("storage", synchroniseSelection);
    return () => window.removeEventListener("storage", synchroniseSelection);
  }, []);

  const availableSources = useMemo<SourceBookOption[]>(() => sourceCodes.map((code) => ({
    code,
    name: sourceBooks[code] || code
  })), [sourceCodes]);
  const excludedSet = useMemo(() => new Set(excludedSources), [excludedSources]);
  const isSourceEnabled = useCallback((source: string) => !excludedSet.has(normaliseSourceCode(source)), [excludedSet]);
  const enabledSourceCount = availableSources.filter((source) => isSourceEnabled(source.code)).length;
  const value = useMemo<SourceSelectionValue>(() => ({
    availableSources,
    excludedSources,
    enabledSourceCount,
    isSourceEnabled,
    toggleSource,
    includeSource,
    registerSources,
    enableAllSources,
    excludeAllSources
  }), [availableSources, enabledSourceCount, excludedSources, isSourceEnabled, toggleSource, includeSource, registerSources, enableAllSources, excludeAllSources]);

  return <SourceSelectionContext.Provider value={value}>{children}</SourceSelectionContext.Provider>;
}

export function useSourceSelection(): SourceSelectionValue {
  const value = useContext(SourceSelectionContext);
  if (!value) throw new Error("useSourceSelection must be used inside SourceSelectionProvider.");
  return value;
}
