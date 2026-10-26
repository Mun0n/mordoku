import type { Grid } from '@/engine/grid';
import type { Assignment, Cell, Clue, Direction, Puzzle, Suspect } from '@/engine/types';

const DIRECTIONS = new Set<Clue['kind']>(['north', 'south', 'east', 'west']);

export function isDirection(clue: Clue): clue is Extract<Clue, { kind: Direction }> {
  return DIRECTIONS.has(clue.kind);
}

export function directionHolds(
  kind: Direction,
  subject: Cell,
  other: Cell,
): boolean {
  switch (kind) {
    case 'north':
      return subject.r < other.r;
    case 'south':
      return subject.r > other.r;
    case 'east':
      return subject.c > other.c;
    case 'west':
      return subject.c < other.c;
  }
}

export function unaryHolds(grid: Grid, cell: Cell, clue: Clue): boolean | null {
  let value: boolean;
  switch (clue.kind) {
    case 'row':
      value = cell.r === clue.id;
      break;
    case 'col':
      value = cell.c === clue.id;
      break;
    case 'area':
      value = grid.areaId[cell.r][cell.c] === clue.id;
      break;
    case 'on':
      value = grid.object[cell.r][cell.c] === clue.object;
      break;
    case 'beside':
      value = grid.beside[cell.r][cell.c].has(clue.object);
      break;
    case 'corner':
      value = grid.corner[cell.r][cell.c];
      break;
    default:
      return null;
  }
  return clue.negate ? !value : value;
}

export function personAllowsCell(grid: Grid, puzzle: Puzzle, person: Suspect, cell: Cell): boolean {
  for (const clue of person.clues) {
    const unary = unaryHolds(grid, cell, clue);
    if (unary === false) return false;
    if (isDirection(clue) && clue.of === puzzle.victim.id) {
      if (!directionHolds(clue.kind, cell, puzzle.victim.cell)) return false;
    }
  }
  return true;
}

export function otherCell(
  puzzle: Puzzle,
  assignment: Assignment,
  id: string,
): Cell | null {
  if (id === puzzle.victim.id) return puzzle.victim.cell;
  return assignment[id] ?? null;
}

export function directionViolated(
  puzzle: Puzzle,
  assignment: Assignment,
  personId: string,
  clue: Extract<Clue, { kind: Direction }>,
): boolean {
  const subject = assignment[personId];
  if (!subject) return false;
  const other = otherCell(puzzle, assignment, clue.of);
  if (!other) return false;
  return !directionHolds(clue.kind, subject, other);
}

export function placedInArea(puzzle: Puzzle, grid: Grid, assignment: Assignment, area: number): number {
  let count = 0;
  for (const suspect of puzzle.suspects) {
    const cell = assignment[suspect.id];
    if (cell && grid.areaId[cell.r][cell.c] === area) count += 1;
  }
  return count;
}
