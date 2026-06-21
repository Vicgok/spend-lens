import { dedupeTransactions, generateSMSHash, TransactionInput } from '../engine';
import { ParsedTransaction } from '../types';

function mockParsedTxn(overrides: Partial<ParsedTransaction>): ParsedTransaction {
  return {
    account: {
      type: 'ACCOUNT',
      number: '1234',
      name: 'Test Bank',
      ...overrides.account
    },
    balance: {
      available: 1000,
      outstanding: null,
      ...overrides.balance
    },
    transaction: {
      type: 'debit',
      amount: 500,
      merchant: 'Test Merchant',
      referenceNo: null,
      ...overrides.transaction
    },
    date: '2026-06-21T12:00:00.000Z',
    confidence: 'high',
    rawBody: 'Mock SMS Body',
    ...overrides
  };
}

function runTests() {
  console.log("=== Running Production Safety Dedupe Grouping Tests ===");
  let allPassed = true;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
    } else {
      console.error(`❌ FAIL: ${message}`);
      allPassed = false;
    }
  };

  const date1 = "2026-06-21T12:00:00.000Z";

  // 1. Same input gives same hash (determinism check)
  const body1 = "Spent Rs.500 at Amazon using card XX1122";
  const parsed1 = mockParsedTxn({
    account: { type: 'CARD', number: '1122', name: 'Axis Card' },
    transaction: { type: 'debit', amount: 500, merchant: 'Amazon', referenceNo: null },
    rawBody: body1
  });
  const hash1a = generateSMSHash(body1, date1, parsed1);
  const hash1b = generateSMSHash(body1, date1, parsed1);
  assert(hash1a === hash1b, "Same input must always produce the same hash");

  // 2. Card/card same merchant same amount different accounts do not merge
  const parsedCardA = mockParsedTxn({
    account: { type: 'CARD', number: '1111', name: 'Card A' },
    transaction: { type: 'debit', amount: 100, merchant: 'Uber', referenceNo: null }
  });
  const parsedCardB = mockParsedTxn({
    account: { type: 'CARD', number: '2222', name: 'Card B' },
    transaction: { type: 'debit', amount: 100, merchant: 'Uber', referenceNo: null }
  });
  const inputsCard: any[] = [
    { body: "Spent Rs.100 on card XX1111 at Uber", date: date1, parsed: parsedCardA },
    { body: "Spent Rs.100 on card XX2222 at Uber", date: date1, parsed: parsedCardB }
  ];
  const groupsCard = dedupeTransactions(inputsCard);
  assert(groupsCard.length === 2, "Card/card same merchant same amount different accounts do not merge");

  // 3. Account/account same merchant same amount different accounts do not merge
  const parsedAccountA = mockParsedTxn({
    account: { type: 'ACCOUNT', number: '5555', name: 'Bank A' },
    transaction: { type: 'debit', amount: 1500, merchant: 'Zomato', referenceNo: null }
  });
  const parsedAccountB = mockParsedTxn({
    account: { type: 'ACCOUNT', number: '6666', name: 'Bank B' },
    transaction: { type: 'debit', amount: 1500, merchant: 'Zomato', referenceNo: null }
  });
  const inputsAccount: any[] = [
    { body: "Rs.1500 debited from A/c XX5555 to Zomato", date: date1, parsed: parsedAccountA },
    { body: "Rs.1500 debited from A/c XX6666 to Zomato", date: date1, parsed: parsedAccountB }
  ];
  const groupsAccount = dedupeTransactions(inputsAccount);
  assert(groupsAccount.length === 2, "Account/account same merchant same amount different accounts do not merge");

  // 4. Missing-account non-bridge does not overmerge
  const parsedMissingA = mockParsedTxn({
    account: { type: 'ACCOUNT', number: null, name: null },
    transaction: { type: 'debit', amount: 300, merchant: 'Netflix', referenceNo: null }
  });
  const parsedMissingB = mockParsedTxn({
    account: { type: 'ACCOUNT', number: null, name: null },
    transaction: { type: 'debit', amount: 300, merchant: 'Netflix', referenceNo: null }
  });
  const inputsMissing: any[] = [
    { body: "Rs.300 debited towards Netflix transaction ref 98765", date: date1, parsed: parsedMissingA },
    { body: "Rs.300 debited towards Netflix transaction ref 54321", date: date1, parsed: parsedMissingB }
  ];
  const groupsMissing = dedupeTransactions(inputsMissing);
  assert(groupsMissing.length === 2, "Missing-account non-bridge does not overmerge");

  // 5. Explicit BNPL/wallet bridge still merges
  const parsedBridgeA = mockParsedTxn({
    account: { type: 'WALLET', number: null, name: 'Simpl' },
    transaction: { type: 'debit', amount: 800, merchant: 'Swiggy', referenceNo: null }
  });
  const parsedBridgeB = mockParsedTxn({
    account: { type: 'ACCOUNT', number: '5566', name: 'Kotak' },
    transaction: { type: 'debit', amount: 800, merchant: 'Swiggy', referenceNo: null }
  });
  const inputsBridge: any[] = [
    { body: "Spent Rs.800 via Simpl at Swiggy", date: date1, parsed: parsedBridgeA },
    { body: "KOTAK: Rs 800 debited from A/c XX5566 towards Swiggy on 21-May-26 12:00.", date: date1, parsed: parsedBridgeB }
  ];
  const groupsBridge = dedupeTransactions(inputsBridge);
  assert(groupsBridge.length === 1, "Explicit BNPL/wallet bridge still merges with bank debit");

  // 6. Processing order does not affect grouping results (determinism check)
  const inputsOrder1 = [...inputsBridge];
  const inputsOrder2 = [inputsBridge[1], inputsBridge[0]];
  const groupsOrder1 = dedupeTransactions(inputsOrder1);
  const groupsOrder2 = dedupeTransactions(inputsOrder2);
  assert(
    groupsOrder1.length === groupsOrder2.length &&
    groupsOrder1[0].groupKey === groupsOrder2[0].groupKey,
    "Processing order does not affect final grouping results"
  );

  if (!allPassed) {
    console.error("❌ Some production safety tests FAILED.");
    process.exit(1);
  } else {
    console.log("✅ All production safety grouping tests PASSED successfully.");
  }
}

runTests();
