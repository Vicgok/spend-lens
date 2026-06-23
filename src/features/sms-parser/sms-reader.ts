import { Platform, PermissionsAndroid } from 'react-native';
import {
  parseTransactionSMS,
  generateSMSHash,
  dedupeTransactions,
  areTransactionsDuplicate,
  TransactionInput,
} from './engine';
import { useTransactionStore } from '../../stores/transaction-store';
import {
  checkSMSHashExists,
  writeLog,
  addPendingDetection,
  getRecentSMSTransactions,
  hasProcessedSMSHash,
  markSMSMessageProcessed,
} from '../../lib/database';
import { Account } from '../../types';
import SpendLensSmsModule from '../../../modules/spendlens-sms-module';
import { identifyBankFromSender, normalizeBankName } from './enrichment/sender';
import { ParsedTransaction } from './types';

const DEDUPE_VERSION = 'comparator-v2';
const LIVE_DEDUPE_WINDOW_MS = 5 * 60 * 1000;

interface ParsedSMSCandidate {
  body: string;
  sender?: string;
  receivedDate: string;
  dateStr: string;
  parsed: ParsedTransaction;
}

interface InsertResult {
  inserted: boolean;
  resolvedAccount: Account | null;
}

/**
 * Check if the app has SMS reading permission.
 */
export async function checkSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const readGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const receiveGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);

    let notificationGranted = true;
    if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      notificationGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    return readGranted && receiveGranted && notificationGranted;
  } catch (error) {
    console.error('Error checking SMS permissions:', error);
    return false;
  }
}

/**
 * Request SMS reading permission from the user.
 * Requests READ_SMS, RECEIVE_SMS, and POST_NOTIFICATIONS together.
 */
export async function requestSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ];

    if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);

    const readGranted = results[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED;
    const receiveGranted = results[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED;

    let notificationGranted = true;
    if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      notificationGranted = results[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED;
    }

    return readGranted && receiveGranted && notificationGranted;
  } catch (error) {
    console.error('Error requesting SMS permissions:', error);
    return false;
  }
}

/**
 * Resolves the appropriate database account for a parsed SMS.
 * Tries to match existing accounts by last 4 digits, bankId, or bank name.
 * Never creates account automatically. Registers pending bank detections instead.
 */
export async function resolveAccountForParsedSMS(
  parsed: ParsedTransaction,
  sender: string
): Promise<Account | null> {
  const store = useTransactionStore.getState();
  await store.loadAccounts();
  const accounts = store.accounts;

  const info = identifyBankFromSender(sender);
  const bankId = info.bankId || (parsed.account.name ? normalizeBankName(parsed.account.name) : null);

  if (parsed.account.number) {
    const numberMatch = accounts.find((a) => a.name.includes(parsed.account.number!));
    if (numberMatch) {
      await writeLog('ACCOUNT_MATCHED', `Resolved account by last 4 digits: ${numberMatch.name}`, {
        bankId,
        accountNumber: parsed.account.number,
      });
      return numberMatch;
    }
  }

  if (bankId) {
    const matchingAccounts = accounts.filter((a) => a.bankId === bankId);
    if (matchingAccounts.length > 0) {
      const isCardTransaction = parsed.account.type === 'CARD';
      const typeMatchedMatch = matchingAccounts.find((a) => {
        const nameLower = a.name.toLowerCase();
        if (isCardTransaction) {
          return nameLower.includes('card');
        }
        return !nameLower.includes('card') && !nameLower.includes('wallet');
      });
      const resolved = typeMatchedMatch || matchingAccounts[0];
      await writeLog('ACCOUNT_MATCHED', `Resolved account by bankId and type: ${resolved.name}`, {
        bankId,
        type: parsed.account.type,
      });
      return resolved;
    }
  }

  const parsedBankName = parsed.account.name || info.bankName;
  if (parsedBankName) {
    const nameNorm = normalizeBankName(parsedBankName);
    if (nameNorm) {
      const match = accounts.find(
        (a) => a.bankId === nameNorm || a.name.toLowerCase().includes(parsedBankName.toLowerCase())
      );
      if (match) {
        await writeLog('ACCOUNT_MATCHED', `Resolved account by normalized name: ${match.name}`, {
          parsedBankName,
        });
        return match;
      }
    }
  }

  if (bankId) {
    const name = info.bankName || parsed.account.name || bankId.toUpperCase();
    await addPendingDetection(bankId, name);
  }

  await writeLog('ACCOUNT_NOT_FOUND', `Could not resolve account for sender: ${sender}`, { sender, parsed });
  return null;
}

