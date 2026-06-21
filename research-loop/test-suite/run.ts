import { spawnSync } from "child_process";
import * as fs from "fs";
import path from "path";
import { buildLatestMetricsReport, relativeArtifactPath } from "./shared/report-utils";
import { CombinedLatestMetrics, NormalizedLatestMetrics } from "./shared/types";

function runScript(scriptPath: string): boolean {
  console.log(`\n?? Running: ${path.relative(path.resolve(__dirname, "../.."), scriptPath)}`);
  const result = spawnSync("npx", ["tsx", scriptPath], {
    stdio: "inherit",
    shell: true,
  });
  return result.status === 0;
}

function readLatestMetrics<TMetrics = Record<string, unknown>, TFailureBuckets = Record<string, unknown>>(
  filePath: string
): NormalizedLatestMetrics<TMetrics, TFailureBuckets> {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as NormalizedLatestMetrics<TMetrics, TFailureBuckets>;
}

function writeCombinedLatestMetrics(): string {
  const rootReportsDir = path.resolve(__dirname, "reports");
  if (!fs.existsSync(rootReportsDir)) {
    fs.mkdirSync(rootReportsDir, { recursive: true });
  }

  const parserLatestMetricsPath = path.resolve(__dirname, "parser", "reports", "latest-metrics.json");
  const dedupeLatestMetricsPath = path.resolve(__dirname, "dedupe", "reports", "latest-metrics.json");
  const combinedLatestMetricsPath = path.resolve(rootReportsDir, "latest-metrics.json");

  const parser = readLatestMetrics<{ overallAccuracy?: number }>(parserLatestMetricsPath);
  const dedupe = readLatestMetrics<{
    dedupePrecision?: number;
    dedupeRecall?: number;
    pairwiseFP?: number;
  }>(dedupeLatestMetricsPath);

  const combinedReport: CombinedLatestMetrics = {
    ...buildLatestMetricsReport({
      suite: "all",
      status: parser.status === "PASS" && dedupe.status === "PASS" ? "PASS" : "FAIL",
      metrics: {
        parserAccuracy: Number(parser.metrics.overallAccuracy ?? 0),
        dedupePrecision: Number(dedupe.metrics.dedupePrecision ?? 0),
        dedupeRecall: Number(dedupe.metrics.dedupeRecall ?? 0),
        falseMerge: Number(dedupe.metrics.pairwiseFP ?? 0),
      },
      failureBuckets: {
        parser: parser.failureBuckets,
        dedupe: dedupe.failureBuckets,
      },
      artifacts: {
        latestMetrics: relativeArtifactPath(__dirname, combinedLatestMetricsPath),
        parserLatestMetrics: relativeArtifactPath(__dirname, parserLatestMetricsPath),
        dedupeLatestMetrics: relativeArtifactPath(__dirname, dedupeLatestMetricsPath),
      },
      timestamp: new Date().toISOString(),
    }),
    suite: "all",
    parser,
    dedupe,
  };

  fs.writeFileSync(combinedLatestMetricsPath, JSON.stringify(combinedReport, null, 2) + "\n", "utf8");
  return combinedLatestMetricsPath;
}

function main() {
  const target = process.argv[2];

  const parserPath = path.resolve(__dirname, "parser/run.ts");
  const dedupePath = path.resolve(__dirname, "dedupe/run.ts");

  if (!target || target === "all") {
    const parserOk = runScript(parserPath);
    const dedupeOk = runScript(dedupePath);
    if (parserOk && dedupeOk) {
      const combinedPath = writeCombinedLatestMetrics();
      console.log(`\n?? Saved combined latest-metrics.json to ${combinedPath}`);
    }
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
