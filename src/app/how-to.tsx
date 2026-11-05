import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { BLOCKING_OBJECTS, type ObjectKind } from '@/engine/types';
import { useTheme } from '@/hooks/use-theme';
import { markHowToSeen } from '@/storage/progress';
import { ObjectSwatch } from '@/ui/Glyph';

const RULES = [
  {
    title: 'Una por fila',
    body: 'Una persona por fila y por columna. La víctima ocupa la casilla que queda libre.',
  },
  {
    title: 'La sala',
    body: 'El asesino es la única persona viva en la sala de la víctima. No tiene que estar a su lado.',
  },
  {
    title: 'Las pistas',
    body: 'Hablan de salas, muebles y de quién quedó al norte de quién. Ninguna nombra al asesino.',
  },
  {
    title: 'Acusar',
    body: 'Rellena el tablero y acusa. Si te rindes, la solución lo rellena y el caso queda revelado.',
  },
];

const FURNITURE: { kind: ObjectKind; name: string }[] = [
  { kind: 'silla', name: 'Silla' },
  { kind: 'sofa', name: 'Sofá' },
  { kind: 'alfombra', name: 'Alfombra' },
  { kind: 'planta', name: 'Planta' },
  { kind: 'mesa', name: 'Mesa' },
  { kind: 'estanteria', name: 'Estantería' },
];

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
            <View key={rule.title} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.cardTop}>
                <View style={[styles.index, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold" themeColor="accent">
                    {index + 1}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">{rule.title}</ThemedText>
              </View>
              <ThemedText themeColor="textSecondary">{rule.body}</ThemedText>
            </View>
          ))}
          <ThemedText type="smallBold" style={styles.section}>
            Los muebles
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Junto a cuenta en cruz, dentro de la sala. La esquina toca dos paredes que se juntan.
          </ThemedText>
          <View style={styles.grid}>
            {FURNITURE.map((item) => {
              const blocks = BLOCKING_OBJECTS.has(item.kind);
              return (
                <View key={item.kind} style={[styles.tile, { backgroundColor: theme.backgroundElement }]}>
                  <ObjectSwatch kind={item.kind} />
                  <View style={styles.tileCopy}>
                    <ThemedText type="smallBold">{item.name}</ThemedText>
                    <ThemedText type="small" themeColor={blocks ? 'accent' : 'textSecondary'}>
                      {blocks ? 'Bloquea' : 'Se ocupa'}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">Anotar</ThemedText>
            <ThemedText themeColor="textSecondary">
              Mantén pulsada una casilla para dejar a la persona que tengas elegida.
            </ThemedText>
          </View>
        </ScrollView>
        <Pressable
          accessibilityRole="button"
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
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  title: { fontSize: 34, lineHeight: 38, marginBottom: Spacing.two },
  section: { marginTop: Spacing.three },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  index: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 16,
    padding: Spacing.two,
  },
  tileCopy: { flex: 1, gap: 2 },
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
