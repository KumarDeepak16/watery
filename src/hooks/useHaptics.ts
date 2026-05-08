// haptic functions; respect settings.hapticsEnabled

import { useCallback, useMemo } from 'react';

import { useSettingsStore } from '@/stores/settingsStore';
import { haptics } from '@/services/hapticsService';

export type HapticKind =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

export interface UseHapticsResult {
  enabled: boolean;
  trigger: (kind?: HapticKind) => Promise<void>;
  light: () => Promise<void>;
  medium: () => Promise<void>;
  heavy: () => Promise<void>;
  success: () => Promise<void>;
  warning: () => Promise<void>;
  error: () => Promise<void>;
  selection: () => Promise<void>;
}

export const useHaptics = (): UseHapticsResult => {
  const enabled = useSettingsStore((s) => s.hapticsEnabled);

  const trigger = useCallback(
    async (kind: HapticKind = 'selection'): Promise<void> => {
      if (!enabled) return;
      switch (kind) {
        case 'light':
          return haptics.light();
        case 'medium':
          return haptics.medium();
        case 'heavy':
          return haptics.heavy();
        case 'success':
          return haptics.success();
        case 'warning':
          return haptics.warning();
        case 'error':
          return haptics.error();
        case 'selection':
        default:
          return haptics.selection();
      }
    },
    [enabled],
  );

  const noop = useCallback(async () => undefined, []);

  return useMemo(
    () => ({
      enabled,
      trigger,
      light: enabled ? haptics.light : noop,
      medium: enabled ? haptics.medium : noop,
      heavy: enabled ? haptics.heavy : noop,
      success: enabled ? haptics.success : noop,
      warning: enabled ? haptics.warning : noop,
      error: enabled ? haptics.error : noop,
      selection: enabled ? haptics.selection : noop,
    }),
    [enabled, trigger, noop],
  );
};
