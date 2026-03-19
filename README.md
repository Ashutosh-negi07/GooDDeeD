# GooDDeeD

## Environment

Copy `.env.template` to `.env` and set secure values for production.

Local development workflow:
- Copy `.env.template` to `.env.local` (or `.env`) and set development-only values.
- Keep local env files untracked. Only `.env.template` should be committed.
- Before starting backend from a shell, load the file into environment variables:
	- `set -a && source .env.local && set +a`
- Start backend with `cd backend && ./mvnw spring-boot:run`.

Startup safety checks are enforced:
- Backend fails fast if `JWT_SECRET` or datasource env vars are missing.
- Backend fails if `JWT_SECRET` is shorter than 32 bytes.
- Backend fails if placeholder values such as `replace_with_...` or `change_me...` are still present.

Required variables:
- `JWT_SECRET`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

Optional variables:
- `SPRING_JPA_HIBERNATE_DDL_AUTO` (default in app is `validate`)
- `SPRING_JPA_SHOW_SQL` (default is `false`)
- `JWT_EXPIRATION`

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs:
- Backend tests (`./mvnw test`)
- Frontend lint (`npm run lint`)
- Frontend build (`npm run build`)