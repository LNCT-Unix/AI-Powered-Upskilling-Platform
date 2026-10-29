# ==============================================================================
# Stage 1: Build the Spring Boot Application
# ==============================================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Cache Maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy application sources and build executable JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-privileged user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /workspace/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

