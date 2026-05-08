// rotating copy banks

// Time-aware notification messages
export const hydrationMessages: readonly string[] = [
  'Time to hydrate — your focus will thank you',
  'One glass now beats a headache later',
  'Your cells are calling for water',
  'Stay sharp. A quick sip goes a long way',
  'Pause. Breathe. Drink.',
  'Fuel your brain — it runs on water',
  'Tiny habit, tidal results. Drink up',
  'Hydration is the simplest form of self-care',
  'Your skin, kidneys, and mood all agree: drink',
  'One glass closer to your daily goal',
  'Cool down, focus up — it starts with water',
  'Drink up. Future you is grateful',
  'The day runs smoother when you\'re hydrated',
  'Beat the 3pm slump before it starts',
  'Crystal clear thinking starts with clear water',
  'A sip now, a stride later',
  'Recharge in 30 seconds — just drink',
  'Your body is 60% water. Keep it that way',
  'Water first, everything else second',
  'Quiet the noise. Pour a glass',
  'You\'ve been at it a while — time to hydrate',
  'Strong streaks start with small sips',
  'No caffeine needed — water restores focus',
  'Quench the moment. One cup at a time',
  'Aqua time. You earned this break',
];

// Dynamic messages based on context
export function getContextualMessage(opts: {
  percentDone: number;
  streak: number;
  hourOfDay: number;
  remainingMl: number;
}): string {
  const { percentDone, streak, hourOfDay, remainingMl } = opts;

  if (percentDone >= 100) {
    return streak > 7
      ? `Goal crushed! ${streak}-day streak is outstanding`
      : 'Daily goal complete! Great work today';
  }
  if (percentDone >= 75) {
    const remaining = (remainingMl / 1000).toFixed(1);
    return `Almost there — just ${remaining}L to hit your goal`;
  }
  if (percentDone >= 50) {
    return 'Halfway done. Keep the momentum going';
  }
  if (hourOfDay >= 20) {
    const remaining = (remainingMl / 1000).toFixed(1);
    return `${remaining}L left before bed. You can do this`;
  }
  if (hourOfDay >= 14) {
    return 'Afternoon slump? Water helps more than you think';
  }
  if (hourOfDay < 9) {
    return 'Good morning! Start the day with a full glass';
  }
  if (streak >= 7) {
    return `${streak} days strong — don\'t break the chain`;
  }
  const msg = hydrationMessages[Math.floor(Date.now() / 60000) % hydrationMessages.length];
  return msg ?? hydrationMessages[0]!;
}

export const motivationalQuotes: readonly string[] = [
  'Water is life. Drink like it.',
  'You are 60% water. Act like it.',
  'Small sips. Strong streaks.',
  'Discipline is doing the small things daily.',
  'Consistency compounds. Show up every day.',
  'Tiny habits, tidal results.',
  'The body achieves what the mind believes.',
  'Health is built one good choice at a time.',
  'Progress, not perfection.',
  'Strong minds live in hydrated bodies.',
  'Every drop counts toward who you\'re becoming.',
  'The best investment is in your own health.',
  'Your habits are your future, sip by sip.',
  'Champions hydrate before they\'re thirsty.',
  'Simple rituals create extraordinary outcomes.',
  'Start well. Sip often. Finish strong.',
  'Take care of your body — it\'s the only place you live.',
  'Good days are built on healthy mornings.',
  'What you do daily defines who you become.',
  'Grit is staying consistent when motivation fades.',
];

export const hydrationFacts: readonly string[] = [
  'Drinking water can boost metabolism by up to 30% for an hour',
  'Even mild dehydration (1-2%) impairs concentration and mood',
  'Your brain is 73% water — hydration is brain fuel',
  'Drinking water before meals reduces calorie intake by ~13%',
  'Cold water absorption is 20% faster than room-temperature water',
  'Skin elasticity improves significantly with consistent hydration',
  'Water flushes toxins your kidneys can\'t handle without it',
  '75% of Americans are chronically dehydrated',
  'Thirst is already a sign of mild dehydration',
  'Athletes lose up to 2L of water per hour during exercise',
];

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type ClimateKind = 'temperate' | 'warm' | 'hot' | 'tropical';

export const climateTips: Record<ClimateKind, string> = {
  temperate: 'Mild climate — 2L daily is a solid baseline',
  warm: 'Warm weather increases sweat loss — add an extra 300ml',
  hot: 'Hot climate dehydrates fast — aim for 3L minimum',
  tropical: 'High humidity amplifies heat stress — drink before you feel thirsty',
};

export const seasonalTips: readonly string[] = [
  'In summer heat, add 500ml to your daily goal',
  'Air conditioning dehydrates — indoor days need water too',
  'Cold weather reduces thirst but not water needs',
  'Humid climates increase sweat even when you feel cool',
  'Morning light triggers cortisol — counter it with water',
  'Exercise doubles your hydration requirement',
];
