import { bit, cellsOfMask, onlyCell, popcount } from '@/engine/bits';
import {
  directionHolds,
  directionViolated,
  isDirection,
  personAllowsCell,
  placedInArea,
  unaryHolds,
} from '@/engine/clues';
import { gridOf, type Grid } from '@/engine/grid';
import type { Assignment, Cell, Clue, ClueRef, Puzzle } from '@/engine/types';

export type Analysis =
  | {
      ok: true;
      domains: Record<string, bigint>;
      forced: { personId: string; cell: Cell } | null;
    }
  | {
      ok: false;
      reason: 'row' | 'col' | 'blocked' | 'killer' | 'domain';
      ref?: ClueRef;
    };

const NODE_GUARD = 800;

export function analyze(puzzle: Puzzle, assignment: Assignment): Analysis {
  const grid = gridOf(puzzle);
  const placed = placedPeople(puzzle, assignment);

  for (const person of placed) {
    const block = placedCellError(grid, placed, person.id, person.cell);
    if (block) return { ok: false, reason: block };
  }

  for (const suspect of puzzle.suspects) {
    const cell = assignment[suspect.id];
    if (!cell) continue;
    for (let index = 0; index < suspect.clues.length; index++) {
      const clue = suspect.clues[index];
      const unary = unaryHolds(grid, cell, clue);
      if (unary === false) {
        return { ok: false, reason: 'domain', ref: { owner: 'person', personId: suspect.id, index } };
      }
      if (isDirection(clue) && directionViolated(puzzle, assignment, suspect.id, clue)) {
        return { ok: false, reason: 'domain', ref: { owner: 'person', personId: suspect.id, index } };
      }
    }
  }

  const censusBreak = censusAlreadyBroken(puzzle, grid, assignment);
  if (censusBreak) return censusBreak;

  const domains: Record<string, bigint> = {};
  for (const suspect of puzzle.suspects) {
    const cell = assignment[suspect.id];
    if (cell) {
      domains[suspect.id] = bit(grid.size, cell.r, cell.c);
      continue;
    }
    let mask = 0n;
    for (let r = 0; r < grid.size; r++) {
      if (r === grid.victim.r || placed.some((person) => person.cell.r === r)) continue;
      for (let c = 0; c < grid.size; c++) {
        if (c === grid.victim.c || grid.blocked[r][c]) continue;
        if (placed.some((person) => person.cell.c === c)) continue;
        const candidate = { r, c };
        if (!personAllowsCell(grid, puzzle, suspect, candidate)) continue;
        mask |= bit(grid.size, r, c);
      }
    }
    domains[suspect.id] = mask;
  }

  let stable = false;
  for (let iter = 0; iter < NODE_GUARD; iter++) {
    const pruned = prune(puzzle, grid, assignment, domains);
    if (!pruned.ok) return pruned;
    if (!pruned.changed) {
      stable = true;
      break;
    }
  }
  if (!stable) return { ok: false, reason: 'domain' };

  for (const suspect of puzzle.suspects) {
    if (domains[suspect.id] === 0n) return { ok: false, reason: 'domain' };
  }

  let forced: { personId: string; cell: Cell } | null = null;
  for (const suspect of puzzle.suspects) {
    if (assignment[suspect.id]) continue;
    const cell = onlyCell(grid.size, domains[suspect.id]);
    if (cell) {
      forced = { personId: suspect.id, cell };
      break;
    }
  }

  return { ok: true, domains, forced };
}

function placedPeople(puzzle: Puzzle, assignment: Assignment): { id: string; cell: Cell }[] {
  const placed: { id: string; cell: Cell }[] = [];
  for (const suspect of puzzle.suspects) {
    const cell = assignment[suspect.id];
    if (cell) placed.push({ id: suspect.id, cell });
  }
  return placed;
}

