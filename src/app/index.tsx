import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { caseById } from '@/content/cases';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { loadProgress, resumeCaseId } from '@/storage/progress';
import { Mark } from '@/ui/Mark';

export default function MenuScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      loadProgress().then((file) => {
        if (!live) return;
        const id = resumeCaseId(file);
        setResumeId(id && caseById(id) ? id : null);
        setReady(true);
      });
      return () => {
        live = false;
      };
    }, []),
  );

  if (!ready) return <ThemedView style={styles.fill} />;

  const resume = resumeId ? caseById(resumeId) : null;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <View style={styles.brand}>
            <Mark size={96} />
            <ThemedText type="title" style={styles.title}>
              Trama
            </ThemedText>
          </View>
          <View style={styles.actions}>
            <MenuButton label="Nueva partida" onPress={() => router.push('/cases')} primary={!resume} />
            {resume ? (
              <MenuButton
                label="Continuar partida"
                hint={resume.title}
                onPress={() => router.push({ pathname: '/case/[id]', params: { id: resume.id } })}
                primary
              />
            ) : null}
            <MenuButton label="Opciones" onPress={() => router.push('/options')} />
            <MenuButton label="Cómo se juega" onPress={() => router.push('/how-to')} />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function MenuButton({
  label,
  hint,
  onPress,
  primary = false,
}: {
  label: string;
  hint?: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor: primary ? theme.accent : theme.backgroundElement }]}
    >
      <ThemedText type="smallBold" themeColor={primary ? 'background' : 'text'}>
        {label}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor={primary ? 'background' : 'textSecondary'}>
          {hint}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    justifyContent: 'space-between',
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  title: { fontFamily: Fonts.serif, fontSize: 48, lineHeight: 52 },
  actions: { gap: Spacing.two },
  button: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
