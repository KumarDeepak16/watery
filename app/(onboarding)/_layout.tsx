// onboarding stack. no header, single screen flow.

import { Stack } from 'expo-router';

export default function OnboardingLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