function placedCellError(
  grid: Grid,
  placed: { id: string; cell: Cell }[],
  id: string,
  cell: Cell,
): 'blocked' | 'row' | 'col' | null {
  if (grid.blocked[cell.r][cell.c] || (cell.r === grid.victim.r && cell.c === grid.victim.c)) {
    return 'blocked';
  }
  if (cell.r === grid.victim.r) return 'row';
  if (cell.c === grid.victim.c) return 'col';
  for (const other of placed) {
    if (other.id === id) continue;
    if (other.cell.r === cell.r && other.cell.c === cell.c) return 'blocked';
    if (other.cell.r === cell.r) return 'row';
    if (other.cell.c === cell.c) return 'col';
  }
  return null;
}

function censusAlreadyBroken(puzzle: Puzzle, grid: Grid, assignment: Assignment): Analysis | null {
  for (let index = 0; index < puzzle.caseClues.length; index++) {
    const clue = puzzle.caseClues[index];
    if (clue.kind !== 'census') continue;
    if (placedInArea(puzzle, grid, assignment, clue.area) > clue.count) {
      return { ok: false, reason: 'domain', ref: { owner: 'case', index } };
    }
  }
  if (placedInArea(puzzle, grid, assignment, grid.victimArea) > 1) {
    return { ok: false, reason: 'killer' };
  }
  return null;
}

type PruneResult =
  | { ok: true; changed: boolean }
  | { ok: false; reason: 'row' | 'col' | 'blocked' | 'killer' | 'domain'; ref?: ClueRef };

function prune(
  puzzle: Puzzle,
  grid: Grid,
  assignment: Assignment,
  domains: Record<string, bigint>,
): PruneResult {
  let changed = false;

  const mark = (id: string, next: bigint): { ok: false; reason: 'domain' } | null => {
    if (next === domains[id]) return null;
    domains[id] = next;
    changed = true;
    if (next === 0n) return { ok: false, reason: 'domain' };
    return null;
  };

  for (const suspect of puzzle.suspects) {
    if (popcount(domains[suspect.id]) !== 1) continue;
    const cell = onlyCell(grid.size, domains[suspect.id]);
    if (!cell) continue;
    const clear = grid.rowMask[cell.r] | grid.colMask[cell.c];
    for (const other of puzzle.suspects) {
      if (other.id === suspect.id) continue;
      const broken = mark(other.id, domains[other.id] & ~clear);
      if (broken) return broken;
    }
  }

  for (const suspect of puzzle.suspects) {
    for (let index = 0; index < suspect.clues.length; index++) {
      const clue = suspect.clues[index];
      if (!isDirection(clue) || clue.of === puzzle.victim.id) continue;
      const ref: ClueRef = { owner: 'person', personId: suspect.id, index };
      const tightened = tightenDirection(grid, domains, suspect.id, clue.of, clue.kind);
      if (tightened.subject === 0n || tightened.other === 0n) {
        return { ok: false, reason: 'domain', ref };
      }
      const subjectBroken = mark(suspect.id, tightened.subject);
      if (subjectBroken) return { ...subjectBroken, ref };
      const otherBroken = mark(clue.of, tightened.other);
      if (otherBroken) return { ...otherBroken, ref };
    }
  }

  for (let index = 0; index < puzzle.caseClues.length; index++) {
    const clue = puzzle.caseClues[index];
    if (clue.kind !== 'census') continue;
    const result = tightenCensus(puzzle, grid, domains, clue.area, clue.count);
    if (!result.ok) return { ok: false, reason: 'domain', ref: { owner: 'case', index } };
    if (result.changed) changed = true;
  }

  const killer = tightenCensus(puzzle, grid, domains, grid.victimArea, 1);
  if (!killer.ok) return { ok: false, reason: 'killer' };
  if (killer.changed) changed = true;

  if (hideSingles(grid, puzzle, domains)) changed = true;

  for (let r = 0; r < grid.size; r++) {
    if (r === grid.victim.r) continue;
    if (!puzzle.suspects.some((suspect) => (domains[suspect.id] & grid.rowMask[r]) !== 0n)) {
      return { ok: false, reason: 'domain' };
    }
  }
  for (let c = 0; c < grid.size; c++) {
    if (c === grid.victim.c) continue;
    if (!puzzle.suspects.some((suspect) => (domains[suspect.id] & grid.colMask[c]) !== 0n)) {
      return { ok: false, reason: 'domain' };
    }
  }

  return { ok: true, changed };
}

