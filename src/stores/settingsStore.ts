import { create } from "zustand";

export interface Settings {
  theme: "dark" | "light";
  fontSize: number;
  keybindings: Record<string, string>;
}

interface SettingsStore {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  setTheme: (theme: "dark" | "light") => void;
  setFontSize: (size: number) => void;
}

const SETTINGS_STORAGE_KEY = "claude-desktop-settings";

const defaultSettings: Settings = {
  theme: "light",
  fontSize: 14,
  keybindings: {
    newSession: "Ctrl+N",
    search: "Ctrl+K",
    settings: "Ctrl+,",
  },
};

function loadStoredSettings(): Settings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(stored),
      keybindings: defaultSettings.keybindings,
    };
  } catch {
    return defaultSettings;
  }
}

function persistSettings(settings: Settings) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: loadStoredSettings(),
  updateSettings: (newSettings) =>
    set((s) => {
      const settings = { ...s.settings, ...newSettings };
      persistSettings(settings);
      return { settings };
    }),
  setTheme: (theme) =>
    set((s) => {
      const settings = { ...s.settings, theme };
      persistSettings(settings);
      return { settings };
    }),
  setFontSize: (fontSize) =>
    set((s) => {
      const settings = { ...s.settings, fontSize };
      persistSettings(settings);
      return { settings };
    }),
}));
