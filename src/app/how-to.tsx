import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { OBJECT_KINDS, type ObjectKind } from '@/engine/types';
import { useTheme } from '@/hooks/use-theme';
import { markHowToSeen } from '@/storage/progress';
import { ObjectSwatch } from '@/ui/Glyph';

const RULES = [
  'Una persona por fila y por columna. El cuerpo ocupa la casilla libre cuando todos los demás están colocados.',
  'El asesino es la única persona viva en la sala de la víctima. No hace falta que esté pegada a ella.',
  'Las pistas hablan de salas, muebles y de quién quedó al norte de quién. Ninguna dice quién es el asesino.',
  'Cierra el tablero antes de acusar. Si te rindes, la solución rellena el caso entero.',
];

const OBJECT_LABEL: Record<ObjectKind, string> = {
  silla: 'Silla, se puede ocupar',
  sofa: 'Sofá, se puede ocupar',
  alfombra: 'Alfombra, se puede ocupar',
  planta: 'Planta, bloquea la casilla',
  mesa: 'Mesa, bloquea la casilla',
  estanteria: 'Estantería, bloquea la casilla',
};

export default function HowToScreen() {
  const router = useRouter();
  const theme = useTheme();

  async function close() {
    await markHowToSeen();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Cómo se juega
          </ThemedText>
          {RULES.map((rule, index) => (
            <View key={rule} style={styles.rule}>
              <ThemedText type="smallBold" themeColor="accent">
                {index + 1}
              </ThemedText>
              <ThemedText style={styles.ruleText}>{rule}</ThemedText>
            </View>
          ))}
          <ThemedText type="smallBold">Los muebles</ThemedText>
          <ThemedText themeColor="textSecondary">
            Junto a cuenta en cruz, dentro de la misma sala. La esquina toca dos paredes que se juntan.
          </ThemedText>
          {OBJECT_KINDS.map((kind) => (
            <View key={kind} style={styles.objectRow}>
              <ObjectSwatch kind={kind} />
              <ThemedText type="small">{OBJECT_LABEL[kind]}</ThemedText>
            </View>
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            Mantén pulsada una casilla para anotar a la persona que tengas elegida.
          </ThemedText>
        </ScrollView>
        <Pressable
          onPress={() => void close()}
          style={[styles.button, { backgroundColor: theme.accent }]}
        >
          <ThemedText style={styles.buttonLabel} themeColor="background">
            Entendido
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  title: { fontSize: 34, lineHeight: 38 },
  rule: { flexDirection: 'row', gap: Spacing.two },
  ruleText: { flex: 1 },
  objectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  button: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontWeight: '700' },
});
