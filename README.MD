# API Microservice Task (PokeAPI Tests)

This project demonstrates API testing using **Jest + TypeScript** with the [PokeAPI](https://pokeapi.co).  

It includes both **happy path** and **unhappy path** scenarios, schema validation with **Zod**, and a CI/CD pipeline via **GitHub Actions**.

---

## Getting Started

### 1. Install dependencies
```bash
npm install

### 2. Run all tests
npm test

### 3.Run only happy path tests
npx jest tests/happy.spec.ts
# or
npm run test -- tests/happy.spec.ts

### 4. Run only unhappy path tests
npx jest tests/unhappy.spec.ts
# or
npm run test -- tests/unhappy.spec.ts

npm run typecheck

### Reporting
JUnit XML → junit.xml (machine-readable, used by CI).

HTML Report → reports/html/index.html (human-friendly).

Coverage Report → coverage/lcov-report/index.html.

In GitHub Actions:

JUnit summaries are published to PRs.

HTML + JUnit reports are uploaded as build artifacts.

### CI/CD (GitHub Actions)
The pipeline runs on push and PR to main/master:

Node.js 18/20/22 matrix

Install deps

Type-check (tsc --noEmit)

Run Jest tests (happy + unhappy)

Publish JUnit summary (PR annotation)

Upload HTML & JUnit artifacts

Upload coverage artifacts (optional job)

### Project Structure
tests/
  ├── http.ts           # HTTP helper with retry/backoff
  ├── schemas.ts        # Zod schemas for PokeAPI responses
  ├── happy.spec.ts     # Happy path scenarios
  └── unhappy.spec.ts   # Unhappy path scenarios

.github/workflows/ci.yml  # CI/CD pipeline definition
jest.config.cjs           # Jest config with reporters
tsconfig.json             # TypeScript config
ANSWERS.md                # Task Q&A
README.md                 # Project guide
