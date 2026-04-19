# Railway Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the UniShare Spring Boot backend deployable to Railway by fixing a broken build, patching a schema gap, and adding all required Railway deployment artifacts — without changing any existing dev behavior.

**Architecture:** Fix compile errors by stubbing missing AuthService/DTOs, add a Flyway migration for the missing `email_verified` column, remove unused Kafka, wire CORS + Actuator, create `application-prod.yml` reading Railway env vars, and produce a multi-stage Dockerfile + Railway config files.

**Tech Stack:** Java 17, Spring Boot 3.5.11, Gradle 8.14.4 (Groovy DSL), Flyway, PostgreSQL, Cloudinary, Spring Security (opaque tokens), Spring Mail, Spring Actuator (to be added).

**Constraints:** No commits. No pushes. No changes to dev behavior. Every change justified by "build was broken" or "Railway requires this."

---

## File Map

| File | Action | Justification |
|---|---|---|
| `src/main/java/kz/pmproject/model/user/dto/EmailRequest.java` | **Create** | Build broken — referenced by `AuthController` |
| `src/main/java/kz/pmproject/model/user/dto/ResetPasswordRequest.java` | **Create** | Build broken — referenced by `AuthController` |
| `src/main/java/kz/pmproject/service/AuthService.java` | **Create** | Build broken — referenced by `AuthController` |
| `src/main/resources/db.migration/V0.0.6__add_email_verified.sql` | **Create** | Schema mismatch — `User.email_verified` has no migration |
| `src/main/java/kz/pmproject/config/CorsConfig.java` | **Create** | Frontend would be blocked without CORS — env-driven |
| `build.gradle` | **Modify** | Remove unused Kafka; add Actuator (Railway health check) |
| `src/main/resources/application.yml` | **Modify** | `server.port: ${PORT:8080}` (Railway requires dynamic port) |
| `src/main/resources/application-prod.yml` | **Create** | Prod profile reading Railway env vars |
| `Dockerfile` | **Create** | Railway requires a container build spec |
| `railway.json` | **Create** | Railway build/start/health check config |
| `.env.example` | **Create** | Documents all required env vars |
| `RAILWAY_DEPLOY.md` | **Create** | Step-by-step deployment instructions |

---

### Task 1: Create missing DTOs (EmailRequest, ResetPasswordRequest)

**Files:**
- Create: `src/main/java/kz/pmproject/model/user/dto/EmailRequest.java`
- Create: `src/main/java/kz/pmproject/model/user/dto/ResetPasswordRequest.java`

**Justification:** Build broken — `AuthController` imports and uses these classes.

- [ ] **Step 1: Create EmailRequest.java**

```java
// src/main/java/kz/pmproject/model/user/dto/EmailRequest.java
package kz.pmproject.model.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmailRequest {

    @NotBlank
    @Email
    private String email;
}
```

- [ ] **Step 2: Create ResetPasswordRequest.java**

```java
// src/main/java/kz/pmproject/model/user/dto/ResetPasswordRequest.java
package kz.pmproject.model.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank
    private String token;

    @NotBlank
    @Size(min = 8)
    private String newPassword;
}
```

- [ ] **Step 3: Verify these match exactly what AuthController calls**

Check `AuthController.java` lines 55, 60, 65 — `resendVerification(EmailRequest)`, `forgotPassword(EmailRequest)`, `resetPassword(ResetPasswordRequest)`. Both class names must match the imports at lines 10–12.

---

### Task 2: Create AuthService stub

**Files:**
- Create: `src/main/java/kz/pmproject/service/AuthService.java`

**Justification:** Build broken — `AuthController` declares `private final AuthService authService` and calls 6 methods on it.

The existing `TokenService.createToken(User)` and `UserRepository` are already in scope — login and register can use them. Email flows are stubbed.

Look at `AuthController` to understand the expected return types:
- `login()` → `Map<String, Object>`
- `register()` → `Map<String, Object>`
- `verifyEmail(String token)` → `Map<String, Object>`
- `resendVerification(EmailRequest)` → `Map<String, Object>`
- `forgotPassword(EmailRequest)` → `Map<String, Object>`
- `resetPassword(ResetPasswordRequest)` → `Map<String, Object>`

