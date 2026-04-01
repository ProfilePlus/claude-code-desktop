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

const defaultSettings: Settings = {
  theme: "light",
  fontSize: 14,
  keybindings: {
    newSession: "Ctrl+N",
    search: "Ctrl+K",
    settings: "Ctrl+,",
  },
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  updateSettings: (newSettings) =>
    set((s) => ({ settings: { ...s.settings, ...newSettings } })),
  setTheme: (theme) =>
    set((s) => ({ settings: { ...s.settings, theme } })),
  setFontSize: (fontSize) =>
    set((s) => ({ settings: { ...s.settings, fontSize } })),
}));
