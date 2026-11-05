import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { caseById, cases } from '@/content/cases';
import { Spacing } from '@/constants/theme';
import { hint } from '@/engine/analyze';
import { check, placementBlock } from '@/engine/check';
import { clueSentence, personName } from '@/engine/text';
import type { Assignment } from '@/engine/types';
import { caseIsOpen, keepMark, nextCaseId } from '@/game/campaign';
import {
  freshGame,
  liftPerson,
  placePerson,
  showSolution,
  toggleNote,
  undo,
  type GameState,
} from '@/game/state';
import { useTheme } from '@/hooks/use-theme';
import { loadProgress, progressSnapshot, readProgress, writeCase, type CaseStatus } from '@/storage/progress';
import { BarButton, ScreenBar } from '@/ui/Bar';
import { Board } from '@/ui/Board';
import { CaseClueCard, ClueCard } from '@/ui/ClueCard';
import { Dossier } from '@/ui/Dossier';
import { blockMessage, checkMessage, hintMessage, tapNo, tapOk, tapWin } from '@/ui/copy';
import { personSex } from '@/ui/person';

export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = caseById(typeof id === 'string' ? id : '');
  if (!puzzle) {
    return (
      <ThemedView style={styles.fill}>
        <ThemedText style={styles.missing}>Ese caso no está.</ThemedText>
      </ThemedView>
    );
  }
  return <CasePlay key={puzzle.id} puzzleId={puzzle.id} />;
}

