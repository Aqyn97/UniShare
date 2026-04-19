# Railway Deployment Guide — UniShare Backend

## Prerequisites

- Railway account: https://railway.com
- Railway CLI (optional, for local testing): `npm i -g @railway/cli`
- The `Aqyn/railway-deploy` branch pushed to GitHub
- Cloudinary account with a cloud name, API key, and API secret

---

## Step 1: Create Railway Project

1. Go to https://railway.com/dashboard → **New Project**
2. Choose **Deploy from GitHub repo**
3. Select the `UniShare` repository
4. Select branch: **`Aqyn/railway-deploy`**
5. Railway will detect the `Dockerfile` automatically (no nixpacks needed)

---

## Step 2: Add the Postgres Plugin

1. Inside the newly created project, click **+ New** → **Database** → **PostgreSQL**
2. Railway creates a Postgres service and automatically injects these variables
   into your app service's environment:

   | Variable | Description |
   |---|---|
   | `PGHOST` | Internal hostname of the Postgres container |
   | `PGPORT` | Postgres port (5432) |
   | `PGDATABASE` | Database name (`railway`) |
   | `PGUSER` | Database user |
   | `PGPASSWORD` | Generated password |

   **Verify:** Open your backend service → **Variables** tab.
   All five `PG*` variables must be listed. If any are missing, open the
   Postgres service → **Connect** tab and link it to your backend service.

   > **Why not `DATABASE_URL`?** Railway's `DATABASE_URL` is in `postgres://` format,
   > which Spring does not accept. We use the individual `PG*` vars to construct
   > a proper `jdbc:postgresql://` URL in `application-prod.yml`.

---

## Step 3: Set Environment Variables

Open your backend service → **Variables** tab and add the following.
Copy `.env.example` as a reference — **never paste real secrets into `.env.example`**.

### Required — must set before first deploy

| Variable | Value | Notes |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates `application-prod.yml` |
| `CLOUDINARY_CLOUD_NAME` | your cloud name | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_KEY` | your API key | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | your API secret | Cloudinary Dashboard → API Keys |
| `APP_CORS_ALLOWED_ORIGINS` | `https://your-frontend.up.railway.app` | No trailing slash; comma-separate multiple origins |
| `APP_AUTH_FRONTEND_BASE_URL` | `https://your-frontend.up.railway.app` | Used in email links |

### Already injected by the Postgres plugin — do NOT set manually

`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

### Optional — can leave at defaults initially

| Variable | Default | Change when |
|---|---|---|
| `APP_AUTH_MAIL_MODE` | `log` | Set to `send` when email features are implemented |
| `APP_AUTH_MAIL_FROM` | `no-reply@unishare.local` | Set your real domain when using `send` mode |
| `APP_AUTH_VERIFICATION_TTL_HOURS` | `24` | Adjust if needed |
| `APP_AUTH_PASSWORD_RESET_TTL_MINUTES` | `30` | Adjust if needed |

### SMTP variables — only when email is implemented

| Variable | Example |
|---|---|
| `SPRING_MAIL_HOST` | `smtp.gmail.com` |
| `SPRING_MAIL_PORT` | `587` |
| `SPRING_MAIL_USERNAME` | `you@gmail.com` |
| `SPRING_MAIL_PASSWORD` | `your-app-password` |

> **Note:** Email verification (`/auth/verify-email`), resend verification
> (`/auth/resend-verification`), forgot password (`/auth/forgot-password`),
> and reset password (`/auth/reset-password`) currently return HTTP 501.
> They are stubbed and will be implemented in a separate task. You must set
> `APP_AUTH_MAIL_MODE=send` and the SMTP vars only when that work is done.

---

## Step 4: Deploy from `Aqyn/railway-deploy`

Railway triggers a build automatically when you connect the repo. For manual
redeploys:

1. Go to your backend service → **Deployments** tab
2. Click **Deploy** → select branch `Aqyn/railway-deploy`

### What happens during deploy

1. Railway runs `docker build` using the `Dockerfile` at the repo root
2. Stage 1 (builder): downloads Gradle 8.14.4, fetches dependencies, runs `./gradlew bootJar`
3. Stage 2 (runtime): copies the fat JAR into a slim JRE 17 image
4. Railway starts the container; Spring Boot binds to `0.0.0.0:${PORT}`
5. Flyway runs all migrations (`V0.0.1` → `V0.0.6`) against the Railway Postgres DB
6. Railway polls `GET /actuator/health` until it returns HTTP 200 (up to 60 s)

---

## Step 5: Verify the Deployment

### 5a. Health check

```bash
curl https://your-app.up.railway.app/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

### 5b. Register a new user

```bash
curl -X POST https://your-app.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123","email":"test@example.com"}'
```

Expected: `200 OK` with `{"token":"<uuid>","username":"testuser"}`

### 5c. Login

```bash
curl -X POST https://your-app.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

Expected: `200 OK` with `{"token":"<uuid>","username":"testuser"}`

### 5d. Authenticated request

```bash
curl https://your-app.up.railway.app/auth/me \
  -H "x-session: <token-from-login>"
```

Expected: `200 OK` with the user object.

### 5e. Verify Flyway ran cleanly

Check your Railway Postgres database (via Railway's **Data** tab or a Postgres client):

```sql
SELECT version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

All rows should have `success = true`. You should see rows for V0.0.1 through V0.0.6.

---

## Step 6: Rollback Procedure

If a deploy fails or the health check never passes:

### Option A: Redeploy previous version (fastest)

1. Go to service → **Deployments** tab
2. Find the last successful deployment
3. Click **Rollback** (three-dot menu → Rollback)

Railway replaces the running container with the previous image in ~30 seconds.
No database changes are rolled back automatically.

### Option B: Revert a broken Flyway migration

If you deployed a bad migration and the app can't start:

1. Railway CLI: `railway connect` → connect to Postgres
2. Run: `DELETE FROM flyway_schema_history WHERE version = '0.0.6' AND success = false;`
3. Manually reverse the DDL change if needed
4. Redeploy the previous image (Option A)

> **Warning:** Never delete a `success = true` row from `flyway_schema_history`
> unless you also revert the schema change manually. Flyway will re-apply the
> migration and may conflict with existing data.

### Option C: Hard reset (last resort)

Drop the Railway service, recreate it, and redeploy from a known-good commit.
The Postgres plugin data will be preserved if you only recreate the app service.

---

## Checklist Before Going Live

- [ ] `SPRING_PROFILES_ACTIVE=prod` is set
- [ ] All five `PG*` variables appear in Variables tab (injected by Postgres plugin)
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are set
- [ ] `APP_CORS_ALLOWED_ORIGINS` is set to the real frontend URL
- [ ] `APP_AUTH_FRONTEND_BASE_URL` is set to the real frontend URL
- [ ] Health check returns `{"status":"UP"}`
- [ ] Flyway history shows all migrations as `success = true`
- [ ] Login and register endpoints return 200
- [ ] No secrets committed to git (run `git log --all -S "secret"` to verify)
