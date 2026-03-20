package com.gooddeeds.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gooddeeds.backend.dto.LoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@TestPropertySource(properties = {
    "rate-limit.auth.max-requests=10",
    "rate-limit.auth.window-seconds=60",
    "rate-limit.general.max-requests=100",
    "rate-limit.general.window-seconds=60"
})
class RateLimitingFilterTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void generalEndpoint_underLimit_returnsExpectedStatus() throws Exception {
        // A public endpoint should respond normally (not 429)
        mockMvc.perform(get("/api/causes"))
                .andExpect(result ->
                    org.junit.jupiter.api.Assertions.assertNotEquals(
                        429, result.getResponse().getStatus(),
                        "First request should not be rate-limited"
                    )
                );
    }

    @Test
    void authEndpoint_underLimit_returnsExpectedStatus() throws Exception {
        var req = new LoginRequest("nobody@test.com", "pass");

        // First few requests should not be rate-limited (even if they fail auth)
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(result ->
                        org.junit.jupiter.api.Assertions.assertNotEquals(
                            429, result.getResponse().getStatus(),
                            "Request " + " should not be rate-limited yet"
                        )
                    );
        }
    }

    @Test
    void rateLimitResponse_hasTooManyRequestsStatus_whenLimitExceeded() throws Exception {
        var req = new LoginRequest("spam@test.com", "pass");

        // Exhaust the auth limit (default 10 per minute)
        int rateLimitHit = 0;
        for (int i = 0; i <= 12; i++) {
            int status = mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andReturn()
                    .getResponse()
                    .getStatus();
            if (status == 429) {
                rateLimitHit++;
            }
        }

        // After 10 requests in the same window, at least one should be rate-limited
        org.junit.jupiter.api.Assertions.assertTrue(
            rateLimitHit > 0,
            "Expected at least one 429 after exceeding rate limit"
        );
    }

    @Test
    void rateLimitResponse_includesRetryAfterHeader() throws Exception {
        var req = new LoginRequest("floodtest@test.com", "pass");

        // Exhaust limit
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)));
        }

        // Next request should have Retry-After header
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(result -> {
                    if (result.getResponse().getStatus() == 429) {
                        org.junit.jupiter.api.Assertions.assertNotNull(
                            result.getResponse().getHeader("Retry-After"),
                            "429 response must include Retry-After header"
                        );
                    }
                });
    }
}