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
const census = (areaId: number, count: number): Clue => ({ kind: 'census', area: areaId, count });

const cases: Spec[] = [
  {
    id: 'kiosco',
    title: 'El kiosco',
    difficulty: 'very_easy',
    blurb: 'Cerró con Inés entre las revistas y nadie oyó la persiana.',
    map: ['SSSccc', 'SSSccc', 'pppppp', 'pppppp', 'tttooo', 'tttooo'],
    rooms: {
      S: { id: 0, name: 'el Salón', color: '#f0c7b8' },
      c: { id: 1, name: 'la Cocina', color: '#f6e2a8' },
      p: { id: 2, name: 'el Patio', color: '#cfe6c4' },
      t: { id: 3, name: 'el Sótano', color: '#d5ebe4' },
      o: { id: 4, name: 'la Oficina', color: '#c5daf3' },
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
    victim: { id: 'ines', name: 'Inés Lara', role: 'quiosquera', at: [0, 1] },
    people: [
      { id: 'abel', name: 'Abel Ruiz', role: 'repartidor', at: [1, 0], clues: [row(1), on('silla'), area(0)] },
      { id: 'bea', name: 'Bea Molina', role: 'clienta', at: [2, 3], clues: [row(2), on('alfombra')] },
      { id: 'carlos', name: 'Carlos Vidal', role: 'vecino', at: [3, 5], clues: [row(3), col(5)] },
      { id: 'dina', name: 'Dina Serra', role: 'sobrina', at: [4, 2], clues: [row(4), area(3), on('silla')] },
      { id: 'eva', name: 'Eva Costa', role: 'contable', at: [5, 4], clues: [row(5), on('sofa'), area(4)] },
    ],
    caseClues: [],
  },
  {
    id: 'lavanderia',
    title: 'La lavandería',
    difficulty: 'very_easy',
    blurb: 'La última colada salió sola. Rosa no.',
    map: ['mmmmss', 'mmmmss', 'mmmmss', 'dddddd', 'dddddd', 'cccccc'],
    rooms: {
      m: { id: 0, name: 'el Mostrador', color: '#f0c7b8' },
      s: { id: 1, name: 'las Secadoras', color: '#c5daf3' },
      d: { id: 2, name: 'el Doblado', color: '#f6e2a8' },
      c: { id: 3, name: 'la Calle', color: '#cfe6c4' },
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
    victim: { id: 'rosa', name: 'Rosa Vidal', role: 'encargada', at: [1, 1] },
    people: [
      { id: 'nora', name: 'Nora Gil', role: 'clienta', at: [0, 0], clues: [row(0), on('silla'), area(0)] },
      { id: 'ivan', name: 'Iván Mora', role: 'técnico', at: [2, 4], clues: [row(2), area(1)] },
      { id: 'luz', name: 'Luz Serra', role: 'vecina', at: [3, 2], clues: [row(3), on('alfombra')] },
      { id: 'teo', name: 'Teo Costa', role: 'repartidor', at: [4, 5], clues: [row(4), on('silla')] },
      { id: 'berta', name: 'Berta Rivas', role: 'cajera', at: [5, 3], clues: [row(5), on('sofa')] },
    ],
    caseClues: [],
  },
  {
    id: 'aula',
    title: 'El aula',
    difficulty: 'very_easy',
    blurb: 'El timbre sonó y Hugo seguía en la tarima.',
    map: ['pppppp', 'pppppp', 'vvvvvv', 'bbbbjj', 'bbbbjj', 'bbbbjj'],
    rooms: {
      p: { id: 0, name: 'la Pizarra', color: '#f6e2a8' },
      v: { id: 1, name: 'las Ventanas', color: '#c5daf3' },
      b: { id: 2, name: 'los Bancos', color: '#cfe6c4' },
      j: { id: 3, name: 'la Jefatura', color: '#e4d2f4' },
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
    victim: { id: 'hugo', name: 'Hugo Serra', role: 'profesor', at: [0, 2] },
    people: [
      { id: 'ana', name: 'Ana Rivas', role: 'alumna', at: [1, 0], clues: [row(1), on('silla')] },
      { id: 'bruno', name: 'Bruno Gil', role: 'bedel', at: [2, 4], clues: [row(2), on('alfombra')] },
      { id: 'cloe', name: 'Cloe Mora', role: 'alumna', at: [3, 1], clues: [row(3), on('silla')] },
      { id: 'diego', name: 'Diego Paz', role: 'director', at: [4, 5], clues: [row(4), on('sofa'), area(3)] },
      { id: 'elsa', name: 'Elsa Cid', role: 'madre', at: [5, 3], clues: [row(5), area(2)] },
    ],
    caseClues: [],
  },
  {
    id: 'taller',
    title: 'El taller',
    difficulty: 'very_easy',
    blurb: 'El gato hidráulico aguantaba el coche. A Martín, no.',
    map: ['bbbzzz', 'bbbzzz', 'hhhhhh', 'hhhhhh', 'ffffcc', 'ffffcc'],
    rooms: {
      b: { id: 0, name: 'el Banco', color: '#f3d7c0' },
      z: { id: 1, name: 'la Pintura', color: '#f6d2e2' },
      h: { id: 2, name: 'el Hall', color: '#c5daf3' },
      f: { id: 3, name: 'el Foso', color: '#d5ebe4' },
      c: { id: 4, name: 'el Cuarto', color: '#e4d2f4' },
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
    victim: { id: 'martin', name: 'Martín Gil', role: 'mecánico', at: [0, 4] },
    people: [
      { id: 'rita', name: 'Rita Soler', role: 'clienta', at: [1, 5], clues: [row(1), on('silla'), area(1)] },
      { id: 'oscar', name: 'Óscar Vidal', role: 'aprendiz', at: [2, 0], clues: [row(2), on('alfombra')] },
      { id: 'nuria', name: 'Nuria Cid', role: 'proveedora', at: [3, 2], clues: [row(3), on('silla')] },
      { id: 'leo', name: 'Leo Rivas', role: 'chapista', at: [4, 1], clues: [row(4), on('silla'), area(3)] },
      { id: 'gala', name: 'Gala Mora', role: 'administrativa', at: [5, 3], clues: [row(5), col(3)] },
    ],
    caseClues: [],
  },
  {
    id: 'hostal',
    title: 'El hostal',
    difficulty: 'easy',
    blurb: 'La llave de Olga seguía en el casillero de las siete.',
    map: ['rrrrccc', 'rrrrccc', 'rrrrccc', 'ppppppp', 'ppppppp', 'kkkkeee', 'kkkkeee'],
    rooms: {
      r: { id: 0, name: 'el Recibidor', color: '#f0c7b8' },
      c: { id: 1, name: 'el Comedor', color: '#f6e2a8' },
      p: { id: 2, name: 'el Pasillo', color: '#c5daf3' },
      k: { id: 3, name: 'la Cocina', color: '#cfe6c4' },
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
    victim: { id: 'olga', name: 'Olga Ferrer', role: 'hostelera', at: [0, 1] },
    people: [
      { id: 'nora', name: 'Nora Gil', role: 'huésped', at: [1, 0], clues: [row(1), on('silla'), beside('planta')] },
      { id: 'ivan', name: 'Iván Mora', role: 'cocinero', at: [2, 5], clues: [row(2), area(1)] },
      { id: 'luz', name: 'Luz Serra', role: 'camarera', at: [3, 3], clues: [row(3), on('alfombra')] },
      { id: 'teo', name: 'Teo Costa', role: 'mozo', at: [4, 6], clues: [south('luz'), col(6), area(2)] },
      { id: 'paz', name: 'Paz Rivas', role: 'huésped', at: [5, 2], clues: [row(5), area(3), on('silla')] },
      { id: 'gael', name: 'Gael Vidal', role: 'conductor', at: [6, 4], clues: [south('paz'), on('sofa'), area(4)] },
    ],
    caseClues: [census(2, 2)],
  },
  {
    id: 'bodega',
    title: 'La bodega',
    difficulty: 'easy',
    blurb: 'Tomás bajó a catar y la cuba seguía llena.',
    map: ['BBBBBBB', 'BBBBBBB', 'CCCCCCC', 'CCCCCCC', 'NNNNOOO', 'NNNNOOO', 'NNNNOOO'],
    rooms: {
      B: { id: 0, name: 'la Barra', color: '#f3d7c0' },
      C: { id: 1, name: 'la Cava', color: '#e4d2f4' },
      N: { id: 2, name: 'la Nave', color: '#d5ebe4' },
      O: { id: 3, name: 'la Oficina', color: '#c5daf3' },
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
    victim: { id: 'tomas', name: 'Tomás Rueda', role: 'bodeguero', at: [0, 3] },
    people: [
      { id: 'rita', name: 'Rita Soler', role: 'clienta', at: [1, 6], clues: [row(1), on('silla'), area(0)] },
      { id: 'oscar', name: 'Óscar Vidal', role: 'catador', at: [2, 1], clues: [row(2), on('alfombra'), north('nuria')] },
      { id: 'nuria', name: 'Nuria Cid', role: 'sumiller', at: [3, 4], clues: [row(3), beside('mesa')] },
      {
        id: 'leo',
        name: 'Leo Rivas',
        role: 'mozo',
        at: [4, 0],
        clues: [south('nuria'), north('gala'), col(0)],
      },
      { id: 'gala', name: 'Gala Mora', role: 'contable', at: [5, 2], clues: [row(5), beside('estanteria')] },
      { id: 'eva', name: 'Eva Gil', role: 'comercial', at: [6, 5], clues: [row(6), on('sofa'), area(3)] },
    ],
    caseClues: [],
  },
  {
    id: 'invernadero',
    title: 'El invernadero',
    difficulty: 'easy',
    blurb: 'El riego saltó a su hora. Irene no llegó a cerrar la llave.',
    map: ['VVVAAAA', 'VVVAAAA', 'VVVAAAA', 'PPPPPPP', 'PPPPPPP', 'SSSSTTT', 'SSSSTTT'],
    rooms: {
      V: { id: 0, name: 'el Vivero', color: '#cfe6c4' },
      A: { id: 1, name: 'el Agua', color: '#c5daf3' },
      P: { id: 2, name: 'el Pasillo', color: '#f6e2a8' },
      S: { id: 3, name: 'el Semillero', color: '#f0c7b8' },
      T: { id: 4, name: 'el Trastero', color: '#e4d2f4' },
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
    victim: { id: 'irene', name: 'Irene Bosch', role: 'botánica', at: [0, 1] },
    people: [
      { id: 'nora', name: 'Nora Gil', role: 'becaria', at: [1, 2], clues: [row(1), area(0), on('silla')] },
      {
        id: 'ivan',
        name: 'Iván Mora',
        role: 'jardinero',
        at: [2, 5],
        clues: [row(2), area(1), beside('planta'), corner(true)],
      },
      { id: 'luz', name: 'Luz Serra', role: 'clienta', at: [3, 0], clues: [row(3), on('alfombra')] },
      { id: 'teo', name: 'Teo Costa', role: 'repartidor', at: [4, 6], clues: [south('luz'), col(6), area(2)] },
      { id: 'paz', name: 'Paz Rivas', role: 'socia', at: [5, 3], clues: [row(5), on('silla'), area(3)] },
      { id: 'gael', name: 'Gael Vidal', role: 'transportista', at: [6, 4], clues: [south('paz'), on('sofa'), area(4)] },
    ],
    caseClues: [],
  },
  {
    id: 'redaccion',
    title: 'La redacción',
    difficulty: 'easy',
    blurb: 'El cierre de Sara quedó a medias en la pantalla.',
    map: ['RRRRMMM', 'RRRRMMM', 'RRRRMMM', 'HHHHHHH', 'HHHHHHH', 'AAAAIII', 'AAAAIII'],
    rooms: {
      R: { id: 0, name: 'la Redacción', color: '#f6e2a8' },
      M: { id: 1, name: 'las Máquinas', color: '#d5ebe4' },
      H: { id: 2, name: 'el Hall', color: '#c5daf3' },
      A: { id: 3, name: 'el Archivo', color: '#f3d7c0' },
      I: { id: 4, name: 'la Imprenta', color: '#f6d2e2' },
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
    victim: { id: 'sara', name: 'Sara Nadal', role: 'redactora', at: [0, 2] },
    people: [
      { id: 'rita', name: 'Rita Soler', role: 'becaria', at: [1, 0], clues: [row(1), on('silla'), area(0)] },
      { id: 'oscar', name: 'Óscar Vidal', role: 'maquetador', at: [2, 6], clues: [row(2), area(1)] },
      { id: 'nuria', name: 'Nuria Cid', role: 'fotógrafa', at: [3, 3], clues: [row(3), on('alfombra')] },
      { id: 'leo', name: 'Leo Rivas', role: 'editor', at: [4, 1], clues: [south('nuria'), col(1)] },
      { id: 'gala', name: 'Gala Mora', role: 'correctora', at: [5, 4], clues: [row(5), on('silla'), area(4)] },
      { id: 'eva', name: 'Eva Gil', role: 'impresora', at: [6, 5], clues: [row(6), on('sofa')] },
    ],
    caseClues: [],
  },
  {
    id: 'teatro',
    title: 'El teatro',
    difficulty: 'medium',
    blurb: 'Bajó el telón y Julia no salió a saludar.',
    map: ['AAAABBBB', 'AAAABBBB', 'AAAABBBB', 'CCCCCCCC', 'CCCCCCCC', 'DDDDEEEE', 'DDDDEEEE', 'DDDDEEEE'],
    rooms: {
      A: { id: 0, name: 'la Sala', color: '#f0c7b8' },
      B: { id: 1, name: 'el Escenario', color: '#f6e2a8' },
      C: { id: 2, name: 'el Patio', color: '#c5daf3' },
      D: { id: 3, name: 'el Camerino', color: '#e4d2f4' },
      E: { id: 4, name: 'la Calle', color: '#cfe6c4' },
    },
    objects: [
      { r: 1, c: 1, kind: 'planta' },
      { r: 2, c: 5, kind: 'planta' },
      { r: 0, c: 6, kind: 'mesa' },
      { r: 3, c: 3, kind: 'alfombra' },
      { r: 5, c: 1, kind: 'estanteria' },
      { r: 7, c: 4, kind: 'sofa' },
    ],
    victim: { id: 'julia', name: 'Julia Cano', role: 'actriz', at: [0, 1] },
    people: [
      { id: 'ana', name: 'Ana Rivas', role: 'apuntadora', at: [1, 0], clues: [col(0), beside('planta')] },
      {
        id: 'bruno',
        name: 'Bruno Gil',
        role: 'tramoyista',
        at: [2, 6],
        clues: [row(2), area(1), beside('planta'), corner(true)],
      },
      {
        id: 'cloe',
        name: 'Cloe Mora',
        role: 'vestuario',
        at: [3, 3],
        clues: [south('bruno'), north('diego'), col(3)],
      },
      {
        id: 'diego',
        name: 'Diego Paz',
        role: 'director',
        at: [4, 7],
        clues: [corner(), col(7), south('cloe')],
      },
      {
        id: 'elsa',
        name: 'Elsa Cid',
        role: 'maquilladora',
        at: [5, 2],
        clues: [row(5), area(3), beside('estanteria'), corner(true)],
      },
      {
        id: 'fabio',
        name: 'Fabio Soler',
        role: 'acomodador',
        at: [6, 5],
        clues: [col(5), south('elsa'), north('greta')],
      },
      { id: 'greta', name: 'Greta Vidal', role: 'crítica', at: [7, 4], clues: [row(7), on('sofa'), area(4)] },
    ],
    caseClues: [census(2, 2)],
  },
  {
    id: 'comisaria',
    title: 'La comisaría',
    difficulty: 'medium',
    blurb: 'El parte de Pedro quedó sin firmar en el torno.',
    map: ['SSSSSSLL', 'SSSSSSLL', 'SSSSSSLL', 'PPPPPPPP', 'PPPPPPPP', 'AAAAFFFF', 'AAAAFFFF', 'AAAAFFFF'],
    rooms: {
      S: { id: 0, name: 'la Sala', color: '#f0c7b8' },
      L: { id: 1, name: 'el Laboratorio', color: '#d5ebe4' },
      P: { id: 2, name: 'el Pasillo', color: '#f6e2a8' },
      A: { id: 3, name: 'el Archivo', color: '#f3d7c0' },
      F: { id: 4, name: 'las Fichas', color: '#c5daf3' },
    },
    objects: [
      { r: 1, c: 1, kind: 'planta' },
      { r: 2, c: 6, kind: 'mesa' },
      { r: 0, c: 7, kind: 'estanteria' },
      { r: 3, c: 4, kind: 'alfombra' },
      { r: 5, c: 3, kind: 'silla' },
      { r: 7, c: 5, kind: 'sofa' },
    ],
    victim: { id: 'pedro', name: 'Pedro Lama', role: 'oficial', at: [0, 2] },
    people: [
      { id: 'ana', name: 'Ana Rivas', role: 'testigo', at: [1, 0], clues: [col(0), beside('planta'), area(0)] },
      { id: 'bruno', name: 'Bruno Gil', role: 'forense', at: [2, 7], clues: [row(2), area(1), north('cleo')] },
      { id: 'cleo', name: 'Cloe Mora', role: 'abogada', at: [3, 4], clues: [row(3), on('alfombra')] },
      { id: 'diego', name: 'Diego Paz', role: 'periodista', at: [4, 1], clues: [south('cleo'), col(1), area(2)] },
      { id: 'elsa', name: 'Elsa Cid', role: 'archivera', at: [5, 3], clues: [row(5), area(3), on('silla')] },
      {
        id: 'fabio',
        name: 'Fabio Soler',
        role: 'escolta',
        at: [6, 6],
        clues: [col(6), south('elsa'), north('greta')],
      },
      { id: 'greta', name: 'Greta Vidal', role: 'inspectora', at: [7, 5], clues: [row(7), on('sofa'), area(4)] },
    ],
    caseClues: [census(2, 2)],
  },
  {
    id: 'mercado',
    title: 'El mercado',
    difficulty: 'medium',
    blurb: 'Maite no recogió el puesto y el hielo siguió derritiéndose.',
    map: ['FFFFVVVV', 'FFFFVVVV', 'PPPPPPPP', 'PPPPPPPP', 'PPPPPPPP', 'CCCCBBBB', 'CCCCBBBB', 'CCCCBBBB'],
    rooms: {
      F: { id: 0, name: 'la Fruta', color: '#cfe6c4' },
      V: { id: 1, name: 'la Verdura', color: '#d5ebe4' },
      P: { id: 2, name: 'el Pasillo', color: '#f6e2a8' },
      C: { id: 3, name: 'la Carne', color: '#f0c7b8' },
      B: { id: 4, name: 'el Pescado', color: '#c5daf3' },
    },
    objects: [
      { r: 1, c: 2, kind: 'planta' },
      { r: 2, c: 6, kind: 'sofa' },
      { r: 5, c: 2, kind: 'silla' },
      { r: 6, c: 6, kind: 'mesa' },
      { r: 7, c: 4, kind: 'sofa' },
      { r: 0, c: 5, kind: 'estanteria' },
    ],
    victim: { id: 'maite', name: 'Maite Ríos', role: 'placera', at: [0, 1] },
    people: [
      { id: 'ana', name: 'Ana Rivas', role: 'clienta', at: [1, 3], clues: [col(3), beside('planta')] },
      { id: 'bruno', name: 'Bruno Gil', role: 'mozo', at: [2, 6], clues: [row(2), on('sofa')] },
      { id: 'cleo', name: 'Cloe Mora', role: 'frutera', at: [3, 0], clues: [row(3), col(0)] },
      {
        id: 'diego',
        name: 'Diego Paz',
        role: 'repartidor',
        at: [4, 5],
        clues: [south('cleo'), north('elsa'), col(5)],
      },
      { id: 'elsa', name: 'Elsa Cid', role: 'carnicera', at: [5, 2], clues: [row(5), area(3), on('silla')] },
      { id: 'fabio', name: 'Fabio Soler', role: 'pescadero', at: [6, 7], clues: [row(6), col(7), area(4)] },
      { id: 'greta', name: 'Greta Vidal', role: 'inspectora', at: [7, 4], clues: [south('fabio'), on('sofa')] },
    ],
    caseClues: [census(2, 3)],
  },
  {
    id: 'faro',
    title: 'El faro',
    difficulty: 'medium',
    blurb: 'La luz giró sola toda la noche. León no bajó.',
    map: ['TTTTOOOO', 'TTTTOOOO', 'MMMMMMMM', 'MMMMMMMM', 'CCCCEEEE', 'CCCCEEEE', 'CCCCEEEE', 'WWWWWWWW'],
    rooms: {
      T: { id: 0, name: 'la Torre', color: '#f6e2a8' },
      O: { id: 1, name: 'el Observatorio', color: '#c5daf3' },
      M: { id: 2, name: 'el Muelle', color: '#d5ebe4' },
      C: { id: 3, name: 'la Casa', color: '#f0c7b8' },
      E: { id: 4, name: 'el Embarcadero', color: '#cfe6c4' },
      W: { id: 5, name: 'el Rompeolas', color: '#e4d2f4' },
    },
    objects: [
      { r: 1, c: 1, kind: 'planta' },
      { r: 2, c: 5, kind: 'alfombra' },
      { r: 4, c: 3, kind: 'silla' },
      { r: 5, c: 7, kind: 'estanteria' },
      { r: 7, c: 4, kind: 'sofa' },
      { r: 0, c: 6, kind: 'mesa' },
    ],
    victim: { id: 'leon', name: 'León Duarte', role: 'farero', at: [0, 1] },
    people: [
      { id: 'ana', name: 'Ana Rivas', role: 'sobrina', at: [1, 0], clues: [col(0), beside('planta'), area(0)] },
      { id: 'bruno', name: 'Bruno Gil', role: 'patrón', at: [2, 5], clues: [row(2), on('alfombra'), north('cleo')] },
      { id: 'cleo', name: 'Cloe Mora', role: 'marinera', at: [3, 7], clues: [south('bruno'), col(7), area(2)] },
      { id: 'diego', name: 'Diego Paz', role: 'mecánico', at: [4, 3], clues: [row(4), area(3), on('silla')] },
      { id: 'elsa', name: 'Elsa Cid', role: 'bióloga', at: [5, 6], clues: [row(5), beside('estanteria')] },
      { id: 'fabio', name: 'Fabio Soler', role: 'práctico', at: [6, 2], clues: [row(6), col(2), area(3), south('diego')] },
      { id: 'greta', name: 'Greta Vidal', role: 'periodista', at: [7, 4], clues: [row(7), on('sofa')] },
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

for (const spec of cases) {
  const raw = toRaw(spec);
  const puzzle = parseCase(raw, spec.id);
  assertUnique(puzzle);
  writeFileSync(join(dir, `${spec.id}.json`), `${JSON.stringify(raw, null, 2)}\n`);
  console.log(`ok ${spec.id}`);
}

void dirname;
void (0 as unknown as Cell);
