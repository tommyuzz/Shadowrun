import type { ReactNode } from "react";
import type { ModuleDefinition, RawRecord, ReferenceCategory, ReferenceData } from "../types";

const skillDescriptions: Record<string, string> = {
  all: "All active skills in the Shadowrun Fifth Edition Core Rulebook, collected into a single searchable index regardless of linked attribute.",
  agility: "Agility-linked skills cover precision, coordination, fine motor control, weapon handling, stealth, and other actions where physical dexterity is decisive.",
  body: "Body-linked skills cover physical resilience and bodily control when dealing with environmental hazards, pressure, weightlessness, and other demanding conditions.",
  charisma: "Charisma-linked skills govern influence, deception, leadership, negotiation, performance, etiquette, and other interactions with people or animals.",
  intuition: "Intuition-linked skills cover awareness, instinct, perception, pattern recognition, and quickly interpreting surroundings, tracks, disguises, or astral impressions.",
  logic: "Logic-linked skills cover analysis, engineering, medicine, chemistry, Matrix work, technical knowledge, and other tasks that depend on training and reasoning.",
  magic: "Magic-linked skills are used by Awakened characters to cast spells, counter magic, bind or banish spirits, create enchantments, and otherwise manipulate mana.",
  reaction: "Reaction-linked skills cover piloting and controlling vehicles in real time, where immediate responses, handling, and split-second corrections matter.",
  resonance: "Resonance-linked skills are used by technomancers to compile, register, and decompile sprites through their connection to the Resonance.",
  strength: "Strength-linked skills cover sustained muscular effort and physical propulsion, including running and swimming.",
  willpower: "Willpower-linked skills cover mental endurance and force of will in demanding tasks such as survival and astral combat."
};

const legends: Record<string, [string, string][]> = {
  attributes: [["BOD / AGI", "Physical resilience and coordination"], ["REA / STR", "Reflexes and muscular power"], ["WIL / LOG", "Resolve and analytical reasoning"], ["INT / CHA", "Instinct and force of personality"], ["EDG / ESS", "Luck and augmentation capacity"], ["MAG / RES", "Awakened or technomancer capability"]],
  metatypes: [["MIN", "Racial minimum"], ["MAX", "Natural maximum"], ["EDG", "Edge range"], ["ESS", "Base Essence"], ["WALK", "Walking rate"], ["RUN", "Running rate"]],
  qualities: [["TYPE", "General, Metagenic, Infected, or Lifestyle classification"], ["KARMA", "Listed purchase cost or awarded bonus"], ["RTG", "Rated quality with a maximum level"], ["OPTION", "Selectable variant, degree, or level"], ["×2", "Normal post-creation purchase or buy-off multiplier"]],
  lifestyles: [["PT", "Lifestyle points spent or adjusted"], ["¥ / MO", "Monthly nuyen cost or adjustment"], ["MIN", "Minimum lifestyle for a waived monthly cost"], ["+/−", "Positive or negative lifestyle option"], ["VAR", "Entry contains selectable configurations"]],
  priorityarray: [["A–E", "Each priority level is assigned exactly once"], ["SAP", "Special Attribute Points from Metatype"], ["ATTR", "Points assigned to the eight standard attributes"], ["MAG / RES", "Magic or Resonance rating and starting options"], ["SK / GRP", "Individual Skill Points and Skill Group Points"], ["¥", "Starting resources for the selected play level"]],
  cyberdecks: [["DR", "Device Rating"], ["ATT", "Attack"], ["SLZ", "Sleaze"], ["DP", "Data Processing"], ["FW", "Firewall"], ["PRG", "Running program capacity"]],
  sprites: [["L", "Sprite Level"], ["ATT", "Attack"], ["SLZ", "Sleaze"], ["DP", "Data Processing"], ["FW", "Firewall"], ["RES", "Resonance"], ["CM", "Matrix Condition Monitor"]],
  spells: [["M / P", "Mana / Physical spell type"], ["T", "Touch range"], ["LOS", "Line of sight"], ["(A)", "Area effect"], ["S / P", "Stun / Physical damage"], ["I / S / P", "Instant / Sustained / Permanent duration"], ["F", "Force used in Drain Value"]],
  adeptpowers: [["PP", "Power Points spent to purchase adept powers."], ["/ LVL", "Cost is paid for each level purchased."], ["ACT", "Power has a listed activation action."], ["INT", "Intrinsic power; no activation action is required."], ["DRN", "Adept Drain is normally Stun, resisted with Body + Willpower."]],
  rituals: [["F", "Ritual Force"], ["TIME", "Performance time"], ["DUR", "Effect duration"], ["AREA", "Area of effect"], ["LINK", "Mystic or material link"], ["SEAL", "Final sealing test"]],
  spirits: [["F", "Spirit Force"], ["BOD", "Body"], ["AGI", "Agility"], ["REA", "Reaction"], ["STR", "Strength"], ["INI", "Initiative"], ["AST", "Astral Initiative"]],
  drones: [["PIL", "Autonomous Pilot rating"], ["SNS", "Sensor array rating"], ["HDL", "Handling limit"], ["SPD", "Speed limit"], ["ACC", "Acceleration rating"], ["BDY / ARM", "Body and Armor ratings"]],
  equipment: [["¥", "Listed purchase cost"], ["R", "Restricted availability"], ["F", "Forbidden availability"], ["RTG", "Rating-dependent value"], ["CAP", "Accessory capacity"], ["ESS", "Essence cost"]]
};

