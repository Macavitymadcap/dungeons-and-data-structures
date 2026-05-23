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
      includes: ["Slip past the guard", "Dungeons &amp; Data Structures"],
    },
    {
      path: "gamebook/debug/index.html",
      includes: [
        "Debug state",
        "Passage ID",
        "Encounter state",
        "authorMode",
      ],
    },
    {
      path: "gamebook/author/index.html",
      includes: [
        "Author Tools",
        "Graph validation",
        "Validation passed",
        "flowchart TD",
        "p_guardian_clash",
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

console.log(`Checked ${checked.length} static artifacts.`);
