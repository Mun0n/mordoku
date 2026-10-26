import { cellsOfMask, onlyCell, popcount } from '@/engine/bits';
import { analyze } from '@/engine/analyze';
import { blankAssignment, check } from '@/engine/check';
import type { Assignment, Cell, Puzzle } from '@/engine/types';

const NODE_CAP = 2_000_000;

export type Solution = Record<string, Cell>;

export function solve(puzzle: Puzzle, limit = 2): Solution[] {
  const found: Solution[] = [];
  let nodes = 0;
  const assignment = blankAssignment(puzzle);

  const rec = () => {
    if (found.length >= limit) return;
    nodes += 1;
    if (nodes > NODE_CAP) {
      throw new Error(`búsqueda demasiado amplia en ${puzzle.id}`);
    }

    const analysis = analyze(puzzle, assignment);
    if (!analysis.ok) return;

    const singles = puzzle.suspects.filter(
      (suspect) => !assignment[suspect.id] && popcount(analysis.domains[suspect.id]) === 1,
    );
    if (singles.length > 0) {
      const pinned: string[] = [];
      for (const suspect of singles) {
        const cell = onlyCell(puzzle.size, analysis.domains[suspect.id]);
        if (!cell) return;
        assignment[suspect.id] = cell;
        pinned.push(suspect.id);
      }
      rec();
      for (const id of pinned) assignment[id] = null;
      return;
    }

    const pending = puzzle.suspects.filter((suspect) => !assignment[suspect.id]);
    if (pending.length === 0) {
      if (check(puzzle, assignment).ok) found.push(snapshot(puzzle, assignment));
      return;
    }

    let pick = pending[0];
    let best = popcount(analysis.domains[pick.id]);
    for (const suspect of pending) {
      const count = popcount(analysis.domains[suspect.id]);
      if (count < best) {
        best = count;
        pick = suspect;
      }
    }

    for (const cell of cellsOfMask(puzzle.size, analysis.domains[pick.id])) {
      assignment[pick.id] = cell;
      rec();
      assignment[pick.id] = null;
      if (found.length >= limit) return;
    }
  };

  rec();
  return found;
}

function snapshot(puzzle: Puzzle, assignment: Assignment): Solution {
  const solution: Solution = {};
  for (const suspect of puzzle.suspects) {
    const cell = assignment[suspect.id];
    if (!cell) throw new Error(`${puzzle.id}: solución incompleta`);
    solution[suspect.id] = { r: cell.r, c: cell.c };
  }
  return solution;
}

export function assertUnique(puzzle: Puzzle): void {
  const found = solve(puzzle, 2);
  if (found.length !== 1) {
    const boards = found.map((solution) => formatSolution(puzzle, solution)).join('\n---\n');
    throw new Error(`${puzzle.id}: ${found.length} soluciones\n${boards}`);
  }
  for (const suspect of puzzle.suspects) {
    const got = found[0][suspect.id];
    const want = puzzle.solution[suspect.id];
    if (!got || !want || got.r !== want.r || got.c !== want.c) {
      throw new Error(
        `${puzzle.id}: ${suspect.id} cierra en ${got?.r},${got?.c} y el archivo dice ${want?.r},${want?.c}`,
      );
    }
  }
}

export function formatSolution(puzzle: Puzzle, solution: Solution): string {
  const rows = Array.from({ length: puzzle.size }, () => Array<string>(puzzle.size).fill('.'));
  const victim = puzzle.victim.cell;
  rows[victim.r][victim.c] = 'V';
  for (const suspect of puzzle.suspects) {
    const cell = solution[suspect.id];
    if (!cell) continue;
    rows[cell.r][cell.c] = suspect.id.slice(0, 2);
  }
  for (const cell of puzzle.blocked) {
    if (rows[cell.r][cell.c] === '.') rows[cell.r][cell.c] = '#';
  }
  return rows.map((row) => row.join(' ')).join('\n');
}
