# UniShare

UniShare is a full-stack campus rental marketplace where students can list items, book them, and manage rentals in one place.

## Problem Statement

Students often need short-term access to textbooks, tools, electronics, and other useful items, but buying them outright is expensive and wasteful. UniShare solves this by giving students a trusted campus-focused platform to share, rent, and review items inside their community.

## Features

- User registration and login with session-based authentication
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

### 3. Configure environment variables (optional)

Create a root `.env` file only if you want to override the defaults or enable Cloudinary uploads:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/pm_project_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run the backend

```bash
./gradlew bootRun
```

The backend runs on `http://localhost:8080`.

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

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
