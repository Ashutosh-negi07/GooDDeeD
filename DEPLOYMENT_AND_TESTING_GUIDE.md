# GooDDeeD - Complete Deployment & Testing Guide

Welcome! This guide provides everything you need to deploy GooDDeeD to production and ensure code quality through comprehensive testing.

## Quick Navigation

- **[Deployment Roadmap](#deployment-roadmap)** - Step-by-step guide to deploy on Railway (backend) + Vercel (frontend)
- **[Test Coverage Summary](#test-coverage-summary)** - Testing setup, coverage targets, and troubleshooting
- **[Environment Setup](#environment-setup)** - Prerequisites and local development

---

## Deployment Roadmap

### Overview
This project consists of:
- **Backend**: Spring Boot 3.3.3 REST API (deployed on Railway)
- **Frontend**: React + Vite SPA (deployed on Vercel)
- **Database**: PostgreSQL (hosted on Railway)

### Accounts Needed
1. **GitHub** - For version control and CI/CD (already needed)
2. **Railway** - https://railway.app (sign up with GitHub)
3. **Vercel** - https://vercel.com (sign up with GitHub)

---

## Test Coverage Summary

### Current Status
- **Backend**: 21 unit/integration tests, ~65% coverage
- **Frontend**: Test framework not yet installed
- **Target**: 80%+ coverage for both

### Quick Start Testing
```bash
# Backend (requires Java 17)
cd backend
./mvnw clean test jacoco:report
open target/site/jacoco/index.html

# Frontend (requires Node 18+)
cd frontend
npm install --save-dev vitest @testing-library/react
npm run test:coverage
```

---

## Environment Setup

### Prerequisites

#### Java Development (Backend)
```bash
# Install Java 17 (recommended)
# Option 1: Using SDKMAN (recommended)
curl -s "https://get.sdkman.io" | bash
sdkman install java 17.0.10-temurin
sdk use java 17.0.10-temurin

# Option 2: Direct download
# macOS: brew install java@17
# Then set JAVA_HOME: export JAVA_HOME=$(brew --prefix openjdk@17)

# Verify installation
java -version  # Should show Java 17.x
mvn -version   # Should work and use Java 17
```

#### Node.js Development (Frontend)
```bash
# Install Node.js 18+
# Option 1: Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Option 2: Using Homebrew (macOS)
brew install node@18

# Verify installation
node -v  # Should show 18.x or higher
npm -v   # Should show 9.x or higher
```

#### Git
```bash
# Verify Git is installed
git --version
# If not: brew install git (macOS) or apt install git (Linux)
```

---

## Deployment Steps

### Backend Deployment on Railway

#### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Start a new project" 
3. Sign in with GitHub and authorize Railway

#### Step 2: Create Database
1. In Railway dashboard, click **"New Project"**
2. Select **"Provision PostgreSQL"**
3. Copy the generated database credentials (you'll need them)

#### Step 3: Prepare Backend for Deployment
```bash
# Ensure backend is in its own Git repository
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/YOUR_USERNAME/gooddeeds-backend.git
git push -u origin main
```

#### Step 4: Deploy to Railway
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select your `gooddeeds-backend` repository
4. Railway detects Maven project automatically
5. Click **"Deploy"**

#### Step 5: Configure Environment Variables
In Railway dashboard, go to the backend service's **Variables** tab and add:

```
DB_HOST=<from-postgres-service>
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=<from-postgres-service>
JWT_SECRET=<generate-with: openssl rand -base64 32>
PORT=8080
SPRING_PROFILES_ACTIVE=production
```

#### Step 6: Link Database
1. Click **Plugins** on backend service
2. Add the PostgreSQL service you created in Step 2
3. Railway auto-injects database configuration

#### Step 7: Test Backend
```bash
# Get your Railway URL from the deployment
curl https://<railway-domain>/api/causes
# Should return: {"content":[],"size":0,...}
```

---

### Frontend Deployment on Vercel

#### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign in with GitHub and authorize Vercel

#### Step 2: Prepare Frontend for Deployment
```bash
# Update API endpoint for production
# Edit: frontend/src/api/axios.js

const API_BASE_URL = 
  process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://<railway-backend-url>/api'
    : 'http://localhost:8080/api';
```

#### Step 3: Create Frontend Repository
```bash
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/YOUR_USERNAME/gooddeeds-frontend.git
git push -u origin main
```

#### Step 4: Deploy to Vercel
1. Go to Vercel dashboard
2. Click **"New Project"**
3. Select your `gooddeeds-frontend` repository
4. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**

#### Step 5: Add Environment Variables  
In Vercel project settings, **Environment Variables** tab:

```
VITE_API_URL=https://<railway-backend-url>/api
VITE_APP_NAME=GooDDeeD
VITE_APP_VERSION=1.0.0
```

#### Step 6: Configure CORS on Backend
Update backend's `application-production.yml`:

```yaml
cors:
  allowed-origins: https://<vercel-frontend-url>,https://yourdomain.com
```

Then redeploy backend for changes to take effect.

#### Step 7: Test Frontend
1. Click **Visit** link from Vercel dashboard
2. Test the application:
   - Try registering a new account
   - Login with your credentials
   - Create a cause
   - Browse other causes

---

## Testing Guide

### Backend Testing

#### Setup Java 17

```bash
# Verify correct Java version
java -version  # Must show 17.x

# If you have multiple Java versions, set JAVA_HOME
export JAVA_HOME=$(dirname $(dirname $(readlink $(readlink $(which java)))))
```

#### Run Tests

```bash
cd backend

# Run all tests
./mvnw clean test

# Run with coverage
./mvnw clean test jacoco:report

# View coverage report (opens in browser)
open target/site/jacoco/index.html

# Run specific test class
./mvnw test -Dtest=AuthControllerTest

# Run specific test method  
./mvnw test -Dtest=AuthControllerTest#register_validRequest_returnsTokenAndUser
```

#### Test Structure

```
src/test/java/com/gooddeeds/backend/
├── config/
│   └── RateLimitingFilterTest.java      (4 tests)
├── controller/
│   ├── AuthControllerTest.java          (7 tests)
│   └── CauseControllerTest.java         (10 tests)
```

### Frontend Testing

#### Install Test Framework

```bash
cd frontend

# Add Vitest and testing libraries
npm install --save-dev vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @vitest/environment-jsdom \
  @vitest/coverage-v8
```

#### Run Tests

```bash
# Run all tests once
npm run test

# Watch mode (re-run on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

#### Create Sample Test

Create `frontend/src/__tests__/App.test.jsx`:

```javascript
import { render, screen } from '@testing-library/react'
import App from '../App'
import { describe, it, expect, vi } from 'vitest'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeTruthy()
  })
})
```

---

## Monitoring & Maintenance

### Backend Monitoring

#### Access Logs
```bash
# Via Railway Dashboard:
# Project → Backend Service → Logs tab

