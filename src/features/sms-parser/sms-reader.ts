import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { parseTransactionSMS, generateSMSHash } from './engine';
import { useTransactionStore } from '../../stores/transaction-store';
import { checkSMSHashExists } from '../../lib/database';
import { TransactionCreateInput } from '../../types';
import SpendLensSmsModule from '../../../modules/spendlens-sms-module';

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
        const store = useTransactionStore.getState();
        
        // Find default account (prefer Bank, fallback to first available account)
        let targetAccount = store.accounts.find((a) => a.type === 'bank') || store.accounts[0];
        if (!targetAccount) {
          targetAccount = await store.createAccount({
            name: 'Primary Bank Account',
            type: 'bank',
            balance: 50000,
            currency: 'INR',
            icon: '🏦',
          });
        }
        
        for (const sms of messages) {
          const dateStr = new Date(sms.date).toISOString();
          const hash = generateSMSHash(sms.body, dateStr);
          const alreadyExists = await checkSMSHashExists(hash);
          
          if (!alreadyExists) {
            const parsed = parseTransactionSMS(sms.body, dateStr, sms.address);
            if (parsed && parsed.transaction.amount) {
              const input: TransactionCreateInput = {
                accountId: targetAccount.id,
                type: parsed.transaction.type === 'credit' ? 'income' : 'expense',
                amount: parsed.transaction.amount,
                merchant: parsed.transaction.merchant || undefined,
                description: parsed.rawBody,
                date: parsed.date || dateStr,
                source: 'sms',
                smsHash: hash,
              };
              await store.addTransaction(input);
              newCount++;
            }
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
      const parsed = parseTransactionSMS(sms.body, sms.date, sms.sender);
      if (parsed && parsed.transaction.amount) {
        const input: TransactionCreateInput = {
          accountId: targetAccount.id,
          type: parsed.transaction.type === 'credit' ? 'income' : 'expense',
          amount: parsed.transaction.amount,
          merchant: parsed.transaction.merchant || undefined,
          description: parsed.rawBody,
          date: parsed.date || sms.date,
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
          const hash = generateSMSHash(body, date);
          const alreadyExists = await checkSMSHashExists(hash);
          if (!alreadyExists) {
            const parsed = parseTransactionSMS(body, date, address);
            if (parsed && parsed.transaction.amount) {
              const store = useTransactionStore.getState();
              
              // Ensure we have an account
              let targetAccount = store.accounts.find((a) => a.type === 'bank') || store.accounts[0];
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
                type: parsed.transaction.type === 'credit' ? 'income' : 'expense',
                amount: parsed.transaction.amount,
                merchant: parsed.transaction.merchant || undefined,
                description: parsed.rawBody,
                date: parsed.date || date,
                source: 'sms',
                smsHash: hash,
              });
              
              // Push local native notification
              if (SpendLensSmsModule && typeof SpendLensSmsModule.showNotification === 'function') {
                const amountFormatted = `₹${parsed.transaction.amount.toLocaleString('en-IN')}`;
                const actionText = parsed.transaction.type === 'credit' ? 'credited to' : 'debited from';
                const merchantText = parsed.transaction.merchant ? ` at ${parsed.transaction.merchant}` : '';
                SpendLensSmsModule.showNotification(
                  parsed.transaction.type === 'credit' ? 'Income Detected 💰' : 'Expense Detected 💸',
                  `${amountFormatted} ${actionText} your account${merchantText}.`
                ).catch((err: any) => console.warn('Failed to trigger native notification:', err));
              }

              onNewTransactionAdded(1);
            }
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
