package com.gooddeeds.backend.service;

import com.gooddeeds.backend.dto.CreateCauseRequest;
import com.gooddeeds.backend.dto.UpdateCauseRequest;
import com.gooddeeds.backend.model.Cause;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface CauseService {

    Cause createCause(CreateCauseRequest request, UUID creatorUserId);

    Page<Cause> getAllCauses(int page, int size);

    Cause getCauseById(UUID id);

    Page<Cause> searchCausesByGoal(String keyword, int page, int size);

    Cause updateCause(UUID causeId, UpdateCauseRequest request, UUID adminUserId);

    void deleteCause(UUID causeId, UUID adminUserId);
}
