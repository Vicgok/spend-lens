import * as path from "path";
import { writeJson, readJson } from "./fs-utils";
import {
  NormalizedLatestMetrics,
  ParserMetrics,
  ResearchSuiteName,
  ResearchSuiteStatus,
} from "./types";

/**
 * Writes a metrics JSON report to the given file path.
 */
export function saveMetricsReport(filePath: string, metrics: ParserMetrics): void {
  writeJson(filePath, metrics);
}

/**
 * Reads an existing metrics baseline. Returns null if not found.
 */
export function loadBaseline(filePath: string): ParserMetrics | null {
  return readJson<ParserMetrics>(filePath);
}

/**
 * Generates a summary comparison line for console output.
 */
export function formatComparisonRow(
  label: string,
  baseline: number | undefined,
  current: number
): string {
  const bStr = baseline !== undefined ? `${baseline}%` : "N/A";
  return `${label.padEnd(26)} Baseline: ${bStr.padEnd(10)} Current: ${current}%`;
}

/**
 * Resolves the path to a file inside the reports/ directory of a given suite folder.
 * E.g. reportsPath("parser", "baseline.json") -> test-suite/parser/reports/baseline.json
 */
export function reportsPath(suiteDir: string, filename: string): string {
  return path.resolve(suiteDir, "reports", filename);
}

/**
 * Builds a repo-relative artifact path using forward slashes for portability.
 */
export function relativeArtifactPath(rootDir: string, targetPath: string): string {
  return path.relative(rootDir, targetPath).split(path.sep).join("/");
}

/**
 * Creates a normalized latest-metrics payload for a suite.
 */
export function buildLatestMetricsReport<TMetrics, TFailureBuckets>(params: {
  suite: ResearchSuiteName;
  status: ResearchSuiteStatus;
  metrics: TMetrics;
  failureBuckets: TFailureBuckets;
  artifacts: Record<string, string>;
  timestamp?: string;
}): NormalizedLatestMetrics<TMetrics, TFailureBuckets> {
  return {
    suite: params.suite,
    status: params.status,
    timestamp: params.timestamp ?? new Date().toISOString(),
    metrics: params.metrics,
    failureBuckets: params.failureBuckets,
    artifacts: params.artifacts,
  };
}

/**
 * Writes a normalized latest-metrics report to a suite reports directory.
 */
export function writeLatestMetricsReport<TMetrics, TFailureBuckets>(
  suiteDir: string,
  report: NormalizedLatestMetrics<TMetrics, TFailureBuckets>
): string {
  const filePath = reportsPath(suiteDir, "latest-metrics.json");
  writeJson(filePath, report);
  return filePath;
}
