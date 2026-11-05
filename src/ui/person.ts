export type Sex = 'woman' | 'man';

const WOMAN =
  /\b(?:la|una)\b|\b(?:doncella|cocinera|ama de llaves|institutriz|prometida|esposa|señora|hija|hermana|mujer)\b/u;

export function personSex(role: string): Sex {
  return WOMAN.test(role.toLocaleLowerCase('es-ES')) ? 'woman' : 'man';
}
