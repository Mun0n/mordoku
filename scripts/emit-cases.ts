import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { parseCase } from '../src/engine/parse';
import { assertUnique } from '../src/engine/solve';
import type { Cell, Clue, Difficulty, ObjectKind } from '../src/engine/types';

const INK = ['#c4476a', '#b85a18', '#8c6410', '#2f8f55', '#2a7f86', '#3a6fbe', '#6d52b8'];

type Room = { id: number; name: string; color: string };
type Person = {
  id: string;
  name: string;
  role: string;
  at: [number, number];
  clues: Clue[];
};

type Spec = {
  id: string;
  title: string;
  difficulty: Difficulty;
  blurb: string;
  map: string[];
  rooms: Record<string, Room>;
  objects: { r: number; c: number; kind: ObjectKind }[];
  victim: { id: string; name: string; role: string; at: [number, number] };
  people: Person[];
  caseClues: Clue[];
};

const row = (id: number): Clue => ({ kind: 'row', id });
const col = (id: number): Clue => ({ kind: 'col', id });
const area = (id: number, negate?: boolean): Clue => ({ kind: 'area', id, negate });
const on = (object: ObjectKind): Clue => ({ kind: 'on', object });
const beside = (object: ObjectKind, negate?: boolean): Clue => ({ kind: 'beside', object, negate });
const corner = (negate?: boolean): Clue => ({ kind: 'corner', negate });
const north = (of: string): Clue => ({ kind: 'north', of });
const south = (of: string): Clue => ({ kind: 'south', of });
const east = (of: string): Clue => ({ kind: 'east', of });
const west = (of: string): Clue => ({ kind: 'west', of });
const census = (areaId: number, count: number): Clue => ({ kind: 'census', area: areaId, count });

