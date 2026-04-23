# UniShare — Code Audit

**Date:** 2026-04-23  
**Stack:** Spring Boot 3.5 / Java 17 + React 19 / TypeScript 6

---

## Architecture

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.5, Java 17, Spring Data JPA, Flyway, PostgreSQL 15 |
| Auth | Stateless opaque tokens (UUID), custom TokenFilter, x-session header |
| Image storage | Cloudinary (server-signed client-side upload) |
| Frontend | React 19, TypeScript 6, Vite 8, TanStack Query v5, React Hook Form + Zod, Tailwind CSS v4 |
| Routing | React Router v7 |
| Deployment | Railway (two services), Docker multi-stage, nginx 1.27 |

Controllers are thin, business logic lives in services, schema versioning goes through Flyway. No structural problems. Everything below is specific and fixable.

---

## Issues

### Critical

**C1 — Plaintext password bypass** `SecurityConfig.java:42-48`  
The custom `PasswordEncoder.matches()` does a raw string comparison when the stored value has no BCrypt prefix. The seed admin row in `V0.0.1` has `password = 'password'` as literal text. On any production database that ran that migration and nothing else, `admin` / `password` logs in as a full admin without any hashing involved.

**C2 — Password field leaking in admin API** `AdminController.java:25`, `User.java`  
`GET /admin/users` returns the JPA entity directly. `User.password` has no `@JsonIgnore`, so every admin API call includes password hashes in the response body — and the plaintext string for the seed account. Same issue on `banUser()` and `unbanUser()`.

**C3 — No logout; tokens live forever** `TokenService.java`, `OpaqueTokenRepository.java`  
`findAllByUserIdAndRevokedFalse()` exists in the repository but is never called. There is no `POST /auth/logout`. Tokens expire after 7 days and cannot be revoked earlier. The frontend `logout()` clears localStorage but leaves the token valid on the server.

**C4 — No tests**  
`testImplementation` is in `build.gradle`, zero test files exist anywhere.

---

### Important

**I1 — Stats endpoint loads all reviews into memory** `AdminService.java:91-95`  
`reviewRepository.findAll()` then `.stream().mapToInt().average()` — a full table load to compute one number. `SELECT AVG(rating) FROM reviews` does the same thing in the database.

**I2 — Dashboard filters items client-side** `dashboard-page.tsx:70-74`  
`fetchItems({ size: 100 })` then `.filter(item => item.ownerId === userId)` in JavaScript. Anyone with more than 100 listings gets truncated results with no error or indication. Backend needs an `ownerId` param.

**I3 — UserSession.java is empty** `model/user/entity/UserSession.java`  
Package declaration and an empty class body. No references anywhere.

**I4 — UserDto.java is unreachable** `model/user/dto/UserDto.java`  
Private fields, no Lombok, no getters or setters, never imported anywhere.

**I5 — Kotlin in a Java-only project** `build.gradle:6,50`, `settings.gradle:1-5`  
The Kotlin JVM plugin and `kotlin-stdlib-jdk8` are declared. There are no `.kt` files. Unnecessary compiler + runtime overhead.

**I6 — spring-boot-starter-data-jdbc unused** `build.gradle:29`  
Project uses JPA only. Nothing calls `JdbcTemplate`.

**I7 — Admin list endpoints have no pagination**  
`getUsers()`, `getItems()`, and `getBookings()` in `AdminService` all call `findAll()` with no row limit.

**I8 — ResetPasswordRequest field name mismatch**  
Backend DTO field: `newPassword`. Frontend sends: `password`. Dormant because the endpoint throws 501, but will break on first real implementation.

---

### Minor

**M1** — `ItemDetailPage` shows `User #123` instead of a username. `ItemResponse` DTO is missing `ownerUsername`.

**M2** — Token TTL hardcoded: `LocalDateTime.now().plusDays(7)` in `TokenService.createToken()`.

**M3** — `ReviewRepository.countBy()` duplicates the inherited `count()` method.

**M4** — `show-sql: true` in the default `application.yml` logs every query in all environments.

---

## Feature status

| Feature | Status | Notes |
|---|---|---|
| Registration | OK | Works end-to-end |
| Login | WARN | Works, plaintext bypass exists (C1) |
| Email verification | MISSING | All four email endpoints return 501 |
| Password reset | MISSING | Returns 501, frontend UI exists |
| Logout | PARTIAL | Clears localStorage only, token stays valid on server (C3) |
| Browse / search items | OK | Pagination, filters all work |
| Create / edit / delete listing | OK | Includes Cloudinary image upload |
| Publish / hide listing | OK | |
| Booking lifecycle | OK | All status transitions enforced |
| Reviews | OK | Gated on COMPLETED booking, one per booking |
| Admin — users | WARN | Password field in response (C2) |
| Admin — items | OK | |
| Admin — stats | WARN | Full table scan (I1) |
| Dashboard — my listings | WARN | Truncates at 100 (I2) |
| Dashboard — bookings | OK | |

---

## What was changed

| File | Change |
|---|---|
| `SecurityConfig.java` | Replaced custom `PasswordEncoder` with `new BCryptPasswordEncoder()` |
| `V0.0.7__hash_admin_password.sql` | Updates the seed admin password to a BCrypt hash |
| `User.java` | Added `@JsonIgnore` on `password` |
| `TokenService.java` | Added `revokeToken(String tokenValue)` |
| `AuthController.java` | Added `POST /auth/logout` |
| `auth.ts` | Added `logoutRequest()` |
| `auth-provider.tsx` | `logout()` now calls the API before clearing localStorage |
| `ReviewRepository.java` | Added `findAverageRating()` with `SELECT AVG` |
| `AdminService.java` | `getStats()` uses the aggregate query |
| `ItemSpecs.java` | Added `ownerOf(Long ownerId)` |
| `ItemController.java` | Added `ownerId` filter param on `GET /items` |
| `types.ts` | Added `ownerId` to `ItemsQuery` |
| `dashboard-page.tsx` | Passes `ownerId: userId` to the backend |
| `build.gradle` | Removed Kotlin plugin, `kotlin-stdlib-jdk8`, `spring-boot-starter-data-jdbc` |
| `settings.gradle` | Removed Kotlin `pluginManagement` block |
| `UserSession.java` | Deleted |
| `UserDto.java` | Deleted |

---

## Verification

```
npm run build             → 0 errors, 231 modules
plaintext fallback        → removed
@JsonIgnore on password   → confirmed
POST /auth/logout         → present, revokes token in DB
findAverageRating() query → SELECT AVG, no findAll()
GET /items?ownerId=X      → wired through spec + controller
dashboard ownerId filter  → server-side, not client-side
dead files                → deleted
Kotlin                    → removed from build
data-jdbc                 → removed from build
```

Still open: email verification, password reset, tests, admin pagination, token TTL config.
