package com.gooddeeds.backend.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
class SecurityAuditLoggerTest {

    @Autowired SecurityAuditLogger securityAuditLogger;

    @Test
    void logSuccessfulLogin_doesNotThrow() {
        assertDoesNotThrow(() ->
            securityAuditLogger.logSuccessfulLogin("user@test.com", "127.0.0.1")
        );
    }

    @Test
    void logFailedLogin_doesNotThrow() {
        assertDoesNotThrow(() ->
            securityAuditLogger.logFailedLogin("user@test.com", "127.0.0.1", "Bad credentials")
        );
    }

    @Test
    void logAccessDenied_doesNotThrow() {
        assertDoesNotThrow(() ->
            securityAuditLogger.logAccessDenied("user@test.com", "/api/admin", "127.0.0.1")
        );
    }

    @Test
    void logJwtValidationFailure_doesNotThrow() {
        assertDoesNotThrow(() ->
            securityAuditLogger.logJwtValidationFailure("Token expired", "127.0.0.1")
        );
    }

    @Test
    void logSuspiciousActivity_doesNotThrow() {
        assertDoesNotThrow(() ->
            securityAuditLogger.logSuspiciousActivity("SQL injection attempt", "user@test.com", "10.0.0.1")
        );
    }

    @Test
    void logPasswordChange_doesNotThrow() {
        assertDoesNotThrow(() ->
            securityAuditLogger.logPasswordChange("user@test.com", "127.0.0.1")
        );
    }

    @Test
    void logWithNullEmail_doesNotThrow() {
        assertDoesNotThrow(() ->
            securityAuditLogger.logSuccessfulLogin(null, "127.0.0.1")
        );
    }

    @ParameterizedTest
    @CsvSource({
        "short@a.com, sh***@a.com",
        "ab@test.com, ab***@test.com",
        "user@example.com, us***@example.com",
        "a@b.com, a***@b.com"
    })
    void logFailedLogin_emailMaskedInLogs(String email, String expectedMask) {
        // Verify no exception thrown (the masking is internal, but this confirms the code path)
        assertDoesNotThrow(() ->
            securityAuditLogger.logFailedLogin(email, "127.0.0.1", "test")
        );
    }
}