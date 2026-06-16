import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../lib/constants';
import { ThemeMode } from '../theme';

function logOnboardingStore(event: string, payload?: Record<string, unknown>) {
  const suffix = payload ? ` ${JSON.stringify(payload)}` : '';
  console.log(`[ONBOARDING_STORE] ${event}${suffix}`);
}

interface OnboardingState {
  isComplete: boolean;
  isHydrated: boolean;
  currentStep: number;
  setStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isComplete: false,
  isHydrated: false,
  currentStep: 0,

  setStep: (step) =>
    set((state) => {
      logOnboardingStore('setStep', {
        from: state.currentStep,
        to: step,
        isComplete: state.isComplete,
        isHydrated: state.isHydrated,
      });
      return { currentStep: step };
    }),

  completeOnboarding: async () => {
    const before = useOnboardingStore.getState();
    logOnboardingStore('completeOnboarding:start', {
      currentStep: before.currentStep,
      isComplete: before.isComplete,
      isHydrated: before.isHydrated,
    });
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    set({ isComplete: true, currentStep: 0, isHydrated: true });
    const after = useOnboardingStore.getState();
    logOnboardingStore('completeOnboarding:done', {
      currentStep: after.currentStep,
      isComplete: after.isComplete,
      isHydrated: after.isHydrated,
    });
  },

  checkOnboardingStatus: async () => {
    logOnboardingStore('checkOnboardingStatus:start');
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    set({ isComplete: value === 'true', isHydrated: true });
    const after = useOnboardingStore.getState();
    logOnboardingStore('checkOnboardingStatus:done', {
      storageValue: value,
      currentStep: after.currentStep,
      isComplete: after.isComplete,
      isHydrated: after.isHydrated,
    });
  },
}));

interface SettingsState {
  currency: string;
  themeMode: ThemeMode;
  setCurrency: (currency: string) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'INR',
  themeMode: 'dark',

  setCurrency: async (currency) => {
    await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_CURRENCY, currency);
    set({ currency });
  },

  setThemeMode: async (mode) => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    set({ themeMode: mode });
  },

  loadSettings: async () => {
    const currency = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_CURRENCY);
    const themeMode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
    set({
      currency: currency || 'INR',
      themeMode: (themeMode as ThemeMode) || 'dark',
    });
  },
}));
