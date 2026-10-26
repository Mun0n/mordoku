import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import type { Puzzle } from '@/engine/types';
import { useTheme } from '@/hooks/use-theme';
import { Portrait } from '@/ui/Portrait';

const SERIF = Fonts?.serif ?? 'serif';

export function Dossier({ puzzle, onClose }: { puzzle: Puzzle; onClose: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.blurb}>{puzzle.blurb}</ThemedText>
        <ThemedText type="smallBold">La víctima</ThemedText>
        <Person
          name={puzzle.victim.name}
          role={puzzle.victim.role}
          seed={puzzle.victim.id}
          shirt={puzzle.victim.color}
          victim
        />
        <ThemedText type="smallBold">También estaban</ThemedText>
        {puzzle.suspects.map((suspect) => (
          <Person
            key={suspect.id}
            name={suspect.name}
            role={suspect.role}
            seed={suspect.id}
            shirt={suspect.color}
          />
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.close, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="smallBold" themeColor="background">
          Al tablero
        </ThemedText>
      </Pressable>
    </View>
  );
}

function Person({
  name,
  role,
  seed,
  shirt,
  victim = false,
}: {
  name: string;
  role: string;
  seed: string;
  shirt: string;
  victim?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.person, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.frame, { borderColor: theme.text }]}>
        <Portrait seed={seed} shirt={shirt} victim={victim} width={64} />
      </View>
      <View style={styles.copy}>
        <ThemedText style={styles.name}>{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {titled(role)}
        </ThemedText>
      </View>
    </View>
  );
}

function titled(role: string) {
  if (role.length === 0) return role;
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  blurb: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 26,
    lineHeight: 34,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    padding: Spacing.two,
  },
  frame: {
    borderWidth: 2,
    padding: 3,
  },
  copy: { flex: 1, gap: 2 },
  name: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 26,
  },
  close: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
