# GooDDeeD Test Coverage Summary

## Backend (Spring Boot 3.3.3)

### Test Files
| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| `RateLimitingFilterTest.java` | 4 | Rate limiting on auth endpoints |
| `AuthControllerTest.java` | 7 | Registration, login, user endpoints |
| `CauseControllerTest.java` | 10 | Cause CRUD operations and search |
| `SecurityAuditLoggerTest.java` | 8 | Audit logging for security events |
| `GooddeedsApplicationTests.java` | 1 | Spring context loads |

**Total: ~30 backend tests**

### Configuration ✓
- Spring Boot 3.3.3 LTS
- JaCoCo coverage plugin (v0.8.10) — auto-generates report on `mvn test`
- Lombok 1.18.32 with annotation processor
- H2 in-memory database for tests
- `spring-boot-starter-test` + `spring-security-test`

### Running Tests
```bash
cd backend

# Requires Java 17 — if you have a different version:
# sdkman install java 17.0.10-temurin && sdk use java 17.0.10-temurin

./mvnw clean test                    # Run all tests
./mvnw test -Dtest=AuthControllerTest  # Run specific class
open target/site/jacoco/index.html   # View coverage report
```

> **Note:** If you see `ExceptionInInitializerError: TypeTag :: UNKNOWN`, you're running Java 24+ — Lombok requires Java 17.

---

## Frontend (React + Vite + Vitest)

### Test Files
| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| `App.test.jsx` | 2 | App renders, navigation structure |
| `AuthContext.test.jsx` | 3 | Auth state, login, logout |
| `ProtectedRoute.test.jsx` | 2 | Route protection rendering |
| `api.test.jsx` | 4 | Axios instance config, auth headers |

**Total: ~11 frontend tests**

### Configuration ✓
- Vitest + jsdom environment
- `@testing-library/react` + `@testing-library/jest-dom`
- `@vitest/coverage-v8` for code coverage
- Test config in `vite.config.js`

### Running Tests
```bash
cd frontend
npm run test              # Run all tests once
npm run test:watch        # Watch mode
npm run test:coverage     # Run with coverage report
```

---

## CI/CD ✓

Two GitHub Actions workflows are configured:

- **`.github/workflows/ci.yml`** — Runs on push to `main`/`master` + PRs. Uses a real PostgreSQL 16 service container for backend tests, plus frontend lint & build.
- **`.github/workflows/test.yml`** — Runs on push to `main`/`develop` + PRs. Backend tests with JaCoCo + Codecov upload, frontend tests with coverage + Codecov upload, plus lint check.

---

## Coverage Targets

| Layer | Estimated Current | Target |
|-------|-------------------|--------|
| Backend Controllers | ~70% | 85%+ |
| Backend Services | ~65% | 80%+ |
| Backend Config | ~40% | 60%+ |
| Frontend Components | ~30% | 85%+ |
| Frontend Hooks | ~40% | 80%+ |
| Frontend Utilities | ~60% | 90%+ |

**Estimated effort to reach 80% overall**: ~8-10 hours (adding ~30 backend service tests + ~20 frontend component tests).
