import { assignmentFromSolution, check } from '@/engine/check';
import { gridOf } from '@/engine/grid';
import { initial } from '@/engine/text';
import {
  OBJECT_KINDS,
  type Area,
  type Cell,
  type Clue,
  type Difficulty,
  type ObjectKind,
  type Puzzle,
  type Suspect,
} from '@/engine/types';

const DIFFICULTIES = new Set<Difficulty>(['very_easy', 'easy', 'medium']);
const KINDS = new Set<string>(OBJECT_KINDS);

export function parseCase(raw: unknown, source = 'caso'): Puzzle {
  const data = asRecord(raw, source);
  const id = asString(data.id, `${source}.id`);
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`${source}: id inválido`);
  const difficulty = asString(data.difficulty, `${id}.difficulty`);
  if (!DIFFICULTIES.has(difficulty as Difficulty)) throw new Error(`${id}: dificultad inválida`);
  const size = asInt(data.size, `${id}.size`);
  if (size < 4 || size > 8) throw new Error(`${id}: el tamaño tiene que estar entre 4 y 8`);

  const areas = asArray(data.areas, `${id}.areas`).map((entry, index) => parseArea(entry, id, index, size));
  const objects = asArray(data.objects, `${id}.objects`).map((entry, index) =>
    parseObject(entry, id, index),
  );
  const blocked = asArray(data.blocked, `${id}.blocked`).map((entry, index) =>
    asCell(entry, `${id}.blocked[${index}]`, size),
  );
  const victim = parseVictim(data.victim, id, size);
  const suspects = asArray(data.suspects, `${id}.suspects`).map((entry, index) =>
    parseSuspect(entry, id, index),
  );
  const caseClues = asArray(data.caseClues, `${id}.caseClues`).map((entry, index) =>
    parseClue(entry, `${id}.caseClues[${index}]`),
  );
  const solution = parseSolution(data.solution, id, suspects, size);

  const puzzle: Puzzle = {
    id,
    title: asString(data.title, `${id}.title`),
    difficulty: difficulty as Difficulty,
    blurb: asString(data.blurb, `${id}.blurb`),
    size,
    areas,
    objects,
    blocked,
    victim,
    suspects,
    caseClues,
    solution,
  };

  validate(puzzle);
  return puzzle;
}

function validate(puzzle: Puzzle): void {
  if (puzzle.suspects.length + 1 !== puzzle.size) {
    throw new Error(`${puzzle.id}: tiene que haber ${puzzle.size - 1} sospechosos`);
  }

  const ids = new Set<string>([puzzle.victim.id]);
  const initials = new Set<string>();
  for (const suspect of puzzle.suspects) {
    if (ids.has(suspect.id)) throw new Error(`${puzzle.id}: id repetido ${suspect.id}`);
    ids.add(suspect.id);
    const letter = initial(suspect.name);
    if (initials.has(letter)) throw new Error(`${puzzle.id}: inicial repetida ${letter}`);
    initials.add(letter);
  }

  const seen = new Set<string>();
  const areaIds = new Set<number>();
  for (const area of puzzle.areas) {
    if (areaIds.has(area.id)) throw new Error(`${puzzle.id}: sala repetida ${area.id}`);
    areaIds.add(area.id);
    for (const cell of area.cells) {
      assertInside(puzzle, cell, `sala ${area.name}`);
      const key = `${cell.r},${cell.c}`;
      if (seen.has(key)) throw new Error(`${puzzle.id}: ${key} está en dos salas`);
      seen.add(key);
    }
  }
  if (seen.size !== puzzle.size * puzzle.size) {
    throw new Error(`${puzzle.id}: las salas no cubren el tablero`);
  }

  const objectAt = new Set<string>();
  for (const item of puzzle.objects) {
    assertInside(puzzle, item, 'objeto');
    const key = `${item.r},${item.c}`;
    if (objectAt.has(key)) throw new Error(`${puzzle.id}: dos objetos en ${key}`);
    objectAt.add(key);
  }

  for (const cell of puzzle.blocked) assertInside(puzzle, cell, 'bloqueo');
  assertInside(puzzle, puzzle.victim.cell, 'víctima');

  for (const suspect of puzzle.suspects) {
    for (const clue of suspect.clues) validateClue(puzzle, clue, suspect.id, areaIds, false);
  }
  for (const clue of puzzle.caseClues) validateClue(puzzle, clue, 'caso', areaIds, true);

  const grid = gridOf(puzzle);
  if (grid.blocked[puzzle.victim.cell.r][puzzle.victim.cell.c]) {
    throw new Error(`${puzzle.id}: la víctima está en una casilla bloqueada`);
  }

  for (const suspect of puzzle.suspects) {
    const cell = puzzle.solution[suspect.id];
    if (!cell) throw new Error(`${puzzle.id}: falta la solución de ${suspect.id}`);
  }

  const result = check(puzzle, assignmentFromSolution(puzzle));
  if (!result.ok) {
    throw new Error(`${puzzle.id}: la solución guardada no cumple (${result.reason})`);
  }
}

