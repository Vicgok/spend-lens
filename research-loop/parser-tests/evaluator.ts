import { readdirSync, readFileSync } from "fs";
import path from "path";

import { parseTransactionSMS } from "../../src/features/sms-parser/engine";

export interface CorpusExpectation {
  transactionType: "debit" | "credit" | null;
  amount: number | null;
  merchant: string | null;
  accountCard: string | null;
}

export interface CorpusRecord {
  id?: string;
  message: string;
  sender?: string;
  receivedDate?: string;
  expected: CorpusExpectation | null;
}

export interface AccuracySummary {
  totalSamples: number;
  positiveSamples: number;
  negativeSamples: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  detectionAccuracy: number;
  typeAccuracy: number;
  amountAccuracy: number;
  merchantAccuracy: number;
  accountAccuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  overallAccuracy: number;
}

interface EvaluationCounts {
  totalSamples: number;
  positiveSamples: number;
  negativeSamples: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  typeMatches: number;
  amountMatches: number;
  merchantMatches: number;
  accountMatches: number;
  overallMatches: number;
}

const DEFAULT_RECEIVED_DATE = "2026-06-19T00:00:00.000Z";

function normalizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : null;
}

function normalizeAccountCard(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  return normalizeText(trimmed);
}

function normalizeAmount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Number(value.toFixed(2));
}

function calculateRate(matches: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Number(((matches / total) * 100).toFixed(2));
}

export function loadCorpus(corpusDir: string): CorpusRecord[] {
  const files = readdirSync(corpusDir)
    .filter((file) => file.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  const records: CorpusRecord[] = [];

  for (const file of files) {
    const filePath = path.join(corpusDir, file);
    const content = JSON.parse(
      readFileSync(filePath, "utf8"),
    ) as CorpusRecord[];

    if (!Array.isArray(content)) {
      throw new Error(`Corpus file must contain an array: ${filePath}`);
    }

    records.push(...content);
  }

  return records;
}

export function evaluateCorpus(records: CorpusRecord[]): AccuracySummary {
  const counts: EvaluationCounts = {
    totalSamples: records.length,
    positiveSamples: 0,
    negativeSamples: 0,
    truePositives: 0,
    trueNegatives: 0,
    falsePositives: 0,
    falseNegatives: 0,
    typeMatches: 0,
    amountMatches: 0,
    merchantMatches: 0,
    accountMatches: 0,
    overallMatches: 0,
  };

  for (const record of records) {
    const expectedDetected = record.expected !== null;
    const parsed = parseTransactionSMS(
      record.message,
      record.receivedDate ?? DEFAULT_RECEIVED_DATE,
      record.sender,
    );
    const actualDetected = parsed !== null;

    if (expectedDetected) {
      counts.positiveSamples += 1;
    } else {
      counts.negativeSamples += 1;
    }

    if (expectedDetected && actualDetected) {
      counts.truePositives += 1;
    } else if (!expectedDetected && !actualDetected) {
      counts.trueNegatives += 1;
    } else if (!expectedDetected && actualDetected) {
      counts.falsePositives += 1;
    } else {
      counts.falseNegatives += 1;
    }

    if (!expectedDetected || !record.expected) {
      if (!actualDetected) {
        counts.overallMatches += 1;
      }
      continue;
    }

    const actualType = parsed?.transaction.type ?? null;
    const actualAmount = normalizeAmount(parsed?.transaction.amount);
    const actualMerchant = normalizeText(parsed?.transaction.merchant);
    const actualAccountCard = normalizeAccountCard(
      parsed?.account.number ?? parsed?.account.name,
    );

    const expectedType = record.expected.transactionType;
    const expectedAmount = normalizeAmount(record.expected.amount);
    const expectedMerchant = normalizeText(record.expected.merchant);
    const expectedAccountCard = normalizeAccountCard(record.expected.accountCard);

    const typeMatch = actualType === expectedType;
    const amountMatch = actualAmount === expectedAmount;
    const merchantMatch = actualMerchant === expectedMerchant;
    const accountMatch = actualAccountCard === expectedAccountCard;

    if (typeMatch) {
      counts.typeMatches += 1;
    }

    if (amountMatch) {
      counts.amountMatches += 1;
    }

    if (merchantMatch) {
      counts.merchantMatches += 1;
    }

    if (accountMatch) {
      counts.accountMatches += 1;
    }

    if (actualDetected && typeMatch && amountMatch && merchantMatch && accountMatch) {
      counts.overallMatches += 1;
    }
  }

  return {
    totalSamples: counts.totalSamples,
    positiveSamples: counts.positiveSamples,
    negativeSamples: counts.negativeSamples,
    truePositives: counts.truePositives,
    trueNegatives: counts.trueNegatives,
    falsePositives: counts.falsePositives,
    falseNegatives: counts.falseNegatives,
    detectionAccuracy: calculateRate(
      counts.truePositives + counts.trueNegatives,
      counts.totalSamples,
    ),
    typeAccuracy: calculateRate(counts.typeMatches, counts.positiveSamples),
    amountAccuracy: calculateRate(counts.amountMatches, counts.positiveSamples),
    merchantAccuracy: calculateRate(
      counts.merchantMatches,
      counts.positiveSamples,
    ),
    accountAccuracy: calculateRate(counts.accountMatches, counts.positiveSamples),
    falsePositiveRate: calculateRate(counts.falsePositives, counts.negativeSamples),
    falseNegativeRate: calculateRate(counts.falseNegatives, counts.positiveSamples),
    overallAccuracy: calculateRate(counts.overallMatches, counts.totalSamples),
  };
}
