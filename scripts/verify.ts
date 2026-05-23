import {
  createCommandGate,
  renderVerificationReport,
  runVerification,
} from "@macavitymadcap/hyper-dank-automation";

const results = await runVerification([
  createCommandGate("typecheck", "Type check", "bun", ["run", "typecheck"], "TypeScript"),
  createCommandGate("test", "Unit tests", "bun", ["test"], "Bun"),
  createCommandGate("build", "Static build", "bun", ["run", "build"], "Hyper-Dank static"),
  createCommandGate(
    "static-check",
    "Static artifact check",
    "bun",
    ["run", "static:check"],
    "Hyper-Dank static smoke",
  ),
  createCommandGate(
    "static-browser",
    "Static browser smoke",
    "bun",
    ["run", "test:static-gamebook"],
    "Playwright",
  ),
]);

console.log(renderVerificationReport(results));

if (results.some((result) => result.status === "fail")) {
  process.exit(1);
}
