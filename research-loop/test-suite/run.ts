import { spawnSync } from "child_process";
import path from "path";

function runScript(scriptPath: string): boolean {
  console.log(`\n🚀 Running: ${path.relative(path.resolve(__dirname, "../.."), scriptPath)}`);
  const result = spawnSync("npx", ["tsx", scriptPath], {
    stdio: "inherit",
    shell: true,
  });
  return result.status === 0;
}

function main() {
  const target = process.argv[2];

  const parserPath = path.resolve(__dirname, "parser/run.ts");
  const dedupePath = path.resolve(__dirname, "dedupe/run.ts");

  if (!target || target === "all") {
    const parserOk = runScript(parserPath);
    const dedupeOk = runScript(dedupePath);
    if (!parserOk || !dedupeOk) {
      process.exit(1);
    }
  } else if (target === "parser") {
    const ok = runScript(parserPath);
    if (!ok) {
      process.exit(1);
    }
  } else if (target === "dedupe") {
    const ok = runScript(dedupePath);
    if (!ok) {
      process.exit(1);
    }
  } else {
    console.error(`Unknown target: ${target}`);
    console.log("Usage: npm run test:research [parser|dedupe|all]");
    process.exit(1);
  }
}

main();
