import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { parseTransactionSMS, generateSMSHash } from './engine';
import { useTransactionStore } from '../../stores/transaction-store';
import { checkSMSHashExists, writeLog, addPendingDetection } from '../../lib/database';
import { TransactionCreateInput, Account } from '../../types';
import SpendLensSmsModule from '../../../modules/spendlens-sms-module';
import { identifyBankFromSender, normalizeBankName } from './enrichment/sender';
import { ParsedTransaction } from './types';

// Optional import for native read SMS library
let ExpoReadSms: any = null;
try {
  ExpoReadSms = require('@maniac-tech/react-native-expo-read-sms');
} catch (error) {
  // Graceful fallback for Expo Go, iOS, or environment without the library
}

// Detect if we actually have the native module linked (false in Expo Go/iOS/Simulators)
const hasNativeModule = Platform.OS === 'android' && !!NativeModules.RNExpoReadSms;

// Helper to get a ISO date string offset by days, optionally forced to weekend
function getMockDateISO(daysAgo: number, forceWeekend: boolean = false): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  if (forceWeekend) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      // Shift to Saturday
      d.setDate(d.getDate() - (day + 1));
    }
  }
  return d.toISOString();
}

// Sample bank SMS messages for mock simulation
const MOCK_SMS_MESSAGES = [
  {
    sender: 'SBIINB',
    body: 'Your A/c XX1122 is credited with Rs. 75,000.00 on 01-May-26 by Salary. Avl Bal Rs. 1,20,000.00.',
    date: getMockDateISO(15),
  },
  {
    sender: 'HDFCBK',
    body: 'Alert: Rs. 1,200.00 debited from A/c XX4321 on 20-May-26 for purchase at SWIGGY. Avl Bal Rs. 45,670.00.',
    date: getMockDateISO(0),
  },
  {
    sender: 'AXISBK',
    body: 'Dear Customer, transaction of Rs 450.00 debited on card ending 9876 at UBER INDIA. AVL BAL Rs 12,450.00.',
    date: getMockDateISO(3),
  },
  {
    sender: 'KOTAKB',
    body: 'Rs. 2,500.00 paid to ZOMATO from A/c XX5566. Avl Bal: Rs 8,900.00.',
    date: getMockDateISO(4),
  },
  {
    sender: 'CHASE',
    body: 'Transaction alert: Rs. 699.00 charged on Card ending 5543 at NETFLIX. Bal: Rs. 23,254.10.',
    date: getMockDateISO(5),
  },
  {
    sender: 'BOFA',
    body: 'Deposit of Rs. 5,000.00 received in Account ending 9988 from Refund. Balance Rs. 28,450.00.',
    date: getMockDateISO(6),
  },
  // Micro-spending leak: Starbucks 3 times
  {
    sender: 'HDFCBK',
    body: 'Alert: Rs. 180.00 debited from A/c XX4321 on purchase at STARBUCKS. Avl Bal Rs. 43,290.00.',
    date: getMockDateISO(1),
  },
  {
    sender: 'HDFCBK',
    body: 'Alert: Rs. 220.00 debited from A/c XX4321 on purchase at STARBUCKS. Avl Bal Rs. 43,070.00.',
    date: getMockDateISO(2),
  },
  {
    sender: 'HDFCBK',
    body: 'Alert: Rs. 190.00 debited from A/c XX4321 on purchase at STARBUCKS. Avl Bal Rs. 42,880.00.',
    date: getMockDateISO(3),
  },
  // Impulse Spending: Amazon twice within 30 mins
  {
    sender: 'AXISBK',
    body: 'Dear Customer, transaction of Rs 4,500.00 debited on card ending 9876 at AMAZON INDIA. AVL BAL Rs 8,200.00.',
    date: getMockDateISO(2),
  },
  {
    sender: 'AXISBK',
    body: 'Dear Customer, transaction of Rs 3,200.00 debited on card ending 9876 at AMAZON INDIA. AVL BAL Rs 5,000.00.',
    date: new Date(new Date(getMockDateISO(2)).getTime() + 30 * 60 * 1000).toISOString(),
  },
  // Subscriptions
  {
    sender: 'KOTAKB',
    body: 'Rs. 129.00 paid to SPOTIFY from A/c XX5566. Avl Bal: Rs 8,771.00.',
    date: getMockDateISO(10),
  },
  {
    sender: 'KOTAKB',
    body: 'Rs. 189.00 paid to YOUTUBE PREMIUM from A/c XX5566. Avl Bal: Rs 8,582.00.',
    date: getMockDateISO(9),
  },
  // Weekend spend creep: High spends on Saturday and Sunday
  {
    sender: 'HDFCBK',
    body: 'Alert: Rs. 6,800.00 debited from A/c XX4321 for purchase at OVERLAND GEAR. Avl Bal Rs. 35,000.00.',
    date: getMockDateISO(2, true),
  },
  {
    sender: 'HDFCBK',
    body: 'Alert: Rs. 5,200.00 debited from A/c XX4321 for purchase at FINE DINING. Avl Bal Rs. 29,800.00.',
    date: getMockDateISO(3, true),
  },
];

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
 * Simulate scanning SMS messages (for testing/simulators/iOS).
 * Adds simulated transactions to the store.
 * Returns the number of newly added transactions.
 */
export async function simulateSMSScan(): Promise<number> {
  let newTransactionsCount = 0;

  for (const sms of MOCK_SMS_MESSAGES) {
    // Note: We don't enforce the 10-day limit on mocks to ensure demo/testing functions correctly with mock data.
    const wasAdded = await processIncomingSMS(sms.body, sms.date, sms.sender, false);
    if (wasAdded) {
      newTransactionsCount++;
    }
  }

  return newTransactionsCount;
}

/**
 * Start listening for incoming SMS messages (Android only).
 */
export function startSMSListener(onNewTransactionAdded: (count: number) => void) {
  if (!hasNativeModule || !ExpoReadSms) {
    return () => {};
  }

  console.log('Starting SMS background receiver...');
  
  try {
    ExpoReadSms.startReadSMS(
      async (status: string, smsData: any, errorMsg?: any) => {
        if (status === 'error') {
          console.error('SMS Listener Error:', errorMsg);
          return;
        }

        let address = '';
        let body = '';

        if (typeof smsData === 'object' && smsData !== null) {
          address = smsData.address || (Array.isArray(smsData) ? smsData[0] : '');
          body = smsData.body || (Array.isArray(smsData) ? smsData[1] : '');
        } else if (typeof smsData === 'string') {
          if (smsData.startsWith('[') && smsData.endsWith(']')) {
            const content = smsData.slice(1, -1);
            const firstCommaIndex = content.indexOf(', ');
            if (firstCommaIndex !== -1) {
              address = content.substring(0, firstCommaIndex).trim();
              body = content.substring(firstCommaIndex + 2).trim();
            } else {
              body = content;
            }
          } else {
            body = smsData;
          }
        }

        const date = new Date().toISOString();

        if (body) {
          const wasAdded = await processIncomingSMS(body, date, address, true);
          if (wasAdded) {
            onNewTransactionAdded(1);
          }
        }
      }
    );

    // Return unsubscriber function
    return () => {
      if (ExpoReadSms?.stopReadSMS) {
        ExpoReadSms.stopReadSMS();
      }
    };
  } catch (error) {
    console.error('Failed to start native SMS listener:', error);
    return () => {};
  }
}
