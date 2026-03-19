package com.gooddeeds.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gooddeeds.backend.dto.CreateCauseRequest;
import com.gooddeeds.backend.dto.CreateUserRequest;
import com.gooddeeds.backend.dto.UpdateCauseRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CauseControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        var reg = new CreateUserRequest("TestUser", "user@test.com", "password123");
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andReturn();
        token = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
    }

    // ─── Public endpoints ──────────────────────────────────────────────────

    @Test
    void getAllCauses_noAuth_returnsOk() throws Exception {
        mockMvc.perform(get("/api/causes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getAllCauses_paginationParams_returnsCorrectPage() throws Exception {
        mockMvc.perform(get("/api/causes?page=0&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(5));
    }

    @Test
    void searchCauses_noAuth_returnsOk() throws Exception {
        mockMvc.perform(get("/api/causes/search?keyword=help"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getCauseById_nonExistent_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api/causes/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    // ─── Authenticated endpoints ───────────────────────────────────────────

    @Test
    void createCause_withAuth_returnsCreatedCause() throws Exception {
        var req = new CreateCauseRequest("Clean Ocean", "Picking up beach trash", false);

        mockMvc.perform(post("/api/causes")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Clean Ocean"))
                .andExpect(jsonPath("$.description").value("Picking up beach trash"))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @Test
    void createCause_withoutAuth_returnsUnauthorized() throws Exception {
        var req = new CreateCauseRequest("No Auth Cause", "desc", false);

        mockMvc.perform(post("/api/causes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMyCauses_withAuth_returnsUserCauses() throws Exception {
        // Create a cause first
        var req = new CreateCauseRequest("My Cause", "desc", false);
        mockMvc.perform(post("/api/causes")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)));

        mockMvc.perform(get("/api/causes/my")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void getMyCauses_withoutAuth_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/causes/my"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getCauseById_afterCreate_returnsCorrectCause() throws Exception {
        var req = new CreateCauseRequest("Tree Planting", "Plant trees", false);
        MvcResult createResult = mockMvc.perform(post("/api/causes")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        String causeId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(get("/api/causes/" + causeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tree Planting"));
    }

    @Test
    void updateCause_byAdmin_returnsUpdatedCause() throws Exception {
        var req = new CreateCauseRequest("Old Name", "description", false);
        MvcResult createResult = mockMvc.perform(post("/api/causes")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        String causeId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        var updateReq = new UpdateCauseRequest("New Name", "new description", false);
        mockMvc.perform(put("/api/causes/" + causeId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"));
    }

    @Test
    void deleteCause_byAdmin_returnsOk() throws Exception {
        var req = new CreateCauseRequest("To Delete", "description", false);
        MvcResult createResult = mockMvc.perform(post("/api/causes")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        String causeId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(delete("/api/causes/" + causeId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/causes/" + causeId))
                .andExpect(status().isNotFound());
    }
}