function toTransactionInput(candidate: ParsedSMSCandidate): TransactionInput {
  return {
    body: candidate.body,
    date: candidate.dateStr,
    parsed: candidate.parsed,
  };
}

function getRawSMSHash(body: string, dateStr: string): string {
  return generateSMSHash(body, dateStr, null);
}

function toStoredTransactionInput(tx: {
  amount: number;
  date: string;
  merchant: string | null;
  type: 'income' | 'expense' | 'transfer';
  description: string | null;
}): TransactionInput | null {
  if (tx.type === 'transfer') {
    return null;
  }

  const reparsed = tx.description ? parseTransactionSMS(tx.description, tx.date) : null;
  if (reparsed && reparsed.transaction.amount && reparsed.transaction.type) {
    return {
      body: tx.description || '',
      date: tx.date,
      parsed: reparsed,
    };
  }

  return {
    body: tx.description || '',
    date: tx.date,
    parsed: {
      account: {
        type: null,
        number: null,
        name: null,
      },
      balance: {
        available: null,
        outstanding: null,
      },
      transaction: {
        type: tx.type === 'income' ? 'credit' : 'debit',
        amount: tx.amount,
        merchant: tx.merchant,
        referenceNo: null,
      },
      date: tx.date,
      confidence: 'low',
      rawBody: tx.description || '',
    },
  };
}

function getComparatorWindow(candidate: ParsedSMSCandidate): { dateFrom: string; dateTo: string } | null {
  const parsedTime = new Date(candidate.parsed.date || candidate.dateStr).getTime();
  if (Number.isNaN(parsedTime)) {
    return null;
  }

  return {
    dateFrom: new Date(parsedTime - LIVE_DEDUPE_WINDOW_MS).toISOString(),
    dateTo: new Date(parsedTime + LIVE_DEDUPE_WINDOW_MS).toISOString(),
  };
}

async function findPersistedComparatorDuplicate(candidate: ParsedSMSCandidate): Promise<string | null> {
  const window = getComparatorWindow(candidate);
  if (!window) {
    return null;
  }

  const recentTransactions = await getRecentSMSTransactions(window.dateFrom, window.dateTo);
  const candidateInput = toTransactionInput(candidate);

  for (const transaction of recentTransactions) {
    const storedInput = toStoredTransactionInput(transaction);
    if (!storedInput) {
      continue;
    }

    if (
      areTransactionsDuplicate(candidateInput, storedInput) ||
      areTransactionsDuplicate(storedInput, candidateInput)
    ) {
      return transaction.dedupeGroupId || transaction.smsHash || transaction.id;
    }
  }

  return null;
}

async function insertParsedTransaction(
  candidate: ParsedSMSCandidate,
  dedupeGroupId: string,
  resolvedAccount?: Account | null
): Promise<InsertResult> {
  const rawSmsHash = getRawSMSHash(candidate.body, candidate.dateStr);
  const alreadyExists = await checkSMSHashExists(rawSmsHash);
  if (alreadyExists) {
    await markSMSMessageProcessed(rawSmsHash, 'duplicate', dedupeGroupId);
    await writeLog('TXN_SKIPPED_DUPLICATE', `Raw message duplicate skipped for hash ${rawSmsHash}`, {
      hash: rawSmsHash,
      guard: 'sms_hash',
    });
    return { inserted: false, resolvedAccount: null };
  }

  const account = resolvedAccount ?? await resolveAccountForParsedSMS(candidate.parsed, candidate.sender || '');
  if (!account) {
    return { inserted: false, resolvedAccount: null };
  }

  const store = useTransactionStore.getState();
  const transaction = await store.addTransaction({
    accountId: account.id,
    type: candidate.parsed.transaction.type === 'credit' ? 'income' : 'expense',
    amount: candidate.parsed.transaction.amount!,
    merchant: candidate.parsed.transaction.merchant || undefined,
    description: candidate.parsed.rawBody,
    date: candidate.parsed.date || candidate.dateStr,
    source: 'sms',
    smsHash: rawSmsHash,
    dedupeGroupId,
    dedupeVersion: DEDUPE_VERSION,
  });

  await markSMSMessageProcessed(rawSmsHash, 'inserted', dedupeGroupId, transaction.id);
  await writeLog(
    'TXN_CREATED',
    `Transaction of Rs ${candidate.parsed.transaction.amount} persisted to account ${account.name}`,
    { hash: rawSmsHash, dedupeGroupId, dedupeVersion: DEDUPE_VERSION }
  );

  return { inserted: true, resolvedAccount: account };
}

