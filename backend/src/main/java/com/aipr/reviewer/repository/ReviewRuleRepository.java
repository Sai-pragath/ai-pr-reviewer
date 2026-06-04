package com.aipr.reviewer.repository;

import com.aipr.reviewer.model.ReviewRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRuleRepository extends JpaRepository<ReviewRule, Long> {
    List<ReviewRule> findByEnabledTrue();
}