Look at `User` entity: has `username`, `password`, `email`, `emailVerified`, `enabled`, `roles`.
Look at `UserRepository`: has `findByUsername`, `findByEmail`, `existsByUsername`, `existsByEmail`.
Look at `TokenService`: has `createToken(User)` returning `String`.
Look at `RoleRepository`: has standard JPA — use `findAll()` and filter by name.

- [ ] **Step 1: Create AuthService.java**

```java
// src/main/java/kz/pmproject/service/AuthService.java
package kz.pmproject.service;

import kz.pmproject.model.user.dto.EmailRequest;
import kz.pmproject.model.user.dto.LoginRequest;
import kz.pmproject.model.user.dto.RegisterRequest;
import kz.pmproject.model.user.dto.ResetPasswordRequest;
import kz.pmproject.model.user.entity.Role;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.RoleRepository;
import kz.pmproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Transactional
    public Map<String, Object> login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account disabled");
        }

        String token = tokenService.createToken(user);
        return Map.of("token", token, "username", user.getUsername());
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        Role userRole = roleRepository.findAll().stream()
                .filter(r -> "USER".equals(r.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("USER role not seeded in DB"));

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .emailVerified(false)
                .enabled(true)
                .roles(Set.of(userRole))
                .build();

        userRepository.save(user);
        String token = tokenService.createToken(user);
        return Map.of("token", token, "username", user.getUsername());
    }

    // TODO: Implement email verification flow (send token via email, verify on click)
    public Map<String, Object> verifyEmail(String token) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Email verification not yet implemented");
    }

    // TODO: Implement resend verification email flow
    public Map<String, Object> resendVerification(EmailRequest request) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Resend verification not yet implemented");
    }

    // TODO: Implement forgot-password email flow (generate reset token, email it)
    public Map<String, Object> forgotPassword(EmailRequest request) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Forgot password not yet implemented");
    }

    // TODO: Implement password reset (validate reset token, update password)
    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Reset password not yet implemented");
    }
}
```

- [ ] **Step 2: Check Role entity for `getName()` method**

Open `Role.java`. Confirm it has a field `name` (or `getName()`). If it uses an enum/String, match the call in AuthService to that type.

---

### Task 3: Compile check — fix build errors

- [ ] **Step 1: Run compile only**

```bash
./gradlew compileJava
```

Expected: `BUILD SUCCESSFUL`. If errors remain, check the import paths and class names exactly.

---

### Task 4: Add Flyway migration for email_verified column

**Files:**
- Create: `src/main/resources/db.migration/V0.0.6__add_email_verified.sql`

**Justification:** `User.java` declares `@Column(name = "email_verified", nullable = false)` but no migration creates it. With `ddl-auto: validate`, the app fails to start.

Backfill rule: set `false` for existing rows BEFORE adding `NOT NULL` constraint to avoid constraint violation on existing DBs.

- [ ] **Step 1: Create the migration**

```sql
-- V0.0.6__add_email_verified.sql
-- Adds email_verified column to users.
-- Backfills false for existing rows before applying NOT NULL.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN;
UPDATE users SET email_verified = false WHERE email_verified IS NULL;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT false;
```

- [ ] **Step 2: Verify migration numbering**

Existing migrations: V0.0.1, V0.0.2, V0.0.3, V0.0.4, V0.0.5. New one is V0.0.6. Order is intact. Flyway uses lexicographic versioning — `0.0.6 > 0.0.5`. ✓

---

### Task 5: Remove Kafka, add Actuator

**Files:**
- Modify: `build.gradle`

**Justification:** `spring-kafka` and `spring-kafka-test` are unused but Spring Boot auto-configures Kafka on startup, attempting to connect to `localhost:9092` — causes startup failure in prod. `spring-boot-starter-actuator` is needed for `/actuator/health` health check Railway pings.

- [ ] **Step 1: Edit build.gradle**

