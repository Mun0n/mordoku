import { freshGame, placePerson, toggleNote, undo } from '@/game/state';
import type { Puzzle } from '@/engine/types';

const puzzle = {
  suspects: [{ id: 'ana' }, { id: 'bruno' }],
} as Puzzle;

describe('partida', () => {
  test('colocar y deshacer devuelve las notas', () => {
    let state = freshGame(puzzle);
    state = toggleNote(state, 'bruno', { r: 1, c: 1 });
    state = toggleNote(state, 'ana', { r: 2, c: 2 });
    state = placePerson(state, 'ana', { r: 1, c: 1 });
    expect(state.placements.ana).toEqual({ r: 1, c: 1 });
    expect(state.notes['1,1']).toBeUndefined();
    expect(state.notes['2,2']).toBeUndefined();
    state = undo(state);
    expect(state.placements.ana).toBeNull();
    expect(state.notes['1,1']).toEqual(['bruno']);
    expect(state.notes['2,2']).toEqual(['ana']);
  });

  test('una nota se quita con la misma pulsación', () => {
    let state = freshGame(puzzle);
    state = toggleNote(state, 'ana', { r: 0, c: 1 });
    state = toggleNote(state, 'ana', { r: 0, c: 1 });
    expect(state.notes['0,1']).toBeUndefined();
    state = undo(state);
    expect(state.notes['0,1']).toEqual(['ana']);
  });
});
