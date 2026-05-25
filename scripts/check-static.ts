import { readFile } from "node:fs/promises";
import { smokeStaticSite } from "@macavitymadcap/hyper-dank-automation";

const checked = await smokeStaticSite({
  root: "dist",
  routes: [
    {
      path: "index.html",
      includes: [
        "Mt. Graphnor",
        "Entrance And Guardian",
        "hx-post=\"/gamebook/choices/fight-guard\"",
        "assets/hyper-dank-ui.css",
        "assets/client.js",
        "gamebook-new-game",
        "gamebook-reset",
        "gamebook-race",
        "gamebook-save-import",
        "gamebook-save-json",
        "Discoveries",
      ],
    },
    {
      path: "gamebook/index.html",
      includes: [
        "Slip past the guard",
        "Dungeons &amp; Data Structures",
      ],
    },
    {
      path: "assets/hyper-dank-ui.css",
      includes: ".app-shell",
    },
    {
      path: "assets/client.js",
      includes: "localStorage",
    },
  ],
});

const gamebookHtml = await readFile("dist/gamebook/index.html", "utf8");
const clientJs = await readFile("dist/assets/client.js", "utf8");
for (const forbidden of ["Debug state", "gamebook-force-passage", "authorMode", "mermaid"]) {
  for (const [label, content] of [
    ["gamebook HTML", gamebookHtml],
    ["client bundle", clientJs],
  ] as const) {
    if (content.includes(forbidden)) {
      throw new Error(`Published ${label} included development-only text: ${forbidden}`);
    }
  }
}

console.log(`Checked ${checked.length} static artifacts.`);
