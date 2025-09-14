// tests/http.ts
/**
 * Tiny HTTP helper for Jest API tests.
 * - Safe URL join (preserves /api/v2)
 * - Optional BASE_URL env (with guard for PokeAPI)
 * - Timeout with AbortController
 * - Retries on 429/5xx with backoff & Retry-After
 * - Debug crumbs available via (global as any).__lastApiState
 */

const DEFAULT_BASE = 'https://pokeapi.co/api/v2';

export type Opts = {
  method?: string;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number; // number of retry attempts after first try
  baseUrl?: string; // override base (or set via BASE_URL env)
};

function normalizeBase(rawBase: string | undefined): string {
  let base = (rawBase || DEFAULT_BASE).trim();

  // Auto-correct common mistake: using https://pokeapi.co without /api/v2
  const pokeHost = /^https:\/\/pokeapi\.co\/?$/i.test(base);
  if (pokeHost) base = 'https://pokeapi.co/api/v2';

  // Ensure trailing slash
  if (!base.endsWith('/')) base += '/';
  return base;
}

function buildUrl(path: string, baseUrl: string, params?: Opts['params']): URL {
  const base = normalizeBase(baseUrl);

  let url: URL;
  if (/^https?:\/\//i.test(path)) {
    // absolute URL provided; trust it
    url = new URL(path);
  } else {
    const cleaned = path.replace(/^\/+/, ''); // remove leading slashes
    url = new URL(cleaned, base);
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }
  return url;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(ms: number) {
  return ms + Math.floor(Math.random() * 100);
}

function parseRetryAfter(h: string | null): number | null {
  if (!h) return null;
  const sec = Number(h);
  if (Number.isFinite(sec)) return Math.max(0, Math.floor(sec * 1000));
  const dateMs = Date.parse(h);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

export async function request(path: string, opts: Opts = {}) {
  const {
    method = 'GET',
    params,
    body,
    headers,
    timeoutMs = 20_000,
    retries = 1,
    baseUrl = process.env.BASE_URL || DEFAULT_BASE
  } = opts;

  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const url = buildUrl(path, baseUrl, params);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const initHeaders: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'jest-api-tests (+https://example.test)',
        ...(headers ?? {})
      };

      const hasBody = body !== undefined && body !== null && method.toUpperCase() !== 'GET';
      if (hasBody && !initHeaders['Content-Type']) {
        initHeaders['Content-Type'] = 'application/json';
      }

      const res = await fetch(url, {
        method,
        headers: initHeaders,
        body: hasBody ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      // Debug crumbs
      (global as any).__lastApiState = {
        url: url.toString(),
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        attempt
      };

      // Retry on 429 / 5xx
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
        const backoff = retryAfter ?? jitter(200 * Math.pow(2, attempt)); // 200, 400, 800...
        clearTimeout(timeout);
        attempt += 1;
        await sleep(backoff);
        continue;
      }

      clearTimeout(timeout);
      return res;
    } catch (err: any) {
      clearTimeout(timeout);

      // Retry on timeouts / transient network errors
      const isAbort = err?.name === 'AbortError';
      if ((isAbort || ['ECONNRESET', 'ENOTFOUND'].includes(err?.code)) && attempt < retries) {
        const backoff = jitter(200 * Math.pow(2, attempt));
        attempt += 1;
        await sleep(backoff);
        continue;
      }

      (global as any).__lastApiState = {
        url: buildUrl(path, baseUrl, params).toString(),
        error: String(err),
        attempt
      };

      throw err;
    }
  }
}
