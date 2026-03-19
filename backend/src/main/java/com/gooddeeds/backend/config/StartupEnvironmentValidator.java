package com.gooddeeds.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class StartupEnvironmentValidator implements ApplicationRunner {

    private static final List<String> REQUIRED_PROPERTIES = List.of(
            "jwt.secret",
            "spring.datasource.url",
            "spring.datasource.username"
    );

    private final Environment environment;

    public StartupEnvironmentValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        validateRequiredProperties();
        validateJwtSecret();
        validateNoPlaceholders();
    }

    private void validateRequiredProperties() {
        for (String key : REQUIRED_PROPERTIES) {
            String value = environment.getProperty(key);
            if (value == null || value.isBlank()) {
                throw new IllegalStateException("Missing required environment configuration: " + key);
            }
        }
    }

    private void validateJwtSecret() {
        String secret = environment.getProperty("jwt.secret", "");
        int secretBytes = secret.getBytes(StandardCharsets.UTF_8).length;
        if (secretBytes < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes");
        }
    }

    private void validateNoPlaceholders() {
        rejectPlaceholder("jwt.secret", "replace_with_");
        rejectPlaceholder("spring.datasource.password", "change_me");
        rejectPlaceholder("spring.datasource.username", "change_me");
    }

    private void rejectPlaceholder(String key, String marker) {
        String value = environment.getProperty(key, "").trim().toLowerCase();
        if (value.contains(marker)) {
            throw new IllegalStateException("Placeholder value detected for " + key + ". Replace it before startup.");
        }
    }
}
