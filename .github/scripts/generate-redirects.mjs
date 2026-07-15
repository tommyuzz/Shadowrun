import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const modules = ["adeptpowers", "cyberdecks", "drones", "equipment", "lifestyles", "matrixinteraction", "metatypes", "priorityarray", "qualities", "rituals", "skills", "spells", "spirits", "sprites", "vehicles", "weapons"];
const singleCategory = { adeptpowers: "adept-powers", metatypes: "metatypes", rituals: "rituals", spirits: "spirits", sprites: "sprites" };

const slugger = `function slug(value){return String(value||'').normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;

for (const moduleId of modules) {
  const path = join("public", moduleId, `${moduleId}.html`);
  await mkdir(dirname(path), { recursive: true });
  const fixedCategory = singleCategory[moduleId] || "";
  await writeFile(path, `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Opening Shadowrun archive…</title><script>${slugger};var parts=location.hash.slice(1).split('/').filter(Boolean).map(decodeURIComponent).map(slug);var fixed='${fixedCategory}';if(fixed&&parts.length){parts=[fixed,parts[parts.length-1]===fixed?'':parts[parts.length-1]].filter(Boolean)}location.replace('../index.html#/${moduleId}'+(parts.length?'/'+parts.join('/'):'') );</script></head><body><p>Opening the updated Shadowrun archive…</p></body></html>\n`);
}

await mkdir("public", { recursive: true });
await writeFile("public/shadowrunhome.html", `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Opening Shadowrun archive…</title><script>var sector=location.hash.slice(1);location.replace('./index.html#/'+(sector?'?sector='+encodeURIComponent(sector):''));</script></head><body><p>Opening the updated Shadowrun archive…</p></body></html>\n`);
