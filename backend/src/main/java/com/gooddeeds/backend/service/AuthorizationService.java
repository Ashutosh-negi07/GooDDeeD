package com.gooddeeds.backend.service;

import com.gooddeeds.backend.exception.ForbiddenException;
import com.gooddeeds.backend.exception.ResourceNotFoundException;
import com.gooddeeds.backend.model.CauseMembership;
import com.gooddeeds.backend.model.Role;
import com.gooddeeds.backend.repository.CauseMembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Shared authorization service to eliminate duplicated admin/membership checks
 * across CauseService, GoalService, and TaskService.
 */
@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final CauseMembershipRepository membershipRepository;

    /**
     * Verify that the user is an ADMIN of the specified cause.
     * @throws ResourceNotFoundException if user is not a member
     * @throws ForbiddenException if user is not an ADMIN
     */
    public CauseMembership requireAdmin(UUID userId, UUID causeId) {
        CauseMembership membership = membershipRepository.findByUserIdAndCauseId(userId, causeId)
                .orElseThrow(() -> new ResourceNotFoundException("Not a member of this cause"));

        if (membership.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only ADMIN can perform this action");
        }

        return membership;
    }

    /**
     * Verify that the user is an approved member of the specified cause.
     * @throws ResourceNotFoundException if user is not a member
     * @throws ForbiddenException if membership is not approved
     */
    public CauseMembership requireApprovedMember(UUID userId, UUID causeId) {
        CauseMembership membership = membershipRepository.findByUserIdAndCauseId(userId, causeId)
                .orElseThrow(() -> new ResourceNotFoundException("Not a member of this cause"));

        if (!membership.isApproved()) {
            throw new ForbiddenException("Membership not yet approved");
        }

        return membership;
    }
}
