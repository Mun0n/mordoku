import { bit } from '@/engine/bits';
import { BLOCKING_OBJECTS, type Cell, type ObjectKind, type Puzzle } from '@/engine/types';

export type Grid = {
  size: number;
  areaId: number[][];
  areaName: Map<number, string>;
  areaColor: Map<number, string>;
  areaMask: Map<number, bigint>;
  object: (ObjectKind | null)[][];
  blocked: boolean[][];
  corner: boolean[][];
  beside: Set<ObjectKind>[][];
  rowMask: bigint[];
  colMask: bigint[];
  victim: Cell;
  victimArea: number;
};

const cache = new WeakMap<Puzzle, Grid>();

export function gridOf(puzzle: Puzzle): Grid {
  const cached = cache.get(puzzle);
  if (cached) return cached;
  const grid = buildGrid(puzzle);
  cache.set(puzzle, grid);
  return grid;
}

function buildGrid(puzzle: Puzzle): Grid {
  const { size } = puzzle;
  const areaId = Array.from({ length: size }, () => Array<number>(size).fill(-1));
  const areaName = new Map<number, string>();
  const areaColor = new Map<number, string>();
  const areaMask = new Map<number, bigint>();

  for (const area of puzzle.areas) {
    areaName.set(area.id, area.name);
    areaColor.set(area.id, area.color);
    let mask = areaMask.get(area.id) ?? 0n;
    for (const cell of area.cells) {
      areaId[cell.r][cell.c] = area.id;
      mask |= bit(size, cell.r, cell.c);
    }
    areaMask.set(area.id, mask);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (areaId[r][c] < 0) {
        throw new Error(`${puzzle.id}: la casilla ${r},${c} no tiene sala`);
      }
    }
  }

  const object: (ObjectKind | null)[][] = Array.from({ length: size }, () =>
    Array<ObjectKind | null>(size).fill(null),
  );
  for (const item of puzzle.objects) object[item.r][item.c] = item.kind;

  const blocked = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  for (const cell of puzzle.blocked) blocked[cell.r][cell.c] = true;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const kind = object[r][c];
      const isBlocking = kind !== null && BLOCKING_OBJECTS.has(kind);
      if (isBlocking !== blocked[r][c]) {
        throw new Error(
          `${puzzle.id}: el bloqueo de ${r},${c} no coincide con el objeto ${kind ?? 'vacío'}`,
        );
      }
    }
  }

  const beside: Set<ObjectKind>[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new Set<ObjectKind>()),
  );
  const corner = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const bounds = [false, false, false, false];
      dirs.forEach(([dr, dc], index) => {
        const nr = r + dr;
        const nc = c + dc;
        const outside =
          nr < 0 || nc < 0 || nr >= size || nc >= size || areaId[nr][nc] !== areaId[r][c];
        bounds[index] = outside;
        if (!outside && object[nr][nc]) beside[r][c].add(object[nr][nc]!);
      });
      const [north, south, west, east] = bounds;
      corner[r][c] = Boolean((north && west) || (north && east) || (south && west) || (south && east));
    }
  }

  const rowMask = Array.from({ length: size }, (_, r) => {
    let mask = 0n;
    for (let c = 0; c < size; c++) mask |= bit(size, r, c);
    return mask;
  });
  const colMask = Array.from({ length: size }, (_, c) => {
    let mask = 0n;
    for (let r = 0; r < size; r++) mask |= bit(size, r, c);
    return mask;
  });

  const victim = puzzle.victim.cell;
  return {
    size,
    areaId,
    areaName,
    areaColor,
    areaMask,
    object,
    blocked,
    corner,
    beside,
    rowMask,
    colMask,
    victim,
    victimArea: areaId[victim.r][victim.c],
  };
}
