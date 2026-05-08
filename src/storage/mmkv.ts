// Storage adapter using AsyncStorage — works on Expo Go, no native rebuild needed.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

// In-memory cache so reads stay synchronous for repos that need it.
const cache = new Map<string, string>();

// Call once at app start to warm cache from disk.
export async function hydrateCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [k, v] of pairs) {
      if (v != null) cache.set(k, v);
    }
  } catch {
    // non-fatal — cache stays empty, reads fall through
  }
}

const persist = async (key: string, value: string): Promise<void> => {
  cache.set(key, value);
  await AsyncStorage.setItem(key, value).catch(() => undefined);
};

const drop = async (key: string): Promise<void> => {
  cache.delete(key);
  await AsyncStorage.removeItem(key).catch(() => undefined);
};

export const getString = (key: string): string | undefined => cache.get(key);

export const setString = (key: string, value: string): void => {
  void persist(key, value);
};

export const getNumber = (key: string): number | undefined => {
  const v = cache.get(key);
  return v != null ? Number(v) : undefined;
};

export const setNumber = (key: string, value: number): void => {
  void persist(key, String(value));
};

export const getBool = (key: string): boolean | undefined => {
  const v = cache.get(key);
  return v != null ? v === 'true' : undefined;
};

export const setBool = (key: string, value: boolean): void => {
  void persist(key, value ? 'true' : 'false');
};

export const getJSON = <T>(key: string): T | undefined => {
  const raw = cache.get(key);
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    void drop(key);
    return undefined;
  }
};

export const setJSON = <T>(key: string, value: T): void => {
  void persist(key, JSON.stringify(value));
};

export const remove = (key: string): void => {
  void drop(key);
};

export const clearAll = async (): Promise<void> => {
  cache.clear();
  await AsyncStorage.clear().catch(() => undefined);
};

export const hasKey = (key: string): boolean => cache.has(key);

// Zustand persist middleware adapter (async).
export const zustandMMKVStorage: StateStorage = {
  getItem: async (name) => {
    const cached = cache.get(name);
    if (cached != null) return cached;
    try {
      const v = await AsyncStorage.getItem(name);
      if (v != null) cache.set(name, v);
      return v;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    await persist(name, value);
  },
  removeItem: async (name) => {
    await drop(name);
  },
};
