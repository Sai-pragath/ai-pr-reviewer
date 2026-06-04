package com.aipr.reviewer.repository;

import com.aipr.reviewer.model.RepositoryConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RepositoryConfigRepository extends JpaRepository<RepositoryConfig, Long> {
    Optional<RepositoryConfig> findByFullName(String fullName);
}
