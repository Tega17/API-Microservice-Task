import { request } from './http';
import { PaginatedList } from './schemas';

describe('PokeAPI — Unhappy paths & edge cases', () => {
  test('GET /pokemon/nonexistentmon returns 404', async () => {
    const res = await request('/pokemon/nonexistentmon');
    expect(res.status).toBe(404);
    const ct = res.headers.get('content-type') || '';
    expect(ct === '' || ct.includes('application/json') || ct.includes('text')).toBeTruthy();
  });

  test('GET /pokemon/100000 returns 404 (id out of range)', async () => {
    const res = await request('/pokemon/100000');
    expect(res.status).toBe(404);
  });

  test('Invalid query values are handled (negative offset)', async () => {
    const res = await request('/pokemon', { params: { limit: 5, offset: -10 } });
    // Coerced to 0 (200) or rejected (400)
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      const parsed = PaginatedList.parse(await res.json());
      expect(parsed.results.length).toBeLessThanOrEqual(5);
    }
  });

  test('Zero limit is coerced to default page size (not empty)', async () => {
    const res = await request('/pokemon', { params: { limit: 0, offset: 0 } });
    expect(res.status).toBe(200);
    const parsed = PaginatedList.parse(await res.json());
    // PokeAPI treats 0 as “use default” (commonly 20)
    expect(parsed.results.length).toBeGreaterThanOrEqual(1);
    expect(parsed.results.length).toBeLessThanOrEqual(20);
    expect(parsed.previous).toBeNull();
  });

  test('Unsupported method (POST) returns 404/405', async () => {
    const res = await request('/pokemon', { method: 'POST', body: { foo: 'bar' } });
    expect([404, 405]).toContain(res.status);
  });

  test('Weird characters in path are safely rejected', async () => {
    const res = await request('/pokemon/%3Cscript%3E');
    // Depending on edge/router, may be 400 or 404
    expect([400, 404]).toContain(res.status);
  });

  test('If rate-limited/transient error occurs, it is surfaced', async () => {
    const res = await request('/pokemon/ditto');
    expect([200, 429, 503, 504]).toContain(res.status);
  });
});

