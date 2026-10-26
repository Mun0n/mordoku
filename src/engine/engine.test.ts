import { hint } from '@/engine/analyze';
import { blankAssignment, check, placementBlock } from '@/engine/check';
import { gridOf } from '@/engine/grid';
import { assertUnique, solve } from '@/engine/solve';
import { clueSentence } from '@/engine/text';
import type { Cell, Puzzle } from '@/engine/types';

function cells(rows: string[]): Cell[] {
  const out: Cell[] = [];
  rows.forEach((row, r) => {
    [...row].forEach((char, c) => {
      if (char === 'x') out.push({ r, c });
    });
  });
  return out;
}

function sample(): Puzzle {
  return {
    id: 'muestra',
    title: 'Muestra',
    difficulty: 'very_easy',
    blurb: 'Un caso de prueba.',
    size: 4,
    areas: [
      { id: 0, name: 'el Salón', color: '#f3c7b8', cells: cells(['xx..', 'xx..', 'xx..', 'xx..']) },
      { id: 1, name: 'la Calle', color: '#c5ddf5', cells: cells(['..xx', '..xx', '..xx', '..xx']) },
    ],
    objects: [
      { r: 1, c: 1, kind: 'silla' },
      { r: 0, c: 2, kind: 'planta' },
      { r: 2, c: 0, kind: 'mesa' },
    ],
    blocked: [
      { r: 0, c: 2 },
      { r: 2, c: 0 },
    ],
    victim: { id: 'v', name: 'Vera', role: 'testigo', color: '#6b6258', cell: { r: 0, c: 0 } },
    suspects: [
      {
        id: 'ana',
        name: 'Ana',
        role: 'vecina',
        color: '#d4537e',
        clues: [
          { kind: 'row', id: 1 },
          { kind: 'on', object: 'silla' },
        ],
      },
      {
        id: 'bruno',
        name: 'Bruno',
        role: 'portero',
        color: '#3d7edb',
        clues: [
          { kind: 'row', id: 2 },
          { kind: 'col', id: 2 },
        ],
      },
      {
        id: 'cleo',
        name: 'Cleo',
        role: 'prima',
        color: '#3aa76d',
        clues: [{ kind: 'row', id: 3 }],
      },
    ],
    caseClues: [{ kind: 'census', area: 1, count: 2 }],
    solution: {
      ana: { r: 1, c: 1 },
      bruno: { r: 2, c: 2 },
      cleo: { r: 3, c: 3 },
    },
  };
}

describe('motor', () => {
  const puzzle = sample();

  test('esquinas y junto a respetan la sala', () => {
    const grid = gridOf(puzzle);
    expect(grid.corner[0][0]).toBe(true);
    expect(grid.corner[0][1]).toBe(true);
    expect(grid.corner[1][0]).toBe(false);
    expect(grid.corner[1][1]).toBe(false);
    expect(grid.beside[1][2].has('planta')).toBe(true);
    expect(grid.beside[0][1].has('planta')).toBe(false);
  });

  test('rechaza fila, columna y casilla bloqueada', () => {
    const empty = blankAssignment(puzzle);
    expect(placementBlock(puzzle, empty, 'bruno', { r: 2, c: 3 })).toBeNull();
    expect(placementBlock(puzzle, empty, 'bruno', { r: 0, c: 1 })).toBe('row');
    expect(placementBlock(puzzle, empty, 'bruno', { r: 1, c: 0 })).toBe('col');
    expect(placementBlock(puzzle, empty, 'bruno', { r: 0, c: 2 })).toBe('blocked');
    const placed = { ...empty, bruno: { r: 2, c: 2 } };
    expect(placementBlock(puzzle, placed, 'cleo', { r: 2, c: 3 })).toBe('row');
    expect(placementBlock(puzzle, placed, 'ana', { r: 1, c: 3 })).toBeNull();
  });

  test('una solución que no cumple la pista se señala', () => {
    const wrong = blankAssignment(puzzle);
    wrong.ana = { r: 1, c: 3 };
    wrong.bruno = { r: 2, c: 2 };
    wrong.cleo = { r: 3, c: 1 };
    const result = check(puzzle, wrong);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'clue') {
      expect(result.ref).toEqual({ owner: 'person', personId: 'ana', index: 1 });
    }
  });

  test('el caso de muestra tiene una sola solución', () => {
    expect(check(puzzle, {
      ana: { r: 1, c: 1 },
      bruno: { r: 2, c: 2 },
      cleo: { r: 3, c: 3 },
    })).toEqual({ ok: true, killerId: 'ana' });
    expect(() => assertUnique(puzzle)).not.toThrow();
    expect(solve(puzzle, 2)).toHaveLength(1);
  });

  test('sin la silla hay más de una solución', () => {
    const loose: Puzzle = {
      ...puzzle,
      suspects: puzzle.suspects.map((suspect) =>
        suspect.id === 'ana' ? { ...suspect, clues: [{ kind: 'row', id: 1 }] } : suspect,
      ),
    };
    expect(solve(loose, 2).length).toBe(2);
  });

  test('la ayuda revela la casilla forzada y no la respuesta', () => {
    const forced = hint(puzzle, blankAssignment(puzzle));
    expect(forced).toEqual({ type: 'forced', personId: 'ana', cell: { r: 1, c: 1 } });

    const broken = hint(puzzle, {
      ana: { r: 1, c: 2 },
      bruno: null,
      cleo: null,
    });
    expect(broken.type).toBe('broken');
    if (broken.type === 'broken') {
      expect(broken.ref).toEqual({ owner: 'person', personId: 'ana', index: 1 });
    }
  });

  test('el texto sale de la pista, no al revés', () => {
    expect(clueSentence(puzzle, { kind: 'row', id: 1 })).toBe('Estaba en la fila 2.');
    expect(clueSentence(puzzle, { kind: 'census', area: 1, count: 2 })).toBe(
      'En la Calle había exactamente 2 personas.',
    );
    expect(clueSentence(puzzle, { kind: 'north', of: 'bruno' })).toBe('Estaba al norte de Bruno.');
  });
});
