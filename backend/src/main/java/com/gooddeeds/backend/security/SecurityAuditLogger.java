package com.gooddeeds.backend.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Security audit logger for tracking security-related events
 * All security events should be logged through this component
 */
@Component
public class SecurityAuditLogger {

    private static final Logger securityLogger = LoggerFactory.getLogger("com.gooddeeds.backend.security");

    /**
     * Log successful login attempt
     */
    public void logSuccessfulLogin(String userEmail, String ipAddress) {
        securityLogger.info("SECURITY_EVENT=LOGIN_SUCCESS user={} ip={}",
            maskEmail(userEmail), ipAddress);
    }

    /**
     * Log failed login attempt
     */
    public void logFailedLogin(String userEmail, String ipAddress, String reason) {
        securityLogger.warn("SECURITY_EVENT=LOGIN_FAILED user={} ip={} reason={}",
            maskEmail(userEmail), ipAddress, reason);
    }

    /**
     * Log account lockout
     */
    public void logAccountLockout(String userEmail, String ipAddress) {
        securityLogger.warn("SECURITY_EVENT=ACCOUNT_LOCKOUT user={} ip={}",
            maskEmail(userEmail), ipAddress);
    }

    /**
     * Log password change
     */
    public void logPasswordChange(String userEmail, String ipAddress) {
        securityLogger.info("SECURITY_EVENT=PASSWORD_CHANGE user={} ip={}",
            maskEmail(userEmail), ipAddress);
    }

    /**
     * Log access denied
     */
    public void logAccessDenied(String userEmail, String resource, String ipAddress) {
        securityLogger.warn("SECURITY_EVENT=ACCESS_DENIED user={} resource={} ip={}",
            maskEmail(userEmail), resource, ipAddress);
    }

    /**
     * Log JWT token validation failure
     */
    public void logJwtValidationFailure(String reason, String ipAddress) {
        securityLogger.warn("SECURITY_EVENT=JWT_VALIDATION_FAILED reason={} ip={}",
            reason, ipAddress);
    }

    /**
     * Log suspicious activity
     */
    public void logSuspiciousActivity(String activity, String userEmail, String ipAddress) {
        securityLogger.warn("SECURITY_EVENT=SUSPICIOUS_ACTIVITY activity={} user={} ip={}",
            activity, maskEmail(userEmail), ipAddress);
    }

    /**
     * Mask email for privacy - shows first 2 chars and domain
     * Example: jo***@example.com
     */
    private String maskEmail(String email) {
        if (email == null || email.length() < 3) {
            return "***";
        }

        int atIndex = email.indexOf('@');
        if (atIndex == -1) {
            return email.substring(0, 2) + "***";
        }

        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);

        if (localPart.length() <= 2) {
            return localPart + "***" + domain;
        }

        return localPart.substring(0, 2) + "***" + domain;
    }
}