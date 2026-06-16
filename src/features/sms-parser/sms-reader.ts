import { Platform, PermissionsAndroid} from 'react-native';
import { parseTransactionSMS, generateSMSHash } from './engine';
import { useTransactionStore } from '../../stores/transaction-store';
import { checkSMSHashExists, writeLog, addPendingDetection } from '../../lib/database';
import { Account } from '../../types';
import SpendLensSmsModule from '../../../modules/spendlens-sms-module';
import { identifyBankFromSender, normalizeBankName } from './enrichment/sender';
import { ParsedTransaction } from './types';


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
    
    // Check notification permission for Android 13+ (API 33+)
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

  // 1. Match by last 4 digits first if present (Priority 1)
  if (parsed.account.number) {
    const numberMatch = accounts.find((a) => a.name.includes(parsed.account.number!));
    if (numberMatch) {
      await writeLog('ACCOUNT_MATCHED', `Resolved account by last 4 digits: ${numberMatch.name}`, { bankId, accountNumber: parsed.account.number });
      return numberMatch;
    }
  }

  // 2. Match by bankId (Priority 2)
  if (bankId) {
    const matchingAccounts = accounts.filter((a) => a.bankId === bankId);
    if (matchingAccounts.length > 0) {
      // Refined matching: try to match type (e.g. card/wallet vs bank account)
      const isCardTransaction = parsed.account.type === 'CARD';
      const typeMatchedMatch = matchingAccounts.find((a) => {
        const nameLower = a.name.toLowerCase();
        if (isCardTransaction) {
          return nameLower.includes('card');
        } else {
          return !nameLower.includes('card') && !nameLower.includes('wallet');
        }
      });
      const resolved = typeMatchedMatch || matchingAccounts[0];
      await writeLog('ACCOUNT_MATCHED', `Resolved account by bankId and type: ${resolved.name}`, { bankId, type: parsed.account.type });
      return resolved;
    }
  }

  // 3. Match by bank name / normalizer (Priority 3)
  const parsedBankName = parsed.account.name || info.bankName;
  if (parsedBankName) {
    const nameNorm = normalizeBankName(parsedBankName);
    if (nameNorm) {
      const match = accounts.find((a) => a.bankId === nameNorm || a.name.toLowerCase().includes(parsedBankName.toLowerCase()));
      if (match) {
        await writeLog('ACCOUNT_MATCHED', `Resolved account by normalized name: ${match.name}`, { parsedBankName });
        return match;
      }
    }
  }

  // 4. No match exists - Create pending bank detection (if valid bankId)
  if (bankId) {
    const name = info.bankName || parsed.account.name || bankId.toUpperCase();
    await addPendingDetection(bankId, name);
  }

  // Log as not found since no active account was resolved
  await writeLog('ACCOUNT_NOT_FOUND', `Could not resolve account for sender: ${sender}`, { sender, parsed });

  return null;
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
  await writeLog('SMS_RECEIVED', `Intercepted SMS from ${sender || 'unknown'}`, { body, sender, receivedDate });

  // 1. Parse SMS using engine
  const parsed = parseTransactionSMS(body, dateStr, sender);
  if (!parsed || !parsed.transaction.amount || !parsed.transaction.type) {
    await writeLog('SMS_FAILED', `SMS failed validation or not financial`, { body, sender });
    return false;
  }

  await writeLog('SMS_PARSED', `SMS parsed successfully: ₹${parsed.transaction.amount} at ${parsed.transaction.merchant || 'unknown'}`, { parsed });

  // 2. Generate canonical hash using the parsed transaction details for deduplication
  const hash = generateSMSHash(body, dateStr, parsed);

  // 3. Duplicate Check
  const alreadyExists = await checkSMSHashExists(hash);
  if (alreadyExists) {
    await writeLog('TXN_SKIPPED_DUPLICATE', `Transaction duplicate skipped for hash ${hash}`);
    return false;
  }

  // 4. Resolve account for this transaction
  const resolvedAccount = await resolveAccountForParsedSMS(parsed, sender || '');
  if (!resolvedAccount) {
    return false; // Skip persisting since we cannot map it to a tracked account yet
  }

  // 5. Add Transaction to store
  const store = useTransactionStore.getState();
  await store.addTransaction({
    accountId: resolvedAccount.id,
    type: parsed.transaction.type === 'credit' ? 'income' : 'expense',
    amount: parsed.transaction.amount,
    merchant: parsed.transaction.merchant || undefined,
    description: parsed.rawBody,
    date: parsed.date || dateStr,
    source: 'sms',
    smsHash: hash,
  });

  await writeLog('TXN_CREATED', `Transaction of ₹${parsed.transaction.amount} persisted to account ${resolvedAccount.name}`, { hash });

  // 6. Trigger native notification if requested
  if (shouldNotify && SpendLensSmsModule && typeof SpendLensSmsModule.showNotification === 'function') {
    const amountFormatted = `₹${parsed.transaction.amount.toLocaleString('en-IN')}`;
    const actionText = parsed.transaction.type === 'credit' ? 'credited to' : 'debited from';
    const merchantText = parsed.transaction.merchant ? ` at ${parsed.transaction.merchant}` : '';
    
    try {
      await SpendLensSmsModule.showNotification(
        parsed.transaction.type === 'credit' ? 'Income Detected 💰' : 'Expense Detected 💸',
        `${amountFormatted} ${actionText} ${resolvedAccount.name}${merchantText}.`
      );
      await writeLog('NOTIFICATION_CREATED', `Triggered transaction notification: ₹${parsed.transaction.amount}`);
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
        
        for (const sms of messages) {
          const smsTime = new Date(sms.date).getTime();
          // STRICT constraint: history scan max upto 10days
          if (smsTime < tenDaysAgo) {
            continue;
          }
          
          const wasAdded = await processIncomingSMS(sms.body, sms.date, sms.address, false);
          if (wasAdded) {
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
 * everything: receive SMS → HeadlessJS → processIncomingSMS → notification.
 *
 * This function now only sets up a polling-based refresh when the app is foregrounded
 * to pick up any transactions created by the background headless task.
 */
export function startSMSListener(_onNewTransactionAdded: (count: number) => void) {
  // No-op: native SmsReceiver in AndroidManifest handles incoming SMS
  // The HeadlessJS task processes them in the background
  return () => {};
}
