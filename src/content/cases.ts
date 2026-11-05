import brook from '@/content/cases/brook.json';
import cabana from '@/content/cases/cabana.json';
import cunningham from '@/content/cases/cunningham.json';
import grange from '@/content/cases/grange.json';
import hatherley from '@/content/cases/hatherley.json';
import lewisham from '@/content/cases/lewisham.json';
import pondicherry from '@/content/cases/pondicherry.json';
import thorpe from '@/content/cases/thorpe.json';
import tredannick from '@/content/cases/tredannick.json';
import wisteria from '@/content/cases/wisteria.json';
import woolwich from '@/content/cases/woolwich.json';
import yoxley from '@/content/cases/yoxley.json';
import { parseCase } from '@/engine/parse';
import type { Difficulty, Puzzle } from '@/engine/types';

const ORDER = [
  cabana,
  grange,
  thorpe,
  yoxley,
  hatherley,
  cunningham,
  tredannick,
  lewisham,
  wisteria,
  brook,
  pondicherry,
  woolwich,
];

export const cases: Puzzle[] = ORDER.map((raw) => parseCase(raw));

export function caseById(id: string): Puzzle | null {
  return cases.find((puzzle) => puzzle.id === id) ?? null;
}

export const DIFFICULTY_ORDER: Difficulty[] = ['very_easy', 'easy', 'medium'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  very_easy: 'Muy fácil',
  easy: 'Fácil',
  medium: 'Medio',
};