const cases: Spec[] = [
  {
    id: 'cabana',
    title: 'La cabaña',
    difficulty: 'very_easy',
    blurb: 'Peter Carey no salió de la cabaña. El arpón seguía dentro.',
    map: ['SSSccc', 'SSSccc', 'pppppp', 'pppppp', 'tttooo', 'tttooo'],
    rooms: {
      S: { id: 0, name: 'la Cabaña', color: '#f0c7b8' },
      c: { id: 1, name: 'la Cocina', color: '#f6e2a8' },
      p: { id: 2, name: 'el Camino', color: '#cfe6c4' },
      t: { id: 3, name: 'el Dormitorio', color: '#d5ebe4' },
      o: { id: 4, name: 'el Cobertizo', color: '#c5daf3' },
    },
    objects: [
      { r: 1, c: 0, kind: 'silla' },
      { r: 1, c: 2, kind: 'planta' },
      { r: 0, c: 5, kind: 'mesa' },
      { r: 2, c: 3, kind: 'alfombra' },
      { r: 3, c: 4, kind: 'estanteria' },
      { r: 4, c: 1, kind: 'planta' },
      { r: 4, c: 2, kind: 'silla' },
      { r: 5, c: 4, kind: 'sofa' },
    ],
    victim: { id: 'ines', name: 'Peter Carey', role: 'capitán', at: [0, 1] },
    people: [
      { id: 'abel', name: 'John Neligan', role: 'hijo del banquero', at: [1, 0], clues: [west('ines'), area(3, true)] },
      { id: 'bea', name: 'Patrick Cairns', role: 'arponero', at: [2, 3], clues: [area(3, true), south('abel')] },
      { id: 'carlos', name: 'Ada Carey', role: 'la mujer', at: [3, 5], clues: [beside('estanteria'), south('bea')] },
      { id: 'dina', name: 'Maud Carey', role: 'la hija', at: [4, 2], clues: [area(2, true), on('silla')] },
      { id: 'eva', name: 'Hugh Slater', role: 'tripulante', at: [5, 4], clues: [east('bea'), west('carlos')] },
    ],
    caseClues: [census(3, 1)],
  },
  {
    id: 'grange',
    title: 'Abbey Grange',
    difficulty: 'very_easy',
    blurb: 'Sir Eustace quedó en el comedor, con la campanilla cortada y el cristal roto.',
    map: ['mmmmss', 'mmmmss', 'mmmmss', 'dddddd', 'dddddd', 'cccccc'],
    rooms: {
      m: { id: 0, name: 'el Comedor', color: '#f0c7b8' },
      s: { id: 1, name: 'la Despensa', color: '#c5daf3' },
      d: { id: 2, name: 'el Salón', color: '#f6e2a8' },
      c: { id: 3, name: 'el Vestíbulo', color: '#cfe6c4' },
    },
    objects: [
      { r: 0, c: 0, kind: 'silla' },
      { r: 0, c: 3, kind: 'planta' },
      { r: 2, c: 5, kind: 'mesa' },
      { r: 3, c: 2, kind: 'alfombra' },
      { r: 4, c: 0, kind: 'estanteria' },
      { r: 4, c: 5, kind: 'silla' },
      { r: 5, c: 3, kind: 'sofa' },
    ],
    victim: { id: 'rosa', name: 'Eustace Brackenstall', role: 'el señor', at: [1, 1] },
    people: [
      { id: 'nora', name: 'Theresa Wright', role: 'doncella', at: [0, 0], clues: [on('silla'), west('berta'), north('luz')] },
      { id: 'ivan', name: 'Jack Croker', role: 'capitán', at: [2, 4], clues: [area(2, true), north('luz'), east('rosa')] },
      { id: 'luz', name: 'Mary Brackenstall', role: 'la señora', at: [3, 2], clues: [south('ivan'), north('teo'), west('berta')] },
      { id: 'teo', name: 'Ellen Shaw', role: 'cocinera', at: [4, 5], clues: [on('silla'), south('luz'), east('ivan')] },
      { id: 'berta', name: 'Ralph Keene', role: 'lacayo', at: [5, 3], clues: [south('teo'), south('rosa'), area(0, true)] },
    ],
    caseClues: [census(2, 2)],
  },
  {
    id: 'thorpe',
    title: 'Riding Thorpe',
    difficulty: 'very_easy',
    blurb: 'Hilton Cubitt cayó junto a la ventana. En el alféizar había unos muñecos dibujados.',
    map: ['pppppp', 'pppppp', 'vvvvvv', 'bbbbjj', 'bbbbjj', 'bbbbjj'],
    rooms: {
      p: { id: 0, name: 'el Estudio', color: '#f6e2a8' },
      v: { id: 1, name: 'el Jardín', color: '#c5daf3' },
      b: { id: 2, name: 'el Salón', color: '#cfe6c4' },
      j: { id: 3, name: 'la Cocina', color: '#e4d2f4' },
    },
    objects: [
      { r: 1, c: 0, kind: 'silla' },
      { r: 1, c: 5, kind: 'planta' },
      { r: 2, c: 4, kind: 'alfombra' },
      { r: 2, c: 1, kind: 'mesa' },
      { r: 3, c: 1, kind: 'silla' },
      { r: 4, c: 5, kind: 'sofa' },
      { r: 4, c: 4, kind: 'estanteria' },
      { r: 5, c: 0, kind: 'mesa' },
      { r: 5, c: 1, kind: 'planta' },
      { r: 5, c: 2, kind: 'estanteria' },
    ],
    victim: { id: 'hugo', name: 'Hilton Cubitt', role: 'el señor', at: [0, 2] },
    people: [
      { id: 'ana', name: 'Elsie Cubitt', role: 'la señora', at: [1, 0], clues: [area(2, true), area(1, true)] },
      { id: 'bruno', name: 'Abe Slaney', role: 'el americano', at: [2, 4], clues: [east('elsa'), area(2, true)] },
      { id: 'cloe', name: 'Martha Hull', role: 'ama de llaves', at: [3, 1], clues: [on('silla'), north('elsa')] },
      { id: 'diego', name: 'Fred Carr', role: 'mozo', at: [4, 5], clues: [beside('estanteria'), area(1, true)] },
      { id: 'elsa', name: 'Jane Porter', role: 'doncella', at: [5, 3], clues: [south('cloe'), south('diego')] },
    ],
    caseClues: [census(3, 1)],
  },
  {
    id: 'yoxley',
    title: 'Yoxley',
    difficulty: 'very_easy',
    blurb: 'Willoughby Smith quedó en el estudio, con el cortaplumas de lacre en el cuello.',
    map: ['bbbzzz', 'bbbzzz', 'hhhhhh', 'hhhhhh', 'ffffcc', 'ffffcc'],
    rooms: {
      b: { id: 0, name: 'el Dormitorio', color: '#f3d7c0' },
      z: { id: 1, name: 'el Estudio', color: '#f6d2e2' },
      h: { id: 2, name: 'el Pasillo', color: '#c5daf3' },
      f: { id: 3, name: 'la Cocina', color: '#d5ebe4' },
      c: { id: 4, name: 'el Jardín', color: '#e4d2f4' },
    },
    objects: [
      { r: 1, c: 5, kind: 'silla' },
      { r: 1, c: 3, kind: 'planta' },
      { r: 2, c: 0, kind: 'alfombra' },
      { r: 2, c: 5, kind: 'mesa' },
      { r: 3, c: 2, kind: 'silla' },
      { r: 4, c: 1, kind: 'silla' },
      { r: 5, c: 0, kind: 'estanteria' },
    ],
    victim: { id: 'martin', name: 'Willoughby Smith', role: 'secretario', at: [0, 4] },
    people: [
      { id: 'rita', name: 'Marker', role: 'ama de llaves', at: [1, 5], clues: [north('oscar'), area(2, true), on('silla')] },
      { id: 'oscar', name: 'Anna', role: 'la esposa', at: [2, 0], clues: [south('rita'), west('martin'), area(4, true)] },
      { id: 'nuria', name: 'Susan Tarlton', role: 'doncella', at: [3, 2], clues: [on('silla'), area(0, true), south('rita')] },
      { id: 'leo', name: 'Coram', role: 'el profesor', at: [4, 1], clues: [on('silla'), south('nuria'), area(2, true)] },
      { id: 'gala', name: 'Thomas Reed', role: 'jardinero', at: [5, 3], clues: [south('leo'), area(4, true), area(2, true)] },
    ],
    caseClues: [census(3, 2)],
  },
  {
    id: 'hatherley',
    title: 'La charca',
    difficulty: 'easy',
    blurb: 'Charles McCarthy no volvió de la charca. Su hijo dice que lo dejó vivo.',
    map: ['rrrrccc', 'rrrrccc', 'rrrrccc', 'ppppppp', 'ppppppp', 'kkkkeee', 'kkkkeee'],
    rooms: {
      r: { id: 0, name: 'la Charca', color: '#f0c7b8' },
      c: { id: 1, name: 'el Bosque', color: '#f6e2a8' },
      p: { id: 2, name: 'el Sendero', color: '#c5daf3' },
      k: { id: 3, name: 'la Granja', color: '#cfe6c4' },
      e: { id: 4, name: 'el Patio', color: '#d5ebe4' },
    },
    objects: [
      { r: 1, c: 0, kind: 'silla' },
      { r: 1, c: 1, kind: 'planta' },
      { r: 2, c: 4, kind: 'mesa' },
      { r: 2, c: 6, kind: 'estanteria' },
      { r: 3, c: 3, kind: 'alfombra' },
      { r: 5, c: 2, kind: 'silla' },
      { r: 6, c: 4, kind: 'sofa' },
      { r: 6, c: 6, kind: 'planta' },
    ],
    victim: { id: 'olga', name: 'Charles McCarthy', role: 'arrendatario', at: [0, 1] },
    people: [
      { id: 'nora', name: 'Alice Turner', role: 'la hija', at: [1, 0], clues: [beside('planta'), north('ivan')] },
      { id: 'ivan', name: 'James McCarthy', role: 'el hijo', at: [2, 5], clues: [area(0, true), west('teo')] },
      { id: 'luz', name: 'Turner', role: 'John, el vecino', at: [3, 3], clues: [north('teo'), area(1, true)] },
      { id: 'teo', name: 'William Crowder', role: 'guardabosque', at: [4, 6], clues: [east('ivan'), south('luz'), south('olga')] },
      { id: 'paz', name: 'Cobb', role: 'John, el mozo', at: [5, 2], clues: [south('teo'), on('silla')] },
      { id: 'gael', name: 'Moran', role: 'el guarda', at: [6, 4], clues: [south('teo'), east('luz')] },
    ],
    caseClues: [census(3, 1)],
  },
  {
    id: 'cunningham',
    title: 'Los Cunningham',
    difficulty: 'easy',
    blurb: 'El cochero William Kirwan amaneció muerto. En la casa hablan de un robo.',
    map: ['BBBBBBB', 'BBBBBBB', 'CCCCCCC', 'CCCCCCC', 'NNNNOOO', 'NNNNOOO', 'NNNNOOO'],
    rooms: {
      B: { id: 0, name: 'el Jardín', color: '#f3d7c0' },
      C: { id: 1, name: 'el Estudio', color: '#e4d2f4' },
      N: { id: 2, name: 'la Cochera', color: '#d5ebe4' },
      O: { id: 3, name: 'la Cocina', color: '#c5daf3' },
    },
    objects: [
      { r: 1, c: 6, kind: 'silla' },
      { r: 1, c: 2, kind: 'planta' },
      { r: 2, c: 1, kind: 'alfombra' },
      { r: 3, c: 5, kind: 'mesa' },
      { r: 4, c: 2, kind: 'estanteria' },
      { r: 6, c: 0, kind: 'mesa' },
      { r: 6, c: 5, kind: 'sofa' },
    ],
    victim: { id: 'tomas', name: 'William Kirwan', role: 'cochero', at: [0, 3] },
    people: [
      { id: 'rita', name: 'Señor Acton', role: 'el vecino', at: [1, 6], clues: [north('nuria'), east('eva'), area(1, true)] },
      { id: 'oscar', name: 'Alec Cunningham', role: 'el hijo', at: [2, 1], clues: [west('tomas'), area(0, true), north('nuria')] },
      { id: 'nuria', name: 'Cunningham', role: 'el padre', at: [3, 4], clues: [south('rita'), beside('mesa'), west('eva')] },
      { id: 'leo', name: 'Hayter', role: 'el coronel', at: [4, 0], clues: [west('tomas'), north('gala'), west('oscar')] },
      { id: 'gala', name: 'Edith Moore', role: 'doncella', at: [5, 2], clues: [west('tomas'), beside('estanteria'), south('leo')] },
      { id: 'eva', name: 'Brooks', role: 'mozo', at: [6, 5], clues: [east('nuria'), area(2, true), area(1, true)] },
    ],
    caseClues: [census(3, 1)],
  },
  {
    id: 'tredannick',
    title: 'Tredannick',
    difficulty: 'easy',
    blurb: 'Brenda Tregennis quedó en el salón, con la lámpara aún encendida.',
    map: ['VVVAAAA', 'VVVAAAA', 'VVVAAAA', 'PPPPPPP', 'PPPPPPP', 'SSSSTTT', 'SSSSTTT'],
    rooms: {
      V: { id: 0, name: 'el Salón', color: '#cfe6c4' },
      A: { id: 1, name: 'el Comedor', color: '#c5daf3' },
      P: { id: 2, name: 'el Pasillo', color: '#f6e2a8' },
      S: { id: 3, name: 'el Jardín', color: '#f0c7b8' },
      T: { id: 4, name: 'el Estudio', color: '#e4d2f4' },
    },
    objects: [
      { r: 1, c: 2, kind: 'silla' },
      { r: 2, c: 4, kind: 'planta' },
      { r: 0, c: 6, kind: 'mesa' },
      { r: 3, c: 0, kind: 'alfombra' },
      { r: 5, c: 0, kind: 'estanteria' },
      { r: 5, c: 3, kind: 'silla' },
      { r: 6, c: 4, kind: 'sofa' },
    ],
    victim: { id: 'irene', name: 'Brenda Tregennis', role: 'la hermana', at: [0, 1] },
    people: [
      { id: 'nora', name: 'Hannah Polwhele', role: 'cocinera', at: [1, 2], clues: [on('silla'), north('luz'), area(2, true)] },
      { id: 'ivan', name: 'Mortimer Tregennis', role: 'el hermano', at: [2, 5], clues: [beside('planta'), east('irene'), area(2, true)] },
      { id: 'luz', name: 'Leon Sterndale', role: 'explorador', at: [3, 0], clues: [south('nora'), west('irene'), north('teo')] },
      { id: 'teo', name: 'Vicario Roundhay', role: 'el vicario', at: [4, 6], clues: [east('ivan'), south('irene'), area(3, true)] },
      { id: 'paz', name: 'Bonython', role: 'Mary, la doncella', at: [5, 3], clues: [on('silla'), north('gael'), area(2, true)] },
      { id: 'gael', name: 'Rosewarne', role: 'jardinero', at: [6, 4], clues: [south('paz'), east('irene'), area(2, true)] },
    ],
    caseClues: [census(3, 1), census(1, 1)],
  },
  {
    id: 'lewisham',
    title: 'Lewisham',
    difficulty: 'easy',
    blurb: 'Clara Amberley no bajó a cenar. La casa entera olía a pintura.',
    map: ['RRRRMMM', 'RRRRMMM', 'RRRRMMM', 'HHHHHHH', 'HHHHHHH', 'AAAAIII', 'AAAAIII'],
    rooms: {
      R: { id: 0, name: 'el Estudio', color: '#f6e2a8' },
      M: { id: 1, name: 'el Cuarto fuerte', color: '#d5ebe4' },
      H: { id: 2, name: 'el Pasillo', color: '#c5daf3' },
      A: { id: 3, name: 'el Jardín', color: '#f3d7c0' },
      I: { id: 4, name: 'la Cochera', color: '#f6d2e2' },
    },
    objects: [
      { r: 1, c: 0, kind: 'silla' },
      { r: 2, c: 4, kind: 'mesa' },
      { r: 2, c: 5, kind: 'estanteria' },
      { r: 3, c: 3, kind: 'alfombra' },
      { r: 5, c: 4, kind: 'silla' },
      { r: 5, c: 5, kind: 'planta' },
      { r: 6, c: 5, kind: 'sofa' },
    ],
    victim: { id: 'sara', name: 'Clara Amberley', role: 'la señora', at: [0, 2] },
    people: [
      { id: 'rita', name: 'Ray Ernest', role: 'médico', at: [1, 0], clues: [north('oscar'), west('leo')] },
      { id: 'oscar', name: 'Josiah Amberley', role: 'fabricante', at: [2, 6], clues: [north('nuria'), area(2, true)] },
      { id: 'nuria', name: 'Señor Barker', role: 'detective', at: [3, 3], clues: [north('leo'), area(3, true)] },
      { id: 'leo', name: 'Edith Lamb', role: 'doncella', at: [4, 1], clues: [west('sara'), east('rita')] },
      { id: 'gala', name: 'Nell Ware', role: 'cocinera', at: [5, 4], clues: [north('eva'), on('silla')] },
      { id: 'eva', name: 'Paul Green', role: 'pintor', at: [6, 5], clues: [east('nuria'), area(0, true)] },
    ],
    caseClues: [census(1, 1)],
  },
  {
    id: 'wisteria',
    title: 'Wisteria Lodge',
    difficulty: 'medium',
    blurb: 'Aloysius Garcia no amaneció en la casa. Su huésped dice que se fue de noche.',
    map: ['AAAABBBB', 'AAAABBBB', 'AAAABBBB', 'CCCCCCCC', 'CCCCCCCC', 'DDDDEEEE', 'DDDDEEEE', 'DDDDEEEE'],
    rooms: {
      A: { id: 0, name: 'el Salón', color: '#f0c7b8' },
      B: { id: 1, name: 'el Comedor', color: '#f6e2a8' },
      C: { id: 2, name: 'el Pasillo', color: '#c5daf3' },
      D: { id: 3, name: 'la Cocina', color: '#e4d2f4' },
      E: { id: 4, name: 'el Jardín', color: '#cfe6c4' },
    },
    objects: [
      { r: 1, c: 1, kind: 'planta' },
      { r: 2, c: 5, kind: 'planta' },
      { r: 0, c: 6, kind: 'mesa' },
      { r: 3, c: 3, kind: 'alfombra' },
      { r: 5, c: 1, kind: 'estanteria' },
      { r: 7, c: 4, kind: 'sofa' },
    ],
    victim: { id: 'julia', name: 'Aloysius Garcia', role: 'el señor', at: [0, 1] },
    people: [
      { id: 'ana', name: 'Tom Hudson', role: 'criado', at: [1, 0], clues: [beside('planta'), north('cloe'), area(1, true)] },
      { id: 'bruno', name: 'John Scott Eccles', role: 'huésped', at: [2, 6], clues: [beside('planta'), east('julia'), east('greta')] },
      { id: 'cloe', name: 'Burnet', role: 'la institutriz', at: [3, 3], clues: [south('bruno'), north('diego'), west('bruno')] },
      { id: 'diego', name: 'Henderson', role: 'el vecino', at: [4, 7], clues: [east('bruno'), south('cloe'), corner()] },
      { id: 'elsa', name: 'Lucy Penn', role: 'doncella', at: [5, 2], clues: [beside('estanteria'), south('cloe'), east('julia')] },
      { id: 'fabio', name: 'Cole', role: 'Harry, el cochero', at: [6, 5], clues: [south('elsa'), north('greta'), east('greta')] },
      { id: 'greta', name: 'Ned Walsh', role: 'jardinero', at: [7, 4], clues: [south('fabio'), area(3, true), area(2, true)] },
    ],
    caseClues: [census(2, 2)],
  },
  {
    id: 'brook',
    title: 'Brook Street',
    difficulty: 'medium',
    blurb: 'Blessington apareció ahorcado en su cuarto. El médico duerme en el piso de abajo.',
    map: ['SSSSSSLL', 'SSSSSSLL', 'SSSSSSLL', 'PPPPPPPP', 'PPPPPPPP', 'AAAAFFFF', 'AAAAFFFF', 'AAAAFFFF'],
    rooms: {
      S: { id: 0, name: 'el Cuarto', color: '#f0c7b8' },
      L: { id: 1, name: 'el Consultorio', color: '#d5ebe4' },
      P: { id: 2, name: 'el Pasillo', color: '#f6e2a8' },
      A: { id: 3, name: 'el Comedor', color: '#f3d7c0' },
      F: { id: 4, name: 'la Cocina', color: '#c5daf3' },
    },
    objects: [
      { r: 1, c: 1, kind: 'planta' },
      { r: 2, c: 6, kind: 'mesa' },
      { r: 0, c: 7, kind: 'estanteria' },
      { r: 3, c: 4, kind: 'alfombra' },
      { r: 5, c: 3, kind: 'silla' },
      { r: 7, c: 5, kind: 'sofa' },
    ],
    victim: { id: 'pedro', name: 'Blessington', role: 'el paciente', at: [0, 2] },
    people: [
      { id: 'ana', name: 'Tom Bell', role: 'botones', at: [1, 0], clues: [beside('planta'), west('pedro'), north('cleo')] },
      { id: 'bruno', name: 'Percy Trevelyan', role: 'médico', at: [2, 7], clues: [beside('mesa'), east('pedro'), south('ana')] },
      { id: 'cleo', name: 'Biddle', role: 'antiguo socio', at: [3, 4], clues: [south('bruno'), north('diego'), west('greta')] },
      { id: 'diego', name: 'Hayward', role: 'antiguo socio', at: [4, 1], clues: [south('cleo'), west('pedro'), area(3, true)] },
      { id: 'elsa', name: 'Moffat', role: 'antiguo socio', at: [5, 3], clues: [south('diego'), north('fabio'), west('cleo')] },
      { id: 'fabio', name: 'Annie Croft', role: 'doncella', at: [6, 6], clues: [south('elsa'), north('greta'), east('greta')] },
      { id: 'greta', name: 'Will Dunn', role: 'cochero', at: [7, 5], clues: [south('fabio'), area(3, true), east('elsa')] },
    ],
    caseClues: [census(2, 2), census(1, 1)],
  },
  {
    id: 'pondicherry',
    title: 'Pondicherry',
    difficulty: 'medium',
    blurb: 'Bartholomew Sholto no abrió el ático. La puerta seguía cerrada por dentro.',
    map: ['FFFFVVVV', 'FFFFVVVV', 'PPPPPPPP', 'PPPPPPPP', 'PPPPPPPP', 'CCCCBBBB', 'CCCCBBBB', 'CCCCBBBB'],
    rooms: {
      F: { id: 0, name: 'el Ático', color: '#cfe6c4' },
      V: { id: 1, name: 'el Laboratorio', color: '#d5ebe4' },
      P: { id: 2, name: 'el Pasillo', color: '#f6e2a8' },
      C: { id: 3, name: 'el Comedor', color: '#f0c7b8' },
      B: { id: 4, name: 'la Cochera', color: '#c5daf3' },
    },
    objects: [
      { r: 1, c: 2, kind: 'planta' },
      { r: 2, c: 6, kind: 'sofa' },
      { r: 5, c: 2, kind: 'silla' },
      { r: 6, c: 6, kind: 'mesa' },
      { r: 7, c: 4, kind: 'sofa' },
      { r: 0, c: 5, kind: 'estanteria' },
    ],
    victim: { id: 'maite', name: 'Bartholomew Sholto', role: 'el hermano', at: [0, 1] },
    people: [
      { id: 'ana', name: 'Sholto', role: 'Thaddeus, el hermano', at: [1, 3], clues: [col(3), beside('planta')] },
      { id: 'bruno', name: 'Jonathan Small', role: 'fugitivo', at: [2, 6], clues: [row(2), on('sofa')] },
      { id: 'cleo', name: 'Tonga', role: 'el compañero', at: [3, 0], clues: [row(3), col(0)] },
      {
        id: 'diego',
        name: 'McMurdo',
        role: 'portero',
        at: [4, 5],
        clues: [south('cleo'), north('elsa'), col(5)],
      },
      { id: 'elsa', name: 'Lal Rao', role: 'mayordomo', at: [5, 2], clues: [row(5), area(3), on('silla')] },
      { id: 'fabio', name: 'Bernstone', role: 'ama de llaves', at: [6, 7], clues: [row(6), col(7), area(4)] },
      { id: 'greta', name: 'Peter Hogg', role: 'cochero', at: [7, 4], clues: [south('fabio'), on('sofa')] },
    ],
    caseClues: [census(2, 3)],
  },
  {
    id: 'woolwich',
    title: 'Woolwich',
    difficulty: 'medium',
    blurb: 'Cadogan West no entregó los planos. Apareció lejos de la oficina, y no estaban todos.',
    map: ['TTTTOOOO', 'TTTTOOOO', 'MMMMMMMM', 'MMMMMMMM', 'CCCCEEEE', 'CCCCEEEE', 'CCCCEEEE', 'WWWWWWWW'],
    rooms: {
      T: { id: 0, name: 'el Despacho', color: '#f6e2a8' },
      O: { id: 1, name: 'el Pasillo', color: '#c5daf3' },
      M: { id: 2, name: 'el Andén', color: '#d5ebe4' },
      C: { id: 3, name: 'el Salón', color: '#f0c7b8' },
      E: { id: 4, name: 'el Archivo', color: '#cfe6c4' },
      W: { id: 5, name: 'la Calle', color: '#e4d2f4' },
    },
    objects: [
      { r: 1, c: 1, kind: 'planta' },
      { r: 2, c: 5, kind: 'alfombra' },
      { r: 4, c: 3, kind: 'silla' },
      { r: 5, c: 7, kind: 'estanteria' },
      { r: 7, c: 4, kind: 'sofa' },
      { r: 0, c: 6, kind: 'mesa' },
    ],
    victim: { id: 'leon', name: 'Cadogan West', role: 'funcionario', at: [0, 1] },
    people: [
      { id: 'ana', name: 'Sidney Johnson', role: 'escribiente', at: [1, 0], clues: [col(0), beside('planta'), area(0)] },
      { id: 'bruno', name: 'Valentine', role: 'el hermano', at: [2, 5], clues: [row(2), on('alfombra'), north('cleo')] },
      { id: 'cleo', name: 'Westbury', role: 'Violet, la prometida', at: [3, 7], clues: [south('bruno'), col(7), area(2)] },
      { id: 'diego', name: 'James Walter', role: 'el jefe', at: [4, 3], clues: [row(4), area(3), on('silla')] },
      { id: 'elsa', name: 'Oberstein', role: 'espía', at: [5, 6], clues: [row(5), beside('estanteria')] },
      { id: 'fabio', name: 'Harold Porter', role: 'mozo', at: [6, 2], clues: [row(6), col(2), area(3), south('diego')] },
      { id: 'greta', name: 'Ellen Wade', role: 'doncella', at: [7, 4], clues: [row(7), on('sofa')] },
    ],
    caseClues: [census(2, 2)],
  },
];

