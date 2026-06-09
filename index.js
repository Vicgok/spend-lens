import { NativeModules, AppRegistry } from 'react-native';
import { processIncomingSMS } from './src/features/sms-parser/sms-reader';

// Monkeypatch the unmaintained 3rd party library's native module to prevent NativeEventEmitter crashes
if (NativeModules.RNExpoReadSms) {
  if (typeof NativeModules.RNExpoReadSms.addListener !== 'function') {
    NativeModules.RNExpoReadSms.addListener = () => {};
  }
  if (typeof NativeModules.RNExpoReadSms.removeListeners !== 'function') {
    NativeModules.RNExpoReadSms.removeListeners = () => {};
  }
}

// Register headless task for background SMS scanning
AppRegistry.registerHeadlessTask('SpendLensSmsTask', () => async (data) => {
  console.log('[Headless Task] Received SMS data:', data);
  try {
    const { body, sender, date } = data;
    // Process SMS in background, showing notification if it's a valid transaction
    await processIncomingSMS(body, new Date(date).toISOString(), sender, true);
  } catch (error) {
    console.error('[Headless Task] Error processing SMS:', error);
  }
});

import 'expo-router/entry';

