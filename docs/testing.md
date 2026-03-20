# Testing

## Overview

GooDDeeD uses a multi-layered testing strategy covering unit tests, integration tests, and performance/stress testing.

## Backend Tests (JUnit 5 + Spring Boot Test)

### Test Suite

| Test File                     | Tests | Coverage Area                        |
|-------------------------------|-------|--------------------------------------|
| `AuthControllerTest.java`     | 7     | Registration, login, user endpoints  |
| `CauseControllerTest.java`    | 10    | Cause CRUD operations and search     |
| `RateLimitingFilterTest.java` | 4     | Rate limiting on auth endpoints      |
| `SecurityAuditLoggerTest.java`| 8     | Audit logging for security events    |
| `GooddeedsApplicationTests`  | 1     | Spring context loads                 |

**Total: ~30 backend tests**

### Running Backend Tests

```bash
cd backend

# Run all tests
./mvnw clean test

# Run with JaCoCo coverage report
./mvnw clean test jacoco:report
open target/site/jacoco/index.html

# Run a specific test class
./mvnw test -Dtest=AuthControllerTest
```

> Requires **Java 17**. Tests use an in-memory **H2 database** with `ddl-auto: create-drop`, so no external database is needed.

---

## Frontend Tests (Vitest + React Testing Library)

### Test Suite

| Test File                 | Tests | Coverage Area                  |
|---------------------------|-------|--------------------------------|
| `App.test.jsx`            | 2     | App renders, navigation        |
| `AuthContext.test.jsx`    | 3     | Auth state, login, logout      |
| `ProtectedRoute.test.jsx` | 2    | Route protection               |
| `api.test.jsx`            | 4     | Axios config, auth headers     |

**Total: ~11 frontend tests**

### Running Frontend Tests

```bash
cd frontend

npm run test              # Run all tests once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

---

## K6 Stress Testing

The project includes a comprehensive **k6** stress test script at [`backend/stress-test/k6-stress-test.js`](../backend/stress-test/k6-stress-test.js) that simulates real user journeys.

### Test Profiles

| Profile    | Description                                                    |
|------------|----------------------------------------------------------------|
| `smoke`    | 1 VU, 45s — basic sanity check                                |
| `standard` | 1 VU smoke (30s) + ramp to 12 VUs load (4min)                 |
| `full`     | Smoke → Load (20 VUs) → Stress (100 VUs) → Spike (180 VUs)    |

### User Journey Simulated

Each virtual user performs a realistic flow:

1. **Public Browse** — Health check, list causes, search, view cause details
2. **Authentication** — Register → Login → Get profile
3. **Dashboard** — View task statistics, my causes, memberships
4. **Cause Management** — Create cause → Update → Create goal → Create task
5. **Task Management** — CRUD operations, status updates, filtered queries
6. **Membership Flow** — Join open cause → View members → Leave
7. **Profile Update** — Look up by email → Update name
8. **Cleanup** — Delete created test data

### Running K6 Tests

```bash
# Install k6
brew install k6

# Smoke test (quick sanity check)
k6 run --env K6_PROFILE=smoke --env BASE_URL=http://localhost:8080 backend/stress-test/k6-stress-test.js

# Standard test (smoke + load)
k6 run --env K6_PROFILE=standard --env BASE_URL=http://localhost:8080 backend/stress-test/k6-stress-test.js

# Full stress test (smoke + load + stress + spike)
k6 run --env K6_PROFILE=full --env BASE_URL=http://localhost:8080 backend/stress-test/k6-stress-test.js
```

### Performance Thresholds

| Metric               | Threshold        |
|----------------------|------------------|
| HTTP p95 latency     | < 1200ms         |
| HTTP p99 latency     | < 2500ms         |
| HTTP failure rate    | < 2%             |
| Contract checks      | > 98% pass rate  |
| Server 5xx errors    | < 1              |
| Auth operations p95  | < 1200ms         |
| Cause operations p95 | < 1500ms         |
| Task operations p95  | < 1500ms         |

### Custom Metrics

The test tracks custom metrics beyond k6 defaults:

- `contract_checks` — API contract validation rate
- `server_5xx` / `unexpected_4xx` — Error counters
- `auth_duration` — Authentication flow latency
- `browse_duration` — Public browsing latency
- `cause_ops_duration` — Cause CRUD latency
- `task_ops_duration` — Task CRUD latency

Results are output to `stress-test-results.json` after each run.

---

## Coverage Targets

| Layer               | Current (est.) | Target |
|---------------------|----------------|--------|
| Backend Controllers | ~70%           | 85%+   |
| Backend Services    | ~65%           | 80%+   |
| Backend Config      | ~40%           | 60%+   |
| Frontend Components | ~30%           | 85%+   |
| Frontend Hooks      | ~40%           | 80%+   |