function validateClue(
  puzzle: Puzzle,
  clue: Clue,
  owner: string,
  areaIds: Set<number>,
  caseLevel: boolean,
): void {
  if (clue.kind === 'census') {
    if (!caseLevel) throw new Error(`${puzzle.id}: ${owner} no puede llevar un censo`);
    if (!areaIds.has(clue.area)) throw new Error(`${puzzle.id}: censo de una sala inexistente`);
    if (clue.count < 0 || clue.count >= puzzle.size) throw new Error(`${puzzle.id}: censo imposible`);
    if (clue.area === areaOf(puzzle, puzzle.victim.cell) && clue.count !== 1) {
      throw new Error(`${puzzle.id}: la sala de la víctima tiene exactamente una persona viva`);
    }
    return;
  }
  if (caseLevel) throw new Error(`${puzzle.id}: las pistas de la escena solo pueden ser censos`);
  if (clue.kind === 'row' || clue.kind === 'col') {
    if (clue.id < 0 || clue.id >= puzzle.size) throw new Error(`${puzzle.id}: ${owner} apunta fuera del tablero`);
  }
  if (clue.kind === 'area' && !areaIds.has(clue.id)) {
    throw new Error(`${puzzle.id}: ${owner} nombra una sala inexistente`);
  }
  if ((clue.kind === 'north' || clue.kind === 'south' || clue.kind === 'east' || clue.kind === 'west') &&
    (clue.of === owner || (!puzzle.suspects.some((suspect) => suspect.id === clue.of) && clue.of !== puzzle.victim.id))
  ) {
    throw new Error(`${puzzle.id}: ${owner} se compara con alguien que no existe`);
  }
}

function parseArea(raw: unknown, id: string, index: number, size: number): Area {
  const data = asRecord(raw, `${id}.areas[${index}]`);
  return {
    id: asInt(data.id, `${id}.areas[${index}].id`),
    name: asString(data.name, `${id}.areas[${index}].name`),
    color: asString(data.color, `${id}.areas[${index}].color`),
    cells: asArray(data.cells, `${id}.areas[${index}].cells`).map((cell, cellIndex) =>
      asCell(cell, `${id}.areas[${index}].cells[${cellIndex}]`, size),
    ),
  };
}

function parseObject(raw: unknown, id: string, index: number): { r: number; c: number; kind: ObjectKind } {
  const data = asRecord(raw, `${id}.objects[${index}]`);
  const kind = asString(data.kind, `${id}.objects[${index}].kind`);
  if (!KINDS.has(kind)) throw new Error(`${id}: objeto ${kind} desconocido`);
  return {
    r: asInt(data.r, `${id}.objects[${index}].r`),
    c: asInt(data.c, `${id}.objects[${index}].c`),
    kind: kind as ObjectKind,
  };
}

function parseVictim(raw: unknown, id: string, size: number): Puzzle['victim'] {
  const data = asRecord(raw, `${id}.victim`);
  return {
    id: asString(data.id, `${id}.victim.id`),
    name: asString(data.name, `${id}.victim.name`),
    role: asString(data.role, `${id}.victim.role`),
    color: asString(data.color, `${id}.victim.color`),
    cell: asCell(data.cell, `${id}.victim.cell`, size),
  };
}

