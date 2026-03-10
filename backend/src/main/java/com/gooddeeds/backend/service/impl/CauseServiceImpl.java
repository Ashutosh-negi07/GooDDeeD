package com.gooddeeds.backend.service.impl;

import com.gooddeeds.backend.dto.CreateCauseRequest;
import com.gooddeeds.backend.dto.UpdateCauseRequest;
import com.gooddeeds.backend.exception.ResourceNotFoundException;
import com.gooddeeds.backend.model.Cause;
import com.gooddeeds.backend.model.CauseMembership;
import com.gooddeeds.backend.model.Role;
import com.gooddeeds.backend.model.User;
import com.gooddeeds.backend.repository.CauseMembershipRepository;
import com.gooddeeds.backend.repository.CauseRepository;
import com.gooddeeds.backend.repository.UserRepository;
import com.gooddeeds.backend.service.AuthorizationService;
import com.gooddeeds.backend.service.CauseService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CauseServiceImpl implements CauseService {

    private final CauseRepository causeRepository;
    private final CauseMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;

    @Override
    public Cause createCause(CreateCauseRequest request, UUID creatorUserId) {
        Cause cause = Cause.builder()
                .name(request.name())
                .description(request.description())
                .restricted(request.restricted())
                .build();
        cause = causeRepository.save(cause);

        // H1 fix: Auto-join creator as ADMIN
        User creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CauseMembership membership = CauseMembership.builder()
                .user(creator)
                .cause(cause)
                .role(Role.ADMIN)
                .approved(true)
                .build();
        membershipRepository.save(membership);

        log.info("Cause '{}' created by user {}", cause.getName(), creatorUserId);
        return cause;
    }

    @Override
    public Page<Cause> getAllCauses(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return causeRepository.findAll(pageable);
    }

    @Override
    public Cause getCauseById(UUID id) {
        return causeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cause not found"));
    }

    @Override
    public Page<Cause> searchCausesByGoal(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return causeRepository.searchByKeyword(keyword, pageable);
    }

    @Override
    public Cause updateCause(UUID causeId, UpdateCauseRequest request, UUID adminUserId) {
        Cause cause = causeRepository.findById(causeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cause not found"));

        authorizationService.requireAdmin(adminUserId, causeId);

        if (request.name() != null) {
            cause.setName(request.name());
        }
        if (request.description() != null) {
            cause.setDescription(request.description());
        }
        if (request.restricted() != null) {
            cause.setRestricted(request.restricted());
        }

        log.info("Cause {} updated by admin {}", causeId, adminUserId);
        return causeRepository.save(cause);
    }

    @Override
    public void deleteCause(UUID causeId, UUID adminUserId) {
        Cause cause = causeRepository.findById(causeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cause not found"));

        authorizationService.requireAdmin(adminUserId, causeId);

        causeRepository.delete(cause);
        log.info("Cause {} deleted by admin {}", causeId, adminUserId);
    }
}
