import type { ComponentType } from "react";

export type RawRecord = Record<string, unknown>;

export interface ReferenceRecord {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  source: string;
  description?: string;
  tags: string[];
  searchText: string;
  raw: RawRecord;
}

export interface FilterDefinition {
  id: string;
  label: string | ((category: ReferenceCategory) => string);
  allLabel: string | ((category: ReferenceCategory) => string);
  values: (record: ReferenceRecord) => string[];
  formatValue?: (value: string) => string;
}

export interface ReferenceCategory {
  id: string;
  label: string;
  description?: string;
}

export interface ReferenceData {
  records: ReferenceRecord[];
  categories: ReferenceCategory[];
  definitions: Record<string, string>;
  payload: RawRecord;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  singular: string;
  sector: "corerules" | "hacking" | "magic" | "equipment";
  kicker: string;
  subtitle: string;
  archiveCode: string;
  moduleCode: string;
  intro: string;
  listInstruction: string;
  listMeta: (record: ReferenceRecord) => string;
  filters: FilterDefinition[];
  defaultCategoryId?: string;
  Detail?: ComponentType<{ record: ReferenceRecord; data: ReferenceData; recordNumber: number }>;
}
