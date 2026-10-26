import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { cases, DIFFICULTY_LABEL, DIFFICULTY_ORDER } from '@/content/cases';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { loadProgress, type CaseStatus, type ProgressFile } from '@/storage/progress';

export default function CasesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressFile>({});

  useFocusEffect(
    useCallback(() => {
      let live = true;
      loadProgress().then((file) => {
        if (live) setProgress(file);
      });
      return () => {
        live = false;
      };
    }, []),
  );

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText themeColor="accent">Menú</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Nueva partida
          </ThemedText>
          {DIFFICULTY_ORDER.map((difficulty) => (
            <View key={difficulty} style={styles.group}>
              <ThemedText type="smallBold">{DIFFICULTY_LABEL[difficulty]}</ThemedText>
              {cases
                .filter((puzzle) => puzzle.difficulty === difficulty)
                .map((puzzle) => {
                  const status = progress[puzzle.id]?.status ?? 'new';
                  return (
                    <Pressable
                      key={puzzle.id}
                      onPress={() => router.push({ pathname: '/case/[id]', params: { id: puzzle.id } })}
                      style={[styles.card, { backgroundColor: theme.backgroundElement }]}
                    >
                      <View style={styles.cardTop}>
                        <ThemedText type="smallBold" style={styles.cardTitle}>
                          {puzzle.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {puzzle.size}×{puzzle.size}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {puzzle.blurb}
                      </ThemedText>
                      <StatusBadge status={status} />
                    </Pressable>
                  );
                })}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  if (status === 'new') return null;
  const label = status === 'solved' ? 'Resuelto' : status === 'revealed' ? 'Revelado' : 'A medias';
  return (
    <ThemedText type="small" themeColor="accent">
      {label}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  title: { fontSize: 34, lineHeight: 38 },
  group: { gap: Spacing.two },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  cardTitle: { flex: 1 },
});
