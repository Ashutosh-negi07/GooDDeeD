# GooDDeeD — Deployment Plan

> **Stack:** Spring Boot 3.3.3 (Railway) + React 19 / Vite (Vercel) + PostgreSQL (Railway)

---

## Phase 1: Prepare Accounts & Database

### 1.1 Create Accounts
- [ ] Sign up at [railway.app](https://railway.app) with GitHub
- [ ] Sign up at [vercel.com](https://vercel.com) with GitHub

### 1.2 Provision PostgreSQL on Railway
1. Railway Dashboard → **New Project** → **Provision PostgreSQL**
2. Note down these values (visible in the PostgreSQL service's **Variables** tab):
   - `DATABASE_URL` (JDBC format)
   - Host, Port, Username, Password, Database Name

### 1.3 Generate Secrets
```bash
# Generate a strong JWT secret (run locally)
openssl rand -base64 32
# Save the output — you'll need it in Step 2.2
```

---

## Phase 2: Deploy Backend (Railway)

### 2.1 Push Backend to GitHub
```bash
# If not already a GitHub repo:
cd backend
git init && git add . && git commit -m "Initial backend"
git remote add origin https://github.com/YOUR_USERNAME/gooddeeds-backend.git
git branch -M main && git push -u origin main
```

### 2.2 Deploy on Railway
1. Railway Dashboard → **New Project** → **Deploy from GitHub repo**
2. Select your `gooddeeds-backend` repository
3. Railway auto-detects Maven — it will use:
   - **Build:** `./mvnw clean package -DskipTests`
   - **Start:** `java -jar target/backend-*.jar`

### 2.3 Set Environment Variables
In the backend service's **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:<port>/<dbname>` (from PostgreSQL service) |
| `SPRING_DATASOURCE_USERNAME` | `postgres` (from PostgreSQL service) |
| `SPRING_DATASOURCE_PASSWORD` | *(from PostgreSQL service)* |
| `JWT_SECRET` | *(the value from `openssl rand` in Step 1.3)* |
| `JWT_EXPIRATION` | `3600000` (1 hour, adjust as needed) |
| `SPRING_PROFILES_ACTIVE` | `production` |
| `CORS_ALLOWED_ORIGINS` | *(leave blank for now — fill in after Vercel deploy in Step 3.4)* |

### 2.4 Link Database
1. In Railway project, click backend service → **Plugins** → **Add Database**
2. Select the PostgreSQL service from Step 1.2

### 2.5 Verify Backend
```bash
# Get your Railway URL from the deployment dashboard
curl https://<railway-domain>/api/causes
# Expected: {"content":[],"page":{"size":10,"number":0,"totalElements":0,"totalPages":0}}
```

---

## Phase 3: Deploy Frontend (Vercel)

### 3.1 Push Frontend to GitHub
```bash
cd frontend
git init && git add . && git commit -m "Initial frontend"
git remote add origin https://github.com/YOUR_USERNAME/gooddeeds-frontend.git
git branch -M main && git push -u origin main
```

### 3.2 Deploy on Vercel
1. Vercel Dashboard → **New Project** → **Import Git Repository**
2. Select your `gooddeeds-frontend` repository
3. Configure:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3.3 Set Environment Variables
In Vercel → Project Settings → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://<railway-backend-domain>/api` |

### 3.4 Update Backend CORS ← Critical!
Go back to Railway backend service **Variables** and update:

| Variable | Value |
|----------|-------|
| `CORS_ALLOWED_ORIGINS` | `https://<your-vercel-domain>` |

Railway will auto-redeploy with the new CORS setting.

### 3.5 Verify Frontend
1. Open your Vercel URL in a browser
2. Test the full flow:
   - [ ] Register a new account
   - [ ] Login with those credentials
   - [ ] Create a cause
   - [ ] Browse causes on the explore page

---

## Phase 4: Post-Deployment

### 4.1 Custom Domain (Optional)
- **Backend:** Railway → Settings → Domains → Add `api.yourdomain.com` → Add CNAME record
- **Frontend:** Vercel → Settings → Domains → Add `yourdomain.com` → Follow DNS steps
- **Update CORS** again if you add a custom domain

### 4.2 Verify Security Checklist
- [ ] `JWT_SECRET` is 32+ characters
- [ ] No `.env` files with real secrets are committed to git
- [ ] CORS only allows your Vercel domain
- [ ] HTTPS is active (automatic on both platforms)
- [ ] Backend error responses don't leak stack traces (already configured)

### 4.3 Set Up Monitoring
- **Backend Logs:** Railway Dashboard → Service → Logs tab
- **Frontend Analytics:** Vercel Dashboard → Analytics
- **Health Check:** `curl https://<railway-domain>/api/actuator/health`

---

## Quick Reference: All Environment Variables

### Railway (Backend)
```
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<db>
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<password>
JWT_SECRET=<openssl rand -base64 32>
JWT_EXPIRATION=3600000
SPRING_PROFILES_ACTIVE=production
CORS_ALLOWED_ORIGINS=https://<vercel-url>
```

### Vercel (Frontend)
```
VITE_API_URL=https://<railway-url>/api
```