# Check backend health
curl https://<railway-domain>/api/actuator/health
```

#### Database Maintenance
```bash
# Connect to database
PGPASSWORD=<password> psql -h <host> -U postgres -d railway

# Check database size
SELECT datname, pg_size_pretty(pg_database_size(datname)) 
FROM pg_database 
WHERE datname = 'railway';

# Optimize tables
VACUUM ANALYZE;
```

### Frontend Monitoring

#### Access Logs
```bash
# Via Vercel Dashboard:
# Project → Deployments → View Logs
```

#### Performance Metrics
1. Vercel Dashboard → **Analytics**
2. Monitor Core Web Vitals
3. Check API response times

---

## Troubleshooting

### Backend Won't Deploy
**Problem**: Build fails on Railway
```
Solution:
1. Check Java version: java -version (must show 17.x)
2. Test locally: ./mvnw clean package -DskipTests
3. Check pom.xml for syntax errors
4. View Railway logs for specific error
```

### Frontend API Calls Failing  
**Problem**: "CORS error" in browser console
```
Solution:
1. Check VITE_API_URL environment variable is set correctly
2. Verify backend's CORS configuration includes frontend URL
3. Check Authorization header is being sent in Network tab
4. Ensure JWT token is valid (check expiration)
```

### Tests Fail Locally But Pass on CI
**Problem**: Environment difference
```
Solution:
1. Verify Java version: java -version (must be 17.x)
2. Update Maven: ./mvnw -v
3. Clear cache: ./mvnw clean
4. Check for hardcoded localhost URLs → use environment variables
```

---

## Performance Optimization

### Backend
```yaml
# application-production.yml
spring:
  jpa:
    batch_size: 20
    order_inserts: true
    order_updates: true

# Enable compression
server:
  compression:
    enabled: true
    min-response-size: 1024
```

### Frontend
```javascript
// vite.config.js
export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'util-vendor': ['axios', 'lucide-react']
        }
      }
    }
  }
})
```

---

## Security Checklist

Before deploying to production:

- [ ] JWT_SECRET is strong (32+ chars, mixed alphanumeric)
- [ ] Never commit `.env` or `application-production.yml` with secrets
- [ ] CORS is restricted to your domain only
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced (automatic on both platforms)
- [ ] Database backups are tested
- [ ] Error messages don't expose sensitive data
- [ ] Input validation is on all endpoints
- [ ] API authentication tokens have expiration

---

## Useful Commands Reference

### Backend
```bash
cd backend

# Clean and build
./mvnw clean install

# Run tests with coverage
./mvnw clean test jacoco:report

# Package for production
./mvnw clean package -DskipTests

# Run locally
./mvnw spring-boot:run

# Check dependency tree
./mvnw dependency:tree
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint
```

### Database  
```bash
# Connect to PostgreSQL
PGPASSWORD=password psql -h host -U postgres -d database

# Backup database
pg_dump -h host -U postgres database > backup.sql

# Restore database
psql -h host -U postgres database < backup.sql
```

---

## Getting Help

1. **Check test output** for specific error messages
2. **Review logs** on Railway/Vercel dashboards
3. **Consult troubleshooting section** in this guide
4. **Check project README.md** files in `/backend` and `/frontend`
5. **Review test files** to understand expected behavior

---

## Next Steps

1. ✅ Set up development environment (Java 17, Node 18+)
2. ✅ Create Railway and Vercel accounts
3. ✅ Deploy backend to Railway
4. ✅ Deploy frontend to Vercel
5. ✅ Set up CI/CD with GitHub Actions
6. ✅ Increase test coverage to 80%+
7. ✅ Configure monitoring and alerting
8. ✅ Plan backup and disaster recovery

---

## Support Files

- `DEPLOYMENT_ROADMAP.md` - Detailed deployment walkthrough
- `TEST_COVERAGE_SUMMARY.md` - Testing setup and coverage details  
- `backend/pom.xml` - Maven configuration with JaCoCo
- `frontend/package.json` - npm scripts for testing and building
- `.github/workflows/test.yml` - CI/CD configuration (add this)

---

**Last Updated**: March 18, 2026  
**Version**: 1.0.0
