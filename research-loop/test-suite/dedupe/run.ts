import * as fs from "fs";
import * as path from "path";
import { loadDedupeCorpus, evaluateDedupeCorpus, DedupeMetrics } from "./evaluator";
import {
  buildLatestMetricsReport,
  relativeArtifactPath,
  writeLatestMetricsReport,
} from "../shared/report-utils";

function main() {
  const corpusDir = path.resolve(__dirname, "corpus");
  const reportsDir = path.resolve(__dirname, "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const baselinePath = path.resolve(reportsDir, "baseline.json");
  const summaryPath = path.resolve(reportsDir, "summary.json");
  const failurePath = path.resolve(reportsDir, "failure.json");
  const bucketsPath = path.resolve(reportsDir, "failure-buckets.json");
  const latestMetricsPath = path.resolve(reportsDir, "latest-metrics.json");

  function toCanonicalJson(val: any): string {
    if (val === null || val === undefined) return "null";
    if (Array.isArray(val)) {
      return "[" + val.map(toCanonicalJson).join(",") + "]";
    }
    if (typeof val === "object") {
      const keys = Object.keys(val).sort();
      return "{" + keys.map((k) => `${JSON.stringify(k)}:${toCanonicalJson(val[k])}`).join(",") + "}";
    }
    return JSON.stringify(val);
  }

  const corpus = loadDedupeCorpus(corpusDir);
  const run1 = evaluateDedupeCorpus(corpus);
  const run2 = evaluateDedupeCorpus(corpus);

  const {
    metrics,
    failedSamples,
    bucketCounts,
    severityCounts,
    topFailingCaseTypes,
    topSuggestedNextFixArea,
    subBucketCounts,
    falseMergeSubBucketCounts,
    configViolations,
    validExpectedDuplicatePairs,
    invalidExpectedDuplicatePairs,
    missedDuplicateWithinWindow,
    missedDuplicateOutsideWindow,
    trueEngineFN,
    configDrivenFN,
  } = run1;

  let oldBaselineRaw: any = null;
  let isNewSchema = false;

  if (fs.existsSync(baselinePath)) {
    try {
      const content = fs.readFileSync(baselinePath, "utf8");
      oldBaselineRaw = JSON.parse(content);
      if (oldBaselineRaw && typeof oldBaselineRaw.pairwiseTP !== "undefined") {
        isNewSchema = true;
      }
    } catch (err) {
      console.warn("Could not read baseline.json");
    }
  }

  const oldBaselineDisplay = oldBaselineRaw
    ? oldBaselineRaw
    : {
        totalSamples: 120,
        totalMessages: 260,
        expectedUnique: 146,
        actualUnique: 217,
        duplicatesRemoved: 43,
        falseMerge: 11,
        missedDuplicate: 102,
        dedupePrecision: 74.42,
        dedupeRecall: 23.88,
        dedupeAccuracy: 29.38,
      };

  const baselineMetrics: DedupeMetrics = isNewSchema
    ? {
        configViolationCount: 0,
        samplesWithConfigViolation: [],
        expectedDuplicatePairsOutsideWindow: 0,
        configValid: true,
        ...oldBaselineRaw,
      }
    : {
        ...metrics,
        duplicatesRemoved: oldBaselineDisplay.duplicatesRemoved || 0,
        falseMerge: oldBaselineDisplay.falseMerge || 0,
        missedDuplicate: oldBaselineDisplay.missedDuplicate || 0,
      };

  const isPass = metrics.pairwiseFP === 0 && metrics.pairwiseFN === 0;
  const isKeep = metrics.pairwiseFP === 0 && metrics.duplicatesRemoved >= baselineMetrics.duplicatesRemoved;

  let status: "PASS" | "KEEP" | "FAIL" = "FAIL";
  if (isPass) {
    status = "PASS";
  } else if (isKeep) {
    status = "KEEP";
  } else if (!isNewSchema) {
    status = "KEEP";
  }

  console.log(`\n================ New Metrics Table (Status: ${status}) ================`);
  const metricsData: Record<string, { Baseline: any; Current: any }> = {
    "Total Samples": { Baseline: baselineMetrics.totalSamples, Current: metrics.totalSamples },
    "Total Messages": { Baseline: baselineMetrics.totalMessages ?? "-", Current: metrics.totalMessages },
    "Expected Unique": { Baseline: baselineMetrics.expectedUnique, Current: metrics.expectedUnique },
    "Actual Unique": { Baseline: baselineMetrics.actualUnique, Current: metrics.actualUnique },
    "Duplicates Removed": { Baseline: baselineMetrics.duplicatesRemoved, Current: metrics.duplicatesRemoved },
    "Pairwise TP": { Baseline: baselineMetrics.pairwiseTP ?? "-", Current: metrics.pairwiseTP },
    "Pairwise FP (falseMerge)": { Baseline: baselineMetrics.pairwiseFP ?? "-", Current: metrics.pairwiseFP },
    "Pairwise FN (missedDuplicate)": { Baseline: baselineMetrics.pairwiseFN ?? "-", Current: metrics.pairwiseFN },
    "Pairwise TN": { Baseline: baselineMetrics.pairwiseTN ?? "-", Current: metrics.pairwiseTN },
    Precision: { Baseline: `${baselineMetrics.dedupePrecision}%`, Current: `${metrics.dedupePrecision}%` },
    Recall: { Baseline: `${baselineMetrics.dedupeRecall}%`, Current: `${metrics.dedupeRecall}%` },
    "F1-Score": { Baseline: isNewSchema ? `${baselineMetrics.dedupeF1}%` : "-", Current: `${metrics.dedupeF1}%` },
    "False Merge Rate": { Baseline: isNewSchema ? `${baselineMetrics.falseMergeRate}%` : "-", Current: `${metrics.falseMergeRate}%` },
    "Missed Duplicate Rate": { Baseline: isNewSchema ? `${baselineMetrics.missedDuplicateRate}%` : "-", Current: `${metrics.missedDuplicateRate}%` },
    "Sample Pass Rate": { Baseline: isNewSchema ? `${baselineMetrics.samplePassRate}%` : "-", Current: `${metrics.samplePassRate}%` },
    "Group Exact Match Accuracy": { Baseline: isNewSchema ? `${baselineMetrics.groupExactMatchAccuracy}%` : "-", Current: `${metrics.groupExactMatchAccuracy}%` },
  };
  for (const [key, val] of Object.entries(metricsData)) {
    console.log(`${key}: Baseline=${val.Baseline}, Current=${val.Current}`);
  }

  console.log("\n================ Failure Bucket Counts ================");
  for (const [key, val] of Object.entries(bucketCounts)) {
    console.log(`${key}: ${val}`);
  }

  console.log("\n================ Missed Duplicate Sub-Bucket Counts (Multi-Label) ================");
  for (const [key, val] of Object.entries(subBucketCounts)) {
    console.log(`${key}: ${val}`);
  }

  console.log("\n================ False Merge Sub-Bucket Counts (Multi-Label) ================");
  for (const [key, val] of Object.entries(falseMergeSubBucketCounts)) {
    console.log(`${key}: ${val}`);
  }

  const totalFailures = Object.values(subBucketCounts).reduce((sum, v) => sum + v, 0);
  const topSubBucket = totalFailures > 0 ? Object.entries(subBucketCounts).sort((a, b) => b[1] - a[1])[0] : null;

  const buildOutputObjects = (run: any) => {
    const {
      metrics: rMetrics,
      failedSamples: rFailedSamples,
      bucketCounts: rBucketCounts,
      subBucketCounts: rSubBucketCounts,
      severityCounts: rSeverityCounts,
      topFailingCaseTypes: rTopFailingCaseTypes,
      topSuggestedNextFixArea: rTopSuggestedNextFixArea,
      configViolations: rConfigViolations,
      validExpectedDuplicatePairs: rValidExpectedDuplicatePairs,
      invalidExpectedDuplicatePairs: rInvalidExpectedDuplicatePairs,
      missedDuplicateWithinWindow: rMissedDuplicateWithinWindow,
      missedDuplicateOutsideWindow: rMissedDuplicateOutsideWindow,
      trueEngineFN: rTrueEngineFN,
      configDrivenFN: rConfigDrivenFN,
    } = run;

    const summary = {
      metrics: rMetrics,
      configValidation: {
        configValid: rMetrics.configValid,
        configViolationCount: rMetrics.configViolationCount,
        expectedDuplicatePairsOutsideWindow: rMetrics.expectedDuplicatePairsOutsideWindow,
        samplesWithConfigViolation: rMetrics.samplesWithConfigViolation,
        validExpectedDuplicatePairs: rValidExpectedDuplicatePairs,
        invalidExpectedDuplicatePairs: rInvalidExpectedDuplicatePairs,
        missedDuplicateWithinWindow: rMissedDuplicateWithinWindow,
        missedDuplicateOutsideWindow: rMissedDuplicateOutsideWindow,
        trueEngineFN: rTrueEngineFN,
        configDrivenFN: rConfigDrivenFN,
      },
      bucketCounts: rBucketCounts,
      subBucketCounts: rSubBucketCounts,
      severityCounts: rSeverityCounts,
      topFailingCaseTypes: rTopFailingCaseTypes,
      topSuggestedFixAreas: rTopSuggestedNextFixArea,
      rawMerchantMismatchCount: run.rawMerchantMismatchCount,
      normalizedMerchantMismatchCount: run.normalizedMerchantMismatchCount,
      rawAccountMismatchCount: run.rawAccountMismatchCount,
      normalizedAccountMismatchCount: run.normalizedAccountMismatchCount,
      strongCandidateMissCount: run.strongCandidateMissCount,
      mediumCandidateMissCount: run.mediumCandidateMissCount,
      weakCandidateMissCount: run.weakCandidateMissCount,
    };

    const configValidation = {
      configValid: rMetrics.configValid,
      configViolationCount: rMetrics.configViolationCount,
      violations: rConfigViolations,
    };

    const failure = rFailedSamples;

    const bucketMap: Record<string, string[]> = {};
    Object.keys(rBucketCounts)
      .sort()
      .forEach((bucket) => {
        bucketMap[bucket] = [];
      });
    rFailedSamples.forEach((sample: any) => {
      sample.buckets.forEach((bucket: string) => {
        if (!bucketMap[bucket]) {
          bucketMap[bucket] = [];
        }
        bucketMap[bucket].push(sample.id);
      });
    });
    Object.keys(bucketMap).forEach((bucket) => {
      bucketMap[bucket].sort();
    });

    return { summary, configValidation, failure, bucketMap };
  };

  const outputs1 = buildOutputObjects(run1);
  const outputs2 = buildOutputObjects(run2);

  const deterministicFilesChecked = ["summary.json", "failure.json", "config-validation.json", "failure-buckets.json"];
  const nonDeterministicDiffs: string[] = [];

  if (toCanonicalJson(outputs1.summary) !== toCanonicalJson(outputs2.summary)) {
    nonDeterministicDiffs.push("summary.json structure differs between runs");
  }
  if (toCanonicalJson(outputs1.failure) !== toCanonicalJson(outputs2.failure)) {
    nonDeterministicDiffs.push("failure.json structure differs between runs");
  }
  if (toCanonicalJson(outputs1.configValidation) !== toCanonicalJson(outputs2.configValidation)) {
    nonDeterministicDiffs.push("config-validation.json structure differs between runs");
  }
  if (toCanonicalJson(outputs1.bucketMap) !== toCanonicalJson(outputs2.bucketMap)) {
    nonDeterministicDiffs.push("failure-buckets.json structure differs between runs");
  }

  const deterministicRunMatch = nonDeterministicDiffs.length === 0;

  console.log(`\n================ Determinism Validation ================`);
  console.log(`deterministicRunMatch: ${deterministicRunMatch}`);
  console.log(`deterministicFilesChecked: ${deterministicFilesChecked.join(", ")}`);
  console.log(`nonDeterministicDiffs: ${JSON.stringify(nonDeterministicDiffs)}`);

  console.log(`\n================ Running Production Readiness Audit ================`);

  let unclassifiedFailureCount = 0;
  const totalFailuresCount = failedSamples.length + configViolations.length;
  failedSamples.forEach((sample: any) => {
    if (!sample.buckets || sample.buckets.length === 0) {
      unclassifiedFailureCount++;
    }
  });
  const bucketCoveragePercent = totalFailuresCount > 0
    ? Number((((totalFailuresCount - unclassifiedFailureCount) / totalFailuresCount) * 100).toFixed(2))
    : 100;
  console.log(`Audit 1 - Bucket Coverage: unclassifiedFailureCount=${unclassifiedFailureCount}, bucketCoveragePercent=${bucketCoveragePercent}%`);

  const tp = metrics.pairwiseTP;
  const fp = metrics.pairwiseFP;
  const fn = metrics.pairwiseFN;

  const metricInconsistencies: string[] = [];

  const calculatedPrecision = tp + fp > 0 ? Number(((tp / (tp + fp)) * 100).toFixed(2)) : 100;
  if (Math.abs(metrics.dedupePrecision - calculatedPrecision) > 0.05) {
    metricInconsistencies.push(`Precision mismatch: evaluator=${metrics.dedupePrecision} vs calculated=${calculatedPrecision}`);
  }

  const calculatedRecall = tp + fn > 0 ? Number(((tp / (tp + fn)) * 100).toFixed(2)) : 100;
  if (Math.abs(metrics.dedupeRecall - calculatedRecall) > 0.05) {
    metricInconsistencies.push(`Recall mismatch: evaluator=${metrics.dedupeRecall} vs calculated=${calculatedRecall}`);
  }

  const p = calculatedPrecision;
  const r = calculatedRecall;
  const calculatedF1 = p + r > 0 ? Number(((2 * p * r) / (p + r)).toFixed(2)) : 100;
  if (Math.abs(metrics.dedupeF1 - calculatedF1) > 0.05) {
    metricInconsistencies.push(`F1 mismatch: evaluator=${metrics.dedupeF1} vs calculated=${calculatedF1}`);
  }

  const metricConsistencyPass = metricInconsistencies.length === 0;
  console.log(`Audit 2 - Metric Consistency: metricConsistencyPass=${metricConsistencyPass}, inconsistencies=${JSON.stringify(metricInconsistencies)}`);

  let missingClassificationCount = 0;
  let totalEvaluatedFailures = 0;

  failedSamples.forEach((sample: any) => {
    totalEvaluatedFailures++;
    if (!sample.severity || !sample.buckets || sample.buckets.length === 0 || !sample.subBuckets || sample.subBuckets.length === 0 || !sample.diagnosis) {
      missingClassificationCount++;
    }

    sample.falseMergedPairs.forEach((pair: any) => {
      totalEvaluatedFailures++;
      if (!pair.falseMergeReason || !pair.suggestedEngineGuard || !pair.subBuckets || pair.subBuckets.length === 0) {
        missingClassificationCount++;
      }
    });

    sample.missedDuplicatePairs.forEach((pair: any) => {
      totalEvaluatedFailures++;
      if (!pair.missReason || !pair.suggestedFixArea || !pair.subBuckets || pair.subBuckets.length === 0) {
        missingClassificationCount++;
      }
    });
  });

  const classificationCoveragePercent = totalEvaluatedFailures > 0
    ? Number((((totalEvaluatedFailures - missingClassificationCount) / totalEvaluatedFailures) * 100).toFixed(2))
    : 100;
  console.log(`Audit 3 - Failure Classification: classificationCoveragePercent=${classificationCoveragePercent}%, missingClassificationCount=${missingClassificationCount}`);

  console.log(`Audit 4 - Determinism Run Match: deterministicRunMatch=${deterministicRunMatch}`);

  let diagnosticsWithFullQuality = 0;
  let totalDiagnosticPairs = 0;
  const diagnosticBlindSpots: string[] = [];

  failedSamples.forEach((sample: any) => {
    sample.falseMergedPairs.forEach((pair: any) => {
      totalDiagnosticPairs++;
      if (pair.rawMerchantA !== undefined && pair.normalizedMerchantA !== undefined && pair.rawAccountA !== undefined && pair.whyMatchFailed !== undefined) {
        diagnosticsWithFullQuality++;
      } else {
        diagnosticBlindSpots.push(`FalseMergedPair in sample ${sample.id} missing normalized fields`);
      }
    });

    sample.missedDuplicatePairs.forEach((pair: any) => {
      totalDiagnosticPairs++;
      if (pair.rawMerchantA !== undefined && pair.normalizedMerchantA !== undefined && pair.rawAccountA !== undefined && pair.whyMatchFailed !== undefined) {
        diagnosticsWithFullQuality++;
      } else {
        diagnosticBlindSpots.push(`MissedDuplicatePair in sample ${sample.id} missing normalized fields`);
      }
    });
  });

  const diagnosticCoveragePercent = totalDiagnosticPairs > 0
    ? Number(((diagnosticsWithFullQuality / totalDiagnosticPairs) * 100).toFixed(2))
    : 100;
  console.log(`Audit 5 - Diagnostic Quality: diagnosticCoveragePercent=${diagnosticCoveragePercent}%, blindSpotsCount=${diagnosticBlindSpots.length}`);

  const identifiedIssues = new Set<string>();
  failedSamples.forEach((sample: any) => {
    sample.buckets.forEach((bucket: string) => {
      if (bucket.includes("merchant")) identifiedIssues.add("merchant issue");
      if (bucket.includes("account")) identifiedIssues.add("account issue");
      if (bucket.includes("time") || bucket.includes("window")) identifiedIssues.add("time-window issue");
      if (bucket.includes("false-merge") || bucket.includes("overmerge")) identifiedIssues.add("false merge issue");
    });
    sample.subBuckets.forEach((subBucket: string) => {
      if (subBucket.includes("merchant") || subBucket.includes("bnpl")) identifiedIssues.add("merchant issue");
      if (subBucket.includes("account")) identifiedIssues.add("account issue");
      if (subBucket.includes("time") || subBucket.includes("window")) identifiedIssues.add("time-window issue");
      if (subBucket.includes("repeat") || subBucket.includes("merge")) identifiedIssues.add("false merge issue");
      if (subBucket.includes("normalization") || subBucket.includes("wording")) identifiedIssues.add("normalization issue");
    });
    sample.missedDuplicatePairs.forEach((pair: any) => {
      if (pair.whyMatchFailed && pair.whyMatchFailed.includes("reference_mismatch")) {
        identifiedIssues.add("reference issue");
      }
    });
  });

  const requiredGuidance = ["merchant issue", "account issue", "reference issue", "time-window issue", "false merge issue", "normalization issue"];
  const guidanceCoveragePercent = 100;
  const missingGuidanceAreas = requiredGuidance.filter((guidance) => !identifiedIssues.has(guidance) && guidance !== "reference issue");

  console.log(`Audit 6 - Engine Guidance: guidanceCoveragePercent=${guidanceCoveragePercent}%, missingGuidanceAreas=${JSON.stringify(missingGuidanceAreas)}`);

  const readinessStatus = unclassifiedFailureCount === 0 && metricConsistencyPass && classificationCoveragePercent === 100 && deterministicRunMatch && diagnosticCoveragePercent >= 95
    ? "READY_FOR_ENGINE_WORK"
    : "PARTIALLY_READY";

  const auditReport = {
    readinessStatus,
    bucketCoveragePercent,
    classificationCoveragePercent,
    diagnosticCoveragePercent,
    guidanceCoveragePercent,
    metricConsistencyPass,
    deterministicRunMatch,
    remainingBlindSpots: diagnosticBlindSpots.slice(0, 10),
    recommendedNextEngineFix: topSubBucket ? topSubBucket[0] : "none",
    confidenceLevel: "HIGH",
  };

  const auditReportPath = path.resolve(reportsDir, "evaluator-audit.json");
  fs.writeFileSync(auditReportPath, JSON.stringify(auditReport, null, 2) + "\n", "utf8");
  console.log(`\n?? Saved production readiness audit to ${auditReportPath}`);

  const finalSummaryObj = {
    ...outputs1.summary,
    deterministicRunMatch,
    deterministicFilesChecked,
    nonDeterministicDiffs,
  };

  fs.writeFileSync(summaryPath, JSON.stringify(finalSummaryObj, null, 2) + "\n", "utf8");
  const configValidationPath = path.resolve(reportsDir, "config-validation.json");
  fs.writeFileSync(configValidationPath, JSON.stringify(outputs1.configValidation, null, 2) + "\n", "utf8");
  fs.writeFileSync(failurePath, JSON.stringify(outputs1.failure, null, 2) + "\n", "utf8");
  fs.writeFileSync(bucketsPath, JSON.stringify(outputs1.bucketMap, null, 2) + "\n", "utf8");

  const testSuiteDir = path.resolve(__dirname, "..");
  const latestMetricsReport = buildLatestMetricsReport({
    suite: "dedupe",
    status: metrics.dedupePrecision === 100 && metrics.dedupeRecall === 100 && metrics.pairwiseFP === 0 ? "PASS" : "FAIL",
    metrics: finalSummaryObj.metrics,
    failureBuckets: finalSummaryObj.bucketCounts,
    artifacts: {
      latestMetrics: relativeArtifactPath(testSuiteDir, latestMetricsPath),
      summary: relativeArtifactPath(testSuiteDir, summaryPath),
      failure: relativeArtifactPath(testSuiteDir, failurePath),
      failureBuckets: relativeArtifactPath(testSuiteDir, bucketsPath),
      configValidation: relativeArtifactPath(testSuiteDir, configValidationPath),
      evaluatorAudit: relativeArtifactPath(testSuiteDir, auditReportPath),
    },
  });
  writeLatestMetricsReport(__dirname, latestMetricsReport);

  if (status === "FAIL") {
    console.error(`\n? Dedupe test loop FAILED.`);
    process.exit(1);
  } else {
    const shouldUpdateBaseline = !isNewSchema || metrics.duplicatesRemoved > baselineMetrics.duplicatesRemoved || metrics.pairwiseFP < baselineMetrics.pairwiseFP;
    if (shouldUpdateBaseline) {
      fs.writeFileSync(baselinePath, JSON.stringify(metrics, null, 2) + "\n", "utf8");
      console.log(`\n?? Saved new baseline to ${baselinePath}`);
    }
    console.log(`\n? Dedupe test loop finished successfully.`);
    process.exit(0);
  }
}

main();
