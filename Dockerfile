# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Copy Gradle wrapper first so its distribution is cached as its own layer.
COPY gradlew .
COPY gradle/ gradle/

# Ensure gradlew is executable (may be stripped on Windows checkouts).
RUN chmod +x gradlew

# Download Gradle distribution before copying source (cache layer).
RUN ./gradlew --version

# Copy build scripts separately so dependency resolution is cached
# and only invalidated when build.gradle or settings.gradle changes.
COPY build.gradle settings.gradle ./

RUN ./gradlew dependencies --no-daemon 2>/dev/null || true

# Copy full source tree.
COPY src/ src/

# Build the fat JAR; skip tests (tests need a live DB).
RUN ./gradlew clean bootJar --no-daemon -x test

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre AS runtime

WORKDIR /app

# Run as non-root for security.
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=builder /app/build/libs/*.jar app.jar

RUN chown appuser:appgroup app.jar
USER appuser

# Railway injects PORT; Spring picks it up via server.port=${PORT:8080}.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
