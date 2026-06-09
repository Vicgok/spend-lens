import { requireNativeModule } from 'expo-modules-core';

let SpendLensSmsModule: any = null;
try {
  SpendLensSmsModule = requireNativeModule('SpendLensSmsModule');
} catch (e: any) {
  console.warn('[SpendLensSmsModule] Native module not found. Fallback to mock.', e?.message);
}

export default SpendLensSmsModule;

