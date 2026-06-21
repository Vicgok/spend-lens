import { readdirSync, readFileSync } from "fs";
import * as path from "path";
import { parseTransactionSMS, generateSMSHash, dedupeTransactions } from "../../../src/features/sms-parser/engine";


export interface DedupeMessage {
  sender: string;
  message: string;
}

export interface ExpectedTransaction {
  transactionType: "debit" | "credit" | null;
  amount: number | null;
  merchant: string | null;
  accountCard: string | null;
  time: string;
}

export interface DedupeRecord {
  id: string;
  messages: DedupeMessage[];
  expectedUniqueTransactions: ExpectedTransaction[];
  expectedDuplicateGroups: number[][];
  expectedIgnoredDuplicates: number[];
  notes?: string;
}

export interface DedupeMetrics {
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
  configViolationCount: number;
  samplesWithConfigViolation: string[];
  expectedDuplicatePairsOutsideWindow: number;
  configValid: boolean;
}

export interface MissedDuplicatePairDetail {
  messageIndexA: number;
  messageIndexB: number;
  messageA: string;
  messageB: string;
  parsedTxnA: any | null;
  parsedTxnB: any | null;
  hashA: string | null;
  hashB: string | null;
  expectedSameGroup: boolean;
  actualGroupA: number[];
  actualGroupB: number[];
  diff: {
    amountMatch: boolean;
    accountMatch: boolean;
    merchantMatch: boolean;
    typeMatch: boolean;
    timeDiffMinutes: number | null;
    scoreIfAvailable: string | null;
    rawMerchantA?: string | null;
    rawMerchantB?: string | null;
    normalizedMerchantA?: string | null;
    normalizedMerchantB?: string | null;
    merchantPresence?: "bothPresent" | "oneMissing" | "bothMissing" | "invalidGenericVsMissing";
    merchantValidityA?: "valid" | "invalidGeneric" | "missing";
    merchantValidityB?: "valid" | "invalidGeneric" | "missing";
    merchantPresenceStatus?: string;
    diagnosisReason?: string;
  };
  missReason: string;
  suggestedFixArea: string;
  subBuckets: ("exact-duplicate-missed" | "near-duplicate-missed" | "merchant-normalization-missed" | "bnpl-bank-wording-missed" | "time-window-boundary-missed" | "account-mismatch-missed" | "type-mismatch-missed" | "amount-mismatch-missed" | "multi-channel-missed" | "low-score-missed" | "unknown-missed" | "outside-configured-window-missed" | "missing-merchant-missed" | "missing-merchant-both-missed" | "invalid-generic-merchant-missed" | "business-rule-credit-merchant-missed" | "bnpl-provider-bank-link-missed")[];
  timeDiffMinutes?: number | null;
  dedupeWindowMinutes?: number;
  withinWindow?: boolean;
  failureSource?: "engine" | "config";
  bnplDetails?: BNPLDetails;
  rawMerchantA: string | null;
  rawMerchantB: string | null;
  rawAccountA: string | null;
  rawAccountB: string | null;
  normalizedMerchantA: string | null;
  normalizedMerchantB: string | null;
  normalizedAccountA: string | null;
  normalizedAccountB: string | null;
  normalizedReferenceA: string | null;
  normalizedReferenceB: string | null;
  amountMatchRaw: boolean;
  amountMatchNormalized: boolean;
  merchantMatchRaw: boolean;
  merchantMatchNormalized: boolean;
  accountMatchRaw: boolean;
  accountMatchNormalized: boolean;
  referenceMatchNormalized: boolean;
  comparisonStrength: "NONE" | "WEAK" | "MEDIUM" | "STRONG";
  whyMatchFailed: string[];
}

export interface BNPLDetails {
  bnplProvider: string;
  bankSender: string;
  providerMerchant: string | null;
  bankMerchant: string | null;
  providerAccount: string | null;
  bankAccount: string | null;
  amountMatch: boolean;
  merchantMatch: boolean;
  accountMatch: boolean;
  typeMatch: boolean;
  timeDiffMinutes: number | null;
  sameTransactionCandidate: boolean;
  bnplDiagnosisReason: string;
  bnplSuggestedFixArea: string;
}

export interface FalseMergedPairDetail {
  messageIndexA: number;
  messageIndexB: number;
  messageA: string;
  messageB: string;
  parsedTxnA: any | null;
  parsedTxnB: any | null;
  hashA: string | null;
  hashB: string | null;
  actualSameGroup: boolean;
  expectedDifferentGroup: boolean;
  amountMatch: boolean;
  accountMatch: boolean;
  merchantMatch: boolean;
  typeMatch: boolean;
  timeDiffMinutes: number | null;
  falseMergeReason: string;
  suggestedEngineGuard: string;
  subBuckets: ("same-amount-legit-repeat" | "repeated-same-day-transaction" | "salary-repeat-false-merge" | "cash-deposit-repeat-false-merge" | "different-merchant-false-merge" | "different-account-false-merge" | "different-type-false-merge" | "time-too-close-but-legit" | "time-window-overmerge" | "low-entropy-fingerprint" | "missing-merchant-overmerge" | "missing-account-overmerge" | "unknown-false-merge")[];
  rawMerchantA: string | null;
  rawMerchantB: string | null;
  rawAccountA: string | null;
  rawAccountB: string | null;
  normalizedMerchantA: string | null;
  normalizedMerchantB: string | null;
  normalizedAccountA: string | null;
  normalizedAccountB: string | null;
  normalizedReferenceA: string | null;
  normalizedReferenceB: string | null;
  amountMatchRaw: boolean;
  amountMatchNormalized: boolean;
  merchantMatchRaw: boolean;
  merchantMatchNormalized: boolean;
  accountMatchRaw: boolean;
  accountMatchNormalized: boolean;
  referenceMatchNormalized: boolean;
  comparisonStrength: "NONE" | "WEAK" | "MEDIUM" | "STRONG";
  whyMatchFailed: string[];
}

export interface FailedSampleDetail {
  id: string;
  caseType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  buckets: string[];
  subBuckets: string[];
  notes?: string;
  expectedDuplicateGroups: number[][];
  actualDuplicateGroups: number[][];
  falseMergedPairs: any[];
  missedDuplicatePairs: any[];
  diagnosis: string;
}

export function loadDedupeCorpus(corpusDir: string): DedupeRecord[] {
  const files = readdirSync(corpusDir)
    .filter((file) => file.toLowerCase().endsWith(".json") && file.toLowerCase() !== "manifest.json")
    .sort((left, right) => left.localeCompare(right));

  const records: DedupeRecord[] = [];

  for (const file of files) {
    const filePath = path.join(corpusDir, file);
    const content = JSON.parse(
      readFileSync(filePath, "utf8")
    ) as DedupeRecord[];

    if (!Array.isArray(content)) {
      throw new Error("Corpus file must contain an array: " + filePath);
    }

    records.push(...content);
  }

  return records;
}

function getNormalizedPartition(n: number, groups: number[][]): string {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) {
      root = parent[root];
    }
    // Path compression
    let curr = i;
    while (curr !== root) {
      const next = parent[curr];
      parent[curr] = root;
      curr = next;
    }
    return root;
  };
  const union = (i: number, j: number) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  };

  for (const group of groups) {
    if (group.length > 1) {
      const first = group[0];
      for (let k = 1; k < group.length; k++) {
        union(first, group[k]);
      }
    }
  }

  const groupsMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groupsMap.has(root)) {
      groupsMap.set(root, []);
    }
    groupsMap.get(root)!.push(i);
  }

  const sorted = Array.from(groupsMap.values()).map(g => g.sort((a, b) => a - b));
  sorted.sort((a, b) => a[0] - b[0]);
  return JSON.stringify(sorted);
}

function isMerchantRelated(mA: string | null, mB: string | null): boolean {
  if (!mA || !mB) return false;
  const nA = mA.trim().toLowerCase();
  const nB = mB.trim().toLowerCase();
  if (nA === nB) return true;
  if (nA.includes(nB) || nB.includes(nA)) return true;
  const wordsA = nA.split(/[^a-z0-9]/).filter(w => w.length >= 3);
  const wordsB = nB.split(/[^a-z0-9]/).filter(w => w.length >= 3);
  return wordsA.some(w => wordsB.includes(w));
}

