import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { Colors } from '@/constants/theme';
import { SettingsProvider, useSettings } from '@/settings';
import { loadProgress } from '@/storage/progress';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SettingsProvider>
      <RootStack />
    </SettingsProvider>
  );
}

function RootStack() {
  const { ready, resolved } = useSettings();
  const colors = Colors[resolved];
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    let live = true;
    loadProgress().then(() => {
      if (live) setProgressReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const booted = ready && progressReady;

  useEffect(() => {
    if (!booted) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [booted]);

  if (!booted) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
