import { request } from './http';
import { PaginatedList, PokemonSchema, TypeSchema } from './schemas';

describe('PokeAPI — Happy paths', () => {
  test('GET /pokemon/ditto returns a valid Pokémon object', async () => {
    const res = await request('/pokemon/ditto', { retries: 1 });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type') || '').toContain('application/json');

    const parsed = PokemonSchema.parse(await res.json());
    expect(parsed.name).toBe('ditto');
    expect(parsed.id).toBeGreaterThan(0);
    expect(parsed.abilities.length).toBeGreaterThan(0);
  });

  test('GET /pokemon?limit=20&offset=0 paginates correctly', async () => {
    const res = await request('/pokemon', { params: { limit: 20, offset: 0 } });
    expect(res.status).toBe(200);
    const parsed = PaginatedList.parse(await res.json());
    expect(parsed.results.length).toBe(20);
    expect(parsed.next).toBeTruthy();
    expect(parsed.previous).toBeNull();
  });

  test('GET /type/fire has valid damage_relations', async () => {
    const res = await request('/type/fire');
    expect(res.status).toBe(200);
    const parsed = TypeSchema.parse(await res.json());
    expect(parsed.name).toBe('fire');
    const total =
      parsed.damage_relations.double_damage_from.length +
      parsed.damage_relations.double_damage_to.length +
      parsed.damage_relations.half_damage_from.length +
      parsed.damage_relations.half_damage_to.length +
      parsed.damage_relations.no_damage_from.length +
      parsed.damage_relations.no_damage_to.length;
    expect(total).toBeGreaterThan(0);
  });

  describe('Smoke: known Pokémon IDs', () => {
    const cases = [
      { path: '/pokemon/1', name: 'bulbasaur' },
      { path: '/pokemon/25', name: 'pikachu' },
      { path: '/pokemon/150', name: 'mewtwo' }
    ];
    test.each(cases)('%s returns %s', async ({ path, name }) => {
      const res = await request(path);
      expect(res.status).toBe(200);
      const data = await res.json();
      const parsed = PokemonSchema.pick({ id: true, name: true }).parse(data);
      expect(parsed.name).toBe(name);
      expect(parsed.id).toBeGreaterThan(0);
    });
  });

  test('Common response headers exist (cache, date)', async () => {
    const res = await request('/pokemon/1');
    expect(res.status).toBe(200);
    expect(res.headers.has('cache-control')).toBe(true);
    expect(res.headers.has('date')).toBe(true);
  });
});
