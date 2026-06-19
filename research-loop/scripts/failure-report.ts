import * as fs from "fs";
import * as path from "path";
import { loadCorpus } from "../parser-tests/evaluator";
import { parseTransactionSMS } from "../../src/features/sms-parser/engine";

// Copy exact normalization functions from evaluator.ts to ensure identical comparisons.
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

const DEFAULT_RECEIVED_DATE = "2026-06-19T00:00:00.000Z";

interface Failure {
  id: string;
  sender: string;
  message: string;
  expected: unknown;
  actual: unknown;
  failedFields: string[];
  suggestedBucket: string;
}

function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  const corpusDir = path.resolve(projectRoot, "research-loop/parser-tests/corpus");
  const failuresJsonPath = path.resolve(projectRoot, "research-loop/autoresearch/failures.json");
  const failuresTsvPath = path.resolve(projectRoot, "research-loop/autoresearch/failures.tsv");

  const records = loadCorpus(corpusDir);
  const failures: Failure[] = [];

  const bucketCounts: Record<string, number> = {
    "merchant-normalization": 0,
    "account-extraction": 0,
    "amount-extraction": 0,
    "type-classification": 0,
    "false-negative": 0,
    "false-positive": 0,
    "refund-handling": 0,
    "unclassified": 0,
  };

  let failureCount = 0;

  for (let idx = 0; idx < records.length; idx++) {
    const record = records[idx];
    const recordId = record.id || `sample-${idx}`;
    const expectedDetected = record.expected !== null;
    const parsed = parseTransactionSMS(
      record.message,
      record.receivedDate ?? DEFAULT_RECEIVED_DATE,
      record.sender,
    );
    const actualDetected = parsed !== null;

    let isFailed = false;
    const failedFields: string[] = [];

    if (expectedDetected !== actualDetected) {
      isFailed = true;
      failedFields.push("detection");
    } else if (expectedDetected && record.expected && parsed) {
      const actualType = parsed.transaction.type ?? null;
      const actualAmount = normalizeAmount(parsed.transaction.amount);
      const actualMerchant = normalizeText(parsed.transaction.merchant);
      const actualAccountCard = normalizeAccountCard(
        parsed.account.number ?? parsed.account.name,
      );

      const expectedType = record.expected.transactionType;
      const expectedAmount = normalizeAmount(record.expected.amount);
      const expectedMerchant = normalizeText(record.expected.merchant);
      const expectedAccountCard = normalizeAccountCard(record.expected.accountCard);

      if (actualType !== expectedType) {
        failedFields.push("transactionType");
      }
      if (actualAmount !== expectedAmount) {
        failedFields.push("amount");
      }
      if (actualMerchant !== expectedMerchant) {
        failedFields.push("merchant");
      }
      if (actualAccountCard !== expectedAccountCard) {
        failedFields.push("accountCard");
      }

      if (failedFields.length > 0) {
        isFailed = true;
      }
    }

    if (isFailed) {
      failureCount++;
      const messageLower = record.message.toLowerCase();
      const isRefundOrReversal = messageLower.includes("refund") || messageLower.includes("reversal");

      let suggestedBucket = "unclassified";
      if (isRefundOrReversal) {
        suggestedBucket = "refund-handling";
      } else if (expectedDetected && !actualDetected) {
        suggestedBucket = "false-negative";
      } else if (!expectedDetected && actualDetected) {
        suggestedBucket = "false-positive";
      } else if (failedFields.includes("transactionType")) {
        suggestedBucket = "type-classification";
      } else if (failedFields.includes("amount")) {
        suggestedBucket = "amount-extraction";
      } else if (failedFields.includes("accountCard")) {
        suggestedBucket = "account-extraction";
      } else if (failedFields.includes("merchant")) {
        suggestedBucket = "merchant-normalization";
      }

      bucketCounts[suggestedBucket] = (bucketCounts[suggestedBucket] || 0) + 1;

      // Extract expected and actual representations
      const expectedRep = record.expected;
      let actualRep: any = null;
      if (actualDetected && parsed) {
        actualRep = {
          transactionType: parsed.transaction.type ?? null,
          amount: parsed.transaction.amount ?? null,
          merchant: parsed.transaction.merchant ?? null,
          accountCard: parsed.account.number ?? parsed.account.name ?? null,
        };
      }

      failures.push({
        id: recordId,
        sender: record.sender || "UNKNOWN",
        message: record.message,
        expected: expectedRep,
        actual: actualRep,
        failedFields,
        suggestedBucket,
      });
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(failuresJsonPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save JSON
  fs.writeFileSync(failuresJsonPath, JSON.stringify(failures, null, 2) + "\n", "utf8");

  // Save TSV
  const tsvHeader = ["id", "sender", "message", "expected", "actual", "failedFields", "suggestedBucket"].join("\t");
  const tsvRows = failures.map(f => {
    return [
      f.id,
      f.sender,
      f.message.replace(/\r?\n|\t/g, " "), // Escape newlines/tabs in messages
      JSON.stringify(f.expected),
      JSON.stringify(f.actual),
      f.failedFields.join(","),
      f.suggestedBucket
    ].join("\t");
  });
  fs.writeFileSync(failuresTsvPath, [tsvHeader, ...tsvRows].join("\n") + "\n", "utf8");

  // Console summary
  console.log("FAILURE REPORT");
  console.log("");
  console.log(`Total Failures: ${failureCount}`);
  console.log("");
  console.log("Bucket Counts:");
  
  const bucketKeys = [
    "merchant-normalization",
    "account-extraction",
    "amount-extraction",
    "type-classification",
    "false-negative",
    "false-positive",
    "refund-handling",
    "unclassified"
  ];
  for (const bucket of bucketKeys) {
    console.log(`${bucket}: ${bucketCounts[bucket] || 0}`);
  }
  console.log("");

  // Determine top bucket
  let topBucket = "none";
  let maxCount = -1;
  for (const bucket of bucketKeys) {
    const count = bucketCounts[bucket] || 0;
    if (count > maxCount) {
      maxCount = count;
      topBucket = bucket;
    }
  }
  console.log(`Top Bucket: ${maxCount > 0 ? topBucket : "none"}`);
}

main();
