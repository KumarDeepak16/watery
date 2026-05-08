import { getJSON, setJSON } from '../mmkv';
import { StorageKey } from '../keys';
import { DEFAULT_SETTINGS, type Settings } from '../types';

export const getSettings = (): Settings => {
  const stored = getJSON<Partial<Settings>>(StorageKey.SETTINGS);
  // merge against defaults so newly added fields backfill on upgrade
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
};

export const saveSettings = (patch: Partial<Settings>): Settings => {
  const next: Settings = { ...getSettings(), ...patch };
  setJSON(StorageKey.SETTINGS, next);
  return next;
};

export const resetSettings = (): Settings => {
  setJSON(StorageKey.SETTINGS, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
};

export const settingsRepository = {
  getSettings,
  saveSettings,
  resetSettings,
};
