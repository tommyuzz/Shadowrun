import type { ReferenceCategory, ReferenceRecord } from "./types";

export interface PagePresentation {
  pageClass: string;
  workspaceClass: string;
  panelClass: string;
  listViewClass?: string;
  recordViewClass?: string;
  headerClass: string;
  listHeaderClass: string;
  recordHeaderClass: string;
  filtersClass: string;
  filterFieldClass?: string;
  summaryClass: string;
  listClass: string;
  itemClass: string;
  indexClass: string;
  nameClass: string;
  metaClass: string;
  tabsClass?: string;
  searchLabel: string;
  searchPlaceholder: string;
  listTitle: (category: ReferenceCategory) => string;
  listEyebrow: (category: ReferenceCategory) => string;
  recordEyebrow: (record: ReferenceRecord) => string;
  indexPrefix: (category: ReferenceCategory) => string;
  tagButtonClass: string;
  tagDetailClass: string;
  tagDetailTitleClass: string;
  tagDetailCopyClass?: string;
  backLabel?: string;
  tabLabel?: (category: ReferenceCategory) => string;
}

const allTitle = (category: ReferenceCategory, noun: string) => category.id === "all" ? `All ${noun}` : category.label;
const archiveEyebrow = (category: ReferenceCategory, noun: string) => `${category.id === "all" ? "Complete archive" : `${category.label} archive`} // ${noun} list`;

