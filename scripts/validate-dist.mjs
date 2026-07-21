import { access, readFile } from "node:fs/promises";
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

console.log(`Verified ${references.length} built files referenced by dist/index.html.`);
