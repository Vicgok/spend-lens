import { NativeModules } from 'react-native';

// Monkeypatch the unmaintained 3rd party library's native module to prevent NativeEventEmitter crashes
if (NativeModules.RNExpoReadSms) {
  if (typeof NativeModules.RNExpoReadSms.addListener !== 'function') {
    NativeModules.RNExpoReadSms.addListener = () => {};
  }
  if (typeof NativeModules.RNExpoReadSms.removeListeners !== 'function') {
    NativeModules.RNExpoReadSms.removeListeners = () => {};
  }
}

import 'expo-router/entry';

