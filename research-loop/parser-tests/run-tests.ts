import path from "path";

import { evaluateCorpus, loadCorpus } from "./evaluator";

function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

function main() {
  const corpusDir = path.join(__dirname, "corpus");
  const records = loadCorpus(corpusDir);
  const summary = evaluateCorpus(records);

  console.log(`Total Samples: ${summary.totalSamples}`);
  console.log(`Expected Exceptions: ${summary.expectedExceptions}`);
  console.log("");
  console.log(`Detection Accuracy: ${formatPercent(summary.detectionAccuracy)}`);
  console.log(`Type Accuracy: ${formatPercent(summary.typeAccuracy)}`);
  console.log(`Amount Accuracy: ${formatPercent(summary.amountAccuracy)}`);
  console.log(`Merchant Accuracy: ${formatPercent(summary.merchantAccuracy)}`);
  console.log(`Account Accuracy: ${formatPercent(summary.accountAccuracy)}`);
  console.log("");
  console.log(`False Positive Rate: ${formatPercent(summary.falsePositiveRate)}`);
  console.log(`False Negative Rate: ${formatPercent(summary.falseNegativeRate)}`);
  console.log(`False Positives: ${summary.falsePositives}`);
  console.log(`False Negatives: ${summary.falseNegatives}`);
  console.log("");
  console.log(`Overall Accuracy: ${formatPercent(summary.overallAccuracy)}`);
}

main();
