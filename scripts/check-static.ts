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
for (const forbidden of ["Debug state", "gamebook-force-passage", "authorMode"]) {
  if (gamebookHtml.includes(forbidden)) {
    throw new Error(`Published gamebook HTML included development-only text: ${forbidden}`);
  }
}

console.log(`Checked ${checked.length} static artifacts.`);
