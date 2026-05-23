import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { createApp } from "../src/app.tsx";

const outDir = "dist";
const app = createApp({ authorToolsEnabled: false });

await rm(outDir, { force: true, recursive: true });
await mkdir(`${outDir}/assets`, { recursive: true });
await mkdir(`${outDir}/gamebook`, { recursive: true });

await cp(
  "node_modules/@macavitymadcap/hyper-dank-ui/src/styles.css",
  `${outDir}/assets/hyper-dank-ui.css`,
);
await Bun.build({
  entrypoints: ["src/gamebook/player-client.ts"],
  minify: true,
  outdir: `${outDir}/assets`,
  target: "browser",
});

const gamebookResponse = await app.request("/gamebook");
const gamebookHtml = await gamebookResponse.text();

await writeFile(`${outDir}/index.html`, gamebookHtml);
await writeFile(`${outDir}/gamebook/index.html`, gamebookHtml);
await Bun.write(
  `${outDir}/assets/client.js`,
  Bun.file(`${outDir}/assets/player-client.js`),
);
await rm(`${outDir}/assets/player-client.js`);

console.log(`Built static gamebook to ${outDir}/`);