const matrixActionLegend: [string, string][] = [["ACT", "Matrix action type"], ["MRK", "Marks required"], ["ATT", "Attack"], ["SLZ", "Sleaze"], ["DP", "Data Processing"], ["FW", "Firewall"]];
const complexFormLegend: [string, string][] = [["L", "Complex Form Level"], ["FAD", "Fading Value"], ["I", "Instant duration"], ["S", "Sustained duration"], ["P", "Permanent duration"], ["V", "Opposed test"]];

function payloadObject(data: ReferenceData, key: string): RawRecord {
  const value = data.payload[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawRecord : {};
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="panel category-panel"><div className="panel-inner"><h2 className="panel-heading"><span className="crosshair" aria-hidden="true"/>{title}</h2>{children}</div></section>;
}

function Legend({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return <section className="panel legend-panel"><div className="panel-inner"><h2 className="panel-heading"><span className="crosshair" aria-hidden="true"/>{title}</h2><dl className="legend-grid">{rows.map(([code, copy]) => <div className="legend-row" key={code}><dt>{code}</dt><dd>{copy}</dd></div>)}</dl></div></section>;
}

export function ModuleSidebar({ module, category, data }: { module: ModuleDefinition; category: ReferenceCategory; data: ReferenceData }) {
  const categories = payloadObject(data, "category");
  const subcategories = payloadObject(data, "subcategories");
  if (module.id === "skills") return <aside className="sidebar" aria-label="Skill attribute information"><section className="panel category-panel"><div className="panel-inner"><p className="panel-kicker">Linked attribute</p><h2>{category.id === "all" ? "All skills" : `${category.label} skills`}</h2><p className="category-description">{skillDescriptions[category.id] || category.description}</p></div></section></aside>;

  if (module.id === "weapons") return <aside className="sidebar" aria-label="Weapon archive information"><Panel title="Archive scope"><p className="protocol-copy">Core Rulebook melee weapons, projectile weapons, firearms, heavy weapons, grenades, rockets, and missiles. Ammunition and accessories are indexed separately.</p></Panel><Legend title="Weapon field key" rows={[["ACC", <><strong>Accuracy</strong> is the weapon&apos;s inherent limit for attack tests, before applicable modifications.</>], ["DV", <><strong>Damage Value</strong> is the weapon&apos;s base damage before net hits and other modifiers.</>], ["AP", <><strong>Armor Penetration</strong> modifies the Armor rating used for the Damage Resistance Test.</>], ["RC", <><strong>Recoil Compensation</strong> offsets recoil from firing multiple rounds. A value in parentheses is conditional.</>], ["MODE", <><strong>Firing Mode</strong>: SS is Single-Shot, SA is Semi-Automatic, BF is Burst Fire, and FA is Full Auto.</>]]}/></aside>;
  if (module.id === "vehicles") return <aside className="sidebar" aria-label="Vehicle archive information"><Panel title="Archive scope"><p className="protocol-copy">Core Rulebook groundcraft, watercraft and aircraft. Select category and subcategory tags for the relevant operating rules.</p></Panel><Legend title="Vehicle field key" rows={[["HAND", <><strong>Handling</strong> is the limit for manoeuvrability-focused Vehicle Tests.</>], ["SPD", <><strong>Speed</strong> measures movement and may limit speed-focused Vehicle Tests.</>], ["ACC", <><strong>Acceleration</strong> governs how quickly the vehicle changes speed.</>], ["BOD", <><strong>Body</strong> represents vehicle size, mass and structural resilience.</>], ["ARM", <><strong>Armor</strong> protects the vehicle against incoming damage.</>], ["PIL", <><strong>Pilot</strong> is the rating of the vehicle&apos;s built-in Pilot program.</>], ["SEN", <><strong>Sensor</strong> is the rating of the vehicle&apos;s sensor array.</>]]}/></aside>;

  let title = `${module.singular} protocol`;
  let copy = category.description || module.intro;
  let legendTitle = "Archive key";
  let rows: [string, ReactNode][] = legends[module.id] || [];
  let glitch = "";

  switch (module.id) {
    case "attributes": title = category.id === "all" ? "Attribute protocol" : `${category.label} attributes`; copy = category.id === "all" ? "Physical, Mental and Special Attributes define a runner's core capabilities, derived values, linked tests, and exceptional potential. Choose a category or filter by a commonly linked skill." : category.description || copy; legendTitle = "Attribute key"; break;
    case "metatypes": title = "Metatype protocol"; copy = String(categories.Metatypes || copy); legendTitle = "Attribute key"; break;
    case "qualities": title = category.id === "all" ? "Quality protocol" : category.label; copy = category.id === "all" ? "Positive and Negative Qualities define character advantages, complications, Karma values, requirements, ratings, selectable variants, and General, Metagenic, Infected, or Lifestyle classifications. Choose a category above, then use Quality Type to narrow the archive." : String(categories[category.label] || copy); legendTitle = "Quality key"; break;
    case "lifestyles": title = category.id === "all" ? "Lifestyle protocol" : category.label; copy = category.id === "all" ? "Configure lifestyle resources and lifestyle-wide options. Entertainment records cover assets, services, and outings; Lifestyle Options cover positive and negative modifiers, monthly adjustments, and restrictions." : String(categories[category.label] || copy); legendTitle = "Lifestyle key"; break;
    case "priorityarray": title = "Priority protocol"; copy = `${String(categories["Priority Array"] || copy)}<br><br>${String(categories["Play Levels"] || "")}`; legendTitle = "Creation key"; break;
    case "cyberdecks": title = category.label === "Cyberdecks" ? "Cyberdeck protocol" : "Software protocol"; copy = String(categories[category.label] || copy); legendTitle = "Matrix key"; break;
    case "matrixinteraction": title = category.label === "Matrix Actions" ? "Matrix action protocol" : "Complex form protocol"; copy = String(categories[category.label] || copy); legendTitle = category.label === "Matrix Actions" ? "Action key" : "Resonance key"; rows = category.label === "Matrix Actions" ? matrixActionLegend : complexFormLegend; break;
    case "sprites": title = "Sprite protocol"; copy = String(categories.Sprites || copy); legendTitle = "Resonance key"; break;
    case "spells": {
      const group = data.payload[category.id] as RawRecord | undefined;
      title = `${category.label} spell protocol`; copy = String(group?.description || copy); glitch = group?.glitches ? `<strong>Glitches:</strong> ${String(group.glitches)}` : ""; legendTitle = "Code index"; break;
    }
    case "adeptpowers": {
      const rules = payloadObject(data, "rules");
      title = "Adept Power Protocol"; copy = "Core adept powers and the general rules for purchasing, activating, and resisting Drain from adept powers."; glitch = `${String(rules["rating limit"] || "")}<br><br>${String(rules["adept drain"] || "")}`; legendTitle = "Power code index"; break;
    }
    case "rituals": title = "Ritual protocol"; copy = String(categories.Rituals || copy); legendTitle = "Procedure key"; break;
    case "spirits": title = "Spirit protocol"; copy = String(categories.Spirits || copy); legendTitle = "Force key"; break;
    case "drones": title = category.id === "all" ? "Drone protocol" : category.label; copy = category.id === "all" ? String(categories.Drones || copy) : String(subcategories[category.label] || copy); legendTitle = "Systems key"; break;
    case "equipment": title = category.id === "all" ? "Equipment market" : category.label; copy = category.id === "all" ? "Browse the complete procurement archive or select a market department above. Product rules and classifications are shown without altering the supplied catalogue data." : String(categories[category.label] || copy); legendTitle = "Market key"; break;
  }

  return <aside className="sidebar" aria-label={`${module.name} rules and notation`}><Panel title={title}><div className="category-description" dangerouslySetInnerHTML={{ __html: copy }}/>{glitch ? <div className="glitch-text" dangerouslySetInnerHTML={{ __html: glitch }}/> : null}</Panel>{rows.length ? <Legend title={legendTitle} rows={rows}/> : null}</aside>;
}

const footers: Record<string, [string, string, string]> = {
  skills: [">> LEARN. ADAPT. SURVIVE.\nKNOW THE RULES. CONTROL THE FIELD.", "The corporations own everything.\nInformation is power. Stay sharp.", "✦"],
  attributes: [">> MEASURE. TEST. ENDURE.\nKNOW THE RUNNER'S LIMITS.", "Ratings shape every dice pool.\nDerived values connect the system.", "Σ"],
  metatypes: [">> ORIGIN. APTITUDE. IDENTITY.\nDEFINE THE RUNNER.", "Natural limits shape potential.\nThey do not define the individual.", "⌁"],
  qualities: [">> CHOOSE. DEFINE. COMPLICATE.\nMAKE THE RUNNER DISTINCT.", "Every advantage has a cost.\nEvery complication creates a story.", "±"],
  lifestyles: [">> CONFIGURE. SECURE. MAINTAIN.\nMAKE THE SAFEHOUSE YOUR OWN.", "Comfort costs nuyen.\nEvery compromise leaves a trace.", "⌂"],
  priorityarray: [">> ASSIGN. BUILD. VERIFY.\nFIVE CHOICES. ONE RUNNER.", "Every category takes one priority.\nNo level may be assigned twice.", "Ⅴ"],
  cyberdecks: [">> JACK IN. CONFIGURE. EXECUTE.\nCONTROL THE GRID.", "Every action leaves a signature.\nWatch the overwatch score.", "⌁"],
  matrixinteraction: [">> ACCESS. EXECUTE. RESOLVE.\nLEAVE NO SIGNATURE.", "Every illegal action raises the score.\nKnow the test. Watch the grid.", "⌁"],
  sprites: [">> COMPILE. TASK. REGISTER.\nFOLLOW THE RESONANCE.", "Level shapes the entity.\nEvery service has a cost.", "⌁"],
  spells: [">> CAST. ADAPT. SURVIVE.\nKNOW THE RULES. CONTROL THE FIELD.", "The corporations own everything.\nInformation is power. Stay sharp.", "✦"],
  adeptpowers: [">> FOCUS. MOVE. TRANSCEND.\nCHANNEL THE MANA. CONTROL THE BODY.", "Power is discipline made manifest.\nKnow the cost before you commit.", "◇"],
  rituals: [">> GATHER. PREPARE. SEAL.\nSHAPE THE MANA.", "Every participant shares the Drain.\nProtect the foundation.", "⌁"],
  spirits: [">> SUMMON. BIND. COMMAND.\nHONOUR THE SERVICE.", "Force shapes the manifestation.\nThe metaplanes remember.", "⌁"],
  weapons: [">> SELECT. SIGHT. SURVIVE.\nKNOW YOUR RANGE. CONTROL THE FIELD.", "Every weapon leaves a signature.\nChoose the right tool. Leave clean.", "⌁"],
  vehicles: [">> ROUTE. RIG. RUN.\nCONTROL THE LANE. OWN THE ESCAPE.", "Every route leaves telemetry.\nKeep moving. Change vectors.", "⌁"],
  drones: [">> LINK. TASK. EXECUTE.\nKEEP THE FEED CLEAN.", "Autonomy is conditional.\nMaintain command authority.", "⌁"],
  equipment: [">> BROWSE. VERIFY. ACQUIRE.\nNO QUESTIONS. NO RETURNS.", "Catalogue data is not a warranty.\nCheck legality before procurement.", "⌁"]
};

function Lines({ value }: { value: string }) {
  const [first, second] = value.split("\n");
  return <>{first}<br/>{second}</>;
}

export function ModuleFooter({ moduleId }: { moduleId: string }) {
  const [copy, warning, sigil] = footers[moduleId];
  return <footer><div className="footer-frame"><div className="footer-bars" aria-hidden="true"/><div className="footer-copy"><Lines value={copy}/></div><div className="footer-warning"><Lines value={warning}/></div><span className="sigil" aria-hidden="true">{sigil}</span></div></footer>;
}