Remove these two lines:
```groovy
implementation 'org.springframework.kafka:spring-kafka'
// ... later in dependencies:
testImplementation 'org.springframework.kafka:spring-kafka-test'
```

Add this line in the `dependencies` block:
```groovy
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

The final `dependencies` block should look like:
```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jdbc'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-mail'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'

    implementation 'org.postgresql:postgresql:42.7.8'
    implementation 'org.flywaydb:flyway-core'
    runtimeOnly 'org.flywaydb:flyway-database-postgresql'

    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9'

    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
    implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk8"
}
```

---

### Task 6: Fix server.port and disable Kafka auto-config (application.yml)

**Files:**
- Modify: `src/main/resources/application.yml`

**Justification:** `server.port: 8080` is hardcoded — Railway injects `PORT` env var and will route to whatever port the app binds. Must use `${PORT:8080}`.

- [ ] **Step 1: Change server.port**

In `application.yml`, change:
```yaml
server:
  port: 8080
```
to:
```yaml
server:
  port: ${PORT:8080}
  address: 0.0.0.0
```

No other changes to `application.yml` — dev defaults must remain intact.

---

### Task 7: Add CORS configuration

**Files:**
- Create: `src/main/java/kz/pmproject/config/CorsConfig.java`

**Justification:** Zero CORS config exists. Browser preflight requests from the frontend will be blocked (HTTP 403). Needed in dev and prod.

- [ ] **Step 1: Create CorsConfig.java**

```java
// src/main/java/kz/pmproject/config/CorsConfig.java
package kz.pmproject.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                String[] origins = Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isBlank())
                        .toArray(String[]::new);

                registry.addMapping("/**")
                        .allowedOrigins(origins)
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}
```

---

### Task 8: Create application-prod.yml

**Files:**
- Create: `src/main/resources/application-prod.yml`

**Justification:** Railway deployment requires a prod profile. This file overrides only the settings that differ in prod.

Railway Postgres plugin injects: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

- [ ] **Step 1: Create application-prod.yml**

```yaml
# application-prod.yml — activated by SPRING_PROFILES_ACTIVE=prod on Railway
# All values must come from Railway environment variables.
# Do NOT add hardcoded secrets here.

