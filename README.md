# UniShare

A campus peer-to-peer rental marketplace. Students list items, others book them, and everyone leaves reviews after completed rentals.

Built for a university environment where trust matters — accounts are managed, users can be moderated, and the booking lifecycle is explicit (request → approve → handover → return).

---

## Features

- **Auth** — register, login, token-based sessions, role/permission system
- **Listings** — create, edit, publish/hide items with image support (Cloudinary)
- **Bookings** — full lifecycle: PENDING → APPROVED → ACTIVE → COMPLETED (or REJECTED / CANCELLED)
- **Reviews** — leave a review after a completed booking; displayed on item pages with average rating
- **Dashboard** — manage your listings and track bookings as both renter and owner
- **Admin panel** — platform stats, user ban/unban, item moderation

---

## Stack

**Backend**
- Java 21, Spring Boot 3
- PostgreSQL + Flyway migrations
- Spring Security (token-based, stateless)
- Cloudinary for image storage

**Frontend**
- React 19, TypeScript, Vite
- React Router v7, TanStack Query v5
- Tailwind CSS v4
- React Hook Form + Zod

---

## Running locally

### Prerequisites

- Java 21+
- Node.js 18+
- Docker (for the database)

### 1. Start the database

```bash
docker-compose up -d
```

This starts a PostgreSQL instance on port `5433` with database `pm_project_db`.

### 2. Backend

```bash
./gradlew bootRun
```

The API runs on `http://localhost:8080`. Flyway runs migrations automatically on startup.

To override database credentials or add Cloudinary config, create a `.env` file in the project root:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/pm_project_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Image upload works without Cloudinary configured — items just won't have images.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api/*` to the backend automatically.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5433/pm_project_db` | Database URL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | DB password |
| `CLOUDINARY_CLOUD_NAME` | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | — | Cloudinary API secret |
| `VITE_API_URL` | `/api` (proxied) | Frontend API base URL (production only) |

---

## Screenshots

_TODO: add screenshots of home page, item detail, dashboard, admin panel_

---

## What's missing / future work

- Item search is basic — no full-text ranking or relevance sorting
- Booking item titles are fetched per-row on the dashboard (N+1); worth a batch endpoint
- No email notifications for booking status changes
- No user profile pages — owner info on listings is currently just a user ID
- Mobile image upload not tested end-to-end
- No test coverage on the frontend
