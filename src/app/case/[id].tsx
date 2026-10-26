import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { caseById } from '@/content/cases';
import { Spacing } from '@/constants/theme';
import { hint } from '@/engine/analyze';
import { check, placementBlock } from '@/engine/check';
import { clueSentence } from '@/engine/text';
import { gridOf } from '@/engine/grid';
import type { Assignment } from '@/engine/types';
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
import { loadProgress, readProgress, writeCase, type CaseStatus } from '@/storage/progress';
import { Board } from '@/ui/Board';
import { CaseClueCard, ClueCard } from '@/ui/ClueCard';
import { blockMessage, checkMessage, hintMessage, tapNo, tapOk, tapWin } from '@/ui/copy';

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
  const [state, setState] = useState<GameState>(() => freshGame(puzzle));
  const [status, setStatus] = useState<CaseStatus>('new');
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(puzzle.suspects[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadProgress().then((file) => {
      if (!live) return;
      const saved = readProgress(puzzle, file[puzzle.id]);
      setState({ placements: saved.placements, notes: saved.notes, undo: [] });
      setStatus(saved.status);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [puzzle]);

  function commit(next: GameState, nextStatus: CaseStatus, banner: string | null = message) {
    setState(next);
    setStatus(nextStatus);
    setMessage(banner);
    void writeCase(puzzle.id, {
      placements: next.placements,
      notes: next.notes,
      status: nextStatus,
    });
  }

  function edited(current: CaseStatus): CaseStatus {
    return current === 'revealed' ? 'revealed' : 'in_progress';
  }

  function onTap(r: number, c: number) {
    const occupant = suspectAt(state.placements, r, c);
    if (!selectedId) {
      if (occupant) setSelectedId(occupant);
      return;
    }
    const current = state.placements[selectedId];
    if (current && current.r === r && current.c === c) {
      commit(liftPerson(state, selectedId), edited(status), null);
      tapOk();
      return;
    }
    if (occupant && occupant !== selectedId) {
      setSelectedId(occupant);
      return;
    }
    const block = placementBlock(puzzle, state.placements, selectedId, { r, c });
    if (block) {
      setMessage(blockMessage(block));
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
          commit(freshGame(puzzle), status === 'revealed' ? 'revealed' : 'new', null);
          setSelectedId(puzzle.suspects[0]?.id ?? null);
        },
      },
    ]);
  }

  function onHint() {
    const result = hint(puzzle, state.placements);
    if (result.type === 'forced') {
      commit(placePerson(state, result.personId, result.cell), edited(status), hintMessage(puzzle, result));
      setSelectedId(result.personId);
      tapOk();
      return;
    }
    setMessage(hintMessage(puzzle, result));
    if (result.type === 'broken') tapNo();
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

  function onAccuse() {
    const result = check(puzzle, state.placements);
    if (!result.ok) {
      setMessage(checkMessage(puzzle, result));
      tapNo();
      return;
    }
    const nextStatus = status === 'revealed' ? 'revealed' : 'solved';
    commit(state, nextStatus, checkMessage(puzzle, result));
    tapWin();
  }

  const full = puzzle.suspects.every((suspect) => state.placements[suspect.id]);
  const boardWidth = Math.min(width - Spacing.three * 2, 560, height * 0.48);
  const cardWidth = Math.floor((width - Spacing.three * 2 - 14) / 2);
  const grid = gridOf(puzzle);
  const selected = puzzle.suspects.find((suspect) => suspect.id === selectedId);

  if (!ready) return <ThemedView style={styles.fill} />;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText themeColor="accent">Volver</ThemedText>
          </Pressable>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.topTitle}>
            {puzzle.title}
          </ThemedText>
          <Pressable onPress={onUndo} hitSlop={8} disabled={state.undo.length === 0}>
            <ThemedText themeColor={state.undo.length ? 'accent' : 'textSecondary'}>Deshacer</ThemedText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {status === 'revealed' ? (
            <ThemedText type="small" themeColor="accent">
              Solución vista
            </ThemedText>
          ) : null}
          {message ? <ThemedText>{message}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary">
            {selected ? selected.name : 'Elige a alguien'}. Mantén pulsado para anotar.
          </ThemedText>
          <Board
            puzzle={puzzle}
            placements={state.placements}
            notes={state.notes}
            selectedId={selectedId}
            width={boardWidth}
            onTap={onTap}
            onLongPress={onLongPress}
          />
          <View style={styles.cards}>
            <ClueCard
              name={puzzle.victim.name}
              seed={puzzle.victim.id}
              shirt="#6b6258"
              width={cardWidth}
              victim
              lines={[
                'La víctima.',
                `Fila ${puzzle.victim.cell.r + 1}, columna ${puzzle.victim.cell.c + 1}.`,
                grid.areaName.get(grid.victimArea) ?? 'Sala desconocida',
              ]}
            />
            {puzzle.suspects.map((suspect) => (
              <ClueCard
                key={suspect.id}
                name={suspect.name}
                seed={suspect.id}
                shirt={suspect.color}
                width={cardWidth}
                selected={suspect.id === selectedId}
                lines={suspect.clues.map((clue) => clueSentence(puzzle, clue))}
                onPress={() => setSelectedId((current) => (current === suspect.id ? null : suspect.id))}
              />
            ))}
            <CaseClueCard puzzle={puzzle} clues={puzzle.caseClues} width={width - Spacing.three * 2} />
          </View>
          <View style={styles.legend}>
            {puzzle.areas.map((area) => (
              <View key={area.id} style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: area.color }]} />
                <ThemedText type="small">{area.name}</ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={[styles.actions, { borderTopColor: theme.backgroundSelected }]}>
          <Action label="Ayuda" onPress={onHint} />
          <Action label="Solución" onPress={onReveal} />
          <Action label="Acusar" onPress={onAccuse} disabled={!full} filled />
        </View>
        <Pressable onPress={onReset} style={styles.reset}>
          <ThemedText type="small" themeColor="textSecondary">
            Reiniciar
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
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

function suspectAt(placements: Assignment, r: number, c: number): string | null {
  for (const [id, cell] of Object.entries(placements)) {
    if (cell && cell.r === r && cell.c === c) return id;
  }
  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  missing: { padding: Spacing.four },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  topTitle: { flex: 1, textAlign: 'center' },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  cards: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 14,
    paddingTop: Spacing.two,
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
  reset: { alignItems: 'center', paddingVertical: Spacing.two },
});