function isDateSame(dateA: string | null, dateB: string | null): boolean {
  if (!dateA || !dateB) return false;
  return dateA.substring(0, 10) === dateB.substring(0, 10);
}

function normalizeMerchantEvaluator(m: string | null): string {
  if (!m) return "";
  let val = m.toLowerCase().trim();
  val = val.replace(/\b(txn|ref|payment|transaction)\b/g, "");
  val = val.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
  val = val.replace(/\s+/g, " ").trim();
  return val;
}

function normalizeAccountEvaluator(a: string | null): string {
  if (!a) return "";
  let val = a.toUpperCase().trim();
  val = val.replace(/[xX\*\-]/g, "");
  if (val.length > 4) {
    val = val.substring(val.length - 4);
  }
  return val;
}

function normalizeTypeEvaluator(t: string | null): string {
  if (!t) return "";
  const val = t.toLowerCase().trim();
  if (val.includes("refund")) return "refund";
  if (val.includes("reversal")) return "reversal";
  if (val.includes("credit") || val.includes("income")) return "credit";
  return "debit";
}

function normalizeReferenceEvaluator(r: string | null): string {
  if (!r) return "";
  return r.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

interface NormalizedComparisonResult {
  rawMerchantA: string | null;
  rawMerchantB: string | null;
  rawAccountA: string | null;
  rawAccountB: string | null;
  normalizedMerchantA: string | null;
  normalizedMerchantB: string | null;
  normalizedAccountA: string | null;
  normalizedAccountB: string | null;
  normalizedReferenceA: string | null;
  normalizedReferenceB: string | null;
  amountMatchRaw: boolean;
  amountMatchNormalized: boolean;
  merchantMatchRaw: boolean;
  merchantMatchNormalized: boolean;
  accountMatchRaw: boolean;
  accountMatchNormalized: boolean;
  referenceMatchNormalized: boolean;
  comparisonStrength: "NONE" | "WEAK" | "MEDIUM" | "STRONG";
  whyMatchFailed: string[];
}

function computeNormalizedComparison(parsedA: any, parsedB: any): NormalizedComparisonResult {
  if (!parsedA || !parsedB) {
    return {
      rawMerchantA: null,
      rawMerchantB: null,
      rawAccountA: null,
      rawAccountB: null,
      normalizedMerchantA: null,
      normalizedMerchantB: null,
      normalizedAccountA: null,
      normalizedAccountB: null,
      normalizedReferenceA: null,
      normalizedReferenceB: null,
      amountMatchRaw: false,
      amountMatchNormalized: false,
      merchantMatchRaw: false,
      merchantMatchNormalized: false,
      accountMatchRaw: false,
      accountMatchNormalized: false,
      referenceMatchNormalized: false,
      comparisonStrength: "NONE",
      whyMatchFailed: ["missing_parsed_transaction"]
    };
  }

  const rawMerchantA = parsedA.transaction.merchant;
  const rawMerchantB = parsedB.transaction.merchant;
  const rawAccountA = parsedA.account.number;
  const rawAccountB = parsedB.account.number;

  const normalizedMerchantA = normalizeMerchantEvaluator(rawMerchantA);
  const normalizedMerchantB = normalizeMerchantEvaluator(rawMerchantB);
  const normalizedAccountA = normalizeAccountEvaluator(rawAccountA);
  const normalizedAccountB = normalizeAccountEvaluator(rawAccountB);
  const normalizedReferenceA = normalizeReferenceEvaluator(parsedA.transaction.referenceNo);
  const normalizedReferenceB = normalizeReferenceEvaluator(parsedB.transaction.referenceNo);

  const amountMatchRaw = parsedA.transaction.amount === parsedB.transaction.amount;
  const amountMatchNormalized = amountMatchRaw;

  const merchantMatchRaw = rawMerchantA !== null && rawMerchantB !== null && rawMerchantA.trim().toLowerCase() === rawMerchantB.trim().toLowerCase();
  const merchantMatchNormalized = normalizedMerchantA !== "" && normalizedMerchantB !== "" && normalizedMerchantA === normalizedMerchantB;

  const accountMatchRaw = rawAccountA !== null && rawAccountB !== null && rawAccountA === rawAccountB;
  const accountMatchNormalized = normalizedAccountA !== "" && normalizedAccountB !== "" && normalizedAccountA === normalizedAccountB;

  const referenceMatchNormalized = normalizedReferenceA !== "" && normalizedReferenceB !== "" && normalizedReferenceA === normalizedReferenceB;

  const typeMatch = normalizeTypeEvaluator(parsedA.transaction.type) === normalizeTypeEvaluator(parsedB.transaction.type);

  let comparisonStrength: "NONE" | "WEAK" | "MEDIUM" | "STRONG" = "NONE";
  if (amountMatchNormalized && typeMatch) {
    if (referenceMatchNormalized || (merchantMatchNormalized && accountMatchNormalized)) {
      comparisonStrength = "STRONG";
    } else if (merchantMatchNormalized || accountMatchNormalized || isMerchantRelated(rawMerchantA, rawMerchantB)) {
      comparisonStrength = "MEDIUM";
    } else {
      comparisonStrength = "WEAK";
    }
  }

  const whyMatchFailed: string[] = [];
  if (!amountMatchNormalized) {
    whyMatchFailed.push("amount_mismatch");
  }
  if (!typeMatch) {
    whyMatchFailed.push("type_mismatch");
  }
  if (!rawMerchantA || !rawMerchantB) {
    whyMatchFailed.push("merchant_missing");
  } else if (!merchantMatchRaw && merchantMatchNormalized) {
    whyMatchFailed.push("merchant_representation_difference");
  } else if (!merchantMatchNormalized) {
    whyMatchFailed.push("merchant_mismatch");
  }

  if (!rawAccountA || !rawAccountB) {
    whyMatchFailed.push("account_missing");
  } else if (!accountMatchRaw && accountMatchNormalized) {
    whyMatchFailed.push("account_representation_difference");
  } else if (!accountMatchNormalized) {
    whyMatchFailed.push("account_mismatch");
  }

  if (normalizedReferenceA && normalizedReferenceB && normalizedReferenceA !== normalizedReferenceB) {
    whyMatchFailed.push("reference_mismatch");
  }

  return {
    rawMerchantA,
    rawMerchantB,
    rawAccountA,
    rawAccountB,
    normalizedMerchantA,
    normalizedMerchantB,
    normalizedAccountA,
    normalizedAccountB,
    normalizedReferenceA,
    normalizedReferenceB,
    amountMatchRaw,
    amountMatchNormalized,
    merchantMatchRaw,
    merchantMatchNormalized,
    accountMatchRaw,
    accountMatchNormalized,
    referenceMatchNormalized,
    comparisonStrength,
    whyMatchFailed
  };
}

export function evaluateDedupeCorpus(records: DedupeRecord[]): {
  metrics: DedupeMetrics;
  failedSamples: FailedSampleDetail[];
  bucketCounts: Record<string, number>;
  severityCounts: Record<string, number>;
  topFailingCaseTypes: { caseType: string; count: number }[];
  topSuggestedNextFixArea: { area: string; count: number }[];
  subBucketCounts: Record<string, number>;
  falseMergeSubBucketCounts: Record<string, number>;
  outsideWindowExpectedDuplicateCount: number;
  outsideWindowSampleIds: string[];
  topConflictingReasons: { reason: string; count: number }[];
  configViolations: any[];
  validExpectedDuplicatePairs: number;
  invalidExpectedDuplicatePairs: number;
  missedDuplicateWithinWindow: number;
  missedDuplicateOutsideWindow: number;
  trueEngineFN: number;
  configDrivenFN: number;
  missingMerchantMissedCount: number;
  merchantNormalizationMissedCount: number;
  missingBothMerchantCount: number;
  invalidGenericMerchantMissedCount: number;
  businessRuleCreditMerchantMissedCount: number;
  bnplProviderBankMissedCount: number;
  bnplProviderBreakdown: Record<string, number>;
  bnplMerchantMismatchCount: number;
  bnplAccountMismatchCount: number;
  bnplAmountMismatchCount: number;
  bnplTimeMismatchCount: number;
  rawMerchantMismatchCount: number;
  normalizedMerchantMismatchCount: number;
  rawAccountMismatchCount: number;
  normalizedAccountMismatchCount: number;
  strongCandidateMissCount: number;
  mediumCandidateMissCount: number;
  weakCandidateMissCount: number;
} {
  const totalSamples = records.length;
  let totalMessages = 0;
  let expectedUnique = 0;
  let actualUnique = 0;
  let duplicatesRemoved = 0;

  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;
  let totalTN = 0;

  let passedSamplesCount = 0;
  let exactMatchCount = 0;

  const dedupeWindowMinutes = 5;
  let outsideWindowExpectedDuplicateCount = 0;
  const outsideWindowSampleIds: string[] = [];

  const failedSamples: FailedSampleDetail[] = [];
  const configViolations: any[] = [];
  let validExpectedDuplicatePairs = 0;
  let invalidExpectedDuplicatePairs = 0;
  let missedDuplicateWithinWindow = 0;
  let missedDuplicateOutsideWindow = 0;
  let trueEngineFN = 0;
  let configDrivenFN = 0;
  let missingMerchantMissedCount = 0;
  let merchantNormalizationMissedCount = 0;
  let missingBothMerchantCount = 0;
  let invalidGenericMerchantMissedCount = 0;
  let businessRuleCreditMerchantMissedCount = 0;

  let bnplProviderBankMissedCount = 0;
  const bnplProviderBreakdown: Record<string, number> = {};
  let bnplMerchantMismatchCount = 0;
  let bnplAccountMismatchCount = 0;
  let bnplAmountMismatchCount = 0;
  let bnplTimeMismatchCount = 0;
  
  let rawMerchantMismatchCount = 0;
  let normalizedMerchantMismatchCount = 0;
  let rawAccountMismatchCount = 0;
  let normalizedAccountMismatchCount = 0;
  let strongCandidateMissCount = 0;
  let mediumCandidateMissCount = 0;
  let weakCandidateMissCount = 0;

  const bucketCounts: Record<string, number> = {
    "false-merge": 0,
    "missed-duplicate": 0,
    "group-count-mismatch": 0,
    "bnpl-bank-wording-mismatch": 0,
    "repeated-same-day-false-merge": 0,
    "merchant-spelling-variation": 0,
    "same-amount-legit-repeat": 0,
    "multi-sms-same-transaction": 0,
    "time-window-boundary": 0,
    "wrong-canonical-transaction": 0,
    "parser-output-invalid": 0
  };

  const subBucketCounts: Record<string, number> = {
    "exact-duplicate-missed": 0,
    "near-duplicate-missed": 0,
    "merchant-normalization-missed": 0,
    "bnpl-bank-wording-missed": 0,
    "time-window-boundary-missed": 0,
    "account-mismatch-missed": 0,
    "type-mismatch-missed": 0,
    "amount-mismatch-missed": 0,
    "multi-channel-missed": 0,
    "low-score-missed": 0,
    "unknown-missed": 0,
    "outside-configured-window-missed": 0,
    "missing-merchant-missed": 0,
    "missing-merchant-both-missed": 0,
    "invalid-generic-merchant-missed": 0,
    "business-rule-credit-merchant-missed": 0,
    "bnpl-provider-bank-link-missed": 0
  };

  const falseMergeSubBucketCounts: Record<string, number> = {
    "same-amount-legit-repeat": 0,
    "repeated-same-day-transaction": 0,
    "salary-repeat-false-merge": 0,
    "cash-deposit-repeat-false-merge": 0,
    "different-merchant-false-merge": 0,
    "different-account-false-merge": 0,
    "different-type-false-merge": 0,
    "time-too-close-but-legit": 0,
    "time-window-overmerge": 0,
    "low-entropy-fingerprint": 0,
    "missing-merchant-overmerge": 0,
    "missing-account-overmerge": 0,
    "unknown-false-merge": 0
  };

  const severityCounts: Record<string, number> = {
    "CRITICAL": 0,
    "HIGH": 0,
    "MEDIUM": 0,
    "LOW": 0
  };

  const caseTypeCounts: Record<string, number> = {};
  const suggestedFixCounts: Record<string, number> = {};
  const conflictingReasonCounts: Record<string, number> = {};

  for (const record of records) {
    const n = record.messages.length;
    totalMessages += n;
    expectedUnique += record.expectedUniqueTransactions.length;

    // Determine CaseType
    let caseType = "Unknown Case";
    if (record.id.startsWith("exact-")) caseType = "Exact Duplicate";
    else if (record.id.startsWith("near-")) caseType = "Near Duplicate";
    else if (record.id.startsWith("multi-")) caseType = "Multi SMS";
    else if (record.id.startsWith("false-")) caseType = "False Merge Protection";
    else if (record.id.startsWith("edge-")) caseType = "Edge Case";

    // Use time of first expected transaction as fallback date for receipt time
    let fallbackDate = "2026-05-01T00:00:00.000Z";
    if (record.expectedUniqueTransactions.length > 0 && record.expectedUniqueTransactions[0].time) {
      const t = record.expectedUniqueTransactions[0].time;
      fallbackDate = t.includes("T") ? new Date(t).toISOString() : new Date(t + "T12:00:00").toISOString();
    }

    // Parse all messages and get hashes
    let hasEmptyParserOutput = false;
    const txInputs: any[] = [];
    const parsedList = record.messages.map((m, idx) => {
      const parsed = parseTransactionSMS(m.message, fallbackDate, m.sender);
      if (parsed === null) {
        hasEmptyParserOutput = true;
      } else {
        txInputs.push({
          body: m.message,
          date: fallbackDate,
          parsed,
          originalIndex: idx
        });
      }
      return parsed;
    });

    const actualGroups = dedupeTransactions(txInputs);
    const hashes = new Array(n).fill(null);
    actualGroups.forEach((g) => {
      const canonicalIdx = (g.canonical as any).originalIndex;
      hashes[canonicalIdx] = g.groupKey;
      g.duplicates.forEach((d) => {
        const dupIdx = (d as any).originalIndex;
        hashes[dupIdx] = g.groupKey;
      });
    });

    // Check outside-window expected duplicate condition
    let sampleIsOutsideWindow = false;
    for (const group of record.expectedDuplicateGroups) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const idxA = group[i];
          const idxB = group[j];
          const parsedA = parsedList[idxA];
          const parsedB = parsedList[idxB];
          if (parsedA && parsedB && parsedA.date && parsedB.date) {
            const timeDiffMinutes = Math.abs(new Date(parsedA.date).getTime() - new Date(parsedB.date).getTime()) / 60000;
            if (timeDiffMinutes > dedupeWindowMinutes) {
              sampleIsOutsideWindow = true;
              configViolations.push({
                type: "expected-duplicate-outside-window",
                sampleId: record.id,
                pairIndexes: [idxA, idxB].sort((a, b) => a - b),
                timeDiffMinutes: Number(timeDiffMinutes.toFixed(2)),
                dedupeWindowMinutes,
                reason: `Expected duplicate pair [${idxA}, ${idxB}] in sample ${record.id} has time difference of ${timeDiffMinutes.toFixed(2)} minutes, which exceeds the configured window of ${dedupeWindowMinutes} minutes.`
              });
            }
          }
        }
      }
    }
    if (sampleIsOutsideWindow) {
      outsideWindowExpectedDuplicateCount++;
      outsideWindowSampleIds.push(record.id);
    }

    // Count actual unique transactions (non-null unique hashes)
    const validHashes = hashes.filter((h): h is string => h !== null);
    const uniqueHashes = new Set(validHashes);
    actualUnique += uniqueHashes.size;

    // Duplicates removed is the number of parsed transactions minus the unique hashes
    const parsedCount = parsedList.filter(p => p !== null).length;
    duplicatesRemoved += Math.max(0, parsedCount - uniqueHashes.size);

    // Build actual groups (indices of grouped messages)
    const actualGroupsMap = new Map<string, number[]>();
    hashes.forEach((h, idx) => {
      if (h !== null) {
        if (!actualGroupsMap.has(h)) {
          actualGroupsMap.set(h, []);
        }
        actualGroupsMap.get(h)!.push(idx);
      }
    });
    const actualDuplicateGroups = Array.from(actualGroupsMap.values()).filter(g => g.length > 1);

    // Pairwise evaluation
    let sampleTP = 0;
    let sampleFP = 0;
    let sampleFN = 0;
    let sampleTN = 0;
    const falseMergedPairs: FailedSampleDetail["falseMergedPairs"] = [];
    const missedDuplicatePairs: FailedSampleDetail["missedDuplicatePairs"] = [];

    const notesLower = (record.notes || "").toLowerCase();

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const isExpectedDuplicate = record.expectedDuplicateGroups.some(
          (group) => group.includes(i) && group.includes(j)
        );
        const isActualDuplicate =
          hashes[i] !== null && hashes[j] !== null && hashes[i] === hashes[j];

        if (isExpectedDuplicate) {
          const parsedA = parsedList[i];
          const parsedB = parsedList[j];
          let isWithin = true;
          if (parsedA && parsedB && parsedA.date && parsedB.date) {
            const timeDiff = Math.abs(new Date(parsedA.date).getTime() - new Date(parsedB.date).getTime()) / 60000;
            if (timeDiff > dedupeWindowMinutes) {
              isWithin = false;
            }
          }
          if (isWithin) {
            validExpectedDuplicatePairs++;
          } else {
            invalidExpectedDuplicatePairs++;
          }

          if (!isActualDuplicate) {
            if (isWithin) {
              missedDuplicateWithinWindow++;
              trueEngineFN++;
            } else {
              missedDuplicateOutsideWindow++;
              configDrivenFN++;
            }
          }
        }

        if (isExpectedDuplicate && isActualDuplicate) {
          totalTP++;
          sampleTP++;
        } else if (!isExpectedDuplicate && isActualDuplicate) {
          totalFP++;
          sampleFP++;
          
          const parsedA = parsedList[i];
          const parsedB = parsedList[j];

          let diff = {
            amountMatch: false,
            accountMatch: false,
            merchantMatch: false,
            typeMatch: false,
            timeDiffMinutes: null as number | null
          };

          let falseMergeReason = "Unknown false merge comparison.";
          let suggestedEngineGuard = "Investigate deduplication fingerprint constraints.";
          const subBuckets: FalseMergedPairDetail["subBuckets"] = [];

          if (parsedA && parsedB) {
            diff.amountMatch = parsedA.transaction.amount === parsedB.transaction.amount;
            diff.typeMatch = parsedA.transaction.type === parsedB.transaction.type;
            diff.accountMatch = parsedA.account.number === parsedB.account.number;
            
            const merchantA = parsedA.transaction.merchant;
            const merchantB = parsedB.transaction.merchant;
            diff.merchantMatch = (merchantA || "").trim().toLowerCase() === (merchantB || "").trim().toLowerCase();
            
            if (parsedA.date && parsedB.date) {
              diff.timeDiffMinutes = Math.abs(new Date(parsedA.date).getTime() - new Date(parsedB.date).getTime()) / 60000;
            }

            const msgALower = record.messages[i].message.toLowerCase();
            const msgBLower = record.messages[j].message.toLowerCase();

            // 1. Different fields
            if (merchantA !== null && merchantB !== null && !diff.merchantMatch) {
              subBuckets.push("different-merchant-false-merge");
              falseMergeReason = `Different merchants ('${merchantA}' vs '${merchantB}').`;
              suggestedEngineGuard = "Prevent merging transactions with different non-null merchants.";
            }
            if (parsedA.account.number !== null && parsedB.account.number !== null && !diff.accountMatch) {
              subBuckets.push("different-account-false-merge");
              falseMergeReason = `Different account numbers ('${parsedA.account.number}' vs '${parsedB.account.number}').`;
              suggestedEngineGuard = "Prevent merging transactions with different non-null account numbers.";
            }
            if (!diff.typeMatch) {
              subBuckets.push("different-type-false-merge");
              falseMergeReason = `Different transaction types (${parsedA.transaction.type} vs ${parsedB.transaction.type}).`;
              suggestedEngineGuard = "Prevent merging transactions with different transaction types (debit vs credit).";
            }

            // 2. Missing fields
            if (merchantA === null || merchantB === null) {
              subBuckets.push("missing-merchant-overmerge");
              falseMergeReason = "One or both transactions have missing/null merchant.";
              suggestedEngineGuard = "Require merchant presence or apply strict fallback matching when merchant is missing.";
            }
            if (parsedA.account.number === null || parsedB.account.number === null) {
              subBuckets.push("missing-account-overmerge");
              falseMergeReason = "One or both transactions have missing/null account identifier.";
              suggestedEngineGuard = "Require account numbers or fallback sender bank identifier before deduplication.";
            }

            // 3. Low-entropy
            if ((merchantA === null && parsedA.account.number === null) || (merchantB === null && parsedB.account.number === null)) {
              subBuckets.push("low-entropy-fingerprint");
              falseMergeReason = "Low-entropy fingerprint (missing both merchant and account).";
              suggestedEngineGuard = "Avoid deduping messages that lack key merchant and account identity metadata.";
            }

            // 4. Specific patterns: Salary, Cash deposit
            if (diff.amountMatch && (msgALower.includes("salary") || msgBLower.includes("salary") || notesLower.includes("salary"))) {
              subBuckets.push("salary-repeat-false-merge");
              falseMergeReason = "Salary transactions repeat with same amount but are separate credits.";
              suggestedEngineGuard = "Bypass deduplication or use reference/sequence numbers for salary messages.";
            }
            if (diff.amountMatch && (msgALower.match(/(cash deposit|cdm|deposit)/) || msgBLower.match(/(cash deposit|cdm|deposit)/) || notesLower.includes("cash deposit") || notesLower.includes("cdm"))) {
              subBuckets.push("cash-deposit-repeat-false-merge");
              falseMergeReason = "Cash deposits repeat on the same day with identical amounts.";
              suggestedEngineGuard = "Use unique reference numbers or shorter time windows for cash deposits.";
            }

            // 5. Time boundaries
            if (diff.timeDiffMinutes !== null) {
              if (diff.timeDiffMinutes <= 5) {
                subBuckets.push("time-too-close-but-legit");
                falseMergeReason = `Time difference too close (${diff.timeDiffMinutes.toFixed(1)}m) but expected different.`;
                suggestedEngineGuard = "Incorporate transaction reference/sequence numbers to differentiate rapid-fire legit transactions.";
              } else {
                subBuckets.push("time-window-overmerge");
                falseMergeReason = `Time difference (${diff.timeDiffMinutes.toFixed(1)}m) exceeds 5m window but got merged on same yyyyMMdd.`;
                suggestedEngineGuard = "Enforce time-window bounds in deduplication hash generation.";
              }
            }

            // 6. General same-amount same-day / legit repeat
            if (diff.amountMatch) {
              if (diff.accountMatch && diff.merchantMatch && diff.typeMatch) {
                subBuckets.push("repeated-same-day-transaction");
                falseMergeReason = "Identical transaction details repeated on the same day.";
                suggestedEngineGuard = "Differentiate same-day identical transactions using reference numbers or sub-day counters.";
              } else {
                subBuckets.push("same-amount-legit-repeat");
                falseMergeReason = "Legitimate separate transactions with the same amount.";
                suggestedEngineGuard = "Verify all transaction details match strictly before deduplication.";
              }
            }

            if (subBuckets.length === 0) {
              subBuckets.push("unknown-false-merge");
            }
          } else {
            subBuckets.push("unknown-false-merge");
          }

          // Accumulate counts
          subBuckets.forEach(b => {
            falseMergeSubBucketCounts[b]++;
          });

          const falseMergeComparison = computeNormalizedComparison(parsedA, parsedB);
          if (!falseMergeComparison.merchantMatchRaw) {
            rawMerchantMismatchCount++;
          }
          if (!falseMergeComparison.merchantMatchNormalized) {
            normalizedMerchantMismatchCount++;
          }
          if (!falseMergeComparison.accountMatchRaw) {
            rawAccountMismatchCount++;
          }
          if (!falseMergeComparison.accountMatchNormalized) {
            normalizedAccountMismatchCount++;
          }

          falseMergedPairs.push({
            messageIndexA: i,
            messageIndexB: j,
            messageA: record.messages[i].message,
            messageB: record.messages[j].message,
            parsedTxnA: parsedA,
            parsedTxnB: parsedB,
            hashA: hashes[i],
            hashB: hashes[j],
            actualSameGroup: true,
            expectedDifferentGroup: true,
            amountMatch: diff.amountMatch,
            accountMatch: diff.accountMatch,
            merchantMatch: diff.merchantMatch,
            typeMatch: diff.typeMatch,
            timeDiffMinutes: diff.timeDiffMinutes,
            falseMergeReason,
            suggestedEngineGuard,
            subBuckets,
            ...falseMergeComparison
          });
        } else if (isExpectedDuplicate && !isActualDuplicate) {
          totalFN++;
          sampleFN++;

          // Pair classification logic
          const parsedA = parsedList[i];
          const parsedB = parsedList[j];
          let merchantA: string | null = null;
          let merchantB: string | null = null;

          const groupA = Array.from(actualGroupsMap.values()).find(g => g.includes(i)) || [i];
          const groupB = Array.from(actualGroupsMap.values()).find(g => g.includes(j)) || [j];
          let diagnosisBucket: "missing-merchant-both-missed" | "missing-merchant-missed" | "invalid-generic-merchant-missed" | "business-rule-credit-merchant-missed" | "merchant-normalization-missed" | null = null;
          let merchantPresenceStatus = "bothMissing";
          let diagnosisReason = "Both merchant names are missing/null.";
          let bnplDetails: BNPLDetails | undefined = undefined;

          let diff: MissedDuplicatePairDetail["diff"] = {
            amountMatch: false,
            accountMatch: false,
            merchantMatch: false,
            typeMatch: false,
            timeDiffMinutes: null,
            scoreIfAvailable: null,
            rawMerchantA: null,
            rawMerchantB: null,
            normalizedMerchantA: null,
            normalizedMerchantB: null,
            merchantPresence: "bothMissing"
          };

          let missReason = "Unknown comparison difference.";
          let suggestedFixArea = "Investigate parser extraction output.";
          const subBuckets: MissedDuplicatePairDetail["subBuckets"] = [];

          if (parsedA && parsedB) {
            diff.amountMatch = parsedA.transaction.amount === parsedB.transaction.amount;
            diff.typeMatch = parsedA.transaction.type === parsedB.transaction.type;
            diff.accountMatch = parsedA.account.number === parsedB.account.number;
            
            merchantA = parsedA.transaction.merchant;
            merchantB = parsedB.transaction.merchant;
            diff.merchantMatch = (merchantA || "").trim().toLowerCase() === (merchantB || "").trim().toLowerCase();
            
            if (parsedA.date && parsedB.date) {
              diff.timeDiffMinutes = Math.abs(new Date(parsedA.date).getTime() - new Date(parsedB.date).getTime()) / 60000;
            }
            diff.scoreIfAvailable = `${parsedA.confidence} / ${parsedB.confidence}`;

            diff.rawMerchantA = merchantA;
            diff.rawMerchantB = merchantB;

            const isMerchantAEmpty = !merchantA || merchantA.trim() === "";
            const isMerchantBEmpty = !merchantB || merchantB.trim() === "";
            const normA = !merchantA ? "" : merchantA.trim().toLowerCase();
            const normB = !merchantB ? "" : merchantB.trim().toLowerCase();
            diff.normalizedMerchantA = normA;
            diff.normalizedMerchantB = normB;

            const invalidGenericMerchants = new Set([
              "txn", "upi", "ref", "reference", "payment", "transaction", "bank", "debit", "credit", "a/c", "account"
            ]);
            const isAVal = !isMerchantAEmpty && !invalidGenericMerchants.has(normA);
            const isBVal = !isMerchantBEmpty && !invalidGenericMerchants.has(normB);
            const isAGen = !isMerchantAEmpty && invalidGenericMerchants.has(normA);
            const isBGen = !isMerchantBEmpty && invalidGenericMerchants.has(normB);
            const isAMiss = isMerchantAEmpty;
            const isBMiss = isMerchantBEmpty;

            const validityA = isAMiss ? "missing" : (isAGen ? "invalidGeneric" : "valid");
            const validityB = isBMiss ? "missing" : (isBGen ? "invalidGeneric" : "valid");
            diff.merchantValidityA = validityA;
            diff.merchantValidityB = validityB;

            if ((isAMiss && isBGen) || (isBMiss && isAGen)) {
              diff.merchantPresence = "invalidGenericVsMissing";
            } else if (isAMiss && isBMiss) {
              diff.merchantPresence = "bothMissing";
            } else if (isAMiss || isBMiss) {
              diff.merchantPresence = "oneMissing";
            } else {
              diff.merchantPresence = "bothPresent";
            }

            // Classify missed duplicate pair
            diagnosisBucket = null;
            merchantPresenceStatus = "bothMissing";
            diagnosisReason = "Both merchant names are missing/null.";

            const isCredit = parsedA.transaction.type === "credit" || parsedB.transaction.type === "credit";
            const isSalaryOrCashDepositOrBusinessCredit = (m: string | null) => {
              if (!m) return false;
              const norm = m.toLowerCase().trim();
              return norm.includes("salary") || norm.includes("cash deposit") || norm.includes("cdm") || norm.includes("deposit") || norm.includes("business-rule credit") || norm.includes("business-rule-credit") || norm.includes("business credit");
            };
            const hasBusinessCredit = isSalaryOrCashDepositOrBusinessCredit(merchantA) || isSalaryOrCashDepositOrBusinessCredit(merchantB);

            if (isCredit && hasBusinessCredit) {
              diagnosisBucket = "business-rule-credit-merchant-missed";
              merchantPresenceStatus = (isAMiss && isBMiss) ? "bothMissing" : ((isAMiss || isBMiss) ? "oneMissing" : "bothPresent");
              diagnosisReason = "Credit transaction where merchant name is salary, cash deposit, or business-rule credit.";
            } else if ((isAMiss && isBGen) || (isBMiss && isAGen)) {
              diagnosisBucket = "invalid-generic-merchant-missed";
              merchantPresenceStatus = "invalidGenericVsMissing";
              diagnosisReason = "One merchant is missing/null and the other is an invalid generic merchant placeholder.";
            } else if ((isAVal && isBMiss) || (isBVal && isAMiss)) {
              diagnosisBucket = "missing-merchant-missed";
              merchantPresenceStatus = "oneMissing";
              diagnosisReason = "One merchant is missing/null and the other is a valid merchant.";
            } else if ((isAVal && isBGen) || (isBVal && isAGen)) {
              diagnosisBucket = "invalid-generic-merchant-missed";
              merchantPresenceStatus = "genericVsValid";
              diagnosisReason = "One merchant is valid and the other is an invalid generic merchant placeholder.";
            } else if (isAVal && isBVal && normA !== normB) {
              diagnosisBucket = "merchant-normalization-missed";
              merchantPresenceStatus = "bothPresent";
              diagnosisReason = "Both merchants are valid but their normalized names differ.";
            } else if (isAMiss && isBMiss) {
              diagnosisBucket = "missing-merchant-both-missed";
              merchantPresenceStatus = "bothMissing";
              diagnosisReason = "Both merchant names are missing/null.";
            } else {
              if (normA === normB) {
                diagnosisBucket = null;
                merchantPresenceStatus = (isAMiss && isBMiss) ? "bothMissing" : ((isAMiss || isBMiss) ? "oneMissing" : "bothPresent");
                diagnosisReason = "Merchants matched or matched as generic/missing.";
              } else {
                diagnosisBucket = "merchant-normalization-missed";
                merchantPresenceStatus = "bothPresent";
                diagnosisReason = "Both merchants are generic but differ.";
              }
            }

            diff.merchantPresenceStatus = merchantPresenceStatus;
            diff.diagnosisReason = diagnosisReason;

            if (diagnosisBucket === "missing-merchant-both-missed") {
              missingBothMerchantCount++;
            } else if (diagnosisBucket === "missing-merchant-missed") {
              missingMerchantMissedCount++;
            } else if (diagnosisBucket === "merchant-normalization-missed") {
              merchantNormalizationMissedCount++;
            } else if (diagnosisBucket === "invalid-generic-merchant-missed") {
              invalidGenericMerchantMissedCount++;
            } else if (diagnosisBucket === "business-rule-credit-merchant-missed") {
              businessRuleCreditMerchantMissedCount++;
            }
          } else {
            diff.merchantPresence = "bothMissing";
            diff.merchantValidityA = "missing";
            diff.merchantValidityB = "missing";
            diff.merchantPresenceStatus = "bothMissing";
            diff.diagnosisReason = "One or both parsed transactions are null.";
            missingBothMerchantCount++;
          }

          let isWithinWindow = true;
          if (diff.timeDiffMinutes !== null && diff.timeDiffMinutes > dedupeWindowMinutes) {
            isWithinWindow = false;
          }

          if (!isWithinWindow) {
            missReason = "outside-configured-window";
            suggestedFixArea = "None (Config violation)";
          } else {
            if (parsedA && parsedB) {
              // Multi-label rule logic
              if (!diff.amountMatch) {
                subBuckets.push("amount-mismatch-missed");
                missReason = `Amount mismatch (₹${parsedA.transaction.amount} vs ₹${parsedB.transaction.amount}).`;
                suggestedFixArea = "Enhance the amount extractor to handle complex text representations.";
              }
              if (!diff.typeMatch) {
                subBuckets.push("type-mismatch-missed");
                missReason = `Transaction type mismatch (${parsedA.transaction.type} vs ${parsedB.transaction.type}).`;
                suggestedFixArea = "Enhance transaction type extractor keywords.";
              }
              if (!diff.accountMatch) {
                subBuckets.push("account-mismatch-missed");
                missReason = `Account number mismatch ('${parsedA.account.number}' vs '${parsedB.account.number}').`;
                suggestedFixArea = "Verify account resolution rules or match sender bankId.";
              }

              // Diagnosis Bucket Integration
              if (diagnosisBucket) {
                subBuckets.push(diagnosisBucket);
                if (diagnosisBucket === "missing-merchant-both-missed") {
                  missReason = "Both merchant names are missing/null.";
                  suggestedFixArea = "Require merchant presence in SMS messages.";
                } else if (diagnosisBucket === "missing-merchant-missed") {
                  missReason = `One message is missing merchant name ('${diff.rawMerchantA}' vs '${diff.rawMerchantB}').`;
                  suggestedFixArea = "Improve merchant name extraction from SMS text.";
                } else if (diagnosisBucket === "merchant-normalization-missed") {
                  missReason = `Merchant spelling variation ('${diff.rawMerchantA}' vs '${diff.rawMerchantB}').`;
                  suggestedFixArea = "Enhance the merchant normalizer to normalize spacing, delimiters, and suffixes.";
                } else if (diagnosisBucket === "invalid-generic-merchant-missed") {
                  missReason = `One or both messages contain an invalid generic merchant placeholder ('${diff.rawMerchantA}' vs '${diff.rawMerchantB}').`;
                  suggestedFixArea = "Improve merchant name extraction to resolve actual merchant instead of placeholder.";
                } else if (diagnosisBucket === "business-rule-credit-merchant-missed") {
                  missReason = `Credit transaction with salary/cash deposit/business credit merchant ('${diff.rawMerchantA}' vs '${diff.rawMerchantB}').`;
                  suggestedFixArea = "Apply business rule exception or separate account routing for credit transactions.";
                }
              }

              if (diff.timeDiffMinutes !== null) {
                if (diff.timeDiffMinutes > dedupeWindowMinutes) {
                  subBuckets.push("outside-configured-window-missed");
                  missReason = `Transaction time difference (${diff.timeDiffMinutes.toFixed(1)} minutes) exceeded window limit of ${dedupeWindowMinutes}m.`;
                  suggestedFixArea = "Adjust deduplication window configuration or match transaction date ranges.";
                }
                if (diff.timeDiffMinutes >= 4 && diff.timeDiffMinutes <= 6) {
                  subBuckets.push("time-window-boundary-missed");
                  missReason = `Transaction time difference (${diff.timeDiffMinutes.toFixed(1)} minutes) is near the deduplication window limit.`;
                  suggestedFixArea = "Calibrate deduplication window size or allow flexible boundaries for matching accounts.";
                }
              }

            const isBNPLA = notesLower.includes("bnpl") || notesLower.includes("lazy") || notesLower.includes("simpl") ||
                              record.messages[i].sender.toLowerCase().match(/(simpl|lazy|paytm|amazon|flipk)/) ||
                              record.messages[i].message.toLowerCase().match(/(simpl|lazy|pay later|amazon pay|flipkart pay)/);
            const isBNPLB = notesLower.includes("bnpl") || notesLower.includes("lazy") || notesLower.includes("simpl") ||
                              record.messages[j].sender.toLowerCase().match(/(simpl|lazy|paytm|amazon|flipk)/) ||
                              record.messages[j].message.toLowerCase().match(/(simpl|lazy|pay later|amazon pay|flipkart pay)/);
            
            if (isBNPLA || isBNPLB) {
              subBuckets.push("bnpl-bank-wording-missed");
              // Only override general reason if it's currently generic
              if (missReason.includes("Unknown")) {
                missReason = "BNPL provider vs bank account wording alert mismatch.";
                suggestedFixArea = "Dedupe BNPL provider wording alerts with their corresponding bank accounts.";
              }
            }

            const getBNPLProviderName = (msg: string, sender: string): string | null => {
               const text = (msg + " " + sender).toUpperCase();
               if (text.includes("SIMPL")) return "Simpl";
               if (text.includes("LAZYPAY") || text.includes("LAZY PAY")) return "LazyPay";
               if (text.includes("AMAZON PAY LATER") || text.includes("AMAZONPAY")) return "Amazon Pay Later";
               if (text.includes("FLIPKART PAY LATER") || text.includes("FLIPKART")) return "Flipkart Pay Later";
               if (text.includes("ZESTMONEY")) return "ZestMoney";
               return null;
             };

             const providerA = getBNPLProviderName(record.messages[i].message, record.messages[i].sender);
             const providerB = getBNPLProviderName(record.messages[j].message, record.messages[j].sender);
             const isDebitA = parsedA?.transaction?.type === "debit";
             const isDebitB = parsedB?.transaction?.type === "debit";

             const isBNPLProviderBankLink = (providerA !== null && providerB === null && isDebitB) ||
                                            (providerB !== null && providerA === null && isDebitA);

             if (isBNPLProviderBankLink) {
               subBuckets.push("bnpl-provider-bank-link-missed");
               const pName = (providerA || providerB) as string;
               
               const isAProvider = providerA !== null;
               const bankSender = isAProvider ? record.messages[j].sender : record.messages[i].sender;
               const providerMerchant = isAProvider ? parsedA.transaction.merchant : parsedB.transaction.merchant;
               const bankMerchant = isAProvider ? parsedB.transaction.merchant : parsedA.transaction.merchant;
               const providerAccount = isAProvider ? parsedA.account.number : parsedB.account.number;
               const bankAccount = isAProvider ? parsedB.account.number : parsedA.account.number;

               const merchantRelated = isMerchantRelated(providerMerchant, bankMerchant);
               const dateSame = isDateSame(parsedA.date, parsedB.date);
               const sameTxnCandidate = diff.amountMatch && diff.typeMatch && merchantRelated && dateSame;

               let bnplDiagnosisReason = `BNPL provider link missed. Provider: ${pName}, Bank: ${bankSender}.`;
               let bnplSuggestedFixArea = "Link BNPL provider transactions to bank account debits using transaction timing and merchant indicators.";

               if (!diff.amountMatch) {
                 bnplDiagnosisReason += " Amount mismatch.";
                 bnplSuggestedFixArea = "Verify amount mappings and ensure both messages capture correct debit values.";
               }
               if (!merchantRelated) {
                 bnplDiagnosisReason += " Merchant mismatch.";
               }
               if (!diff.accountMatch) {
                 bnplDiagnosisReason += " Account mismatch.";
               }

               bnplDetails = {
                 bnplProvider: pName,
                 bankSender,
                 providerMerchant,
                 bankMerchant,
                 providerAccount,
                 bankAccount,
                 amountMatch: diff.amountMatch,
                 merchantMatch: diff.merchantMatch,
                 accountMatch: diff.accountMatch,
                 typeMatch: diff.typeMatch,
                 timeDiffMinutes: diff.timeDiffMinutes,
                 sameTransactionCandidate: sameTxnCandidate,
                 bnplDiagnosisReason,
                 bnplSuggestedFixArea
               };

               bnplProviderBankMissedCount++;
               bnplProviderBreakdown[pName] = (bnplProviderBreakdown[pName] || 0) + 1;
               if (!diff.merchantMatch) {
                 bnplMerchantMismatchCount++;
               }
               if (!diff.accountMatch) {
                 bnplAccountMismatchCount++;
               }
               if (!diff.amountMatch) {
                 bnplAmountMismatchCount++;
               }
               if (diff.timeDiffMinutes === null || diff.timeDiffMinutes > dedupeWindowMinutes) {
                 bnplTimeMismatchCount++;
               }

               if (missReason.includes("Unknown") || missReason.includes("One message is missing merchant") || missReason.includes("Merchant spelling variation")) {
                 missReason = `BNPL link missed between ${pName} and bank debit (amount candidate: ${sameTxnCandidate ? "YES" : "NO"}).`;
                 suggestedFixArea = "Link BNPL provider transactions to bank account debits.";
               }
             }

            if (notesLower.includes("multi-channel") || notesLower.includes("channel")) {
              subBuckets.push("multi-channel-missed");
              missReason = "Transaction sent across multiple distinct communication channels.";
              suggestedFixArea = "Deduplicate multi-channel notifications containing identical transaction content.";
            }
            
            if (parsedA?.confidence === "low" || parsedB?.confidence === "low") {
              subBuckets.push("low-score-missed");
            }
            
            if (subBuckets.length === 0) {
              if (record.id.startsWith("exact-")) {
                subBuckets.push("exact-duplicate-missed");
              } else {
                subBuckets.push("near-duplicate-missed");
              }
            }
          } else {
              subBuckets.push("unknown-missed");
              missReason = "One or both messages failed to parse as valid transactions.";
              suggestedFixArea = "Verify parser validation rules for missing amount or required transaction fields.";
            }
          }

          // Accumulate counts
          subBuckets.forEach(b => {
            subBucketCounts[b]++;
          });

          conflictingReasonCounts[missReason] = (conflictingReasonCounts[missReason] || 0) + 1;

          const missedComparison = computeNormalizedComparison(parsedA, parsedB);
          if (!missedComparison.merchantMatchRaw) {
            rawMerchantMismatchCount++;
          }
          if (!missedComparison.merchantMatchNormalized) {
            normalizedMerchantMismatchCount++;
          }
          if (!missedComparison.accountMatchRaw) {
            rawAccountMismatchCount++;
          }
          if (!missedComparison.accountMatchNormalized) {
            normalizedAccountMismatchCount++;
          }

          if (missedComparison.comparisonStrength === "STRONG") {
            strongCandidateMissCount++;
          } else if (missedComparison.comparisonStrength === "MEDIUM") {
            mediumCandidateMissCount++;
          } else if (missedComparison.comparisonStrength === "WEAK") {
            weakCandidateMissCount++;
          }

          missedDuplicatePairs.push({
            messageIndexA: i,
            messageIndexB: j,
            messageA: record.messages[i].message,
            messageB: record.messages[j].message,
            parsedTxnA: parsedA,
            parsedTxnB: parsedB,
            hashA: hashes[i],
            hashB: hashes[j],
            expectedSameGroup: true,
            actualGroupA: groupA,
            actualGroupB: groupB,
            diff,
            missReason,
            suggestedFixArea,
            subBuckets,
            timeDiffMinutes: diff.timeDiffMinutes,
            dedupeWindowMinutes,
            withinWindow: isWithinWindow,
            failureSource: isWithinWindow ? "engine" : "config",
            bnplDetails,
            ...missedComparison
          });
        } else {
          totalTN++;
          sampleTN++;
        }
      }
    }

    const expectedPartition = getNormalizedPartition(n, record.expectedDuplicateGroups);
    const actualPartition = getNormalizedPartition(n, actualDuplicateGroups);
    const isExactMatch = expectedPartition === actualPartition;

    if (isExactMatch) {
      exactMatchCount++;
    }
    if (sampleFP === 0 && sampleFN === 0 && isExactMatch) {
      passedSamplesCount++;
    }

    // Determine Buckets
    const sampleBuckets: FailedSampleDetail["buckets"] = [];
    if (sampleFP > 0) sampleBuckets.push("false-merge");
    if (sampleFN > 0) sampleBuckets.push("missed-duplicate");
    if (uniqueHashes.size !== record.expectedUniqueTransactions.length) sampleBuckets.push("group-count-mismatch");
    if (hasEmptyParserOutput) sampleBuckets.push("parser-output-invalid");

    if (notesLower.includes("bnpl") || notesLower.includes("lazy") || notesLower.includes("simpl")) {
      sampleBuckets.push("bnpl-bank-wording-mismatch");
    }
    if (notesLower.includes("cash deposit") || notesLower.includes("cdm") || notesLower.includes("same-day")) {
      if (sampleFP > 0) {
        sampleBuckets.push("repeated-same-day-false-merge");
      } else {
        sampleBuckets.push("same-amount-legit-repeat");
      }
    }
    if (notesLower.includes("merchant spelling") || notesLower.includes("spelling") || notesLower.includes("wording") || notesLower.includes("salary")) {
      sampleBuckets.push("merchant-spelling-variation");
    }
    if (notesLower.includes("multi-sms") || notesLower.includes("multi sms") || notesLower.includes("multiple messages")) {
      sampleBuckets.push("multi-sms-same-transaction");
    }
    if (notesLower.includes("window") || notesLower.includes("time") || notesLower.includes("date")) {
      sampleBuckets.push("time-window-boundary");
    }

    // Check if canonical transactions match or differs in fields
    const isWrongCanonical = !isExactMatch && sampleFP === 0 && sampleFN === 0;
    if (isWrongCanonical) {
      sampleBuckets.push("wrong-canonical-transaction");
    }

    // Determine Severity
    let severity: FailedSampleDetail["severity"] = "LOW";
    if (sampleFP > 0) severity = "CRITICAL";
    else if (sampleFN > 0) severity = "HIGH";
    else if (uniqueHashes.size !== record.expectedUniqueTransactions.length) severity = "MEDIUM";

    // Auto-generate actionable reason and suggestedNextFixArea
    let reason = "The sample satisfies all deduplication requirements.";
    let suggestedNextFixArea = "No action needed.";

    if (sampleFP > 0) {
      reason = "Multiple distinct transactions were incorrectly merged because they produced the same canonical hash.";
      suggestedNextFixArea = "Introduce finer metadata to generateSMSHash (such as sub-day transaction counter or sequence) to differentiate identical same-day transactions.";
    } else if (sampleFN > 0) {
      // Pick first missed pair suggested fix area as overall suggestion
      if (missedDuplicatePairs.length > 0) {
        reason = missedDuplicatePairs[0].missReason;
        suggestedNextFixArea = missedDuplicatePairs[0].suggestedFixArea;
      }
    } else if (!isExactMatch) {
      reason = "Actual message grouping structure (partitions) did not match the expected duplicate group definition.";
      suggestedNextFixArea = "Verify parser validation rules and update duplicate partition matching rules in dedupe-evaluator.";
    }
    if (sampleFP > 0 || sampleFN > 0 || !isExactMatch) {
      // Increment bucket counts
      sampleBuckets.forEach(b => {
        if (typeof bucketCounts[b] !== "undefined") {
          bucketCounts[b]++;
        }
      });
      severityCounts[severity]++;
      caseTypeCounts[caseType] = (caseTypeCounts[caseType] || 0) + 1;
      suggestedFixCounts[suggestedNextFixArea] = (suggestedFixCounts[suggestedNextFixArea] || 0) + 1;

      // Extract all subBuckets from both falseMergedPairs and missedDuplicatePairs, deduplicate, and sort alphabetically
      const subBucketsSet = new Set<string>();
      falseMergedPairs.forEach((p: any) => {
        if (p.subBuckets) p.subBuckets.forEach((sb: string) => subBucketsSet.add(sb));
      });
      missedDuplicatePairs.forEach((p: any) => {
        if (p.subBuckets) p.subBuckets.forEach((sb: string) => subBucketsSet.add(sb));
      });
      const subBuckets = Array.from(subBucketsSet).sort();

      // Sort individual pairs deterministically by pairIndexes: messageIndexA then messageIndexB
      const sortedFalseMergedPairs = [...falseMergedPairs].sort((a, b) => {
        if (a.messageIndexA !== b.messageIndexA) return a.messageIndexA - b.messageIndexA;
        return a.messageIndexB - b.messageIndexB;
      }).map((p: any) => {
        if (p.subBuckets) {
          p.subBuckets = [...p.subBuckets].sort();
        }
        return p;
      });

      const sortedMissedDuplicatePairs = [...missedDuplicatePairs].sort((a, b) => {
        if (a.messageIndexA !== b.messageIndexA) return a.messageIndexA - b.messageIndexA;
        return a.messageIndexB - b.messageIndexB;
      }).map((p: any) => {
        if (p.subBuckets) {
          p.subBuckets = [...p.subBuckets].sort();
        }
        return p;
      });

      failedSamples.push({
        id: record.id,
        caseType,
        severity,
        buckets: [...sampleBuckets].sort(),
        subBuckets,
        notes: record.notes,
        expectedDuplicateGroups: record.expectedDuplicateGroups,
        actualDuplicateGroups,
        falseMergedPairs: sortedFalseMergedPairs,
        missedDuplicatePairs: sortedMissedDuplicatePairs,
        diagnosis: reason
      });
    }
  }

  // Sort failed samples: Severity (CRITICAL -> HIGH -> MEDIUM -> LOW), then by ID alphabetically
  const severityWeight: Record<string, number> = { "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
  failedSamples.sort((a, b) => {
    const weightA = severityWeight[a.severity] || 0;
    const weightB = severityWeight[b.severity] || 0;
    if (weightA !== weightB) {
      return weightB - weightA; // Higher weight first
    }
    const cmpId = a.id.localeCompare(b.id);
    if (cmpId !== 0) return cmpId;
    return a.caseType.localeCompare(b.caseType);
  });

  // Calculate global precision, recall, F1, falseMergeRate, missedDuplicateRate
  const precisionDenom = totalTP + totalFP;
  const recallDenom = totalTP + totalFN;
  const fpTnDenom = totalFP + totalTN;

  const dedupePrecision = precisionDenom > 0 ? Number(((totalTP / precisionDenom) * 100).toFixed(2)) : 100;
  const dedupeRecall = recallDenom > 0 ? Number(((totalTP / recallDenom) * 100).toFixed(2)) : 100;
  const dedupeF1 = (dedupePrecision + dedupeRecall) > 0 ? Number(((2 * dedupePrecision * dedupeRecall) / (dedupePrecision + dedupeRecall)).toFixed(2)) : 100;
  const falseMergeRate = fpTnDenom > 0 ? Number(((totalFP / fpTnDenom) * 100).toFixed(2)) : 0;
  const missedDuplicateRate = recallDenom > 0 ? Number(((totalFN / recallDenom) * 100).toFixed(2)) : 0;

  const samplePassRate = totalSamples > 0 ? Number(((passedSamplesCount / totalSamples) * 100).toFixed(2)) : 100;
  const groupExactMatchAccuracy = totalSamples > 0 ? Number(((exactMatchCount / totalSamples) * 100).toFixed(2)) : 100;

  const topFailingCaseTypes = Object.entries(caseTypeCounts)
    .map(([caseType, count]) => ({ caseType, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.caseType.localeCompare(b.caseType);
    });

  const topSuggestedNextFixArea = Object.entries(suggestedFixCounts)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.area.localeCompare(b.area);
    });

  const topConflictingReasons = Object.entries(conflictingReasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.reason.localeCompare(b.reason);
    });

  // Stable sort violations
  configViolations.sort((a, b) => {
    const cmp = a.sampleId.localeCompare(b.sampleId);
    if (cmp !== 0) return cmp;
    const cmpA = a.pairIndexes[0] - b.pairIndexes[0];
    if (cmpA !== 0) return cmpA;
    return a.pairIndexes[1] - b.pairIndexes[1];
  });

  // Alphabetical key sorting helper
  function sortObjectKeys<T extends Record<string, any>>(obj: T): T {
    const sorted: any = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  return {
    metrics: {
      totalSamples,
      totalMessages,
      expectedUnique,
      actualUnique,
      duplicatesRemoved,
      pairwiseTP: totalTP,
      pairwiseFP: totalFP,
      pairwiseFN: totalFN,
      pairwiseTN: totalTN,
      dedupePrecision,
      dedupeRecall,
      dedupeF1,
      falseMergeRate,
      missedDuplicateRate,
      samplePassRate,
      groupExactMatchAccuracy,
      configViolationCount: configViolations.length,
      samplesWithConfigViolation: Array.from(new Set(configViolations.map(v => v.sampleId))).sort(),
      expectedDuplicatePairsOutsideWindow: configViolations.filter(v => v.type === "expected-duplicate-outside-window").length,
      configValid: configViolations.length === 0
    },
    failedSamples,
    bucketCounts: sortObjectKeys(bucketCounts),
    severityCounts: sortObjectKeys(severityCounts),
    topFailingCaseTypes,
    topSuggestedNextFixArea,
    subBucketCounts: sortObjectKeys(subBucketCounts),
    falseMergeSubBucketCounts: sortObjectKeys(falseMergeSubBucketCounts),
    outsideWindowExpectedDuplicateCount,
    outsideWindowSampleIds,
    topConflictingReasons,
    configViolations,
    validExpectedDuplicatePairs,
    invalidExpectedDuplicatePairs,
    missedDuplicateWithinWindow,
    missedDuplicateOutsideWindow,
    trueEngineFN,
    configDrivenFN,
    missingMerchantMissedCount,
    merchantNormalizationMissedCount,
    missingBothMerchantCount,
    invalidGenericMerchantMissedCount,
    businessRuleCreditMerchantMissedCount,
    bnplProviderBankMissedCount,
    bnplProviderBreakdown: sortObjectKeys(bnplProviderBreakdown),
    bnplMerchantMismatchCount,
    bnplAccountMismatchCount,
    bnplAmountMismatchCount,
    bnplTimeMismatchCount,
    rawMerchantMismatchCount,
    normalizedMerchantMismatchCount,
    rawAccountMismatchCount,
    normalizedAccountMismatchCount,
    strongCandidateMissCount,
    mediumCandidateMissCount,
    weakCandidateMissCount
  };
}
