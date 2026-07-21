import { access, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const html = await readFile("dist/index.html", "utf8");
const references = Array.from(html.matchAll(/(?:src|href)="\/Shadowrun\/([^"?#]+)(?:[?#][^"]*)?"/g), (match) => match[1]);

if (!references.length) throw new Error("dist/index.html: no built assets were referenced");

for (const reference of references) {
  try {
    await access(join("dist", reference));
  } catch {
    throw new Error(`dist/index.html references missing file 'dist/${reference}'`);
  }
}

const entryScript = references.find((reference) => /assets\/index-[^/]+\.js$/.test(reference));
if (!entryScript) throw new Error("dist/index.html does not reference the application entry script");
const entryBytes = (await stat(join("dist", entryScript))).size;
if (entryBytes > 500_000) throw new Error(`Initial application script is ${entryBytes} bytes; the 500,000-byte regression budget was exceeded.`);

const builtAssets = await readdir(join("dist", "assets"));
const entryScripts = builtAssets.filter((asset) => /^index-.+\.js$/.test(asset));
const entryStyles = builtAssets.filter((asset) => /^index-.+\.css$/.test(asset));
const creationScripts = builtAssets.filter((asset) => /^CharacterCreationPage-.+\.js$/.test(asset));
const creationStyles = builtAssets.filter((asset) => /^CharacterCreationPage-.+\.css$/.test(asset));
if (entryScripts.length !== 1 || entryStyles.length !== 1) throw new Error("dist/assets contains stale entry bundles from an earlier build.");
if (creationScripts.length !== 1) throw new Error("Character Creation was not emitted as exactly one lazy JavaScript chunk.");
if (creationStyles.length !== 1) throw new Error("Character Creation styles were not emitted as exactly one page-scoped lazy chunk.");
if (references.some((reference) => reference.includes("CharacterCreationPage-"))) throw new Error("Character Creation was eagerly included in the initial document.");

console.log(`Verified ${references.length} built files and a ${entryBytes.toLocaleString("en-GB")}-byte lazy-loading entry bundle.`);
