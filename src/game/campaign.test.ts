import { caseIsOpen, frontierIndex, keepMark, nextCaseId } from '@/game/campaign';

const ids = ['a', 'b', 'c'];

test('una partida nueva solo abre el primero', () => {
  const solved = () => false;
  expect(frontierIndex(ids, solved)).toBe(0);
  expect(caseIsOpen(ids, 'a', solved)).toBe(true);
  expect(caseIsOpen(ids, 'b', solved)).toBe(false);
});

test('superar un nivel abre solo el siguiente', () => {
  const solved = (id: string) => id === 'a';
  expect(frontierIndex(ids, solved)).toBe(1);
  expect(caseIsOpen(ids, 'a', solved)).toBe(true);
  expect(caseIsOpen(ids, 'b', solved)).toBe(true);
  expect(caseIsOpen(ids, 'c', solved)).toBe(false);
});

test('con todos superados se puede repetir cualquiera', () => {
  const solved = () => true;
  expect(frontierIndex(ids, solved)).toBe(3);
  expect(caseIsOpen(ids, 'c', solved)).toBe(true);
  expect(nextCaseId(ids, solved)).toBeNull();
});

test('el siguiente caso es el primero sin superar', () => {
  expect(nextCaseId(ids, () => false)).toBe('a');
  expect(nextCaseId(ids, (id) => id === 'a')).toBe('b');
});

test('resuelto y revelado no se degradan', () => {
  expect(keepMark('solved', 'new')).toBe('solved');
  expect(keepMark('revealed', 'new')).toBe('revealed');
  expect(keepMark('revealed', 'solved')).toBe('revealed');
  expect(keepMark('in_progress', 'solved')).toBe('solved');
  expect(keepMark('new', 'in_progress')).toBe('in_progress');
});
