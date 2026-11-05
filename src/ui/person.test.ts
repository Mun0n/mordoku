import { cases } from '@/content/cases';
import { personSex } from '@/ui/person';

const EXPECTED: Record<string, 'woman' | 'man'> = {
  'Peter Carey': 'man',
  'John Neligan': 'man',
  'Patrick Cairns': 'man',
  'Ada Carey': 'woman',
  'Maud Carey': 'woman',
  'Hugh Slater': 'man',
  'Eustace Brackenstall': 'man',
  'Theresa Wright': 'woman',
  'Jack Croker': 'man',
  'Mary Brackenstall': 'woman',
  'Ellen Shaw': 'woman',
  'Ralph Keene': 'man',
  'Hilton Cubitt': 'man',
  'Elsie Cubitt': 'woman',
  'Abe Slaney': 'man',
  'Martha Hull': 'woman',
  'Fred Carr': 'man',
  'Jane Porter': 'woman',
  'Willoughby Smith': 'man',
  Marker: 'woman',
  Anna: 'woman',
  'Susan Tarlton': 'woman',
  Coram: 'man',
  'Thomas Reed': 'man',
  'Charles McCarthy': 'man',
  'Alice Turner': 'woman',
  'James McCarthy': 'man',
  Turner: 'man',
  'William Crowder': 'man',
  Cobb: 'man',
  Moran: 'man',
  'William Kirwan': 'man',
  'Señor Acton': 'man',
  'Alec Cunningham': 'man',
  Cunningham: 'man',
  Hayter: 'man',
  'Edith Moore': 'woman',
  Brooks: 'man',
  'Brenda Tregennis': 'woman',
  'Hannah Polwhele': 'woman',
  'Mortimer Tregennis': 'man',
  'Leon Sterndale': 'man',
  'Vicario Roundhay': 'man',
  Bonython: 'woman',
  Rosewarne: 'man',
  'Clara Amberley': 'woman',
  'Ray Ernest': 'man',
  'Josiah Amberley': 'man',
  'Señor Barker': 'man',
  'Edith Lamb': 'woman',
  'Nell Ware': 'woman',
  'Paul Green': 'man',
  'Aloysius Garcia': 'man',
  'Tom Hudson': 'man',
  'John Scott Eccles': 'man',
  Burnet: 'woman',
  Henderson: 'man',
  'Lucy Penn': 'woman',
  Cole: 'man',
  'Ned Walsh': 'man',
  Blessington: 'man',
  'Tom Bell': 'man',
  'Percy Trevelyan': 'man',
  Biddle: 'man',
  Hayward: 'man',
  Moffat: 'man',
  'Annie Croft': 'woman',
  'Will Dunn': 'man',
  'Bartholomew Sholto': 'man',
  Sholto: 'man',
  'Jonathan Small': 'man',
  Tonga: 'man',
  McMurdo: 'man',
  'Lal Rao': 'man',
  Bernstone: 'woman',
  'Peter Hogg': 'man',
  'Cadogan West': 'man',
  'Sidney Johnson': 'man',
  Valentine: 'man',
  Westbury: 'woman',
  'James Walter': 'man',
  Oberstein: 'man',
  'Harold Porter': 'man',
  'Ellen Wade': 'woman',
};

test('el retrato sigue el papel, no el apellido', () => {
  const seen = new Map<string, 'woman' | 'man'>();
  for (const puzzle of cases) {
    const people = [puzzle.victim, ...puzzle.suspects];
    for (const person of people) {
      const sex = personSex(person.role);
      const previous = seen.get(person.name);
      if (previous && previous !== sex) {
        throw new Error(`${person.name} sale ${previous} y ${sex}`);
      }
      seen.set(person.name, sex);
    }
  }
  expect(Object.fromEntries(seen)).toEqual(EXPECTED);
  expect(seen.size).toBe(Object.keys(EXPECTED).length);
});
