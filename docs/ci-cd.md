# CI/CD Workflows

## Overview

GooDDeeD uses **GitHub Actions** for continuous integration. Two workflows run automatically on pushes and pull requests to ensure code quality.

## Workflows

### 1. CI (`ci.yml`)

**Triggers:** Push to `main`/`master`, all pull requests

| Job              | What it does                                    |
|------------------|-------------------------------------------------|
| `backend-test`   | Checks out code → Sets up Java 17 → Runs `./mvnw test` |
| `frontend-check` | Checks out code → Sets up Node 20 → `npm ci` → Lint → Build |

**Key details:**
- Backend tests use **H2 in-memory database** (no PostgreSQL service needed)
- Flyway is disabled in CI (`SPRING_FLYWAY_ENABLED: false`) since H2 uses `ddl-auto: create-drop`
- Frontend build validates that the production bundle compiles without errors

### 2. Test & Coverage (`test.yml`)

**Triggers:** Push to `main`/`develop`, PRs to `main`/`develop`

| Job             | What it does                                                 |
|-----------------|--------------------------------------------------------------|
| `backend-test`  | Runs tests → Generates JaCoCo report → Uploads to **Codecov** |
| `frontend-test` | Runs `npm run test:coverage` → Uploads to **Codecov**        |
| `lint`          | Runs `npm run lint` for code quality checks                  |

**Key details:**
- JaCoCo coverage report generated at `backend/target/site/jacoco/jacoco.xml`
- Frontend coverage via `@vitest/coverage-v8` at `frontend/coverage/coverage-final.json`
- Backend coverage upload **fails CI** if Codecov is unreachable; frontend does not

## Auto-Deployment

| Platform | Trigger                                      |
|----------|----------------------------------------------|
| Railway  | Auto-deploys on push to `main` (via GitHub integration) |
| Vercel   | Auto-deploys on push to `main` (via GitHub integration) |

Both platforms detect new commits and rebuild automatically — no manual deployment workflow is needed.

## Environment Variables in CI

### Backend Tests

| Variable                | Value                                           |
|-------------------------|-------------------------------------------------|
| `JWT_SECRET`            | `CI_LOCAL_DEVELOPMENT_SECRET_KEY_AT_LEAST_32_CHARS` |
| `SPRING_FLYWAY_ENABLED` | `false`                                         |

### Frontend Tests

No special environment variables needed — tests run against mocked APIs.

## Running Workflows Locally

You can simulate the CI checks locally before pushing:

```bash
# Backend
cd backend && ./mvnw clean test

# Frontend
cd frontend && npm ci && npm run lint && npm run build && npm run test:coverage
```
