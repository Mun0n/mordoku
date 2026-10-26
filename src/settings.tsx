import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useColorScheme as useSystemScheme } from '@/hooks/use-color-scheme';
import { setHapticsEnabled } from '@/ui/copy';

const KEY = 'caso.v1.settings';

export type SchemeChoice = 'system' | 'light' | 'dark';

type Settings = {
  scheme: SchemeChoice;
  haptics: boolean;
};

type SettingsValue = Settings & {
  ready: boolean;
  resolved: 'light' | 'dark';
  setScheme: (scheme: SchemeChoice) => void;
  setHaptics: (on: boolean) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

const fallback: Settings = { scheme: 'system', haptics: true };

function readSettings(raw: string | null): Settings {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      scheme: parsed.scheme === 'light' || parsed.scheme === 'dark' ? parsed.scheme : 'system',
      haptics: parsed.haptics !== false,
    };
  } catch {
    return fallback;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const system = useSystemScheme();
  const [settings, setSettings] = useState<Settings>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!live) return;
      const next = readSettings(raw);
      setSettings(next);
      setHapticsEnabled(next.haptics);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  function persist(next: Settings) {
    setSettings(next);
    setHapticsEnabled(next.haptics);
    void AsyncStorage.setItem(KEY, JSON.stringify(next));
  }

  const resolved = settings.scheme === 'system' ? (system === 'dark' ? 'dark' : 'light') : settings.scheme;

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        ready,
        resolved,
        setScheme: (scheme) => persist({ ...settings, scheme }),
        setHaptics: (haptics) => persist({ ...settings, haptics }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) {
    return {
      ...fallback,
      ready: true,
      resolved: 'light',
      setScheme: () => undefined,
      setHaptics: () => undefined,
    };
  }
  return value;
}
