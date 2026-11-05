import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings, type SchemeChoice } from '@/settings';
import { clearProgress } from '@/storage/progress';

const SCHEMES: { id: SchemeChoice; label: string }[] = [
  { id: 'system', label: 'Sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
];

export default function OptionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { scheme, haptics, setScheme, setHaptics } = useSettings();

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText themeColor="accent">Menú</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Opciones
          </ThemedText>
          <ThemedText type="smallBold">Apariencia</ThemedText>
          <View style={styles.row}>
            {SCHEMES.map((item) => {
              const on = scheme === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setScheme(item.id)}
                  style={[
                    styles.choice,
                    { backgroundColor: on ? theme.accent : theme.backgroundElement },
                  ]}
                >
                  <ThemedText type="smallBold" themeColor={on ? 'background' : 'text'}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText type="smallBold">Vibración</ThemedText>
          <Pressable
            onPress={() => setHaptics(!haptics)}
            style={[styles.choice, styles.haptics, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="smallBold">{haptics ? 'Activada' : 'Desactivada'}</ThemedText>
          </Pressable>
          <ThemedText type="smallBold">Partida</ThemedText>
          <Pressable
            onPress={confirmClear}
            style={[styles.choice, styles.haptics, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="smallBold">Borrar progreso</ThemedText>
          </Pressable>
          <Pressable onPress={() => router.push('/privacy')} hitSlop={8}>
            <ThemedText type="small" themeColor="textSecondary">
              Privacidad
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function confirmClear() {
  Alert.alert('Borrar progreso', 'Quita las partidas y las marcas de resuelto. Las opciones se quedan.', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Borrar',
      style: 'destructive',
      onPress: () => {
        void clearProgress().catch(() => Alert.alert('No se ha podido borrar el progreso.'));
      },
    },
  ]);
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  title: { fontSize: 34, lineHeight: 38 },
  row: { flexDirection: 'row', gap: Spacing.two },
  choice: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haptics: { flex: 0, alignSelf: 'flex-start', paddingHorizontal: Spacing.four },
});
