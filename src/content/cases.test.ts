import { cases } from '@/content/cases';
import { assertUnique } from '@/engine/solve';

jest.setTimeout(20000);

test('los doce casos cierran en una sola solución', () => {
  expect(cases).toHaveLength(12);
  for (const puzzle of cases) assertUnique(puzzle);
});
