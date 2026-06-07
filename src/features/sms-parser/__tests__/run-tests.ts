import { normalizeSMS } from '../core/normalizer';
import { isValidTransaction } from '../core/validator';
import { getTransactionAmount } from '../extractors/amount';
import { getAccount } from '../extractors/account';
import { getBalance } from '../extractors/balance';
import { getTransactionType } from '../extractors/type';
import { extractMerchantInfo } from '../extractors/merchant';
import { extractTransactionDate } from '../extractors/date';
import { getReferenceNumber } from '../extractors/reference';
import { parseTransactionSMS, generateSMSHash } from '../engine';
import { normalizeBankName } from '../enrichment/sender';

// Load fixtures (using direct require since they are JSON)
const indianBanks = require('./fixtures/indian-banks.json');
const creditCards = require('./fixtures/credit-cards.json');
const wallets = require('./fixtures/wallets.json');
const upi = require('./fixtures/upi.json');
const edgeCases = require('./fixtures/edge-cases.json');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

function runNormalizerTests() {
  console.log('\n--- Running Normalizer Unit Tests ---');
  
  // FIX T1: Destructive x/X removal
  const t1Tokens1 = normalizeSMS('Spent Rs. 500 at Taxi cab');
  assert(t1Tokens1.includes('taxi'), 'T1: Should preserve "taxi" when x is not adjacent to digits');

  const t1Tokens2 = normalizeSMS('Extra charge of Rs 50');
  assert(t1Tokens2.includes('extra'), 'T1: Should preserve "extra" when x is not adjacent to digits');

  const t1Tokens3 = normalizeSMS('A/c XX1234 debited');
  assert(t1Tokens3.includes('1234'), 'T1: Should strip x/X when adjacent to digits (XX1234 -> 1234)');

  const t1Tokens4 = normalizeSMS('A/c **9999 debited');
  assert(t1Tokens4.includes('9999'), 'T1: Should strip * characters (**9999 -> 9999)');

  // FIX T4: Non-word-boundary is/with removal
  const t4Tokens1 = normalizeSMS('Dear Customer, Axis Bank Info');
  assert(t4Tokens1.includes('axis'), 'T4: Should preserve "axis" (should not strip "is" from "axis")');

  const t4Tokens2 = normalizeSMS('I wish you the best');
  assert(t4Tokens2.includes('wish'), 'T4: Should preserve "wish" (should not strip "is" from "wish")');

  const t4Tokens3 = normalizeSMS('Payment is debited');
  assert(!t4Tokens3.includes('is'), 'T4: Should strip standalone "is"');

  const t4Tokens4 = normalizeSMS('Paid with avl bal');
  assert(!t4Tokens4.includes('with'), 'T4: Should strip standalone "with"');
}

function runValidatorTests() {
  console.log('\n--- Running Validator Unit Tests ---');
  
  // FIX T2: Validation gate bug (null balance counts as present)
  // Enforces amount is mandatory + at least one other field [balance, account.number, reference, merchant]
  assert(isValidTransaction(500, null, '1234', null, null) === true, 'T2: Amount and account number present -> Valid');
  assert(isValidTransaction(500, 1000, null, null, null) === true, 'T2: Amount and balance present -> Valid');
  assert(isValidTransaction(null, 1000, '1234', null, null) === false, 'T2: Amount missing -> Invalid');
  assert(isValidTransaction(500, null, null, null, null) === false, 'T2: Only amount present -> Invalid');
  assert(isValidTransaction(null, null, '1234', null, null) === false, 'T2: Only account number present -> Invalid');
  assert(isValidTransaction(null, null, null, null, null) === false, 'T2: No fields present -> Invalid');
  assert(isValidTransaction(500, null, null, '614050212345', null) === true, 'T2: Amount and reference present -> Valid');
  assert(isValidTransaction(500, null, null, null, 'swiggy') === true, 'T2: Amount and merchant present -> Valid');
}

function runAmountTests() {
  console.log('\n--- Running Amount Unit Tests ---');
  
  // FIX T3: First rs. wins (pick amount instead of available balance)
  const tokens1 = normalizeSMS('Rs. 500 debited. Avl Bal Rs. 10000.');
  assert(getTransactionAmount(tokens1) === 500, 'T3: Should pick transaction amount (500) over balance (10000)');

  const tokens2 = normalizeSMS('Avl Bal Rs. 10000. Rs. 500 debited.');
  assert(getTransactionAmount(tokens2) === 500, 'T3: Should pick 500 even if balance appears first in the SMS');
}

function runAccountTests() {
  console.log('\n--- Running Account Unit Tests ---');
  
  const tokens1 = normalizeSMS('debited from A/c XX1234');
  const acc1 = getAccount(tokens1);
  assert(acc1.type === 'ACCOUNT' && acc1.number === '1234', 'Cascade: Standalone "ac" detection');

  const tokens2 = normalizeSMS('spent on Card ending 9876');
  const acc2 = getAccount(tokens2);
  assert(acc2.type === 'CARD' && acc2.number === '9876', 'Cascade: Card ending detection');

  const tokens3 = normalizeSMS('paid using Paytm Wallet');
  const acc3 = getAccount(tokens3);
  assert(acc3.type === 'WALLET' && acc3.name === 'Paytm', 'Cascade: Wallet detection');

  const tokens4 = normalizeSMS('spent on Niyo Card');
  const acc4 = getAccount(tokens4);
  assert(acc4.type === 'ACCOUNT' && acc4.name === 'Niyo', 'Cascade: Special accounts (Niyo)');
}

