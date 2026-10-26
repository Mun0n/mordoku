import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { clueSentence } from '@/engine/text';
import type { Clue, Puzzle } from '@/engine/types';
import { Portrait } from '@/ui/Portrait';

const SERIF = Fonts?.serif ?? 'serif';

const INK = '#2c2622';
const PAPER = '#fffdf8';

type PersonCardProps = {
  name: string;
  seed: string;
  shirt: string;
  lines: string[];
  width: number;
  selected?: boolean;
  victim?: boolean;
  onPress?: () => void;
};

export function ClueCard({
  name,
  seed,
  shirt,
  lines,
  width,
  selected = false,
  victim = false,
  onPress,
}: PersonCardProps) {
  const first = name.split(' ')[0] ?? name;
  const portrait = width - 16;

  const body = (
    <>
      <View style={[styles.frame, selected && { borderColor: shirt }]}>
        <Portrait seed={seed} shirt={shirt} victim={victim} width={portrait} />
        <Text style={styles.name}>{first}</Text>
      </View>
      <View style={[styles.bubble, victim && styles.victimBubble]}>
        {lines.map((line, index) => (
          <Text
            key={`${index}-${line}`}
            style={[styles.clue, victim && styles.victimClue, index === 0 && victim && styles.victimTitle]}
          >
            {line}
          </Text>
        ))}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View accessibilityLabel={`${name}. ${lines.join(' ')}`} style={[styles.card, { width }]}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${lines.join(' ')}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, { width }]}
    >
      {body}
    </Pressable>
  );
}

export function CaseClueCard({ puzzle, clues, width }: { puzzle: Puzzle; clues: Clue[]; width: number }) {
  if (clues.length === 0) return null;
  return (
    <View style={[styles.caseBubble, { width }]}>
      <Text style={styles.name}>Se sabe además</Text>
      {clues.map((clue, index) => (
        <Text key={`${index}-${clueSentence(puzzle, clue)}`} style={styles.clue}>
          {clueSentence(puzzle, clue)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center' },
  frame: {
    alignSelf: 'stretch',
    backgroundColor: PAPER,
    borderWidth: 3,
    borderColor: INK,
    padding: 5,
    shadowColor: INK,
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  name: {
    color: INK,
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  bubble: {
    alignSelf: 'stretch',
    marginTop: -12,
    marginHorizontal: 6,
    backgroundColor: '#f4f1ea',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    shadowColor: INK,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  victimBubble: { backgroundColor: '#f8e4e8' },
  clue: { color: INK, fontSize: 13, lineHeight: 17, textAlign: 'center' },
  victimClue: { color: '#6a3038' },
  victimTitle: { fontWeight: '700' },
  caseBubble: {
    backgroundColor: '#f4f1ea',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
});