spring:
  datasource:
    url: jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
    username: ${PGUSER}
    password: ${PGPASSWORD}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: false

  flyway:
    enabled: true
    baseline-on-migrate: true
    baseline-version: 0
    locations: classpath:db.migration

  mail:
    host: ${SPRING_MAIL_HOST:}
    port: ${SPRING_MAIL_PORT:587}
    username: ${SPRING_MAIL_USERNAME:}
    password: ${SPRING_MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

cloudinary:
  cloudName: ${CLOUDINARY_CLOUD_NAME}
  apiKey: ${CLOUDINARY_API_KEY}
  apiSecret: ${CLOUDINARY_API_SECRET}

app:
  cors:
    allowed-origins: ${APP_CORS_ALLOWED_ORIGINS:http://localhost:5173}
  auth:
    frontend-base-url: ${APP_AUTH_FRONTEND_BASE_URL}
    # NOTE: Change to "send" and configure SPRING_MAIL_* when email features are implemented
    mail-mode: ${APP_AUTH_MAIL_MODE:log}
    mail-from: ${APP_AUTH_MAIL_FROM:no-reply@unishare.local}
    verification-ttl-hours: ${APP_AUTH_VERIFICATION_TTL_HOURS:24}
    password-reset-ttl-minutes: ${APP_AUTH_PASSWORD_RESET_TTL_MINUTES:30}

management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: never

logging:
  level:
    org.flywaydb: INFO
    root: WARN
    kz.pmproject: INFO
```

---

### Task 9: Create Dockerfile

**Files:**
- Create: `Dockerfile`

**Justification:** Railway needs a container build spec. Multi-stage keeps the image small.

Stage 1 (builder): Uses `eclipse-temurin:17-jdk` + Gradle wrapper to produce the fat JAR.
Stage 2 (runtime): Uses `eclipse-temurin:17-jre` — no build tools, smaller image.

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Copy wrapper first so Gradle distribution is cached as its own layer
COPY gradlew .
COPY gradle/ gradle/

# Give execute permission (may be stripped on Windows checkout)
RUN chmod +x gradlew

# Download Gradle distribution before copying source (cache layer)
RUN ./gradlew --version

# Copy build scripts
COPY build.gradle settings.gradle ./

# Pre-fetch dependencies (cache layer — invalidated only when build.gradle changes)
RUN ./gradlew dependencies --no-daemon 2>/dev/null || true

# Copy full source
COPY src/ src/

# Build, skip tests (tests require a running DB)
RUN ./gradlew clean bootJar --no-daemon -x test

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre AS runtime

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=builder /app/build/libs/*.jar app.jar

RUN chown appuser:appgroup app.jar
USER appuser

# Railway injects PORT — Spring picks it up via server.port=${PORT:8080}
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

### Task 10: Create railway.json

**Files:**
- Create: `railway.json`

**Justification:** Tells Railway how to build, start, and health-check the service.

- [ ] **Step 1: Create railway.json**

```json
{
  "$schema": "https://schema.railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "java -jar app.jar",
    "healthcheckPath": "/actuator/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

---

### Task 11: Create .env.example

**Files:**
- Create: `.env.example`

**Justification:** Documents every env var the app needs. No real secrets.

- [ ] **Step 1: Create .env.example**

```bash
# ─── Spring Profile ───────────────────────────────────────────────────────────
# Set to "prod" on Railway. Activates application-prod.yml.
SPRING_PROFILES_ACTIVE=prod

# ─── Server ───────────────────────────────────────────────────────────────────
# Railway injects PORT automatically — do NOT set this manually on Railway.
# Required only for local non-Docker runs that need a specific port.
# PORT=8080

# ─── Database (Railway Postgres plugin injects these automatically) ────────────
# Verify under Railway project → Variables tab after adding the Postgres plugin.
PGHOST=your-railway-postgres-host.railway.internal
PGPORT=5432
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=your-generated-password

# ─── Cloudinary (image upload signing) ───────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Comma-separated list of allowed frontend origins. No trailing slash.
# Example for Railway frontend: https://unishare-frontend.up.railway.app
APP_CORS_ALLOWED_ORIGINS=https://your-frontend.up.railway.app

# ─── App / Auth ───────────────────────────────────────────────────────────────
# Base URL of the frontend — used in email links (when email is implemented)
APP_AUTH_FRONTEND_BASE_URL=https://your-frontend.up.railway.app

# Email sending mode: "log" (prints to console) or "send" (real SMTP)
# Keep as "log" until email features are implemented.
APP_AUTH_MAIL_MODE=log

# "From" address used in outgoing emails
APP_AUTH_MAIL_FROM=no-reply@yourdomain.com

# How long email-verification links stay valid (hours)
APP_AUTH_VERIFICATION_TTL_HOURS=24

# How long password-reset links stay valid (minutes)
APP_AUTH_PASSWORD_RESET_TTL_MINUTES=30

# ─── Mail / SMTP (only needed when APP_AUTH_MAIL_MODE=send) ──────────────────
# SPRING_MAIL_HOST=smtp.gmail.com
# SPRING_MAIL_PORT=587
# SPRING_MAIL_USERNAME=you@gmail.com
# SPRING_MAIL_PASSWORD=your-app-password
```

---

### Task 12: Create RAILWAY_DEPLOY.md

**Files:**
- Create: `RAILWAY_DEPLOY.md`

- [ ] **Step 1: Create RAILWAY_DEPLOY.md**

(See full content in implementation — too long for plan, content is documentation-only)

---

### Task 13: Full build verification

- [ ] **Step 1: Clean build**
```bash
./gradlew clean build
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 2: Run tests**
```bash
./gradlew test
```
Expected: `BUILD SUCCESSFUL` (no test classes exist yet — passes trivially)

- [ ] **Step 3: Verify app starts on dev profile (requires local Postgres on port 5433)**
```bash
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun
```
Expected: `Started PMProjectApplication` without errors. Check that Flyway runs V0.0.6 successfully.
