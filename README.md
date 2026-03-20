# ❤️ GooDDeeD

A full-stack volunteer coordination platform where people come together to create causes, set goals, and track tasks that make a real-world impact.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.3-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **Cause Management** — Create, browse, search, and manage volunteer causes
- **Goal & Task Tracking** — Break causes into goals and actionable tasks with status tracking
- **Team Memberships** — Join causes, manage members with role-based access (Owner / Admin / Member)
- **Authentication** — Secure JWT-based registration and login with BCrypt password hashing
- **Rate Limiting** — IP-based protection against brute-force and abuse
- **Search & Pagination** — Full-text cause search with paginated results
- **Responsive UI** — Ocean-themed design that works on desktop and mobile

---

## 🏗️ Architecture

```
┌──────────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│    Frontend (SPA)    │──────▶│   Backend REST API   │──────▶│   PostgreSQL    │
│  React 19 + Vite     │ HTTPS │  Spring Boot 3.3.3   │ JDBC  │                 │
│  Vercel              │       │  Railway              │       │  Railway         │
└──────────────────────┘       └──────────────────────┘       └─────────────────┘
```

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | React 19, Vite 7, React Router, Axios        |
| Backend    | Spring Boot 3.3.3, Java 17, Maven            |
| Database   | PostgreSQL (Flyway migrations)                |
| Auth       | JWT + BCrypt                                  |
| CI/CD      | GitHub Actions                                |
| Hosting    | Railway (backend + DB) · Vercel (frontend)    |

---

## 📁 Project Structure

```
GooDDeeD/
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/          #   Controllers, services, models, config
│   ├── src/main/resources/     #   application.yml, Flyway migrations
│   ├── src/test/               #   JUnit 5 integration tests
│   ├── stress-test/            #   k6 performance test script
│   └── Dockerfile              #   Multi-stage Docker build
├── frontend/                   # React SPA
│   ├── src/pages/              #   Route-level page components
│   ├── src/components/         #   Reusable UI components
│   ├── src/contexts/           #   Auth context provider
│   ├── src/api/                #   Axios instance + interceptors
│   └── src/__tests__/          #   Vitest test files
├── docs/                       # Documentation
│   ├── architecture.md         #   System design & deployment
│   ├── testing.md              #   Test suites & coverage
│   ├── ci-cd.md                #   GitHub Actions workflows
│   └── k6-stress-test-results.md  # Performance test report
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Local dev with PostgreSQL
└── .env.template               # Environment variable template
```

---

## 🚀 Quick Start

### Prerequisites

- **Java 17** — `brew install openjdk@17` or [SDKMAN](https://sdkman.io)
- **Node.js 20+** — `brew install node` or [nvm](https://github.com/nvm-sh/nvm)
- **PostgreSQL 16+** — `brew install postgresql` or use Docker

### 1. Clone & Setup

```bash
git clone https://github.com/Ashutosh-negi07/GooDDeeD.git
cd GooDDeeD
cp .env.template .env.local
```

Edit `.env.local` with your local database credentials and a JWT secret (32+ characters).

### 2. Start the Database

```bash
# Option A: Use local PostgreSQL
createdb gooddeeds_backbone

# Option B: Use Docker
docker compose up -d postgres
```

### 3. Run the Backend

```bash
set -a && source .env.local && set +a
cd backend && ./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080/api`.

### 4. Run the Frontend

```bash
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

### Backend (30 tests)

```bash
cd backend && ./mvnw clean test
```

### Frontend (11 tests)

```bash
cd frontend && npm test
```

### K6 Stress Test

```bash
brew install k6
k6 run --env K6_PROFILE=smoke --env BASE_URL=http://localhost:8080 \
  backend/stress-test/k6-stress-test.js
```

| Profile    | VUs   | Duration | Use Case                   |
|------------|-------|----------|----------------------------|
| `smoke`    | 1     | 45s      | Quick sanity check         |
| `standard` | 12    | ~4.5 min | Normal load simulation     |
| `full`     | 180   | ~14 min  | Full stress + spike test   |

> 📊 See [docs/k6-stress-test-results.md](docs/k6-stress-test-results.md) for detailed performance results.

---

## 🔐 Environment Variables

Copy `.env.template` to `.env.local` and configure:

| Variable                    | Required | Description                     |
|-----------------------------|----------|---------------------------------|
| `JWT_SECRET`                | ✅       | 32+ char secret for signing JWTs |
| `SPRING_DATASOURCE_URL`    | ✅       | JDBC PostgreSQL connection URL   |
| `SPRING_DATASOURCE_USERNAME`| ✅      | Database username                |
| `SPRING_DATASOURCE_PASSWORD`| ✅      | Database password                |
| `CORS_ALLOWED_ORIGINS`     | —        | Frontend URL (for production)    |
| `JWT_EXPIRATION`           | —        | Token lifetime in ms (default: 24h) |

**Startup safety checks:**
- Backend fails fast if `JWT_SECRET` is missing or shorter than 32 bytes
- Backend rejects placeholder values like `replace_with_...` or `change_me...`

---

## 🌐 Deployment

| Service   | Platform | Auto-deploys on push to `main` |
|-----------|----------|-------------------------------|
| Backend   | Railway  | ✅                            |
| Frontend  | Vercel   | ✅                            |
| Database  | Railway  | —                             |

> 📖 See [docs/architecture.md](docs/architecture.md) for deployment details.

---

## 📄 API Endpoints

| Method | Endpoint                          | Auth   | Description            |
|--------|-----------------------------------|--------|------------------------|
| POST   | `/api/auth/register`              | —      | Register new user      |
| POST   | `/api/auth/login`                 | —      | Login, returns JWT     |
| GET    | `/api/auth/me`                    | Bearer | Current user profile   |
| GET    | `/api/causes`                     | —      | List all causes        |
| GET    | `/api/causes/search?keyword=...`  | —      | Search causes          |
| POST   | `/api/causes`                     | Bearer | Create a cause         |
| GET    | `/api/goals/cause/{causeId}`      | —      | Goals for a cause      |
| POST   | `/api/goals`                      | Bearer | Create a goal          |
| GET    | `/api/tasks/cause/{causeId}`      | Bearer | Tasks for a cause      |
| POST   | `/api/tasks`                      | Bearer | Create a task          |
| PATCH  | `/api/tasks/{id}/status`          | Bearer | Update task status     |
| POST   | `/api/memberships/join`           | Bearer | Join a cause           |
| DELETE | `/api/memberships/leave`          | Bearer | Leave a cause          |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design, tech stack, deployment config |
| [Testing](docs/testing.md) | Test suites, coverage targets, how to run |
| [CI/CD](docs/ci-cd.md) | GitHub Actions workflows explained |
| [K6 Results](docs/k6-stress-test-results.md) | Stress test performance report |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m 'feat: add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).