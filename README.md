# UniShare

UniShare is a full-stack campus rental marketplace where students can list items, book them, and manage rentals in one place.

## Problem Statement

Students often need short-term access to textbooks, tools, electronics, and other useful items, but buying them outright is expensive and wasteful. UniShare solves this by giving students a trusted campus-focused platform to share, rent, and review items inside their community.

## Features

- User registration and login with session-based authentication
- Email confirmation before first sign-in
- Password reset via secure email link
- Browse, search, and filter item listings by category
- Create, edit, publish, hide, and delete listings
- Upload and manage listing images
- Booking lifecycle management: request, approve, reject, hand over, return, and cancel
- Reviews for completed rentals
- Personal dashboard for listings and bookings
- Admin panel for user moderation, item moderation, and platform statistics
- Swagger / OpenAPI documentation for backend endpoints

## Project Structure

```text
.
├── src/                # Spring Boot backend source
├── frontend/           # React + Vite frontend
├── docs/               # Repository docs and API collection
├── tests/              # Reserved for future repository-level tests
├── assets/             # Screenshots and shared media
├── build.gradle
├── docker-compose.yml
└── README.md
```

## Installation

### Prerequisites

- Java 17
- Node.js 18+ and npm
- Docker Desktop or local PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/Aqyn97/UniShare.git
cd PMProject
```

### 2. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5433`.

### 3. Configure environment variables

Create a root `.env` file. Database settings can use the defaults, but auth email links now need frontend and mail configuration.

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/pm_project_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

APP_AUTH_FRONTEND_BASE_URL=http://localhost:5173
APP_AUTH_MAIL_MODE=log
APP_AUTH_MAIL_FROM=no-reply@unishare.local

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

`APP_AUTH_MAIL_MODE=log` is the easiest mode for local development. In this mode, confirmation and reset links are written to the backend logs instead of being sent to a real mailbox.

If you want real emails, switch to SMTP mode:

```env
APP_AUTH_MAIL_MODE=smtp
APP_AUTH_MAIL_FROM=no-reply@yourdomain.com
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_app_password
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
```

Without `APP_AUTH_FRONTEND_BASE_URL`, email links may point to the wrong frontend address.

### 4. Run the backend

```bash
./gradlew bootRun
```

The backend runs on `http://localhost:8080`.

On first start after pulling the latest changes, Flyway will add the email verification and password reset tables automatically.

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Authentication Flow

- After registration, the user is redirected to an email confirmation page.
- The user cannot sign in until the email is confirmed.
- If `APP_AUTH_MAIL_MODE=log`, copy the confirmation/reset link from the backend logs.
- If SMTP is configured, the user receives a real email with the confirmation or password reset link.
- Password reset is available from the login page through the "Forgot password?" link.

## Usage

1. Open the frontend in your browser.
2. Register a new account or sign in.
3. Browse available listings from the home page.
4. Filter listings by keyword or category.
5. Create your own listing from the dashboard.
6. Send booking requests and manage rental activity.
7. Open the admin panel if your account has admin access.

## Screenshots

No screenshots have been added yet. If needed, place them in `assets/` and reference them here.

## Technology Stack

- Backend: Java 17, Spring Boot, Spring Security, Spring Data JPA, Flyway
- Database: PostgreSQL
- API Docs: Springdoc OpenAPI / Swagger UI
- Frontend: React, TypeScript, Vite, React Router
- Frontend Data Layer: Axios, TanStack Query, React Hook Form, Zod
- Styling: Tailwind CSS
- Tooling: Gradle, npm, Docker Compose

## API and Docs

- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- Postman collection: `docs/api/unishare-postman-collection.json`
