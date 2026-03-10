package com.gooddeeds.backend.controller;

import com.gooddeeds.backend.dto.CauseResponseDTO;
import com.gooddeeds.backend.dto.CreateCauseRequest;
import com.gooddeeds.backend.dto.UpdateCauseRequest;
import com.gooddeeds.backend.mapper.CauseMapper;
//import com.gooddeeds.backend.model.Cause;
import com.gooddeeds.backend.security.SecurityUtils;
import com.gooddeeds.backend.service.CauseService;
import com.gooddeeds.backend.service.MembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/causes")
@RequiredArgsConstructor
public class CauseController {

    private final CauseService causeService;
    private final MembershipService membershipService;

    // get causes the current user is a member of
    @GetMapping("/my")
    public List<CauseResponseDTO> getMyCauses() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return membershipService.getMembershipsByUserId(userId)
                .stream()
                .map(membership -> CauseMapper.toDTO(membership.getCause()))
                .toList();
    }

    // create cause
    @PostMapping
    public CauseResponseDTO create(@Valid @RequestBody CreateCauseRequest request) {
        UUID creatorUserId = SecurityUtils.getCurrentUserId();
        return CauseMapper.toDTO(
                causeService.createCause(request, creatorUserId));
    }

    // Get all causes (paginated)
    @GetMapping
    public Page<CauseResponseDTO> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return causeService.getAllCauses(page, size)
                .map(CauseMapper::toDTO);
    }

    // Get cause by ID
    @GetMapping("/{id}")
    public CauseResponseDTO getById(@PathVariable UUID id) {
        return CauseMapper.toDTO(
                causeService.getCauseById(id));
    }

    // Search by goal keyword (paginated)
    @GetMapping("/search")
    public Page<CauseResponseDTO> searchCausesByGoal(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return causeService.searchCausesByGoal(keyword, page, size)
                .map(CauseMapper::toDTO);
    }

    // Update cause (admin only)
    @PutMapping("/{id}")
    public CauseResponseDTO update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCauseRequest request) {
        UUID adminUserId = SecurityUtils.getCurrentUserId();
        return CauseMapper.toDTO(
                causeService.updateCause(id, request, adminUserId));
    }

    // Delete cause (admin only)
    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable UUID id) {
        UUID adminUserId = SecurityUtils.getCurrentUserId();
        causeService.deleteCause(id, adminUserId);
    }
}
