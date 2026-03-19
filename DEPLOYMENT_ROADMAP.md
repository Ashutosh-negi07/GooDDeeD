# GooDDeeD Deployment Roadmap

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Railway Backend Deployment](#railway-backend-deployment)
3. [Vercel Frontend Deployment](#vercel-frontend-deployment)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Tools to Install Locally
- Git (or GitHub Desktop)
- Node.js 18+ (for frontend tooling)
- Docker (optional, for local testing)

### Accounts to Create
- **GitHub Account** - Required for both Railway and Vercel (already needed for version control)
- **Railway Account** - https://railway.app (backend hosting)
- **Vercel Account** - https://vercel.com (frontend hosting)
- **PostgreSQL Database** - Hosted on Railway or via Railway's marketplace

---

## Railway Backend Deployment

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up using your GitHub account (recommended for easy integration)
3. Confirm email and complete setup
4. Create a new team (or use default)

### Step 2: Create PostgreSQL Database on Railway
1. In Railway dashboard, click **"New Project"**
2. Select **"Provision PostgreSQL"**
3. Configure database:
   ```
   Name: gooddeeds-db
   Version: Latest stable
   ```
4. Once created, note the following environment variables:
   - **Database URL** (JDBC format will be shown)
   - **Database Host**: `<random-name>.railway.app`
   - **Database Port**: `5432` (or custom if specified)
   - **Database User**: `postgres`
   - **Database Name**: Extract from connection string
   - **Database Password**: Shown in Railway dashboard

### Step 3: Configure Backend Application Properties
Update `/backend/src/main/resources/application-production.yml`:

```yaml
spring:
  application:
    name: gooddeeds-backend
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true
  flyway:
    locations: classpath:db/migration
    baseline-on-migrate: true
  
  jwt:
    secret: ${JWT_SECRET}
    expiration: 86400000 # 24 hours

server:
  port: ${PORT:8080}
  servlet:
    context-path: /api
  compression:
    enabled: true
    min-response-size: 1024

logging:
  level:
    root: INFO
    com.gooddeeds: DEBUG
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

### Step 4: Create Backend Repository on GitHub (if not already there)
```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/YOUR_USERNAME/gooddeeds-backend.git
git branch -M main
git push -u origin main
```

### Step 5: Deploy Backend to Railway
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select **"Configure GitHub App"** and authorize Railway
4. Find and select your `gooddeeds-backend` repository
5. Railway auto-detects Maven project and configures build:
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/backend-*.jar`
6. Click **"Deploy"**

### Step 6: Add Environment Variables to Railway
After deployment starts, go to **Variables** tab:

```
DB_HOST=<railway-postgres-host>
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=<from-postgres-service>
JWT_SECRET=<generate-strong-secret> # At least 32 chars, alphanumeric + special chars
PORT=8080
SPRING_PROFILES_ACTIVE=production
```

**Generate JWT_SECRET**:
```bash
openssl rand -base64 32
```

### Step 7: Link PostgreSQL Service to Backend
1. In Railway project, go to **Service** → Select backend service
2. Click **Plugins** → Add Database
3. Select the PostgreSQL service you created
4. Railway automatically injects DB connection variables

### Step 8: Test Backend Deployment
```bash
# Get Railway backend URL from deployment
curl https://<railway-domain>/api/causes
# Should return JSON with causes data (initially empty)
```

---

## Vercel Frontend Deployment

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up using GitHub (recommended)
3. Grant repository access permissions
4. Complete setup

### Step 2: Prepare Frontend for Deployment
Update `/frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Vercel production override in api/axios.js
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'util-vendor': ['axios', 'lucide-react']
        }
      }
    }
  }
})
```

### Step 3: Update API Configuration for Production
Update `/frontend/src/api/axios.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = 
  process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://<railway-backend-url>/api'
    : 'http://localhost:8080/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
```

### Step 4: Create Frontend Repository on GitHub
```bash
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/YOUR_USERNAME/gooddeeds-frontend.git
git branch -M main
git push -u origin main
```

### Step 5: Deploy Frontend to Vercel
1. Go to Vercel dashboard → **"New Project"**
2. Select **"Import Git Repository"**
3. Enter repository URL or select from list
4. Configure project:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 6: Add Environment Variables on Vercel
Go to **Settings** → **Environment Variables**:

```
VITE_API_URL=https://<railway-backend-url>/api
VITE_APP_NAME=GooDDeeD
VITE_APP_VERSION=1.0.0
```

### Step 7: Configure CORS on Backend
Update `/backend/src/main/java/com/gooddeeds/backend/config/CorsConfig.java`:

```java
package com.gooddeeds.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.split(","))
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

Add to `application-production.yml`:
```yaml
cors:
  allowed-origins: https://<vercel-frontend-url>,https://<your-custom-domain>
```

### Step 8: Test Frontend Deployment
1. Click **"Visit"** link from Vercel dashboard
2. Test login functionality:
   - Register new account
   - Login with credentials
   - Create a cause
   - View causes list

---

## Post-Deployment Configuration

### Custom Domain Setup (Optional)

#### For Backend (Railway):
1. Go to Railway project settings
2. Click **"Domains"**
3. Add custom domain: `api.yourdomain.com`
4. Add CNAME record to your DNS:
   ```
   CNAME api yourdomain.com → cname.railway.app
   ```

#### For Frontend (Vercel):
1. Go to Vercel project settings
2. Click **"Domains"**
3. Add custom domain: `yourdomain.com`
4. Follow DNS configuration steps provided

### SSL/HTTPS
- Railway: Auto-enabled for all deployments
- Vercel: Auto-enabled for all deployments
- Custom domains: Auto-provisioned via Let's Encrypt

### Authentication Setup
1. Update JWT_SECRET environment variable to a strong, random value
2. Configure token expiration per your security requirements
3. Test token refresh functionality

---

## Monitoring & Maintenance

### Railway Monitoring
**Accessing Logs**:
- Dashboard → Project → Select service → **Logs** tab
- Filter by severity level (ERROR, WARN, INFO)
- Set up log retention (default: 7 days)

**Database Backups**:
- PostgreSQL: Automatic daily backups (configurable via Railway dashboard)
- Manual backup:
  ```bash
  pg_dump -h <host> -U postgres <database> > backup.sql
  ```

### Vercel Monitoring
**Accessing Logs**:
- Dashboard → Project → **Deployments** tab
- Click deployment → **Logs** button
- View build logs, deployment logs, runtime logs

**Performance Analytics**:
- Dashboard → **Analytics** section
- Monitor Core Web Vitals, response times
- See geographic distribution of users

### Health Check Endpoints
Add health checks for continuous monitoring:

```bash
# Backend health
curl https://<railway-backend-url>/api/actuator/health

# Frontend health (basic HTTP 200 response)
curl https://<vercel-frontend-url>/
```

### Database Maintenance
1. **Vacuum and Analyze** (monthly):
   ```sql
   VACUUM ANALYZE;
   ```

2. **Check index bloat**:
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;
   ```

3. **Monitor connections**:
   ```sql
   SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
   ```

### Setting Up CI/CD (Optional but Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '21'
      - run: cd backend && ./mvnw clean test
      
  backend-deploy:
    needs: backend-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: |
          git remote add railway ${{ secrets.RAILWAY_REPO_URL }}
          git push railway main

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci && npm run build

  frontend-deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## Troubleshooting

### Backend Issues

**520 Bad Gateway from Railway**:
- Check logs: `Railway Dashboard → Logs`
- Verify JWT_SECRET is set
- Check database connection: `./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=production"`

**Database Connection Error**:
```
Error: Connection to localhost:5432 refused
```
Solutions:
- Verify DB_HOST is correctly set (should be Railway-provided DNS)
- Check firewall rules in Railway
- Ensure database service is running

**CORS Errors in Browser Console**:
```
Access to XMLHttpRequest blocked by CORS policy
```
Solutions:
- Update CORS config in backend with Vercel frontend URL
- Ensure `allowCredentials: true` is set
- Redeploy backend to apply changes

### Frontend Issues

**Blank Screen on Load**:
- Check browser console for errors
- Verify VITE_API_URL is set correctly
- Check that backend is responding: `curl https://<backend-url>/api/causes`

**401 Unauthorized on API Calls**:
- Verify token is being sent: Check Network tab in DevTools
- Check token expiration time in JWT
- Ensure Authorization header format is `Bearer <token>`

**CORS Errors**:
- Check backend CORS configuration
- Ensure frontend URL is whitelisted in `allowed-origins`
- Clear browser cache and revisit

---

## Security Checklist for Production

- [ ] JWT_SECRET is strong (32+ characters, mixed case, numbers, special chars)
- [ ] Environment variables are NOT committed to git
- [ ] Database credentials are stored only in Railway secrets
- [ ] HTTPS is enforced (automatic on both platforms)
- [ ] CORS is configured to only allow your domain
- [ ] Rate limiting is enabled on auth endpoints
- [ ] Database backups are tested and verified
- [ ] Monitoring and alerting is configured
- [ ] API has input validation on all endpoints
- [ ] Sensitive data is not logged or exposed in error messages

---

## Deployment Summary

| Aspect | Railway | Vercel |
|--------|---------|--------|
| **Cost** | Pay-as-you-go (~$5-50/mo) | Free tier available; Pro ($20/mo) |
| **Deployment** | Git push or GitHub integration | Git push or Vercel CLI |
| **Scaling** | Automatic, configurable limits | Automatic, included |
| **Database** | Built-in PostgreSQL marketplace | Integration with Railway/AWS/etc |
| **Monitoring** | Built-in logs, basic analytics | Built-in analytics, Vercel Insights |
| **Uptime SLA** | 99.9% | 99.99% |

Both services are ideal for full-stack JavaScript/JVM deployments and integrate seamlessly with GitHub.