function runBalanceTests() {
  console.log('\n--- Running Balance Unit Tests ---');
  
  const tokens1 = normalizeSMS('Avl Bal Rs. 12,450.50.');
  assert(getBalance(tokens1, 'AVAILABLE') === 12450.50, 'Balance: Standard available balance character walk');

  // FIX T9: substr() replacement verification (substring used)
  const tokens2 = normalizeSMS('Outstanding Rs 5,000.');
  assert(getBalance(tokens2, 'OUTSTANDING') === 5000.00, 'Balance: Outstanding balance character walk');

  const tokens3 = normalizeSMS('bal 450');
  assert(getBalance(tokens3, 'AVAILABLE') === 450.00, 'Balance: Non-standard available balance fallback');
}

function runTypeTests() {
  console.log('\n--- Running Type Unit Tests ---');
  
  const t1 = getTransactionType(normalizeSMS('Rs 500 debited'));
  assert(t1 === 'debit', 'Type: Debited -> debit');

  const t2 = getTransactionType(normalizeSMS('Rs 500 credited'));
  assert(t2 === 'credit', 'Type: Credited -> credit');

  const t3 = getTransactionType(normalizeSMS('paid Rs 500 to swiggy'));
  assert(t3 === 'debit', 'Type: Paid -> debit');
}

function runMerchantTests() {
  console.log('\n--- Running Merchant Unit Tests ---');
  
  // VPA / UPI
  const m1 = extractMerchantInfo('paid via UPI to swiggy@okaxis');
  assert(m1.merchant === 'swiggy', 'Merchant: VPA username extraction');

  // FIX U3: Keyword-based merchant extraction
  const m2 = extractMerchantInfo('spent Rs. 500 at Amazon India');
  assert(m2.merchant === 'Amazon India', 'Merchant: U3 spent at keyword matching');

  const m3 = extractMerchantInfo('paid Rs. 200 to Swiggy');
  assert(m3.merchant === 'Swiggy', 'Merchant: U3 paid to keyword matching');
}

function runDateTests() {
  console.log('\n--- Running Date Unit Tests ---');
  
  const d1 = extractTransactionDate('debited on 20-May-26', null);
  assert(d1 !== null && d1.startsWith('2026-05-20'), 'Date: Parses DD-MMM-YY format');

  const d2 = extractTransactionDate('debited on 20/05/2026 at 14:30', null);
  assert(d2 !== null && d2.includes('14:30:00'), 'Date: Parses DD/MM/YYYY and HH:MM time');

  const d3 = extractTransactionDate('No date here', '2026-06-01T12:00:00.000Z');
  assert(d3 === '2026-06-01T12:00:00.000Z', 'Date: Fallback triggers correctly');
}

function runReferenceTests() {
  console.log('\n--- Running Reference Unit Tests ---');
  
  // FIX T5: UPI keyword "ref" boundary
  const ref1 = getReferenceNumber('UPI Ref: 614050212345');
  assert(ref1 === '614050212345', 'T5: Should extract reference number with boundary matches');

  const ref2 = getReferenceNumber('This is a preferred transaction');
  assert(ref2 === null, 'T5: Should NOT extract from "preferred" (no false positive)');
}

