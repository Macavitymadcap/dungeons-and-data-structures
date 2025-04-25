import * as esbuild from "npm:esbuild@0.20.2";
// Import the Wasm build on platforms where running subprocesses is not
// permitted, such as Deno Deploy, or when running without `--allow-run`.
// import * as esbuild from "https://deno.land/x/esbuild@0.20.2/wasm.js";

import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.1";

const entryPoints = [
    './src/algorithms/index.ts'
]

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: entryPoints,
//   minify: true,
  bundle: true,
  sourcemap: true,
  target: ['chrome58', 'firefox57', 'safari11', 'edge16'],
  outfile: "./public/static/script.js",
});

esbuild.stop();