function CasePlay({ puzzleId }: { puzzleId: string }) {
  const puzzle = caseById(puzzleId)!;
  const theme = useTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const [state, setState] = useState<GameState>(() => freshGame(puzzle));
  const [status, setStatus] = useState<CaseStatus>('new');
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(puzzle.suspects[0]?.id ?? null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [dossier, setDossier] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [locked, setLocked] = useState(false);
  const [boardWidth, setBoardWidth] = useState(0);
  const [cardsColumn, setCardsColumn] = useState(() => width - Spacing.three * 2);
  const cardsRef = useRef<ScrollViewInstance>(null);
  const cardOffsets = useRef<Record<string, number>>({});

  useEffect(() => {
    let live = true;
    loadProgress().then((file) => {
      if (!live) return;
      const order = cases.map((item) => item.id);
      if (!caseIsOpen(order, puzzle.id, (id) => file[id]?.status === 'solved')) {
        setLocked(true);
        setReady(true);
        return;
      }
      const saved = readProgress(puzzle, file[puzzle.id]);
      setState({ placements: saved.placements, notes: saved.notes, undo: [] });
      setStatus(saved.status);
      setDossier(saved.status === 'new');
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [puzzle]);

  function showToast(text: string | null) {
    setToast(text ? { id: Date.now(), text } : null);
  }

  function commit(next: GameState, nextStatus: CaseStatus, banner: string | null = null) {
    const kept = keepMark(status, nextStatus);
    setState(next);
    setStatus(kept);
    showToast(banner);
    void writeCase(puzzle.id, {
      placements: next.placements,
      notes: next.notes,
      status: kept,
    }).catch(() => showToast('No se ha podido guardar la partida.'));
  }

  function edited(current: CaseStatus): CaseStatus {
    return current === 'revealed' ? 'revealed' : 'in_progress';
  }

  function onTap(r: number, c: number) {
    const occupant = suspectAt(state.placements, r, c);
    if (!selectedId) {
      if (occupant) selectFromBoard(occupant);
      return;
    }
    const current = state.placements[selectedId];
    if (current && current.r === r && current.c === c) {
      commit(liftPerson(state, selectedId), edited(status), null);
      tapOk();
      return;
    }
    if (occupant && occupant !== selectedId) {
      selectFromBoard(occupant);
      return;
    }
    const block = placementBlock(puzzle, state.placements, selectedId, { r, c });
    if (block) {
      showToast(blockMessage(block));
      tapNo();
      return;
    }
    commit(placePerson(state, selectedId, { r, c }), edited(status), null);
    tapOk();
  }

  function onLongPress(r: number, c: number) {
    if (!selectedId) return;
    if (puzzle.victim.cell.r === r && puzzle.victim.cell.c === c) return;
    if (suspectAt(state.placements, r, c)) return;
    commit(toggleNote(state, selectedId, { r, c }), edited(status), null);
    tapOk();
  }

  function onUndo() {
    if (state.undo.length === 0) return;
    commit(undo(state), edited(status), null);
  }

  function onReset() {
    Alert.alert('Reiniciar', 'Quita las fichas y las notas de este caso.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: () => {
          commit(freshGame(puzzle), 'new', null);
          setSelectedId(puzzle.suspects[0]?.id ?? null);
        },
      },
    ]);
  }

  function selectFromBoard(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      const y = cardOffsets.current[id];
      if (y == null) return;
      cardsRef.current?.scrollTo({ y: Math.max(0, y - 4), animated: true });
    });
  }

  function onMapLayout(event: LayoutChangeEvent) {
    const { width: slotW, height: slotH } = event.nativeEvent.layout;
    const next = Math.floor(Math.min(slotW, slotH, 560));
    setBoardWidth((prev) => (prev === next ? prev : next));
  }

  function onCardsLayout(event: LayoutChangeEvent) {
    const pad = wide ? Spacing.two : 0;
    const next = Math.floor(event.nativeEvent.layout.width - pad);
    if (next <= 0) return;
    setCardsColumn((prev) => (prev === next ? prev : next));
  }

  function onReveal() {
    Alert.alert('Ver la solución', 'Rellena el tablero y marca el caso como revelado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Ver',
        style: 'destructive',
        onPress: () => {
          const next = showSolution(puzzle);
          const result = check(puzzle, next.placements);
          commit(next, 'revealed', result.ok ? checkMessage(puzzle, result) : null);
        },
      },
    ]);
  }

  function onHint() {
    const result = hint(puzzle, state.placements);
    if (result.type !== 'forced') {
      showToast(hintMessage(puzzle, result));
      tapNo();
      return;
    }
    const block = placementBlock(puzzle, state.placements, result.personId, result.cell);
    if (block) {
      showToast(blockMessage(block));
      tapNo();
      return;
    }
    commit(placePerson(state, result.personId, result.cell), edited(status), hintMessage(puzzle, result));
    selectFromBoard(result.personId);
    tapOk();
  }

  function onAccuse() {
    const result = check(puzzle, state.placements);
    if (!result.ok) {
      showToast(checkMessage(puzzle, result));
      tapNo();
      return;
    }
    const kept = keepMark(status, 'solved');
    commit(state, 'solved', null);
    tapWin();
    const file = progressSnapshot();
    const order = cases.map((item) => item.id);
    const solved = (id: string) => (id === puzzle.id ? kept === 'solved' : file[id]?.status === 'solved');
    const nextId = kept === 'solved' ? nextCaseId(order, solved) : null;
    setVerdict({
      killer: personName(puzzle, result.killerId),
      nextId,
      nextTitle: nextId ? (caseById(nextId)?.title ?? null) : null,
      complete: kept === 'solved' && nextId === null,
      revealed: kept === 'revealed',
    });
  }

  const full = puzzle.suspects.every((suspect) => state.placements[suspect.id]);
  const cardGap = 10;
  const cardColumns = cardsColumn >= 300 ? 3 : cardsColumn >= 200 ? 2 : 1;
  const cardWidth = Math.floor((cardsColumn - cardGap * (cardColumns - 1)) / cardColumns);
  const selected = puzzle.suspects.find((suspect) => suspect.id === selectedId);

  if (!ready) return <ThemedView style={styles.fill} />;
  if (locked) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
          <ScreenBar title={puzzle.title} backLabel="Niveles" onBack={() => router.back()} />
          <ThemedText style={styles.missing}>Antes hay que superar el nivel anterior.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <ScreenBar
          title={puzzle.title}
          hint={dossier ? 'La historia' : status === 'revealed' ? 'Solución vista' : status === 'solved' ? 'Resuelto' : undefined}
          hintColor={dossier ? 'textSecondary' : 'accent'}
          backLabel="Volver"
          onBack={() => router.back()}
          trailing={
            <>
              <BarButton label="Historia" on={dossier} onPress={() => setDossier((open) => !open)}>
                <BookIcon color={theme.text} />
              </BarButton>
              <BarButton label="Deshacer" onPress={onUndo} disabled={state.undo.length === 0}>
                <UndoIcon color={theme.text} />
              </BarButton>
            </>
          }
        />
        <View style={styles.stage}>
        <View style={[styles.play, wide && styles.playWide]}>
          <View style={[styles.mapColumn, wide ? styles.mapColumnWide : styles.mapColumnTall]}>
            <View style={styles.mapSlot} onLayout={onMapLayout}>
              {boardWidth > 0 ? (
                <Board
                  puzzle={puzzle}
                  placements={state.placements}
                  notes={state.notes}
                  selectedId={selectedId}
                  width={boardWidth}
                  onTap={onTap}
                  onLongPress={onLongPress}
                />
              ) : null}
            </View>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.selection}>
              {selectionHint(selected?.name)}
            </ThemedText>
          </View>
          <ScrollView
            ref={cardsRef}
            style={[
              styles.cardsScroll,
              {
                borderColor: theme.backgroundSelected,
                borderTopWidth: wide ? 0 : StyleSheet.hairlineWidth,
                borderLeftWidth: wide ? StyleSheet.hairlineWidth : 0,
              },
            ]}
            onLayout={onCardsLayout}
            contentContainerStyle={[
              styles.scroll,
              { paddingLeft: wide ? Spacing.two : 0, paddingTop: wide ? 0 : Spacing.two },
            ]}
          >
            <View style={[styles.cards, { gap: cardGap }]}>
              <ClueCard
                name={puzzle.victim.name}
                seed={puzzle.victim.id}
                sex={personSex(puzzle.victim.role)}
                shirt="#6b6258"
                width={cardWidth}
                victim
                lines={['La víctima.', roleLine(puzzle.victim.role)]}
              />
              {puzzle.suspects.map((suspect) => (
                <View
                  key={suspect.id}
                  onLayout={(event) => {
                    cardOffsets.current[suspect.id] = event.nativeEvent.layout.y;
                  }}
                  style={{ width: cardWidth }}
                >
                  <ClueCard
                    name={suspect.name}
                    seed={suspect.id}
                    sex={personSex(suspect.role)}
                    shirt={suspect.color}
                    width={cardWidth}
                    selected={suspect.id === selectedId}
                    lines={suspect.clues.map((clue) => clueSentence(puzzle, clue))}
                    onPress={() => setSelectedId((current) => (current === suspect.id ? null : suspect.id))}
                  />
                </View>
              ))}
              <CaseClueCard puzzle={puzzle} clues={puzzle.caseClues} width={cardsColumn} />
            </View>
          </ScrollView>
          {toast ? (
            <PlayToast
              key={toast.id}
              text={toast.text}
              onDone={() => setToast((current) => (current?.id === toast.id ? null : current))}
            />
          ) : null}
        </View>
        {verdict ? (
          <VerdictCard
            verdict={verdict}
            onNext={() => {
              if (!verdict.nextId) return;
              router.replace({ pathname: '/case/[id]', params: { id: verdict.nextId } });
            }}
            onLevels={() => router.dismissTo('/cases')}
            onClose={() => setVerdict(null)}
          />
        ) : (
          <>
            <View style={[styles.actions, { borderTopColor: theme.backgroundSelected }]}>
              <Action label="Reiniciar" onPress={onReset} />
              <Action label="Ayuda" onPress={onHint} />
              <Action label="Acusar" onPress={onAccuse} disabled={!full} filled />
            </View>
            <Pressable accessibilityRole="button" onPress={onReveal} style={styles.quiet}>
              <ThemedText type="small" themeColor="textSecondary">
                Solución
              </ThemedText>
            </Pressable>
          </>
        )}
        {dossier ? (
          <View style={[styles.dossier, { backgroundColor: theme.background }]}>
            <Dossier puzzle={puzzle} onClose={() => setDossier(false)} />
          </View>
        ) : null}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

