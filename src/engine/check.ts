import { directionHolds, isDirection, otherCell, placedInArea, unaryHolds } from '@/engine/clues';
import { gridOf } from '@/engine/grid';
import { sameCell, type Assignment, type Cell, type Clue, type ClueRef, type Puzzle } from '@/engine/types';

export type CheckResult =
  | { ok: true; killerId: string }
  | { ok: false; reason: 'incomplete' }
  | { ok: false; reason: 'row' | 'col' | 'blocked' | 'killer' }
  | { ok: false; reason: 'clue'; ref: ClueRef };

export type BlockReason = 'blocked' | 'occupied' | 'row' | 'col';

export function blankAssignment(puzzle: Puzzle): Assignment {
  const assignment: Assignment = {};
  for (const suspect of puzzle.suspects) assignment[suspect.id] = null;
  return assignment;
}

export function assignmentFromSolution(puzzle: Puzzle): Assignment {
  const assignment = blankAssignment(puzzle);
  for (const suspect of puzzle.suspects) {
    assignment[suspect.id] = { ...puzzle.solution[suspect.id] };
  }
  return assignment;
}

export function placementBlock(
  puzzle: Puzzle,
  assignment: Assignment,
  personId: string,
  cell: Cell,
): BlockReason | null {
  const grid = gridOf(puzzle);
  if (grid.blocked[cell.r][cell.c]) return 'blocked';
  if (sameCell(cell, grid.victim)) return 'occupied';
  if (cell.r === grid.victim.r) return 'row';
  if (cell.c === grid.victim.c) return 'col';
  for (const suspect of puzzle.suspects) {
    if (suspect.id === personId) continue;
    const other = assignment[suspect.id];
    if (!other) continue;
    if (sameCell(other, cell)) return 'occupied';
    if (other.r === cell.r) return 'row';
    if (other.c === cell.c) return 'col';
  }
  return null;
}

export function check(puzzle: Puzzle, assignment: Assignment): CheckResult {
  for (const suspect of puzzle.suspects) {
    if (!assignment[suspect.id]) return { ok: false, reason: 'incomplete' };
  }

  const grid = gridOf(puzzle);
  const rows = new Set<number>([grid.victim.r]);
  const cols = new Set<number>([grid.victim.c]);
  for (const suspect of puzzle.suspects) {
    const cell = assignment[suspect.id]!;
    if (grid.blocked[cell.r][cell.c] || sameCell(cell, grid.victim)) {
      return { ok: false, reason: 'blocked' };
    }
    if (rows.has(cell.r)) return { ok: false, reason: 'row' };
    if (cols.has(cell.c)) return { ok: false, reason: 'col' };
    rows.add(cell.r);
    cols.add(cell.c);
  }

  for (const suspect of puzzle.suspects) {
    for (let index = 0; index < suspect.clues.length; index++) {
      if (!clueSatisfied(puzzle, assignment, suspect.id, suspect.clues[index])) {
        return { ok: false, reason: 'clue', ref: { owner: 'person', personId: suspect.id, index } };
      }
    }
  }

  for (let index = 0; index < puzzle.caseClues.length; index++) {
    const clue = puzzle.caseClues[index];
    if (clue.kind !== 'census') continue;
    if (placedInArea(puzzle, grid, assignment, clue.area) !== clue.count) {
      return { ok: false, reason: 'clue', ref: { owner: 'case', index } };
    }
  }

  const inRoom = puzzle.suspects.filter((suspect) => {
    const cell = assignment[suspect.id]!;
    return grid.areaId[cell.r][cell.c] === grid.victimArea;
  });
  if (inRoom.length !== 1) return { ok: false, reason: 'killer' };
  return { ok: true, killerId: inRoom[0].id };
}

function clueSatisfied(puzzle: Puzzle, assignment: Assignment, personId: string, clue: Clue): boolean {
  const grid = gridOf(puzzle);
  const cell = assignment[personId];
  if (!cell) return false;
  const unary = unaryHolds(grid, cell, clue);
  if (unary !== null) return unary;
  if (isDirection(clue)) {
    const other = otherCell(puzzle, assignment, clue.of);
    if (!other) return false;
    return directionHolds(clue.kind, cell, other);
  }
  return clue.kind !== 'census';
}
