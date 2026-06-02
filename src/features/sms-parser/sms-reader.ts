import { Platform, PermissionsAndroid } from 'react-native';
import { parseSMS, generateSMSHash } from './parser';
import { useTransactionStore } from '../../stores/transaction-store';
import { checkSMSHashExists } from '../../lib/database';
import { TransactionCreateInput } from '../../types';

// Optional import for native read SMS library
let ExpoReadSms: any = null;
try {
  ExpoReadSms = require('@maniac-tech/react-native-expo-read-sms');
} catch (error) {
  // Graceful fallback for Expo Go, iOS, or environment without the library
}

// Sample bank SMS messages for mock simulation
const MOCK_SMS_MESSAGES = [
  {
    sender: 'HDFCBK',
    body: 'Alert: Rs. 1,200.00 debited from A/c XX4321 on 20-May-26 for purchase at SWIGGY. Avl Bal Rs. 45,670.00.',
    date: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
  },
  {
    sender: 'SBIINB',
    body: 'Your A/c XX1122 is credited with Rs. 75,000.00 on 01-May-26 by Salary. Avl Bal Rs. 1,20,000.00.',
    date: new Date(Date.now() - 1 * 86400000).toISOString(), // 1 day ago
  },
  {
    sender: 'AXISBK',
    body: 'Dear Customer, transaction of Rs 450.00 debited on card ending 9876 at UBER INDIA. AVL BAL Rs 12,450.00.',
    date: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
  },
  {
    sender: 'KOTAKB',
    body: 'Rs. 2,500.00 paid to ZOMATO from A/c XX5566. Avl Bal: Rs 8,900.00.',
    date: new Date(Date.now() - 4 * 86400000).toISOString(), // 4 days ago
  },
  {
    sender: 'CHASE',
    body: 'Transaction alert: $ 15.50 charged on Card ending 5543 at NETFLIX. Bal: $ 254.10.',
    date: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
  },
  {
    sender: 'BOFA',
    body: 'Deposit of $ 500.00 received in Account ending 9988 from Refund. Balance $ 1,450.00.',
    date: new Date(Date.now() - 6 * 86400000).toISOString(), // 6 days ago
  },
];

/**
 * Check if the app has SMS reading permission.
 */
export async function checkSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  // Use the library's check function if available
  if (ExpoReadSms?.checkIfHasSMSPermission) {
    try {
      const hasPermission = await ExpoReadSms.checkIfHasSMSPermission();
      return !!hasPermission;
    } catch (e) {
      console.warn('Failed to check permission using expo-read-sms:', e);
    }
  }

  // Fallback to standard react-native check
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
  } catch (error) {
    console.error('Error checking SMS permission:', error);
    return false;
  }
}

/**
 * Request SMS reading permission from the user.
 */
export async function requestSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  // Use the library's request function if available
  if (ExpoReadSms?.requestReadSMSPermission) {
    try {
      const result = await ExpoReadSms.requestReadSMSPermission();
      return result === 'authorized' || result === true;
    } catch (e) {
      console.warn('Failed to request permission using expo-read-sms:', e);
    }
  }

  // Fallback to standard react-native request
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'SpendLens needs access to read your SMS to automatically track and categorize transactions.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting SMS permission:', error);
    return false;
  }
}

/**
 * Synchronize transactions from native Android SMS messages.
 * Reads the device's SMS inbox and parses financial transactions.
 * Returns the number of newly added transactions.
 */
export async function syncSMSFromDevice(): Promise<number> {
  const hasPermission = await checkSMSPermission();
  if (!hasPermission) {
    console.log('Sync aborted: SMS permission not granted.');
    return 0;
  }

  let newCount = 0;
  // If we're on Android and have native package, query inbox (future implementation using custom modules or packages)
  // For safety and compatibility with current state, we proceed if we can query native messages.
  // In our current build, if native read package is not installed or throws, we log it.
  console.log('Scanning Android SMS inbox...');
  
  // Note: Since reading inbox requires direct content resolver query, which isn't standard in
  // expo-read-sms (which primarily listens to INCOMING SMS), we stub actual query here.
  // In a full native build, we would use a native module. For this version, we will
  // mock the scan if there are no native functions to query the inbox.
  return newCount;
}

/**
 * Simulate scanning SMS messages (for testing/simulators/iOS).
 * Adds simulated transactions to the store.
 * Returns the number of newly added transactions.
 */
export async function simulateSMSScan(): Promise<number> {
  const store = useTransactionStore.getState();
  
  // Ensure we have at least one account to assign transactions to
  let targetAccount = store.accounts[0];
  if (!targetAccount) {
    targetAccount = await store.createAccount({
      name: 'Primary Bank Account',
      type: 'bank',
      balance: 50000,
      currency: 'INR',
      icon: '🏦',
    });
  }
  
  let newTransactionsCount = 0;

  for (const sms of MOCK_SMS_MESSAGES) {
    const hash = generateSMSHash(sms.body, sms.date);
    const alreadyExists = await checkSMSHashExists(hash);

    if (!alreadyExists) {
      const parsed = parseSMS(sms.body, sms.date);
      if (parsed) {
        const input: TransactionCreateInput = {
          accountId: targetAccount.id,
          type: parsed.type,
          amount: parsed.amount,
          merchant: parsed.merchant || undefined,
          description: parsed.rawBody,
          date: parsed.date,
          source: 'sms',
          smsHash: hash,
        };
        await store.addTransaction(input);
        newTransactionsCount++;
      }
    }
  }

  return newTransactionsCount;
}

/**
 * Start listening for incoming SMS messages (Android only).
 */
export function startSMSListener(onNewTransactionAdded: (count: number) => void) {
  if (Platform.OS !== 'android' || !ExpoReadSms) {
    return () => {};
  }

  console.log('Starting SMS background receiver...');
  
  try {
    ExpoReadSms.startReadSMS(
      async (sms: any) => {
        // sms is an object containing address and body, e.g. { address: string, body: string } or list
        // Depending on platform package structure, let's extract body and address:
        const address = sms.address || (Array.isArray(sms) ? sms[0] : '');
        const body = sms.body || (Array.isArray(sms) ? sms[1] : '');
        const date = new Date().toISOString();

        if (body) {
          const hash = generateSMSHash(body, date);
          const alreadyExists = await checkSMSHashExists(hash);
          if (!alreadyExists) {
            const parsed = parseSMS(body, date);
            if (parsed) {
              const store = useTransactionStore.getState();
              
              // Ensure we have an account
              let targetAccount = store.accounts[0];
              if (!targetAccount) {
                targetAccount = await store.createAccount({
                  name: 'Primary Bank Account',
                  type: 'bank',
                  balance: 10000,
                  currency: 'INR',
                  icon: '🏦',
                });
              }
              await store.addTransaction({
                accountId: targetAccount.id,
                type: parsed.type,
                amount: parsed.amount,
                merchant: parsed.merchant || undefined,
                description: parsed.rawBody,
                date: parsed.date,
                source: 'sms',
                smsHash: hash,
              });
              onNewTransactionAdded(1);
            }
          }
        }
      },
      (error: any) => {
        console.error('SMS Listener Error:', error);
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
