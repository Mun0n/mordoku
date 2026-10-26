export const OBJECT_KINDS = [
  'silla',
  'planta',
  'mesa',
  'alfombra',
  'estanteria',
  'sofa',
] as const;

export type ObjectKind = (typeof OBJECT_KINDS)[number];

export const BLOCKING_OBJECTS: ReadonlySet<ObjectKind> = new Set([
  'planta',
  'mesa',
  'estanteria',
]);

export type Cell = { r: number; c: number };

export type Direction = 'north' | 'south' | 'east' | 'west';

export type Clue =
  | { kind: 'row' | 'col' | 'area'; id: number; negate?: boolean }
  | { kind: 'on' | 'beside'; object: ObjectKind; negate?: boolean }
  | { kind: 'corner'; negate?: boolean }
  | { kind: Direction; of: string }
  | { kind: 'census'; area: number; count: number };

export type Area = {
  id: number;
  name: string;
  color: string;
  cells: Cell[];
};

export type Suspect = {
  id: string;
  name: string;
  role: string;
  color: string;
  clues: Clue[];
};

export type Victim = {
  id: string;
  name: string;
  role: string;
  color: string;
  cell: Cell;
};

export type Difficulty = 'very_easy' | 'easy' | 'medium';

export type Puzzle = {
  id: string;
  title: string;
  difficulty: Difficulty;
  blurb: string;
  size: number;
  areas: Area[];
  objects: { r: number; c: number; kind: ObjectKind }[];
  blocked: Cell[];
  victim: Victim;
  suspects: Suspect[];
  caseClues: Clue[];
  solution: Record<string, Cell>;
};

export type Assignment = Record<string, Cell | null>;

export type ClueRef =
  | { owner: 'case'; index: number }
  | { owner: 'person'; personId: string; index: number };

export function sameCell(a: Cell, b: Cell): boolean {
  return a.r === b.r && a.c === b.c;
}

export function cellKey(cell: Cell): string {
  return `${cell.r},${cell.c}`;
}
