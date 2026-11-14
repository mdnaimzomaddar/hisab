import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyTheme, ThemeMode } from './theme';

export type ThemePref = 'system' | 'light' | 'dark';
const KEY = 'hisab:theme';

function resolve(pref: ThemePref): ThemeMode {
  if (pref === 'system') return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  return pref;
}

interface ThemeState {
  pref: ThemePref;
  mode: ThemeMode;
  loadPref: () => Promise<void>;
  setPref: (pref: ThemePref) => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  pref: 'dark',
  mode: 'dark',

  loadPref: async () => {
    try {
      const v = await AsyncStorage.getItem(KEY);
      const pref: ThemePref = v === 'light' || v === 'system' ? v : 'dark';
      const mode = resolve(pref);
      applyTheme(mode);
      set({ pref, mode });
    } catch (e) {
      console.warn('loadPref failed', e);
    }
  },

  setPref: (pref) => {
    const mode = resolve(pref);
    applyTheme(mode);
    set({ pref, mode });
    void AsyncStorage.setItem(KEY, pref).catch(() => {});
  },
}));

// "System" বেছে রাখলে ফোনের থিম বদলালে অ্যাপও বদলাবে
Appearance.addChangeListener(() => {
  if (useThemeStore.getState().pref !== 'system') return;
  const mode = resolve('system');
  applyTheme(mode);
  useThemeStore.setState({ mode });
});