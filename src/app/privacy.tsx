import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const LINES = [
  'Trama no pide cuentas, no lleva anuncios y no se conecta a la red. Los casos van dentro de la app.',
  'La partida y las opciones se guardan solo en este dispositivo. Borrar el progreso, en Opciones, o desinstalar la app las quita.',
  'No se recogen datos, no se comparten con nadie y no hay seguimiento.',
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText themeColor="accent">Opciones</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Privacidad
          </ThemedText>
          {LINES.map((line) => (
            <ThemedText key={line}>{line}</ThemedText>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  title: { fontSize: 34, lineHeight: 38 },
});
