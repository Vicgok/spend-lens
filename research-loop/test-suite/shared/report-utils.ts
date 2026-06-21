import * as path from "path";
import { writeJson, readJson } from "./fs-utils";
import { ParserMetrics } from "./types";

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
