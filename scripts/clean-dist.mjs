import { rm } from "node:fs/promises";

// `dist` is generated output. Remove it before every production build so a
// copied project can never retain content-hashed assets from an older release.
await rm("dist", { recursive: true, force: true });