/**
 * Processes an incoming or scanned SMS message.
 * Extracts fields, resolves account, checks duplicates, inserts to DB, and triggers a local notification.
 * Returns true if a new transaction was successfully processed and added, false otherwise.
 */
export async function processIncomingSMS(
  body: string,
  receivedDate: string,
  sender?: string,
  shouldNotify: boolean = true
): Promise<boolean> {
  if (!body) return false;

  const dateStr = new Date(receivedDate).toISOString();
  const rawSmsHash = getRawSMSHash(body, dateStr);
  if (await hasProcessedSMSHash(rawSmsHash)) {
    await writeLog('TXN_SKIPPED_DUPLICATE', `Previously processed raw SMS skipped for hash ${rawSmsHash}`, {
      hash: rawSmsHash,
      guard: 'processed_sms_messages',
    });
    return false;
  }

  await writeLog('SMS_RECEIVED', `Intercepted SMS from ${sender || 'unknown'}`, { body, sender, receivedDate });

  const parsed = parseTransactionSMS(body, dateStr, sender);
  if (!parsed || !parsed.transaction.amount || !parsed.transaction.type) {
    await writeLog('SMS_FAILED', 'SMS failed validation or not financial', { body, sender });
    return false;
  }

  await writeLog('SMS_PARSED', `SMS parsed successfully: Rs ${parsed.transaction.amount} at ${parsed.transaction.merchant || 'unknown'}`, { parsed });

  const candidate: ParsedSMSCandidate = {
    body,
    sender,
    receivedDate,
    dateStr,
    parsed,
  };

  const duplicateGroupId = await findPersistedComparatorDuplicate(candidate);
  if (duplicateGroupId) {
    await markSMSMessageProcessed(rawSmsHash, 'duplicate', duplicateGroupId);
    await writeLog('TXN_SKIPPED_DEDUPE', 'Comparator-v2 duplicate skipped during live ingest', {
      dedupeGroupId: duplicateGroupId,
      sender,
      dateStr,
    });
    return false;
  }

  const resolvedAccount = await resolveAccountForParsedSMS(parsed, sender || '');
  if (!resolvedAccount) {
    return false;
  }

  const liveGroupId = `${generateSMSHash(body, dateStr, parsed)}_t${new Date(parsed.date || dateStr).getTime()}`;
  const { inserted } = await insertParsedTransaction(candidate, liveGroupId, resolvedAccount);
  if (!inserted) {
    return false;
  }

  if (shouldNotify && SpendLensSmsModule && typeof SpendLensSmsModule.showNotification === 'function') {
    const amountFormatted = `Rs ${parsed.transaction.amount.toLocaleString('en-IN')}`;
    const actionText = parsed.transaction.type === 'credit' ? 'credited to' : 'debited from';
    const merchantText = parsed.transaction.merchant ? ` at ${parsed.transaction.merchant}` : '';

    try {
      await SpendLensSmsModule.showNotification(
        parsed.transaction.type === 'credit' ? 'Income Detected' : 'Expense Detected',
        `${amountFormatted} ${actionText} ${resolvedAccount.name}${merchantText}.`
      );
      await writeLog('NOTIFICATION_CREATED', `Triggered transaction notification: Rs ${parsed.transaction.amount}`);
    } catch (err) {
      console.warn('Failed to trigger native notification:', err);
    }
  }

  return true;
}

/**
 * Synchronize transactions from native Android SMS messages.
 * Reads the device's SMS inbox and parses financial transactions.
 * Returns the number of newly added transactions.
 */