const BLOCKING = new Set<ObjectKind>(['planta', 'mesa', 'estanteria']);

function cellsOf(map: string[], letter: string): [number, number][] {
  const cells: [number, number][] = [];
  map.forEach((line, r) => {
    [...line].forEach((char, c) => {
      if (char === letter) cells.push([r, c]);
    });
  });
  return cells;
}

function toRaw(spec: Spec) {
  const size = spec.map.length;
  spec.map.forEach((line, r) => {
    if (line.length !== size) throw new Error(`${spec.id}: la fila ${r} no mide ${size}`);
    [...line].forEach((char) => {
      if (!spec.rooms[char]) throw new Error(`${spec.id}: sala ${char} sin nombre`);
    });
  });

  const rows = new Set<number>([spec.victim.at[0]]);
  const cols = new Set<number>([spec.victim.at[1]]);
  spec.people.forEach((person, index) => {
    if (rows.has(person.at[0]) || cols.has(person.at[1])) {
      throw new Error(`${spec.id}: ${person.id} repite fila o columna`);
    }
    rows.add(person.at[0]);
    cols.add(person.at[1]);
    void index;
  });

  const blocked = spec.objects.filter((item) => BLOCKING.has(item.kind)).map((item) => [item.r, item.c]);
  for (const person of spec.people) {
    if (blocked.some(([r, c]) => r === person.at[0] && c === person.at[1])) {
      throw new Error(`${spec.id}: ${person.id} está sobre un mueble bloqueado`);
    }
  }
  if (blocked.some(([r, c]) => r === spec.victim.at[0] && c === spec.victim.at[1])) {
    throw new Error(`${spec.id}: la víctima está bloqueada`);
  }

  return {
    id: spec.id,
    title: spec.title,
    difficulty: spec.difficulty,
    blurb: spec.blurb,
    size,
    areas: Object.entries(spec.rooms).map(([letter, room]) => ({
      id: room.id,
      name: room.name,
      color: room.color,
      cells: cellsOf(spec.map, letter),
    })),
    objects: spec.objects,
    blocked,
    victim: {
      id: spec.victim.id,
      name: spec.victim.name,
      role: spec.victim.role,
      color: '#6b6258',
      cell: spec.victim.at,
    },
    suspects: spec.people.map((person, index) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      color: INK[index],
      clues: person.clues,
    })),
    caseClues: spec.caseClues,
    solution: Object.fromEntries(spec.people.map((person) => [person.id, person.at])),
  };
}

const dir = join(process.cwd(), 'src/content/cases');
mkdirSync(dir, { recursive: true });

const DEDUCED = new Set([
  'cabana',
  'grange',
  'thorpe',
  'yoxley',
  'hatherley',
  'cunningham',
  'tredannick',
  'lewisham',
  'wisteria',
  'brook',
]);

for (const spec of cases) {
  const raw = toRaw(spec);
  const puzzle = parseCase(raw, spec.id);
  assertUnique(puzzle);
  if (DEDUCED.has(spec.id)) {
    const kinds = [...spec.caseClues, ...spec.people.flatMap((person) => person.clues)];
    if (kinds.some((clue) => clue.kind === 'row' || clue.kind === 'col')) {
      throw new Error(`${spec.id}: una pista dice la fila o la columna`);
    }
  }
  writeFileSync(join(dir, `${spec.id}.json`), `${JSON.stringify(raw, null, 2)}\n`);
  console.log(`ok ${spec.id}`);
}

void dirname;
void (0 as unknown as Cell);
