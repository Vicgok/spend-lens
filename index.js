import { NativeModules, AppRegistry } from 'react-native';
import { processIncomingSMS } from './src/features/sms-parser/sms-reader';


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

