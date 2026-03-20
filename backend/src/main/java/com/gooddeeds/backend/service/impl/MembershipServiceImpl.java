package com.gooddeeds.backend.service.impl;

import com.gooddeeds.backend.exception.ConflictException;
import com.gooddeeds.backend.exception.ForbiddenException;
import com.gooddeeds.backend.exception.ResourceNotFoundException;
import com.gooddeeds.backend.model.Cause;
import com.gooddeeds.backend.model.CauseMembership;
import com.gooddeeds.backend.model.Role;
import com.gooddeeds.backend.model.User;
import com.gooddeeds.backend.repository.CauseMembershipRepository;
import com.gooddeeds.backend.repository.CauseRepository;
import com.gooddeeds.backend.repository.UserRepository;
import com.gooddeeds.backend.service.MembershipService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MembershipServiceImpl implements MembershipService {

    private final UserRepository userRepository;
    private final CauseRepository causeRepository;
    private final CauseMembershipRepository membershipRepository;

    @Override
    public CauseMembership joinCause(UUID userId, UUID causeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cause cause = causeRepository.findById(causeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cause not found"));

        if (membershipRepository.existsByUserAndCause(user, cause)) {
            throw new ConflictException("User already joined this cause");
        }

        boolean approved = !cause.isRestricted();

        // First member becomes ADMIN
        Role role = membershipRepository.findByCauseId(causeId).isEmpty()
                ? Role.ADMIN
                : Role.MEMBER;

        CauseMembership membership = CauseMembership.builder()
                .user(user)
                .cause(cause)
                .role(role)
                .approved(approved || role == Role.ADMIN)
                .build();

        log.info("User {} joined cause {} with role {}", userId, causeId, role);
        return membershipRepository.save(membership);
    }

    @Override
    public CauseMembership getMembershipById(UUID membershipId) {
        return membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
    }

    @Override
    public List<CauseMembership> getMembersOfCause(UUID causeId) {
        return membershipRepository.findByCauseId(causeId);
    }

    @Override
    public List<CauseMembership> getMembershipsByUserId(UUID userId) {
        return membershipRepository.findByUserId(userId);
    }

    @Override
    public CauseMembership approveMembership(UUID adminUserId, UUID membershipId) {
        CauseMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));

        UUID causeId = membership.getCause().getId();

        CauseMembership adminMembership =
                membershipRepository.findByUserIdAndCauseId(adminUserId, causeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Admin not part of this cause"));

        if (adminMembership.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only ADMIN can approve members");
        }

        membership.approve();
        log.info("Membership {} approved by admin {}", membershipId, adminUserId);
        return membershipRepository.save(membership);
    }

    @Override
    public void rejectMembership(UUID adminUserId, UUID membershipId) {
        CauseMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));

        UUID causeId = membership.getCause().getId();

        CauseMembership adminMembership =
                membershipRepository.findByUserIdAndCauseId(adminUserId, causeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Admin not part of this cause"));

        if (adminMembership.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only ADMIN can reject members");
        }

        membershipRepository.delete(membership);
        log.info("Membership {} rejected by admin {}", membershipId, adminUserId);
    }

    // H2 fix: Prevent last admin from leaving
    @Override
    public void leaveCause(UUID userId, UUID causeId) {
        CauseMembership membership = membershipRepository.findByUserIdAndCauseId(userId, causeId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));

        if (membership.getRole() == Role.ADMIN) {
            long adminCount = membershipRepository.countByCauseIdAndRole(causeId, Role.ADMIN);
            if (adminCount <= 1) {
                throw new ForbiddenException("Cannot leave: you are the last admin. Promote another member first.");
            }
        }

        membershipRepository.delete(membership);
        log.info("User {} left cause {}", userId, causeId);
    }
}
