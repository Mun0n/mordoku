import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseCase } from '../src/engine/parse';
import { assertUnique } from '../src/engine/solve';
import type { Difficulty } from '../src/engine/types';

const expectedSize: Record<Difficulty, number> = {
  very_easy: 6,
  easy: 7,
  medium: 8,
};

const DEDUCED = new Set([
  'kiosco',
  'lavanderia',
  'aula',
  'taller',
  'hostal',
  'bodega',
  'invernadero',
  'redaccion',
  'teatro',
  'comisaria',
]);

const dir = join(process.cwd(), 'src/content/cases');
const files = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .sort();

if (files.length !== 12) {
  throw new Error(`se esperaban 12 casos y hay ${files.length}`);
}

const counts: Record<Difficulty, number> = { very_easy: 0, easy: 0, medium: 0 };

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(dir, file), 'utf8')) as unknown;
  const puzzle = parseCase(raw, file);
  if (`${puzzle.id}.json` !== file) {
    throw new Error(`${file} no coincide con el id ${puzzle.id}`);
  }
  if (puzzle.size !== expectedSize[puzzle.difficulty]) {
    throw new Error(`${puzzle.id}: ${puzzle.difficulty} tiene que ser ${expectedSize[puzzle.difficulty]}×${expectedSize[puzzle.difficulty]}`);
  }
  assertUnique(puzzle);
  if (DEDUCED.has(puzzle.id)) {
    const kinds = [
      ...puzzle.caseClues,
      ...puzzle.suspects.flatMap((suspect) => suspect.clues),
    ];
    if (kinds.some((clue) => clue.kind === 'row' || clue.kind === 'col')) {
      throw new Error(`${puzzle.id}: una pista dice la fila o la columna`);
    }
  }
  counts[puzzle.difficulty] += 1;
  console.log(`ok ${puzzle.id}`);
}

for (const difficulty of Object.keys(counts) as Difficulty[]) {
  if (counts[difficulty] !== 4) {
    throw new Error(`${difficulty}: hay ${counts[difficulty]}, se esperaban 4`);
  }
}

console.log('12 casos, una solución cada uno');