export const presentations: Record<string, PagePresentation> = {
  skills: {
    pageClass: "page-skills", workspaceClass: "workspace", panelClass: "skill-panel", listViewClass: "skill-list-view", recordViewClass: "skill-record-view",
    headerClass: "skill-header", listHeaderClass: "skill-list-header", recordHeaderClass: "skill-record-header", filtersClass: "skill-list-filters", filterFieldClass: "skill-filter-field",
    summaryClass: "skill-list-summary", listClass: "skill-list", itemClass: "skill-list-item", indexClass: "list-index", nameClass: "skill-list-name", metaClass: "skill-list-group",
    searchLabel: "Search all skill fields", searchPlaceholder: "Enter skill, test, rule or attribute…",
    listTitle: (c) => c.id === "all" ? "All skills" : `${c.label} skills`, listEyebrow: (c) => c.id === "all" ? "Complete archive // Skill list" : `${c.label} protocol // Skill list`,
    recordEyebrow: (r) => `${r.category} protocol // Skill record`, indexPrefix: () => "SK", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title", tagDetailCopyClass: "tag-detail-copy", tabLabel: (c) => c.id === "all" ? "All Skills" : c.label
  },
  metatypes: {
    pageClass: "page-metatypes", workspaceClass: "workspace metatype-workspace", panelClass: "metatype-panel", headerClass: "metatype-header", listHeaderClass: "metatype-list-header", recordHeaderClass: "metatype-record-header",
    filtersClass: "metatype-filters", summaryClass: "metatype-list-summary", listClass: "metatype-list", itemClass: "metatype-list-item", indexClass: "metatype-list-index", nameClass: "metatype-list-name", metaClass: "metatype-list-value",
    searchLabel: "Search all metatype fields", searchPlaceholder: "Enter name, trait or attribute…", listTitle: () => "Metatypes", listEyebrow: () => "Population archive // Metatype list", recordEyebrow: () => "Demographic record // Metatype profile",
    indexPrefix: () => "MT", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title"
  },
  qualities: {
    pageClass: "page-qualities", workspaceClass: "workspace", panelClass: "quality-panel", listViewClass: "quality-list-view", recordViewClass: "quality-record-view",
    headerClass: "reference-header quality-header", listHeaderClass: "reference-list-header quality-list-header", recordHeaderClass: "reference-record-header quality-record-header", filtersClass: "quality-filters", filterFieldClass: "quality-filter-field",
    summaryClass: "reference-list-summary quality-list-summary", listClass: "reference-list quality-list", itemClass: "reference-list-item quality-list-item", indexClass: "reference-list-index quality-list-index", nameClass: "reference-list-name quality-list-name", metaClass: "reference-list-meta quality-list-value", tabsClass: "quality-tabs",
    searchLabel: "Search all quality fields", searchPlaceholder: "Enter name, type, effect, Karma or variant…", listTitle: (c) => c.id === "all" ? "All qualities" : c.label, listEyebrow: (c) => archiveEyebrow(c, "Quality"), recordEyebrow: (r) => `${r.category} // Character quality record`,
    indexPrefix: (c) => c.id === "positive-qualities" ? "PQ" : c.id === "negative-qualities" ? "NQ" : "QL", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title", tagDetailCopyClass: "tag-detail-copy", backLabel: "Back to quality index", tabLabel: (c) => c.id === "all" ? "All Qualities" : c.label
  },
  lifestyles: {
    pageClass: "page-lifestyles", workspaceClass: "workspace", panelClass: "lifestyle-panel", listViewClass: "lifestyle-list-view", recordViewClass: "lifestyle-record-view",
    headerClass: "reference-header lifestyle-header", listHeaderClass: "reference-list-header lifestyle-list-header", recordHeaderClass: "reference-record-header lifestyle-record-header", filtersClass: "lifestyle-filters", filterFieldClass: "lifestyle-filter-field",
    summaryClass: "reference-list-summary lifestyle-list-summary", listClass: "reference-list lifestyle-list", itemClass: "reference-list-item lifestyle-list-item", indexClass: "reference-list-index lifestyle-list-index", nameClass: "reference-list-name lifestyle-list-name", metaClass: "reference-list-meta lifestyle-list-value", tabsClass: "lifestyle-tabs",
    searchLabel: "Search all lifestyle fields", searchPlaceholder: "Enter name, benefit, cost, lifestyle or restriction…", listTitle: (c) => c.id === "all" ? "Lifestyle extras" : c.label, listEyebrow: (c) => archiveEyebrow(c, "Lifestyle"), recordEyebrow: (r) => `${r.category} // ${r.subcategory || "Lifestyle"} record`,
    indexPrefix: (c) => c.id === "entertainment" ? "EX" : c.id === "lifestyle-options" ? "LO" : "LS", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title", tagDetailCopyClass: "tag-detail-copy", backLabel: "Back to lifestyle index", tabLabel: (c) => c.id === "all" ? "All Records" : c.label
  },
  cyberdecks: {
    pageClass: "page-cyberdecks", workspaceClass: "workspace", panelClass: "matrix-panel", headerClass: "matrix-header", listHeaderClass: "matrix-list-header", recordHeaderClass: "matrix-record-header", filtersClass: "matrix-filters",
    summaryClass: "matrix-list-summary", listClass: "matrix-list", itemClass: "matrix-list-item", indexClass: "matrix-list-index", nameClass: "matrix-list-name", metaClass: "matrix-list-cost", tabsClass: "matrix-tabs",
    searchLabel: "Search all catalogue fields", searchPlaceholder: "Enter name, rating, effect or cost…", listTitle: (c) => c.label, listEyebrow: (c) => `${c.label === "Cyberdecks" ? "Hardware archive" : "Software archive"} // ${c.label} list`, recordEyebrow: (r) => `${r.category} archive // Record`,
    indexPrefix: (c) => c.label === "Cyberdecks" ? "CD" : "SW", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title"
  },
  matrixinteraction: {
    pageClass: "page-matrixinteraction", workspaceClass: "workspace", panelClass: "interaction-panel", headerClass: "interaction-header", listHeaderClass: "interaction-list-header", recordHeaderClass: "interaction-record-header", filtersClass: "interaction-filters",
    summaryClass: "interaction-list-summary", listClass: "interaction-list", itemClass: "interaction-list-item", indexClass: "interaction-list-index", nameClass: "interaction-list-name", metaClass: "interaction-list-value", tabsClass: "interaction-tabs",
    searchLabel: "Search all interaction fields", searchPlaceholder: "Enter name, test, target or action…", listTitle: (c) => c.label, listEyebrow: (c) => `${c.label === "Matrix Actions" ? "Matrix protocol" : "Resonance protocol"} // ${c.label} list`, recordEyebrow: (r) => r.category === "Matrix Actions" ? "Matrix action // Execution record" : "Resonance protocol // Complex form",
    indexPrefix: (c) => c.label === "Matrix Actions" ? "MA" : "CF", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title"
  },
  sprites: {
    pageClass: "page-sprites", workspaceClass: "workspace sprite-workspace", panelClass: "sprite-panel", headerClass: "sprite-header", listHeaderClass: "sprite-list-header", recordHeaderClass: "sprite-record-header", filtersClass: "sprite-filters",
    summaryClass: "sprite-list-summary", listClass: "sprite-list", itemClass: "sprite-list-item", indexClass: "sprite-list-index", nameClass: "sprite-list-name", metaClass: "sprite-list-value",
    searchLabel: "Search all sprite fields", searchPlaceholder: "Enter name, power, skill or attribute…", listTitle: () => "Sprites", listEyebrow: () => "Resonance archive // Sprite list", recordEyebrow: () => "Compiled entity // Sprite record",
    indexPrefix: () => "SR", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title"
  },
  spells: {
    pageClass: "page-spells", workspaceClass: "workspace", panelClass: "spell-panel", listViewClass: "spell-list-view", recordViewClass: "spell-record-view", headerClass: "spell-header", listHeaderClass: "spell-list-header", recordHeaderClass: "",
    filtersClass: "spell-list-search", filterFieldClass: "spell-filter-field", summaryClass: "spell-list-summary", listClass: "spell-list", itemClass: "spell-list-item", indexClass: "spell-list-index", nameClass: "spell-list-name", metaClass: "spell-list-drain",
    searchLabel: "Search all spell fields", searchPlaceholder: "Enter spell, keyword, effect or statistic…", listTitle: (c) => `${c.label} spells`, listEyebrow: (c) => `${c.label} protocol // Spell list`, recordEyebrow: (r) => `${r.category} protocol // Spell record`,
    indexPrefix: () => "SP", tagButtonClass: "keyword-toggle", tagDetailClass: "keyword-detail", tagDetailTitleClass: "keyword-detail-title", tagDetailCopyClass: "keyword-detail-copy"
  },
  adeptpowers: {
    pageClass: "page-adeptpowers", workspaceClass: "workspace", panelClass: "power-panel", listViewClass: "power-list-view", recordViewClass: "power-record-view", headerClass: "power-header", listHeaderClass: "power-list-header", recordHeaderClass: "",
    filtersClass: "power-list-search", filterFieldClass: "power-filter-field", summaryClass: "power-list-summary", listClass: "power-list", itemClass: "power-list-item", indexClass: "power-list-index", nameClass: "power-list-name", metaClass: "power-list-meta",
    searchLabel: "Search all power fields", searchPlaceholder: "Enter power, rule, cost or effect…", listTitle: () => "Adept powers", listEyebrow: () => "Adept archive // Core adept powers", recordEyebrow: () => "Adept archive // Power record",
    indexPrefix: () => "AP", tagButtonClass: "keyword-toggle", tagDetailClass: "keyword-detail", tagDetailTitleClass: "keyword-detail-title", tagDetailCopyClass: "keyword-detail-copy"
  },
  rituals: {
    pageClass: "page-rituals", workspaceClass: "workspace ritual-workspace", panelClass: "ritual-panel", headerClass: "ritual-header", listHeaderClass: "ritual-list-header", recordHeaderClass: "ritual-record-header", filtersClass: "ritual-filters",
    summaryClass: "ritual-list-summary", listClass: "ritual-list", itemClass: "ritual-list-item", indexClass: "ritual-list-index", nameClass: "ritual-list-name", metaClass: "ritual-list-value",
    searchLabel: "Search all ritual fields", searchPlaceholder: "Enter ritual, keyword, duration or rule…", listTitle: () => "Rituals", listEyebrow: () => "Ceremonial archive // Ritual list", recordEyebrow: () => "Ritual spellcasting // Procedure record",
    indexPrefix: () => "RT", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title"
  },
  spirits: {
    pageClass: "page-spirits", workspaceClass: "workspace spirit-workspace", panelClass: "spirit-panel", headerClass: "spirit-header", listHeaderClass: "spirit-list-header", recordHeaderClass: "spirit-record-header", filtersClass: "spirit-filters",
    summaryClass: "spirit-list-summary", listClass: "spirit-list", itemClass: "spirit-list-item", indexClass: "spirit-list-index", nameClass: "spirit-list-name", metaClass: "spirit-list-value",
    searchLabel: "Search all spirit fields", searchPlaceholder: "Enter name, power, skill or formula…", listTitle: () => "Spirits", listEyebrow: () => "Metaplane archive // Spirit list", recordEyebrow: () => "Conjuring protocol // Spirit record",
    indexPrefix: () => "ST", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title"
  },
  weapons: {
    pageClass: "page-weapons", workspaceClass: "workspace", panelClass: "weapon-panel", listViewClass: "weapon-list-view", recordViewClass: "weapon-record-view", headerClass: "reference-header", listHeaderClass: "reference-list-header weapon-header weapon-list-header", recordHeaderClass: "reference-record-header weapon-header",
    filtersClass: "weapon-filters", filterFieldClass: "weapon-filter-field", summaryClass: "reference-list-summary weapon-list-summary", listClass: "reference-list weapon-list", itemClass: "reference-list-item weapon-list-item", indexClass: "reference-list-index list-index", nameClass: "reference-list-name weapon-list-name", metaClass: "reference-list-meta weapon-list-value", tabsClass: "weapon-tabs",
    searchLabel: "Search all weapon fields", searchPlaceholder: "Enter weapon, skill, damage or feature…", listTitle: (c) => allTitle(c, "weapons"), listEyebrow: (c) => archiveEyebrow(c, "Weapon"), recordEyebrow: (r) => `${r.category} protocol // Weapon record`,
    indexPrefix: () => "WP", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title", tagDetailCopyClass: "tag-detail-copy", tabLabel: (c) => c.id === "all" ? "All" : c.label
  },
  vehicles: {
    pageClass: "page-vehicles", workspaceClass: "workspace", panelClass: "vehicle-panel", listViewClass: "vehicle-list-view", recordViewClass: "vehicle-record-view", headerClass: "reference-header", listHeaderClass: "reference-list-header vehicle-header vehicle-list-header", recordHeaderClass: "reference-record-header vehicle-header",
    filtersClass: "vehicle-filters", filterFieldClass: "vehicle-filter-field", summaryClass: "reference-list-summary vehicle-list-summary", listClass: "reference-list vehicle-list", itemClass: "reference-list-item vehicle-list-item", indexClass: "reference-list-index list-index", nameClass: "reference-list-name vehicle-list-name", metaClass: "reference-list-meta vehicle-list-value", tabsClass: "vehicle-tabs",
    searchLabel: "Search all vehicle fields", searchPlaceholder: "Enter vehicle, skill, rating or model…", listTitle: (c) => allTitle(c, "vehicles"), listEyebrow: (c) => archiveEyebrow(c, "Vehicle"), recordEyebrow: (r) => `${r.category} protocol // Vehicle record`,
    indexPrefix: () => "VH", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title", tagDetailCopyClass: "tag-detail-copy", tabLabel: (c) => c.id === "all" ? "All Vehicles" : c.label
  },
  drones: {
    pageClass: "page-drones", workspaceClass: "workspace", panelClass: "drone-panel", headerClass: "drone-header", listHeaderClass: "list-header", recordHeaderClass: "record-header", filtersClass: "filter-panel filter-panel--drone",
    summaryClass: "list-summary", listClass: "record-list drone-list", itemClass: "drone-list-item", indexClass: "drone-list-index", nameClass: "drone-list-name", metaClass: "drone-list-detail", tabsClass: "drone-tabs",
    searchLabel: "Search all drone fields", searchPlaceholder: "Enter drone, system, skill or rating…", listTitle: (c) => c.id === "all" ? "All drones" : c.label, listEyebrow: (c) => archiveEyebrow(c, "Drone"), recordEyebrow: (r) => `${r.subcategory} // Drone system record`,
    indexPrefix: () => "DR", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title", tabLabel: (c) => ({ all: "All", microdrones: "Micro", minidrones: "Mini", "small-drones": "Small", "medium-drones": "Medium", "large-drones": "Large" })[c.id] || c.label
  },
  equipment: {
    pageClass: "page-equipment", workspaceClass: "workspace", panelClass: "equipment-panel", headerClass: "equipment-header", listHeaderClass: "equipment-list-header", recordHeaderClass: "equipment-record-header", filtersClass: "equipment-filters",
    summaryClass: "equipment-list-summary", listClass: "equipment-list", itemClass: "equipment-list-item", indexClass: "equipment-list-index", nameClass: "equipment-list-name", metaClass: "equipment-list-price", tabsClass: "equipment-tabs",
    searchLabel: "Search all product fields", searchPlaceholder: "Enter product, specification, effect or cost…", listTitle: (c) => c.id === "all" ? "All equipment" : c.label, listEyebrow: (c) => `${c.id === "all" ? "Complete catalogue" : `${c.label} department`} // Product list`, recordEyebrow: (r) => `${r.category} // Market listing`,
    indexPrefix: () => "EQ", tagButtonClass: "tag-toggle", tagDetailClass: "tag-detail", tagDetailTitleClass: "tag-detail-title", backLabel: "Back to catalogue"
  }
};

export const titleCase = (value: unknown): string => String(value ?? "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function valueText(value: unknown, fallback = "—"): string {
  return value == null || value === "" ? fallback : String(value);
}