type Verdict = {
  killer: string;
  nextId: string | null;
  nextTitle: string | null;
  complete: boolean;
  revealed: boolean;
};

function VerdictCard({
  verdict,
  onNext,
  onLevels,
  onClose,
}: {
  verdict: Verdict;
  onNext: () => void;
  onLevels: () => void;
  onClose: () => void;
}) {
  const title = verdict.complete ? 'Campaña completa' : `El asesino es ${verdict.killer}.`;
  const detail = verdict.complete
    ? `El asesino es ${verdict.killer}.`
    : verdict.revealed
      ? 'Ver la solución no abre el siguiente.'
      : verdict.nextTitle
        ? `Siguiente: ${verdict.nextTitle}`
        : null;
  const theme = useTheme();
  return (
    <View style={[styles.verdict, { backgroundColor: theme.background, borderTopColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold" themeColor={verdict.complete ? 'accent' : 'text'}>
        {title}
      </ThemedText>
      {detail ? (
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      ) : null}
      <View style={styles.actions}>
        {verdict.revealed ? (
          <Action label="Seguir" onPress={onClose} filled />
        ) : verdict.nextId ? (
          <>
            <Action label="Niveles" onPress={onLevels} />
            <Action label="Siguiente" onPress={onNext} filled />
          </>
        ) : (
          <Action label="Niveles" onPress={onLevels} filled />
        )}
      </View>
    </View>
  );
}

function Action({
  label,
  onPress,
  disabled = false,
  filled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  filled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.action,
        filled
          ? { backgroundColor: disabled ? theme.backgroundSelected : theme.accent }
          : { backgroundColor: theme.backgroundElement },
      ]}
    >
      <ThemedText
        type="smallBold"
        style={{ color: filled && !disabled ? theme.background : theme.text, opacity: disabled ? 0.45 : 1 }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function selectionHint(name: string | undefined): string {
  if (!name) return 'Elige a alguien. Mantén pulsado para anotar.';
  return `${name}. Mantén pulsado para anotar.`;
}

function roleLine(role: string): string {
  const head = Array.from(role)[0] ?? '';
  return `${head.toLocaleUpperCase('es-ES')}${role.slice(head.length)}.`;
}

function PlayToast({ text, onDone }: { text: string; onDone: () => void }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => {
      if (finished) done.current();
    });
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View pointerEvents="none" style={[styles.toastWrap, { opacity }]}>
      <View style={[styles.toast, { backgroundColor: theme.text }]}>
        <ThemedText style={{ color: theme.background, textAlign: 'center' }}>{text}</ThemedText>
      </View>
    </Animated.View>
  );
}

function BookIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 7.2 C9.4 6 6.4 6.6 4.8 7.6 V17.8 C6.6 16.6 9.4 16.2 12 17.6 C14.6 16.2 17.4 16.6 19.2 17.8 V7.6 C17.6 6.6 14.6 6 12 7.2 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12 7.2 V17.6" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function UndoIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M9 8 H14.5 A4.5 4.5 0 1 1 14.5 17 H11"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Path
        d="M9 4.8 L5.2 8 L9 11.2"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function suspectAt(placements: Assignment, r: number, c: number): string | null {
  for (const [id, cell] of Object.entries(placements)) {
    if (cell && cell.r === r && cell.c === c) return id;
  }
  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  stage: { flex: 1 },
  dossier: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  missing: { padding: Spacing.four },
  play: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  playWide: { flexDirection: 'row', alignItems: 'stretch' },
  mapColumn: { minWidth: 0, minHeight: 0, gap: Spacing.two },
  mapColumnTall: { flex: 1.05, alignSelf: 'stretch' },
  mapColumnWide: { flex: 1.05 },
  selection: { textAlign: 'center', alignSelf: 'stretch' },
  mapSlot: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardsScroll: { flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', overflow: 'hidden' },
  scroll: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  cards: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quiet: { alignItems: 'center', paddingVertical: Spacing.two },
  verdict: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toastWrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.two,
  },
  toast: {
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
