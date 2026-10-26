import { blankAssignment } from '@/engine/check';
import { cellKey, type Assignment, type Cell, type Puzzle } from '@/engine/types';

export type Notes = Record<string, string[]>;

type Action =
  | { type: 'place'; id: string; from: Cell | null; to: Cell; notes: Notes }
  | { type: 'lift'; id: string; from: Cell; notes: Notes }
  | { type: 'note'; key: string; before: string[] };

export type GameState = {
  placements: Assignment;
  notes: Notes;
  undo: Action[];
};

export function freshGame(puzzle: Puzzle): GameState {
  return { placements: blankAssignment(puzzle), notes: {}, undo: [] };
}

export function placePerson(state: GameState, id: string, cell: Cell): GameState {
  const notes = stripSuspect(state.notes, id);
  delete notes[cellKey(cell)];
  return {
    placements: { ...state.placements, [id]: { r: cell.r, c: cell.c } },
    notes,
    undo: [
      ...state.undo,
      { type: 'place', id, from: state.placements[id] ?? null, to: cell, notes: cloneNotes(state.notes) },
    ],
  };
}

export function liftPerson(state: GameState, id: string): GameState {
  const from = state.placements[id];
  if (!from) return state;
  return {
    placements: { ...state.placements, [id]: null },
    notes: state.notes,
    undo: [...state.undo, { type: 'lift', id, from, notes: cloneNotes(state.notes) }],
  };
}

export function toggleNote(state: GameState, id: string, cell: Cell): GameState {
  const key = cellKey(cell);
  const before = state.notes[key] ?? [];
  const nextIds = before.includes(id) ? before.filter((item) => item !== id) : [...before, id];
  const notes = cloneNotes(state.notes);
  if (nextIds.length > 0) notes[key] = nextIds;
  else delete notes[key];
  return {
    placements: state.placements,
    notes,
    undo: [...state.undo, { type: 'note', key, before: [...before] }],
  };
}

export function undo(state: GameState): GameState {
  const action = state.undo.at(-1);
  if (!action) return state;
  const stack = state.undo.slice(0, -1);
  if (action.type === 'place') {
    return {
      placements: { ...state.placements, [action.id]: action.from },
      notes: cloneNotes(action.notes),
      undo: stack,
    };
  }
  if (action.type === 'lift') {
    return {
      placements: { ...state.placements, [action.id]: action.from },
      notes: cloneNotes(action.notes),
      undo: stack,
    };
  }
  const notes = cloneNotes(state.notes);
  if (action.before.length > 0) notes[action.key] = [...action.before];
  else delete notes[action.key];
  return { placements: state.placements, notes, undo: stack };
}

export function showSolution(puzzle: Puzzle): GameState {
  const placements = blankAssignment(puzzle);
  for (const suspect of puzzle.suspects) {
    placements[suspect.id] = { ...puzzle.solution[suspect.id] };
  }
  return { placements, notes: {}, undo: [] };
}

function stripSuspect(notes: Notes, id: string): Notes {
  const next = cloneNotes(notes);
  for (const key of Object.keys(next)) {
    next[key] = next[key].filter((suspectId) => suspectId !== id);
    if (next[key].length === 0) delete next[key];
  }
  return next;
}

function cloneNotes(notes: Notes): Notes {
  const next: Notes = {};
  for (const [key, ids] of Object.entries(notes)) next[key] = [...ids];
  return next;
}
