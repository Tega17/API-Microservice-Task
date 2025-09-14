
Technical Test — Q&A
1) Time spent & what I’d add with more time

Time spent: ~2 hours

If I had more time, I would:

Add mocked tests using MSW (Mock Service Worker) to make test runs fully deterministic and avoid PokeAPI rate limits.

Add contract testing (e.g., Pact) to verify schema contracts between consumer and provider.

Add performance/load testing with k6 or Artillery against a staging or mock environment.

Add richer reporting (e.g., Allure) with request/response attachments.

Expand the schema coverage to more PokeAPI endpoints.

Integrate coverage checks (fail build if below threshold).

2) Describe yourself in JSON
{
  "name": "Tega Enajekpo",
  "role": "QA / Software Engineer in Test",
  "location": "London, United Kingdowm",
  "strengths": [
    "API testing",
    "TypeScript",
    "CI/CD pipelines",
    "automation"
  ],
  "testingStack": {
    "unit": ["Jest", "ts-jest"],
    "api": ["Jest", "Zod", "MSW"],
    "e2e": ["Playwright"],
    "reporting": ["jest-junit", "jest-html-reporters"]
  },
  "principles": [
    "deterministic tests",
    "fast feedback",
    "clear failure output",
    "traceability"
  ],
  "funFact": "I am in a Choir that sings anime, video games and films"
}

3) Approach to performance testing

Important: Never load-test public services like PokeAPI. Performance tests should target a staging or dedicated test environment.

Tooling options:

k6
 (Go-based, threshold-driven, CI-friendly)

Artillery
 (Node.js, simple YAML configs)

Methodology:

Define SLIs/SLOs: e.g., p95 latency < 300ms, error rate < 1%, throughput target.

Traffic model: realistic mix of endpoints (/pokemon, /pokemon/{id}, /type/{name}).

Data strategy: parameterize inputs to avoid hitting only cached IDs.

Workloads:

Smoke (1–5 VUs, 1–2 mins)

Baseline (steady load)

Load (expected peak traffic)

Stress (beyond peak to find breaking points)

Soak (long-running to detect leaks or degradations)

Observability: export metrics to Grafana/InfluxDB, enable logging and tracing correlation.

Automation:

Run smoke/baseline in CI nightly.

Run heavier load/stress tests on demand or schedule.

Example (k6 baseline test skeleton):

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '5m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300']
  }
};

const BASE = __ENV.BASE_URL || 'https://staging.your-api.com/api/v2';

export default function () {
  let res = http.get(`${BASE}/pokemon?limit=20&offset=0`);
  check(res, { 'list ok': r => r.status === 200 });

  const ids = [1, 25, 150];
  res = http.get(`${BASE}/pokemon/${ids[Math.floor(Math.random() * ids.length)]}`);
  check(res, { 'pokemon ok': r => r.status === 200 });

  sleep(1);
}


