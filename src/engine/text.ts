import type { Clue, ClueRef, ObjectKind, Puzzle } from '@/engine/types';

const ON: Record<ObjectKind, string> = {
  silla: 'en una silla',
  planta: 'en una planta',
  mesa: 'en una mesa',
  alfombra: 'sobre una alfombra',
  estanteria: 'en una estantería',
  sofa: 'en un sofá',
};

const BESIDE: Record<ObjectKind, string> = {
  silla: 'junto a una silla',
  planta: 'junto a una planta',
  mesa: 'junto a una mesa',
  alfombra: 'junto a una alfombra',
  estanteria: 'junto a una estantería',
  sofa: 'junto a un sofá',
};

const DIRECTION: Record<'north' | 'south' | 'east' | 'west', string> = {
  north: 'al norte de',
  south: 'al sur de',
  east: 'al este de',
  west: 'al oeste de',
};

export function initial(name: string): string {
  const char = Array.from(name)[0] ?? '?';
  return char.toLocaleUpperCase('es-ES');
}

export function clueSentence(puzzle: Puzzle, clue: Clue): string {
  switch (clue.kind) {
    case 'row':
      return clue.negate ? `No estaba en la fila ${clue.id + 1}.` : `Estaba en la fila ${clue.id + 1}.`;
    case 'col':
      return clue.negate
        ? `No estaba en la columna ${clue.id + 1}.`
        : `Estaba en la columna ${clue.id + 1}.`;
    case 'area': {
      const name = areaName(puzzle, clue.id);
      return clue.negate ? `No estaba en ${name}.` : `Estaba en ${name}.`;
    }
    case 'on':
      return clue.negate ? `No estaba ${ON[clue.object]}.` : `Estaba ${ON[clue.object]}.`;
    case 'beside':
      return clue.negate ? `No estaba ${BESIDE[clue.object]}.` : `Estaba ${BESIDE[clue.object]}.`;
    case 'corner':
      return clue.negate
        ? 'No estaba en una esquina de la sala.'
        : 'Estaba en una esquina de la sala.';
    case 'north':
    case 'south':
    case 'east':
    case 'west':
      return `Estaba ${DIRECTION[clue.kind]} ${personName(puzzle, clue.of)}.`;
    case 'census': {
      const name = areaName(puzzle, clue.area);
      const noun = clue.count === 1 ? 'persona' : 'personas';
      return `En ${name} había exactamente ${clue.count} ${noun}.`;
    }
  }
}

export function clueLabel(puzzle: Puzzle, ref: ClueRef): string {
  if (ref.owner === 'case') return clueSentence(puzzle, puzzle.caseClues[ref.index]);
  const person = puzzle.suspects.find((suspect) => suspect.id === ref.personId);
  const clue = person?.clues[ref.index];
  if (!person || !clue) return 'Una pista no cuadra.';
  return `${person.name}: ${clueSentence(puzzle, clue)}`;
}

export function personName(puzzle: Puzzle, id: string): string {
  if (id === puzzle.victim.id) return puzzle.victim.name;
  return puzzle.suspects.find((suspect) => suspect.id === id)?.name ?? id;
}

function areaName(puzzle: Puzzle, id: number): string {
  return puzzle.areas.find((area) => area.id === id)?.name ?? 'una sala';
}
