import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

function extractMetric(stdout: string, label: string): number {
  const regex = new RegExp(`${label}:\\s*([\\d.]+)%?`, "i");
  const match = stdout.match(regex);
  if (!match) {
    throw new Error(`Failed to find metric for: ${label}`);
  }
  return parseFloat(match[1]);
}

function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  const baselinePath = path.resolve(projectRoot, "research-loop/autoresearch/baseline.json");
  const latestMetricsPath = path.resolve(projectRoot, "research-loop/autoresearch/latest-metrics.json");
  const tsvPath = path.resolve(projectRoot, "research-loop/autoresearch/results.tsv");

  // 1. Read autoresearch/baseline.json
  if (!fs.existsSync(baselinePath)) {
    console.error(`Baseline file not found at ${baselinePath}`);
    process.exit(1);
  }
  const baselineContent = fs.readFileSync(baselinePath, "utf8");
  const baseline = JSON.parse(baselineContent);

  let stdout = "";
  try {
    // 2. Run npm run parser:test
    console.log("Running parser tests...");
    stdout = execSync("npm run parser:test", { cwd: projectRoot, encoding: "utf8" });
    console.log(stdout);
  } catch (error: any) {
    console.error("Parser tests failed to run or exited with error.");
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());

    // 7. If REVERT, run git restore src/features/sms-parser
    console.log("REVERT");
    try {
      execSync("git restore src/features/sms-parser", { cwd: projectRoot, stdio: "inherit" });
      console.log("Restored src/features/sms-parser");
    } catch (restoreErr) {
      console.error("Failed to restore parser directory:", restoreErr);
    }
    process.exit(1);
  }

  // 3. Read latest metrics output JSON
  let latestMetrics: any;
  try {
    latestMetrics = {
      overallAccuracy: extractMetric(stdout, "Overall Accuracy"),
      detectionAccuracy: extractMetric(stdout, "Detection Accuracy"),
      typeAccuracy: extractMetric(stdout, "Type Accuracy"),
      amountAccuracy: extractMetric(stdout, "Amount Accuracy"),
      merchantAccuracy: extractMetric(stdout, "Merchant Accuracy"),
      accountAccuracy: extractMetric(stdout, "Account Accuracy"),
      falsePositiveRate: extractMetric(stdout, "False Positive Rate"),
      falseNegativeRate: extractMetric(stdout, "False Negative Rate"),
    };

    // Write to latest-metrics.json
    fs.writeFileSync(latestMetricsPath, JSON.stringify(latestMetrics, null, 2) + "\n", "utf8");
    console.log(`Saved latest metrics to ${latestMetricsPath}`);
  } catch (parseErr: any) {
    console.error("Failed to parse metrics from test output:", parseErr.message);
    console.log("REVERT");
    try {
      execSync("git restore src/features/sms-parser", { cwd: projectRoot, stdio: "inherit" });
      console.log("Restored src/features/sms-parser");
    } catch (restoreErr) {
      console.error("Failed to restore parser directory:", restoreErr);
    }
    process.exit(1);
  }

  // 4. Compare with baseline
  const isKeep = latestMetrics.overallAccuracy >= baseline.overallAccuracy;

  console.log("\n--- Comparison Summary ---");
  console.log(`Metric\t\t\tBaseline\tCurrent`);
  console.log(`Overall Accuracy:\t${baseline.overallAccuracy}%\t\t${latestMetrics.overallAccuracy}%`);
  console.log(`Detection Accuracy:\t${baseline.detectionAccuracy}%\t\t${latestMetrics.detectionAccuracy}%`);
  console.log(`Type Accuracy:\t\t${baseline.typeAccuracy}%\t\t${latestMetrics.typeAccuracy}%`);
  console.log(`Amount Accuracy:\t${baseline.amountAccuracy}%\t\t${latestMetrics.amountAccuracy}%`);
  console.log(`Merchant Accuracy:\t${baseline.merchantAccuracy}%\t\t${latestMetrics.merchantAccuracy}%`);
  console.log(`Account Accuracy:\t${baseline.accountAccuracy}%\t\t${latestMetrics.accountAccuracy}%`);
  console.log(`False Positive Rate:\t${baseline.falsePositiveRate}%\t\t${latestMetrics.falsePositiveRate}%`);
  console.log(`False Negative Rate:\t${baseline.falseNegativeRate}%\t\t${latestMetrics.falseNegativeRate}%`);
  console.log("--------------------------\n");

  // 5. Print KEEP or REVERT
  if (isKeep) {
    console.log("KEEP");

    // 6. If KEEP, update results.tsv
    try {
      let note = process.argv[2];
      if (!note) {
        try {
          note = execSync("git log -1 --pretty=%s", { cwd: projectRoot, encoding: "utf8" }).trim();
          note = note.replace(/^parser:\s*/i, "");
        } catch (gitErr) {
          note = "improvement";
        }
      }

      if (fs.existsSync(tsvPath)) {
        const tsvContent = fs.readFileSync(tsvPath, "utf8");
        const lines = tsvContent.trim().split(/\r?\n/);
        const lastLine = lines[lines.length - 1];
        const parts = lastLine.split("\t");
        const lastRound = parseInt(parts[0], 10);
        const nextRound = isNaN(lastRound) ? 0 : lastRound + 1;

        const newLine = [
          nextRound,
          latestMetrics.overallAccuracy.toFixed(2),
          latestMetrics.merchantAccuracy.toFixed(2),
          latestMetrics.falsePositiveRate.toFixed(2),
          latestMetrics.falseNegativeRate.toFixed(2),
          note
        ].join("\t");

        const newTsvContent = lines.concat(newLine).join("\n") + "\n";
        fs.writeFileSync(tsvPath, newTsvContent, "utf8");
        console.log(`Updated results.tsv with round ${nextRound}`);
      } else {
        console.warn(`results.tsv not found at ${tsvPath}`);
      }

      // Also update baseline.json so next loop rounds compare against this new KEEP baseline
      fs.writeFileSync(baselinePath, JSON.stringify(latestMetrics, null, 2) + "\n", "utf8");
      console.log(`Updated baseline.json with new metrics`);

    } catch (tsvErr: any) {
      console.error("Failed to update results.tsv or baseline.json:", tsvErr.message);
    }
  } else {
    console.log("REVERT");

    // 7. If REVERT, run git restore src/features/sms-parser
    try {
      execSync("git restore src/features/sms-parser", { cwd: projectRoot, stdio: "inherit" });
      console.log("Restored src/features/sms-parser");
    } catch (restoreErr: any) {
      console.error("Failed to restore parser directory:", restoreErr.message);
    }
  }
}

main();
