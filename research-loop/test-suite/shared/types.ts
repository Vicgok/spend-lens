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
