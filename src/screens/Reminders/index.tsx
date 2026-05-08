// reminders settings screen.

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { Header } from '@/components/navigation/Header';
import { useHaptics } from '@/hooks/useHaptics';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { notificationService, SOUND_OPTIONS } from '@/services/notificationService';

const INTERVAL_SEGMENTS = [
  { id: '15', label: '15m' },
  { id: '30', label: '30m' },
  { id: '60', label: '1h' },
  { id: 'custom', label: 'Custom' },
] as const;

const SNOOZE_SEGMENTS = [
  { id: '5', label: '5m' },
  { id: '10', label: '10m' },
  { id: '15', label: '15m' },
  { id: '30', label: '30m' },
] as const;

const KNOWN_INTERVALS = new Set([15, 30, 60]);

const hourToDate = (h: number): Date => {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d;
};
const formatHour = (h: number): string =>
  hourToDate(h).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function RemindersScreen(): JSX.Element {
  const { colors, isDark } = useTheme();
  const haptics = useHaptics();
  const settings = useSettingsStore();
  const { permission, requestPermission, upcomingToday, refreshUpcoming } = useNotifications();

  // local mirror; commit on save
  const [enabled, setEnabled] = useState(settings.notificationsEnabled);
  const [intervalMin, setIntervalMin] = useState(settings.reminderIntervalMin);
  const [wakeHour, setWakeHour] = useState(settings.wakeHour);
  const [sleepHour, setSleepHour] = useState(settings.sleepHour);
  const [silent, setSilent] = useState(settings.silentMode);
  const [sound, setSound] = useState(settings.soundEnabled);
  const [hapticsOn, setHapticsOn] = useState(settings.hapticsEnabled);
  const [snoozeMin, setSnoozeMin] = useState(settings.snoozeMin);
  const [notifSound, setNotifSound] = useState<import('@/services/notificationService').NotificationSound>(
    settings.notificationSound ?? 'water-drop',
  );

  const [customSheet, setCustomSheet] = useState(false);
  const [customMin, setCustomMin] = useState(intervalMin);
  const [openTime, setOpenTime] = useState<'wake' | 'sleep' | null>(null);
  const [saving, setSaving] = useState(false);
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  // Sound sources mapped by id
  const SOUND_SOURCES: Record<string, number> = {
    'water-drop': require('../../../assets/sounds/water-drop.wav'),
    'gentle-bell': require('../../../assets/sounds/gentle-bell.wav'),
    'success-chime': require('../../../assets/sounds/success-chime.wav'),
  };

  const previewSound = useCallback(async (soundId: string) => {
    if (soundId === 'none') return;
    const source = SOUND_SOURCES[soundId];
    if (!source) return;
    try {
      setPlayingSound(soundId);
      const player = createAudioPlayer(source);
      player.play();
      // Auto-cleanup after 3s
      setTimeout(() => {
        try { player.remove(); } catch { /* ignore */ }
        setPlayingSound(null);
      }, 3000);
    } catch {
      setPlayingSound(null);
    }
  }, []);

  // segmented value reflects custom when nonstandard
  const intervalSegId = useMemo(
    () => (KNOWN_INTERVALS.has(intervalMin) ? String(intervalMin) : 'custom'),
    [intervalMin],
  );

  // Generate preview schedule from current settings (works in Expo Go too)
  const previewSchedule = useMemo(() => {
    if (!enabled || intervalMin <= 0) return [];
    const pad = (n: number) => String(n).padStart(2, '0');
    const slots: { id: string; time: string; label: string }[] = [];
    const wakeTotal = wakeHour * 60;
    const sleepTotal = sleepHour * 60;
    let cursor = wakeTotal;
    let i = 0;
    while (cursor <= sleepTotal && slots.length < 30) {
      const h = Math.floor(cursor / 60);
      const m = cursor % 60;
      const ampm = h < 12 ? 'AM' : 'PM';
      const display = h % 12 === 0 ? 12 : h % 12;
      slots.push({
        id: `preview_${i}`,
        time: `${display}:${pad(m)} ${ampm}`,
        label: `Hydration reminder`,
      });
      cursor += intervalMin;
      i++;
    }
    return slots;
  }, [enabled, intervalMin, wakeHour, sleepHour]);

  useEffect(() => {
    void refreshUpcoming();
  }, [refreshUpcoming]);

  const handleEnable = useCallback(
    async (next: boolean) => {
      haptics.selection();
      if (next && permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }
      setEnabled(next);
    },
    [haptics, permission, requestPermission],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    haptics.success();
    await settings.update({
      notificationsEnabled: enabled,
      reminderIntervalMin: intervalMin,
      wakeHour,
      sleepHour,
      silentMode: silent,
      soundEnabled: sound,
      hapticsEnabled: hapticsOn,
      snoozeMin,
      notificationSound: notifSound,
    });
    if (enabled) {
      await notificationService.scheduleHydrationReminders({
        intervalMin,
        wakeHour,
        sleepHour,
        silent,
        sound,
        notificationSound: notifSound,
      });
    } else {
      await notificationService.cancelAll();
    }
    await refreshUpcoming();
    setSaving(false);
  }, [
    enabled,
    intervalMin,
    wakeHour,
    sleepHour,
    silent,
    sound,
    hapticsOn,
    snoozeMin,
    notifSound,
    settings,
    refreshUpcoming,
    haptics,
  ]);

  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = useCallback(async () => {
    haptics.medium();
    setTestResult(null);
    const result = await notificationService.sendTestNotification();
    if (result.success) {
      setTestResult('Notification sent! Check in ~3 seconds.');
      haptics.success();
    } else {
      setTestResult(result.error ?? 'Failed to send notification.');
      haptics.warning();
    }
    setTimeout(() => setTestResult(null), 5000);
  }, [haptics]);

  const onTimeChange = useCallback(
    (kind: 'wake' | 'sleep') => (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') {
        if (event.type === 'set' && date) {
          if (kind === 'wake') setWakeHour(date.getHours());
          else setSleepHour(date.getHours());
        }
        setOpenTime(null);
      } else if (date) {
        if (kind === 'wake') setWakeHour(date.getHours());
        else setSleepHour(date.getHours());
      }
    },
    [],
  );

  const permTint = permission === 'granted' ? 'success' : permission === 'denied' ? 'danger' : 'warning';
  const permLabel =
    permission === 'granted'
      ? 'Notifications enabled'
      : permission === 'denied'
        ? 'Notifications blocked'
        : 'Permission needed';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header
          left={
            <View>
              <Text variant="caption" muted>
                Settings
              </Text>
              <Text variant="h3" className="mt-0.5">
                Reminders
              </Text>
            </View>
          }
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* permission status */}
          <Animated.View entering={FadeInDown.duration(420)} className="mt-2 px-6">
            <Chip icon="notifications" label={permLabel} tint={permTint} />
          </Animated.View>

          {/* master toggle */}
          <Animated.View entering={FadeInDown.duration(420).delay(80)} className="mt-4 px-6">
            <GlassCard className="p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text variant="h4">Hydration Reminders</Text>
                  <Text variant="caption" muted className="mt-1">
                    Gentle nudges to keep you on pace.
                  </Text>
                </View>
                <Toggle value={enabled} onChange={handleEnable} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* interval */}
          <Animated.View entering={FadeInDown.duration(420).delay(160)} className="mt-4 px-6">
            <GlassCard className="p-5">
              <Text variant="caption" muted className="uppercase tracking-wider">
                Frequency
              </Text>
              <View className="mt-3">
                <SegmentedControl
                  segments={[...INTERVAL_SEGMENTS]}
                  value={intervalSegId}
                  onChange={(id) => {
                    haptics.selection();
                    if (id === 'custom') {
                      setCustomMin(intervalMin);
                      setCustomSheet(true);
                    } else {
                      setIntervalMin(Number(id));
                    }
                  }}
                />
              </View>
              <Text variant="caption" muted className="mt-3">
                Every {intervalMin} minutes during waking hours.
              </Text>
            </GlassCard>
          </Animated.View>

          {/* schedule */}
          <Animated.View entering={FadeInDown.duration(420).delay(240)} className="mt-4 px-6">
            <GlassCard className="p-5">
              <Text variant="caption" muted className="uppercase tracking-wider">
                Active Hours
              </Text>

              <Pressable
                onPress={() => {
                  haptics.selection();
                  setOpenTime((p) => (p === 'wake' ? null : 'wake'));
                }}
                className="mt-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Text variant="body">☀️</Text>
                  <Text variant="body" className="ml-3">
                    Wake
                  </Text>
                </View>
                <Text variant="h4">{formatHour(wakeHour)}</Text>
              </Pressable>
              {openTime === 'wake' ? (
                <DateTimePicker
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  value={hourToDate(wakeHour)}
                  onChange={onTimeChange('wake')}
                  minuteInterval={30}
                />
              ) : null}

              <View className="my-3 h-px" style={{ backgroundColor: colors.divider }} />

              <Pressable
                onPress={() => {
                  haptics.selection();
                  setOpenTime((p) => (p === 'sleep' ? null : 'sleep'));
                }}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Text variant="body">🌙</Text>
                  <Text variant="body" className="ml-3">
                    Sleep
                  </Text>
                </View>
                <Text variant="h4">{formatHour(sleepHour)}</Text>
              </Pressable>
              {openTime === 'sleep' ? (
                <DateTimePicker
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  value={hourToDate(sleepHour)}
                  onChange={onTimeChange('sleep')}
                  minuteInterval={30}
                />
              ) : null}
            </GlassCard>
          </Animated.View>

          {/* feedback toggles */}
          <Animated.View entering={FadeInDown.duration(420).delay(320)} className="mt-4 px-6">
            <GlassCard className="p-5">
              <Text variant="caption" muted className="uppercase tracking-wider">
                Feedback
              </Text>
              <ToggleRow
                label="Silent mode"
                desc="Vibration only, no sound"
                value={silent}
                onChange={(v) => {
                  haptics.selection();
                  setSilent(v);
                }}
              />
              <Divider />
              {/* Sound selector */}
              <View style={{ paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View>
                    <Text variant="caption" weight="medium" color={silent ? colors.textSubtle : colors.text}>
                      Notification sound
                    </Text>
                    <Text variant="micro" muted>Choose ringtone</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'column', gap: 6, opacity: silent ? 0.4 : 1 }}>
                  {SOUND_OPTIONS.map((opt) => {
                    const selected = notifSound === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => {
                          if (silent) return;
                          haptics.selection();
                          setNotifSound(opt.id);
                          setSound(opt.id !== 'none');
                          void previewSound(opt.id);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor: selected
                            ? (isDark ? 'rgba(56,189,248,0.12)' : 'rgba(0,119,182,0.07)')
                            : 'transparent',
                          borderWidth: selected ? 1 : 0,
                          borderColor: selected ? colors.primary : 'transparent',
                        }}
                      >
                        <Ionicons
                          name={opt.id === 'none' ? 'volume-mute-outline' : 'musical-note-outline'}
                          size={16}
                          color={selected ? colors.primary : colors.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text variant="caption" weight={selected ? 'semibold' : 'regular'} color={selected ? colors.primary : colors.text}>
                            {opt.label}
                          </Text>
                          <Text variant="micro" muted>
                            {playingSound === opt.id ? 'Playing...' : opt.description}
                          </Text>
                        </View>
                        {selected && (
                          <Ionicons
                            name={playingSound === opt.id ? 'volume-high' : 'checkmark-circle'}
                            size={18}
                            color={colors.primary}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Divider />
              <ToggleRow
                label="Haptics"
                desc="Tactile feedback in-app"
                value={hapticsOn}
                onChange={(v) => {
                  haptics.selection();
                  setHapticsOn(v);
                }}
              />
            </GlassCard>
          </Animated.View>

          {/* snooze */}
          <Animated.View entering={FadeInDown.duration(420).delay(400)} className="mt-4 px-6">
            <GlassCard className="p-5">
              <Text variant="caption" muted className="uppercase tracking-wider">
                Snooze duration
              </Text>
              <View className="mt-3">
                <SegmentedControl
                  segments={[...SNOOZE_SEGMENTS]}
                  value={String(snoozeMin)}
                  onChange={(id) => {
                    haptics.selection();
                    setSnoozeMin(Number(id));
                  }}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* test */}
          <Animated.View entering={FadeInDown.duration(420).delay(480)} className="mt-4 px-6">
            <Button
              title="Send test notification"
              variant="secondary"
              fullWidth
              onPress={handleTest}
            />
            {testResult ? (
              <Text
                variant="small"
                style={{
                  marginTop: 8,
                  textAlign: 'center',
                  color: testResult.includes('sent') ? colors.success : colors.danger,
                }}
              >
                {testResult}
              </Text>
            ) : null}
          </Animated.View>

          {/* upcoming preview list */}
          <Animated.View entering={FadeInDown.duration(420).delay(560)} style={{ marginTop: 16, paddingHorizontal: 24 }}>
            <GlassCard style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text variant="caption" muted style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Schedule Preview
                </Text>
                {previewSchedule.length > 0 && (
                  <Text variant="micro" color={colors.primary}>
                    {previewSchedule.length} reminder{previewSchedule.length !== 1 ? 's' : ''} / day
                  </Text>
                )}
              </View>

              {previewSchedule.length > 0 ? (
                <View style={{ gap: 6 }}>
                  {previewSchedule.slice(0, 8).map((t) => (
                    <View
                      key={t.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: colors.bg,
                        borderWidth: 1,
                        borderColor: colors.divider,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="notifications-outline" size={14} color={colors.primary} />
                        <Text variant="caption" weight="medium">{t.label}</Text>
                      </View>
                      <Text variant="caption" weight="semibold" color={colors.primary}>
                        {t.time}
                      </Text>
                    </View>
                  ))}
                  {previewSchedule.length > 8 && (
                    <Text variant="micro" muted style={{ textAlign: 'center', marginTop: 4 }}>
                      + {previewSchedule.length - 8} more reminders
                    </Text>
                  )}
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Ionicons name="notifications-off-outline" size={28} color={colors.textSubtle} />
                  <Text variant="caption" muted style={{ marginTop: 8, textAlign: 'center' }}>
                    {enabled ? 'Set interval and wake/sleep times above' : 'Enable reminders to see schedule'}
                  </Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* save */}
          <Animated.View entering={FadeInDown.duration(420).delay(640)} className="mt-6 px-6">
            <Button
              title="Save changes"
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              onPress={handleSave}
            />
          </Animated.View>
        </ScrollView>

        {/* custom interval sheet */}
        <Sheet
          visible={customSheet}
          onClose={() => setCustomSheet(false)}
          title="Custom interval"
        >
          <View className="px-2 pb-2">
            <Text variant="caption" muted className="mb-3 uppercase tracking-wider">
              How often?
            </Text>
            <NumberStepper
              value={customMin}
              min={5}
              max={240}
              step={5}
              unit="min"
              onChange={setCustomMin}
            />
            <Button
              title={`Set every ${customMin}min`}
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              onPress={() => {
                setIntervalMin(customMin);
                setCustomSheet(false);
              }}
            />
          </View>
        </Sheet>
    </SafeAreaView>
  );
}

interface ToggleRowProps {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, desc, value, onChange, disabled }: ToggleRowProps): JSX.Element {
  return (
    <View
      className="mt-3 flex-row items-center justify-between"
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <View className="flex-1 pr-4">
        <Text variant="body">{label}</Text>
        <Text variant="caption" muted className="mt-0.5">
          {desc}
        </Text>
      </View>
      <Toggle value={value} onChange={onChange} disabled={disabled} />
    </View>
  );
}

function Divider(): JSX.Element {
  const { colors } = useTheme();
  return <View className="my-1 h-px" style={{ backgroundColor: colors.divider }} />;
}
