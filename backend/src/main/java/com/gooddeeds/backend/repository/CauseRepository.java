package com.gooddeeds.backend.repository;

import com.gooddeeds.backend.model.Cause;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface CauseRepository extends JpaRepository<Cause, UUID> {

    @Query("""
        SELECT c FROM Cause c
        WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
    """)
    Page<Cause> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
