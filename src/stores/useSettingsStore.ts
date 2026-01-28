import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings } from '@/types';

interface SettingsStoreState extends Settings {
  isHydrated: boolean;
}

interface SettingsStoreActions {
  // Sound settings
  toggleSound: () => void;
  toggleMusic: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;

  // Haptics
  toggleHaptics: () => void;
  setHapticsEnabled: (enabled: boolean) => void;

  // Language
  setLanguage: (language: 'fr' | 'en') => void;

  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Notifications
  toggleNotifications: () => void;
  setNotifications: (enabled: boolean) => void;

  // Hydration
  setHydrated: () => void;

  // Reset
  resetSettings: () => void;
}

type SettingsStore = SettingsStoreState & SettingsStoreActions;

const initialState: SettingsStoreState = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  language: 'fr',
  theme: 'system',
  notifications: true,
  isHydrated: false,
};

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        ...initialState,

        toggleSound: () => {
          set((state) => {
            state.soundEnabled = !state.soundEnabled;
          });
        },

        toggleMusic: () => {
          set((state) => {
            state.musicEnabled = !state.musicEnabled;
          });
        },

        setSoundEnabled: (enabled) => {
          set((state) => {
            state.soundEnabled = enabled;
          });
        },

        setMusicEnabled: (enabled) => {
          set((state) => {
            state.musicEnabled = enabled;
          });
        },

        toggleHaptics: () => {
          set((state) => {
            state.hapticsEnabled = !state.hapticsEnabled;
          });
        },

        setHapticsEnabled: (enabled) => {
          set((state) => {
            state.hapticsEnabled = enabled;
          });
        },

        setLanguage: (language) => {
          set((state) => {
            state.language = language;
          });
        },

        setTheme: (theme) => {
          set((state) => {
            state.theme = theme;
          });
        },

        toggleNotifications: () => {
          set((state) => {
            state.notifications = !state.notifications;
          });
        },

        setNotifications: (enabled) => {
          set((state) => {
            state.notifications = enabled;
          });
        },

        setHydrated: () => {
          set((state) => {
            state.isHydrated = true;
          });
        },

        resetSettings: () => {
          set(() => ({
            ...initialState,
            isHydrated: true,
          }));
        },
      })),
      {
        name: 'startup-ludo-settings',
        storage: createJSONStorage(() => AsyncStorage),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated();
        },
        partialize: (state) => ({
          soundEnabled: state.soundEnabled,
          musicEnabled: state.musicEnabled,
          hapticsEnabled: state.hapticsEnabled,
          language: state.language,
          theme: state.theme,
          notifications: state.notifications,
        }),
      }
    )
  )
);
