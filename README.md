# Watery 💧

**Premium hydration tracker** — track water intake, build streaks, get smart reminders and analytics. Fully offline. No account needed.

Built with **Expo SDK 54**, **React Native**, **TypeScript**, **NativeWind**, and **Reanimated 4**.

---

## Features

- **Animated water ring** — SVG wave that fills as you drink
- **Smart reminders** — scheduled between your wake/sleep times at your chosen interval
- **Analytics** — weekly bar chart, monthly heatmap, peak hours, trend line, weekly score
- **Gamification** — XP, levels, streaks, 20+ badges, confetti on goal hit
- **Onboarding** — personalized daily goal based on weight, activity, climate
- **Dark/Light mode** — adaptive palette, system preference support
- **Offline-first** — AsyncStorage, no network required

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 54, Expo Router 6 |
| Language | TypeScript (strict) |
| Styling | NativeWind 4 (Tailwind CSS) |
| Animations | React Native Reanimated 4 |
| Gestures | React Native Gesture Handler |
| State | Zustand 5 |
| Storage | AsyncStorage + in-memory cache |
| Charts | React Native SVG (custom) |
| Icons | @expo/vector-icons (Ionicons) |
| Notifications | expo-notifications |
| Fonts | Plus Jakarta Sans, Space Grotesk |

---

## Project Structure

```
f:\aquapulse\
├── app/                        # Expo Router routes
│   ├── _layout.tsx             # Root layout (providers, fonts, splash)
│   ├── (onboarding)/           # Onboarding flow
│   └── (tabs)/                 # Main app tabs
├── src/
│   ├── components/
│   │   ├── ui/                 # Text, Button, Card, Sheet, Input, Toggle...
│   │   ├── hydration/          # WaterWaveProgress, QuickAddButton...
│   │   ├── charts/             # WeeklyBarChart, MonthlyHeatmap, TrendLine...
│   │   ├── gamification/       # BadgeCard, XpBar, LevelUpModal...
│   │   ├── navigation/         # TabBar, Header
│   │   └── onboarding/         # OnboardingStep, WelcomeAnimation
│   ├── screens/
│   │   ├── Home/               # Hero ring, quick add, insights
│   │   ├── History/            # Analytics: week/month/all-time
│   │   ├── Reminders/          # Notification settings + schedule preview
│   │   ├── Profile/            # Stats, badges, about, data export
│   │   └── Onboarding/         # 8-step personalization flow
│   ├── stores/                 # Zustand stores (user, hydration, settings, gamification, theme)
│   ├── services/               # notificationService, audioService, analyticsService...
│   ├── hooks/                  # useHydration, useTheme, useGamification...
│   ├── storage/                # AsyncStorage adapter, repositories, types
│   ├── theme/                  # colors, typography, spacing, gradients, motion
│   ├── constants/              # app constants, badge definitions
│   └── utils/                  # date, format, math, validators, motivational
├── app.json                    # Expo config
├── tailwind.config.js          # NativeWind theme
├── babel.config.js
├── metro.config.js
└── eas.json                    # EAS Build profiles
```

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Expo CLI** — `npm install -g expo-cli`
- **EAS CLI** (for device builds) — `npm install -g eas-cli`

For running on a physical device or emulator:
- **Android**: Android Studio + SDK (set `ANDROID_HOME`)  
- **iOS**: macOS + Xcode 15+

---

## Installation

```bash
# Clone
git clone https://github.com/kumardeepak16/watery.git
cd watery

# Install dependencies
npm install --legacy-peer-deps

# Start Metro bundler (Expo Go — limited features)
npx expo start --clear
```

Scan QR with **Expo Go** app on your phone.

> **Note**: Notifications, background tasks, and MMKV require a development build (not Expo Go). See below.

---

## Development Build (recommended)

Full native features (notifications, background fetch):

```bash
# Login to Expo account
eas login

# Build development APK (Android)
eas build --profile development --platform android

# Install APK on device, then start Metro:
npx expo start --dev-client --clear
```

---

## Running on Device / Emulator

### Android (requires Android Studio + SDK)

```bash
# Set Android SDK path (Windows)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"

# Prebuild + run
npx expo prebuild --clean
npx expo run:android
```

### iOS (macOS only)

```bash
npx expo prebuild --clean
npx expo run:ios
```

---

## Environment & Config

No `.env` needed — fully local. All config in:

- `app.json` — app identity, permissions, plugins
- `src/constants/app.ts` — default amounts, reminder intervals, activity levels
- `src/theme/colors.ts` — color palette (light/dark)

---

## Key Commands

```bash
npm start              # Start Metro bundler
npm run android        # Start Metro (requires Android SDK for device push)
npm run typecheck      # TypeScript check (npx tsc --noEmit)
npm run format         # Prettier format
eas build --profile development --platform android   # Build dev APK
eas build --profile preview --platform android       # Build preview APK
eas build --profile production --platform android    # Build production AAB
```

---

## Permissions

| Permission | Platform | Purpose |
|---|---|---|
| POST_NOTIFICATIONS | Android 13+ | Hydration reminders |
| RECEIVE_BOOT_COMPLETED | Android | Reschedule reminders after reboot |
| SCHEDULE_EXACT_ALARM | Android | Precise reminder timing |
| FOREGROUND_SERVICE | Android | Background hydration check |
| VIBRATE / WAKE_LOCK | Android | Notification vibration |
| NSUserNotificationsUsageDescription | iOS | Reminders permission prompt |
| UIBackgroundModes: fetch | iOS | Background task |

---

## Architecture Notes

**Storage**: Uses AsyncStorage with an in-memory cache layer. Cache is pre-warmed at app start via `hydrateCache()` so all synchronous store reads work instantly.

**Stores**: Zustand v5 without `persist` middleware — manual `rehydrate()` called on bootstrap to avoid async race with store initialization (`updater is not a function` bug).

**Notifications**: Full scheduling works only in dev builds. Expo Go blocks push on Android SDK 53+. All notification code is wrapped in try/catch for graceful degradation.

**Charts**: Pure `react-native-svg` — no victory-native (too heavy). Animated bars via Reanimated `useAnimatedProps`.

**Wave animation**: JS-thread `setInterval` at 20fps updating SVG path strings. Avoids worklet cross-thread function errors.

---

## Developer

**Deepak Kumar**  
- Email: deepakkumar190803@gmail.com  
- Website: [1619.in](https://1619.in)  
- LinkedIn: [deepakkumar1916](https://www.linkedin.com/in/deepakkumar1916/)  
- GitHub: [kumardeepak16](https://github.com/kumardeepak16)

---

## License

MIT — free to use, modify and distribute.

---

*Built with care for your health journey. Stay hydrated.*
