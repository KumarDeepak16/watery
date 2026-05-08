// friendly 404 with bounce-back CTA.

import { View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Text } from '@/components/ui/Text';
import { WaterDropMascot } from '@/components/hydration/WaterDropMascot';

export default function NotFound(): JSX.Element {
  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <WaterDropMascot size={140} expression="sad" />
          <Text variant="h1" weight="bold" className="mt-8" align="center">
            Lost in the stream
          </Text>
          <Text variant="bodyLg" muted className="mt-3" align="center">
            That page evaporated. Let's get you back to your hydration.
          </Text>
          <Link href="/(tabs)/home" asChild>
            <Button title="Back to Home" variant="primary" size="lg" style={{ marginTop: 24 }} />
          </Link>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
