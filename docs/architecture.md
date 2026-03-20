# Architecture & Deployment

## System Overview

GooDDeeD is a full-stack volunteer coordination platform built with a modern, decoupled architecture.

```
┌──────────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│    Frontend (SPA)    │──────▶│   Backend REST API   │──────▶│   PostgreSQL    │
│  React 19 + Vite     │ HTTPS │  Spring Boot 3.3.3   │ JDBC  │   (Railway)     │
│  Hosted on Vercel    │       │  Hosted on Railway    │       │                 │
└──────────────────────┘       └──────────────────────┘       └─────────────────┘
```

## Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Frontend   | React 19, Vite, React Router, Axios  |
| Backend    | Spring Boot 3.3.3, Java 17, Maven   |
| Database   | PostgreSQL 18 (Railway)              |
| Auth       | JWT (JSON Web Tokens) + BCrypt       |
| Migrations | Flyway                               |
| CI/CD      | GitHub Actions                       |
| Hosting    | Railway (backend) + Vercel (frontend)|

## Backend Architecture

### Project Structure

```
backend/
├── src/main/java/com/gooddeeds/backend/
│   ├── config/          # Security, CORS, rate limiting
│   ├── controller/      # REST endpoints
│   ├── dto/             # Request/response objects
│   ├── model/           # JPA entities
│   ├── repository/      # Data access layer
│   ├── security/        # JWT filter, auth provider
│   └── service/         # Business logic
├── src/main/resources/
│   ├── application.yml              # Base config
│   ├── application-production.yml   # Production overrides
│   └── db/migration/               # Flyway SQL migrations
├── stress-test/                     # k6 performance tests
├── Dockerfile                       # Multi-stage Docker build
└── pom.xml
```

### Key API Endpoints

| Method | Endpoint                 | Auth     | Description           |
|--------|--------------------------|----------|-----------------------|
| POST   | `/api/auth/register`     | Public   | Register a new user   |
| POST   | `/api/auth/login`        | Public   | Login, returns JWT    |
| GET    | `/api/causes`            | Public   | List/search causes    |
| POST   | `/api/causes`            | Bearer   | Create a cause        |
| POST   | `/api/memberships/join`  | Bearer   | Join a cause          |
| GET    | `/api/tasks/cause/{id}`  | Bearer   | Tasks for a cause     |
| POST   | `/api/tasks`             | Bearer   | Create a task         |

### Security

- **JWT Authentication** — Stateless token-based auth with configurable expiration
- **BCrypt Password Hashing** — Industry-standard password storage
- **Rate Limiting** — IP-based rate limiting on auth endpoints (10 req/60s) and general endpoints (100 req/60s)
- **CORS** — Configurable allowed origins via environment variable
- **Security Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`

## Frontend Architecture

```
frontend/
├── src/
│   ├── api/            # Axios instance with JWT interceptor
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Context (AuthContext)
│   ├── pages/          # Route-level page components
│   └── __tests__/      # Vitest test files
├── public/
└── vite.config.js
```

## Deployment

### Environment Variables

**Railway (Backend)**

| Variable                    | Description                     |
|-----------------------------|---------------------------------|
| `SPRING_PROFILES_ACTIVE`    | Set to `production`             |
| `SPRING_DATASOURCE_URL`     | JDBC PostgreSQL connection URL  |
| `SPRING_DATASOURCE_USERNAME`| Database username               |
| `SPRING_DATASOURCE_PASSWORD`| Database password               |
| `JWT_SECRET`                | 32+ char secret for signing JWTs|
| `JWT_EXPIRATION`            | Token lifetime in ms            |
| `CORS_ALLOWED_ORIGINS`      | Frontend Vercel URL             |

**Vercel (Frontend)**

| Variable       | Description                  |
|----------------|------------------------------|
| `VITE_API_URL` | Railway backend URL + `/api` |

### Docker Build (Backend)

The backend uses a multi-stage Dockerfile:

1. **Build stage** — `maven:3.9.9-eclipse-temurin-17` compiles the JAR
2. **Runtime stage** — `eclipse-temurin:17-jre` runs the JAR on port 8080