function parseSuspect(raw: unknown, id: string, index: number): Suspect {
  const data = asRecord(raw, `${id}.suspects[${index}]`);
  const suspectId = asString(data.id, `${id}.suspects[${index}].id`);
  return {
    id: suspectId,
    name: asString(data.name, `${id}.suspects[${index}].name`),
    role: asString(data.role, `${id}.suspects[${index}].role`),
    color: asString(data.color, `${id}.suspects[${index}].color`),
    clues: asArray(data.clues, `${id}.suspects[${index}].clues`).map((clue, clueIndex) =>
      parseClue(clue, `${id}.${suspectId}[${clueIndex}]`),
    ),
  };
}

function parseClue(raw: unknown, label: string): Clue {
  const data = asRecord(raw, label);
  const kind = asString(data.kind, `${label}.kind`);
  const negate = data.negate === undefined ? undefined : Boolean(data.negate);
  if (kind === 'row' || kind === 'col' || kind === 'area') {
    return { kind, id: asInt(data.id, `${label}.id`), negate };
  }
  if (kind === 'on' || kind === 'beside') {
    const object = asString(data.object, `${label}.object`);
    if (!KINDS.has(object)) throw new Error(`${label}: objeto desconocido`);
    return { kind, object: object as ObjectKind, negate };
  }
  if (kind === 'corner') return { kind, negate };
  if (kind === 'north' || kind === 'south' || kind === 'east' || kind === 'west') {
    return { kind, of: asString(data.of, `${label}.of`) };
  }
  if (kind === 'census') {
    return { kind, area: asInt(data.area, `${label}.area`), count: asInt(data.count, `${label}.count`) };
  }
  throw new Error(`${label}: pista ${kind} desconocida`);
}

function parseSolution(
  raw: unknown,
  id: string,
  suspects: Suspect[],
  size: number,
): Record<string, Cell> {
  const data = asRecord(raw, `${id}.solution`);
  const solution: Record<string, Cell> = {};
  for (const suspect of suspects) {
    if (!(suspect.id in data)) throw new Error(`${id}: falta la solución de ${suspect.id}`);
    solution[suspect.id] = asCell(data[suspect.id], `${id}.solution.${suspect.id}`, size);
  }
  const extra = Object.keys(data).filter((key) => !suspects.some((suspect) => suspect.id === key));
  if (extra.length) throw new Error(`${id}: solución de más (${extra.join(', ')})`);
  return solution;
}

function areaOf(puzzle: Puzzle, cell: Cell): number {
  for (const area of puzzle.areas) {
    if (area.cells.some((item) => item.r === cell.r && item.c === cell.c)) return area.id;
  }
  return -1;
}

function assertInside(puzzle: Puzzle, cell: Cell, label: string): void {
  if (cell.r < 0 || cell.c < 0 || cell.r >= puzzle.size || cell.c >= puzzle.size) {
    throw new Error(`${puzzle.id}: ${label} fuera del tablero`);
  }
}

function asCell(raw: unknown, label: string, size: number): Cell {
  if (!Array.isArray(raw) || raw.length !== 2) throw new Error(`${label} no es una casilla`);
  const cell = { r: asInt(raw[0], `${label}[0]`), c: asInt(raw[1], `${label}[1]`) };
  if (size <= 8 && (cell.r < 0 || cell.c < 0 || cell.r >= size || cell.c >= size)) {
    throw new Error(`${label} fuera del tablero`);
  }
  return cell;
}

function asRecord(raw: unknown, label: string): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${label} tiene que ser un objeto`);
  return raw as Record<string, unknown>;
}

function asArray(raw: unknown, label: string): unknown[] {
  if (!Array.isArray(raw)) throw new Error(`${label} tiene que ser una lista`);
  return raw;
}

function asString(raw: unknown, label: string): string {
  if (typeof raw !== 'string' || raw.length === 0) throw new Error(`${label} tiene que ser texto`);
  return raw;
}

function asInt(raw: unknown, label: string): number {
  if (typeof raw !== 'number' || !Number.isInteger(raw)) throw new Error(`${label} tiene que ser un entero`);
  return raw;
}
