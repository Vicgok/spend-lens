/**
 * Shared types used across parser and dedupe test suites.
 */

export interface ParserMetrics {
  overallAccuracy: number;
  detectionAccuracy: number;
  typeAccuracy: number;
  amountAccuracy: number;
  merchantAccuracy: number;
  accountAccuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface DedupeMetricsSummary {
  totalSamples: number;
  totalMessages: number;
  expectedUnique: number;
  actualUnique: number;
  duplicatesRemoved: number;
  pairwiseTP: number;
  pairwiseFP: number;
  pairwiseFN: number;
  pairwiseTN: number;
  dedupePrecision: number;
  dedupeRecall: number;
  dedupeF1: number;
  falseMergeRate: number;
  missedDuplicateRate: number;
  samplePassRate: number;
  groupExactMatchAccuracy: number;
}

export type ResearchSuiteName = "parser" | "dedupe" | "all";

export type ResearchSuiteStatus = "PASS" | "FAIL";

export interface NormalizedLatestMetrics<
  TMetrics = Record<string, unknown>,
  TFailureBuckets = Record<string, unknown>
> {
  suite: ResearchSuiteName;
  status: ResearchSuiteStatus;
  timestamp: string;
  metrics: TMetrics;
  failureBuckets: TFailureBuckets;
  artifacts: Record<string, string>;
}

export interface CombinedLatestMetrics
  extends NormalizedLatestMetrics<
    {
      parserAccuracy: number;
      dedupePrecision: number;
      dedupeRecall: number;
      falseMerge: number;
    },
    {
      parser: Record<string, unknown>;
      dedupe: Record<string, unknown>;
    }
  > {
  suite: "all";
  parser: NormalizedLatestMetrics;
  dedupe: NormalizedLatestMetrics;
}