function tightenDirection(
  grid: Grid,
  domains: Record<string, bigint>,
  subjectId: string,
  otherId: string,
  kind: Extract<Clue, { kind: 'north' | 'south' | 'east' | 'west' }>['kind'],
): { subject: bigint; other: bigint } {
  const subjectCells = cellsOfMask(grid.size, domains[subjectId]);
  const otherCells = cellsOfMask(grid.size, domains[otherId]);
  let subject = 0n;
  for (const cell of subjectCells) {
    if (otherCells.some((other) => directionHolds(kind, cell, other))) {
      subject |= bit(grid.size, cell.r, cell.c);
    }
  }
  const subjectKept = cellsOfMask(grid.size, subject);
  let other = 0n;
  for (const cell of otherCells) {
    if (subjectKept.some((origin) => directionHolds(kind, origin, cell))) {
      other |= bit(grid.size, cell.r, cell.c);
    }
  }
  return { subject, other };
}

function tightenCensus(
  puzzle: Puzzle,
  grid: Grid,
  domains: Record<string, bigint>,
  area: number,
  count: number,
): { ok: boolean; changed: boolean } {
  const insideMask = grid.areaMask.get(area) ?? 0n;
  const subset: string[] = [];
  const intersects: string[] = [];

  for (const suspect of puzzle.suspects) {
    const mask = domains[suspect.id];
    if (mask === 0n) return { ok: false, changed: false };
    const inside = mask & insideMask;
    if (inside !== 0n) intersects.push(suspect.id);
    if (inside !== 0n && (mask & ~insideMask) === 0n) subset.push(suspect.id);
  }

  if (subset.length > count || intersects.length < count) return { ok: false, changed: false };

  let changed = false;
  if (intersects.length === count) {
    for (const id of intersects) {
      const next = domains[id] & insideMask;
      if (next !== domains[id]) {
        domains[id] = next;
        changed = true;
      }
    }
  }
  if (subset.length === count) {
    for (const suspect of puzzle.suspects) {
      if (subset.includes(suspect.id)) continue;
      const next = domains[suspect.id] & ~insideMask;
      if (next !== domains[suspect.id]) {
        domains[suspect.id] = next;
        changed = true;
        if (next === 0n) return { ok: false, changed };
      }
    }
  }
  return { ok: true, changed };
}

function hideSingles(grid: Grid, puzzle: Puzzle, domains: Record<string, bigint>): boolean {
  let changed = false;
  const restrict = (mask: bigint) => {
    const owners = puzzle.suspects.filter((suspect) => (domains[suspect.id] & mask) !== 0n);
    if (owners.length !== 1) return;
    const id = owners[0].id;
    const next = domains[id] & mask;
    if (next !== domains[id]) {
      domains[id] = next;
      changed = true;
    }
  };
  for (let r = 0; r < grid.size; r++) restrict(grid.rowMask[r]);
  for (let c = 0; c < grid.size; c++) restrict(grid.colMask[c]);
  return changed;
}

export type Hint =
  | { type: 'forced'; personId: string; cell: Cell }
  | { type: 'broken'; reason: 'row' | 'col' | 'blocked' | 'killer' | 'domain'; ref?: ClueRef }
  | { type: 'none' };

export function hint(puzzle: Puzzle, assignment: Assignment): Hint {
  const analysis = analyze(puzzle, assignment);
  if (!analysis.ok) return { type: 'broken', reason: analysis.reason, ref: analysis.ref };
  if (analysis.forced) return { type: 'forced', ...analysis.forced };
  return { type: 'none' };
}
