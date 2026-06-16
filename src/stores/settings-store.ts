import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/logger';
import { STORAGE_KEYS } from '../lib/constants';
import { ThemeMode } from '../theme';

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
    set(() => ({ currentStep: step })),

  completeOnboarding: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    set({ isComplete: true, currentStep: 0, isHydrated: true });
  },

  checkOnboardingStatus: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      set({ isComplete: value === 'true', isHydrated: true });
    } catch (error) {
      logger.warn('Failed to check onboarding status', {
        error: error instanceof Error ? error.message : String(error),
      });
      set({ isHydrated: true });
    }
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
