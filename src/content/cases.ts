import aula from '@/content/cases/aula.json';
import bodega from '@/content/cases/bodega.json';
import comisaria from '@/content/cases/comisaria.json';
import faro from '@/content/cases/faro.json';
import hostal from '@/content/cases/hostal.json';
import invernadero from '@/content/cases/invernadero.json';
import kiosco from '@/content/cases/kiosco.json';
import lavanderia from '@/content/cases/lavanderia.json';
import mercado from '@/content/cases/mercado.json';
import redaccion from '@/content/cases/redaccion.json';
import taller from '@/content/cases/taller.json';
import teatro from '@/content/cases/teatro.json';
import { parseCase } from '@/engine/parse';
import type { Difficulty, Puzzle } from '@/engine/types';

const ORDER = [
  kiosco,
  lavanderia,
  aula,
  taller,
  hostal,
  bodega,
  invernadero,
  redaccion,
  teatro,
  comisaria,
  mercado,
  faro,
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
