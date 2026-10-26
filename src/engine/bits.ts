import type { Cell } from '@/engine/types';

export function bit(size: number, r: number, c: number): bigint {
  return 1n << BigInt(r * size + c);
}

export function popcount(mask: bigint): number {
  let n = 0;
  let m = mask;
  while (m > 0n) {
    m &= m - 1n;
    n += 1;
  }
  return n;
}

export function cellsOfMask(size: number, mask: bigint): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((mask & bit(size, r, c)) !== 0n) cells.push({ r, c });
    }
  }
  return cells;
}

export function onlyCell(size: number, mask: bigint): Cell | null {
  if (popcount(mask) !== 1) return null;
  return cellsOfMask(size, mask)[0] ?? null;
}
