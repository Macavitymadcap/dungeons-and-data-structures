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
      ],
    },
    {
      path: "gamebook/index.html",
      includes: ["Slip past the guard", "Dungeons &amp; Data Structures"],
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
