import { cp, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Package the codecs, fallback fonts and their licenses alongside our same-origin worker.
// Versioned URLs keep the PDF.js runtime and its assets in sync after upgrades.
const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, "node_modules", "pdfjs-dist");
const { version } = JSON.parse(await readFile(path.join(source, "package.json"), "utf8"));
const target = path.join(root, "public", "pdfjs", version);
await mkdir(target, { recursive: true });
for (const directory of ["wasm", "standard_fonts"])
  await cp(path.join(source, directory), path.join(target, directory), { recursive: true });
