// time-of-day greeting helper with emoji

import { useMemo } from 'react';

export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// String subtype with extra fields. Usable directly in <Text>{greeting}</Text>
// thanks to the implicit toString, while still exposing label/emoji/partOfDay.
export type UseGreetingResult = string & {
  greeting: string;
  label: string;
  emoji: string;
  partOfDay: PartOfDay;
};

const decide = (hour: number): { partOfDay: PartOfDay; label: string; emoji: string } => {
  if (hour >= 5 && hour < 12) return { partOfDay: 'morning', label: 'Good morning', emoji: '🌅' };
  if (hour >= 12 && hour < 17) return { partOfDay: 'afternoon', label: 'Good afternoon', emoji: '☀️' };
  if (hour >= 17 && hour < 22) return { partOfDay: 'evening', label: 'Good evening', emoji: '🌇' };
  return { partOfDay: 'night', label: 'Stay hydrated', emoji: '🌙' };
};

export const useGreeting = (name?: string, now?: Date): UseGreetingResult => {
  const hour = (now ?? new Date()).getHours();
  return useMemo<UseGreetingResult>(() => {
    const { partOfDay, label, emoji } = decide(hour);
    const greeting = name ? `${label}, ${name}` : label;
    // String objects render fine in React Native <Text> nodes
    const out = new String(greeting) as unknown as UseGreetingResult;
    Object.assign(out, { greeting, label, emoji, partOfDay });
    return out;
  }, [name, hour]);
};
