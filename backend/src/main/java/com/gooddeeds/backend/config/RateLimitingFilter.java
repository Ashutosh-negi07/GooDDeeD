package com.gooddeeds.backend.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting filter using a sliding window counter per IP address.
 * Auth endpoints have a stricter limit to prevent brute-force attacks.
 */
@Component
@Order(1)
public class RateLimitingFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    @Value("${rate-limit.general.max-requests:100}")
    private int generalMaxRequests;

    @Value("${rate-limit.general.window-seconds:60}")
    private int generalWindowSeconds;

    @Value("${rate-limit.auth.max-requests:10}")
    private int authMaxRequests;

    @Value("${rate-limit.auth.window-seconds:60}")
    private int authWindowSeconds;

    private record WindowCounter(AtomicInteger count, Instant windowStart) {}

    private final Map<String, WindowCounter> generalBucket = new ConcurrentHashMap<>();
    private final Map<String, WindowCounter> authBucket    = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  request  = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String ip      = getClientIp(request);
        String path    = request.getRequestURI();
        boolean isAuth = path.startsWith("/api/auth/");

        if (isAuth) {
            if (!allow(ip, authBucket, authMaxRequests, authWindowSeconds)) {
                log.warn("RATE_LIMIT_EXCEEDED ip={} path={} type=AUTH", ip, path);
                sendTooManyRequests(response, authWindowSeconds);
                return;
            }
        } else {
            if (!allow(ip, generalBucket, generalMaxRequests, generalWindowSeconds)) {
                log.warn("RATE_LIMIT_EXCEEDED ip={} path={} type=GENERAL", ip, path);
                sendTooManyRequests(response, generalWindowSeconds);
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean allow(String ip, Map<String, WindowCounter> bucket, int max, int windowSec) {
        Instant now = Instant.now();

        WindowCounter counter = bucket.compute(ip, (key, existing) -> {
            if (existing == null || now.isAfter(existing.windowStart().plusSeconds(windowSec))) {
                return new WindowCounter(new AtomicInteger(1), now);
            }
            return existing;
        });

        return counter.count().getAndIncrement() < max;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        return (realIp != null && !realIp.isBlank()) ? realIp : request.getRemoteAddr();
    }

    private void sendTooManyRequests(HttpServletResponse response, int retryAfter)
            throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setHeader("Retry-After", String.valueOf(retryAfter));
        response.getWriter().write(
            "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\",\"status\":429}"
        );
    }
}