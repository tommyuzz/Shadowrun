import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "src/styles/original-pages.css");
const pages = [
  ["home", "home.css"],
  ["skills", "skills.css"],
  ["metatypes", "metatypes.css"],
  ["qualities", "qualities.css"],
  ["lifestyles", "lifestyles.css"],
  ["priorityarray", "priority-array.css"],
  ["cyberdecks", "cyberdecks.css"],
  ["matrixinteraction", "matrixinteraction.css"],
  ["sprites", "sprites.css"],
  ["spells", "spells.css"],
  ["adeptpowers", "adept-powers.css"],
  ["rituals", "rituals.css"],
  ["spirits", "spirits.css"],
  ["weapons", "weapons.css"],
  ["vehicles", "vehicles.css"],
  ["drones", "drones.css"],
  ["equipment", "equipment.css"]
];

function withinKeyframes(rule) {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) return true;
    parent = parent.parent;
  }
  return false;
}

function scopeSelector(selector, scope) {
  if (selector.startsWith(scope)) return selector;
  if (/^:root\b/.test(selector)) return selector.replace(/^:root\b/, scope);
  if (/^html\b/.test(selector)) return selector.replace(/^html\b/, scope);
  if (/^body\b/.test(selector)) return selector.replace(/^body\b/, `body:has(${scope})`);
  return `${scope} ${selector}`;
}

const sections = ["/* Generated from assets/css/pages by scripts/scope-page-styles.mjs. */"];

for (const [id, file] of pages) {
  const input = path.join(root, "assets/css/pages", file);
  const css = await fs.readFile(input, "utf8");
  const tree = postcss.parse(css, { from: input });
  const scope = `.page-${id}`;
  tree.walkRules((rule) => {
    if (withinKeyframes(rule)) return;
    rule.selectors = rule.selectors.map((selector) => scopeSelector(selector, scope));
  });
  sections.push(`\n/* ${file} */\n${tree.toString()}`);
}

await fs.writeFile(output, `${sections.join("\n")}\n`, "utf8");
console.log(`Generated ${path.relative(root, output)} from ${pages.length} original page stylesheets.`);