export async function syncSMSFromDevice(): Promise<number> {
  const hasPermission = await checkSMSPermission();
  if (!hasPermission) {
    console.log('Sync aborted: SMS permissions not fully granted.');
    return 0;
  }

  let newCount = 0;

  if (Platform.OS === 'android' && SpendLensSmsModule) {
    console.log('Scanning Android SMS inbox...');
    try {
      const messages = await SpendLensSmsModule.readSmsInbox();
      if (messages && messages.length > 0) {
        const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
        const parsedCandidates: ParsedSMSCandidate[] = [];

        for (const sms of messages) {
          const smsTime = new Date(sms.date).getTime();
          if (smsTime < tenDaysAgo) {
            continue;
          }

          const dateStr = new Date(sms.date).toISOString();
          const rawSmsHash = getRawSMSHash(sms.body, dateStr);
          if (await hasProcessedSMSHash(rawSmsHash)) {
            await writeLog('TXN_SKIPPED_DUPLICATE', `Previously processed raw SMS skipped during historical sync for hash ${rawSmsHash}`, {
              hash: rawSmsHash,
              guard: 'processed_sms_messages',
            });
            continue;
          }

          const parsed = parseTransactionSMS(sms.body, dateStr, sms.address);
          if (!parsed || !parsed.transaction.amount || !parsed.transaction.type) {
            continue;
          }

          parsedCandidates.push({
            body: sms.body,
            sender: sms.address,
            receivedDate: sms.date,
            dateStr,
            parsed,
          });
        }

        const groups = dedupeTransactions(parsedCandidates.map(toTransactionInput));
        const groupIdByKey = new Map<string, string>();
        const duplicateKeys = new Set<string>();

        for (const group of groups) {
          const canonicalKey = `${group.canonical.body}__${group.canonical.date}`;
          groupIdByKey.set(canonicalKey, group.groupKey);

          for (const duplicate of group.duplicates) {
            const duplicateKey = `${duplicate.body}__${duplicate.date}`;
            duplicateKeys.add(duplicateKey);
            groupIdByKey.set(duplicateKey, group.groupKey);
          }
        }

        for (const candidate of parsedCandidates) {
          const candidateKey = `${candidate.body}__${candidate.dateStr}`;
          const rawSmsHash = getRawSMSHash(candidate.body, candidate.dateStr);
          const dedupeGroupId = groupIdByKey.get(candidateKey);

          if (duplicateKeys.has(candidateKey)) {
            await markSMSMessageProcessed(rawSmsHash, 'duplicate', dedupeGroupId ?? null);
            await writeLog('TXN_SKIPPED_DEDUPE', 'Comparator-v2 duplicate skipped during historical sync batch dedupe', {
              dedupeGroupId,
              sender: candidate.sender,
              dateStr: candidate.dateStr,
            });
            continue;
          }

          if (!dedupeGroupId) {
            continue;
          }

          const persistedDuplicateGroupId = await findPersistedComparatorDuplicate(candidate);
          if (persistedDuplicateGroupId) {
            await markSMSMessageProcessed(rawSmsHash, 'duplicate', persistedDuplicateGroupId);
            await writeLog('TXN_SKIPPED_DEDUPE', 'Comparator-v2 duplicate skipped against persisted SMS during historical sync', {
              dedupeGroupId: persistedDuplicateGroupId,
              sender: candidate.sender,
              dateStr: candidate.dateStr,
            });
            continue;
          }

          const { inserted } = await insertParsedTransaction(candidate, dedupeGroupId);
          if (inserted) {
            newCount++;
          }
        }
      }
    } catch (error) {
      console.error('Failed to scan Android SMS inbox:', error);
    }
  }

  return newCount;
}

/**
 * Start listening for incoming SMS messages (Android only).
 *
 * NOTE: Incoming SMS is handled natively by the manifest-registered SmsReceiver
 * which triggers SmsHeadlessTaskService. This JS-side listener is no longer needed
 * and was causing native crashes due to the @maniac-tech/react-native-expo-read-sms
 * library registering a duplicate BroadcastReceiver. The native pipeline handles
 * everything: receive SMS -> HeadlessJS -> processIncomingSMS -> notification.
 *
 * This function now only sets up a polling-based refresh when the app is foregrounded
 * to pick up any transactions created by the background headless task.
 */
export function startSMSListener(_onNewTransactionAdded: (count: number) => void) {
  return () => {};
}
