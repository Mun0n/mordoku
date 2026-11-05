export type CaseMark = 'new' | 'in_progress' | 'solved' | 'revealed';

export function frontierIndex(ids: readonly string[], isSolved: (id: string) => boolean): number {
  const index = ids.findIndex((id) => !isSolved(id));
  return index === -1 ? ids.length : index;
}

export function caseIsOpen(ids: readonly string[], id: string, isSolved: (id: string) => boolean): boolean {
  const index = ids.indexOf(id);
  return index >= 0 && index <= frontierIndex(ids, isSolved);
}

export function nextCaseId(ids: readonly string[], isSolved: (id: string) => boolean): string | null {
  const index = frontierIndex(ids, isSolved);
  return index < ids.length ? ids[index] : null;
}

export function keepMark(current: CaseMark, next: CaseMark): CaseMark {
  if (current === 'solved' || current === 'revealed') return current;
  return next;
}