function runIntegrationTests() {
  console.log('\n--- Running Fixture Integration Tests ---');

  // Helper to run list of fixtures
  const runFixtures = (name: string, fixtures: any[]) => {
    console.log(`\n  Running [${name}] fixtures:`);
    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];
      const parsed = parseTransactionSMS(fixture.body, new Date().toISOString(), fixture.sender);
      
      if (fixture.expected === null) {
        assert(parsed === null, `Msg ${i + 1}: Should ignore non-financial SMS`);
      } else {
        if (!parsed) {
          failedTests++;
          console.error(`  ❌ [FAIL] Msg ${i + 1}: Expected valid parse, got null`);
          continue;
        }

        const exp = fixture.expected;
        let msgMatches = true;

        if (exp.amount !== undefined && parsed.transaction.amount !== exp.amount) {
          console.error(`     Mismatch amount: expected ${exp.amount}, got ${parsed.transaction.amount}`);
          msgMatches = false;
        }
        if (exp.balance !== undefined && parsed.balance.available !== exp.balance) {
          console.error(`     Mismatch balance: expected ${exp.balance}, got ${parsed.balance.available}`);
          msgMatches = false;
        }
        if (exp.outstanding !== undefined && parsed.balance.outstanding !== exp.outstanding) {
          console.error(`     Mismatch outstanding: expected ${exp.outstanding}, got ${parsed.balance.outstanding}`);
          msgMatches = false;
        }
        if (exp.type !== undefined && parsed.transaction.type !== exp.type) {
          console.error(`     Mismatch type: expected ${exp.type}, got ${parsed.transaction.type}`);
          msgMatches = false;
        }
        if (exp.accountNumber !== undefined && parsed.account.number !== exp.accountNumber) {
          console.error(`     Mismatch account.number: expected ${exp.accountNumber}, got ${parsed.account.number}`);
          msgMatches = false;
        }
        if (exp.accountType !== undefined && parsed.account.type !== exp.accountType) {
          console.error(`     Mismatch account.type: expected ${exp.accountType}, got ${parsed.account.type}`);
          msgMatches = false;
        }
        if (exp.merchant !== undefined && parsed.transaction.merchant?.toLowerCase() !== exp.merchant.toLowerCase()) {
          console.error(`     Mismatch merchant: expected ${exp.merchant}, got ${parsed.transaction.merchant}`);
          msgMatches = false;
        }
        if (exp.referenceNo !== undefined && parsed.transaction.referenceNo !== exp.referenceNo) {
          console.error(`     Mismatch referenceNo: expected ${exp.referenceNo}, got ${parsed.transaction.referenceNo}`);
          msgMatches = false;
        }

        assert(msgMatches, `Msg ${i + 1}: ${fixture.body.substring(0, 40)}...`);
      }
    }
  };

  runFixtures('Indian Banks', indianBanks);
  runFixtures('Credit Cards', creditCards);
  runFixtures('Wallets', wallets);
  runFixtures('UPI Senders', upi);
  runFixtures('Edge Cases & OTPs', edgeCases);
}

function runBugFixTests() {
  console.log('\n--- Running Bug 3 and Bug 4 Unit Tests ---');

  // Bug 3 Bank Identification / Normalization
  assert(normalizeBankName('AD-HDFCBK') === 'hdfc', 'Bug 3: AD-HDFCBK -> hdfc');
  assert(normalizeBankName('abc@okicici') === null, 'Bug 3: Ignore UPI VPA/handles containing @');
  assert(normalizeBankName('312312312321-icici') === null, 'Bug 3: Ignore references containing digits and hyphens');
  assert(normalizeBankName('41234567890-icici') === null, 'Bug 3: Ignore digits followed by bank identifier');
  assert(normalizeBankName('HDFCBK') === 'hdfc', 'Bug 3: Exact sender map HDFCBK -> hdfc');
  assert(normalizeBankName('icici bank') === 'icici', 'Bug 3: Substring search with icici keyword -> icici');

  // Bug 4 Canonical Hash
  const parsedMock1 = {
    account: { type: 'ACCOUNT' as const, number: '1234', name: 'HDFC Bank' },
    balance: { available: 5000, outstanding: null },
    transaction: { type: 'debit' as const, amount: 1500, merchant: 'Swiggy', referenceNo: 'REF123' },
    date: '2026-06-07T04:17:11.000Z',
    confidence: 'high' as const,
    rawBody: 'Alert: Rs 1500 debited from A/c XX1234 at Swiggy.'
  };

  const parsedMock2 = {
    account: { type: 'ACCOUNT' as const, number: '1234', name: 'HDFC Bank' },
    balance: { available: 3500, outstanding: null },
    transaction: { type: 'debit' as const, amount: 1500, merchant: 'Swiggy', referenceNo: 'REF124' },
    date: '2026-06-07T05:00:00.000Z',
    confidence: 'high' as const,
    rawBody: 'Notice: Rs 1500.00 debited from A/c 1234 for Swiggy.'
  };

  const hash1 = generateSMSHash(parsedMock1.rawBody, parsedMock1.date, parsedMock1);
  const hash2 = generateSMSHash(parsedMock2.rawBody, parsedMock2.date, parsedMock2);

  assert(hash1 === hash2, 'Bug 4: Identical amount, type, last4, merchant, and yyyyMMdd must produce the same canonical hash');

  const hashFallback1 = generateSMSHash('Alert: Rs 1500 spent', '2026-06-07T04:17:11.000Z', null);
  const hashFallback2 = generateSMSHash('Dear Customer, Rs 1500 spent', '2026-06-07T04:17:11.000Z', null);
  assert(hashFallback1 === hashFallback2, 'Bug 4: Cleaned body fallback matches ignoring common prefixes');
}

function main() {
  console.log('=============================================');
  console.log('       SPENDLENS SMS ENGINE TEST SUITE       ');
  console.log('=============================================');
  
  runNormalizerTests();
  runValidatorTests();
  runAmountTests();
  runAccountTests();
  runBalanceTests();
  runTypeTests();
  runMerchantTests();
  runDateTests();
  runReferenceTests();
  runBugFixTests();
  runIntegrationTests();

  console.log('\n=============================================');
  console.log(`TEST RUN SUMMARY:`);
  console.log(`  PASSED: ${passedTests}`);
  console.log(`  FAILED: ${failedTests}`);
  console.log('=============================================');
  
  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
