package com.aipr.reviewer;

import com.aipr.reviewer.model.ReviewRule;
import com.aipr.reviewer.repository.ReviewRuleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ReviewerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReviewerApplication.class, args);
    }

    /**
     * Seeds database with initial default rules on application startup if empty.
     */
    @Bean
    public CommandLineRunner seedDatabase(ReviewRuleRepository ruleRepository) {
        return args -> {
            if (ruleRepository.count() == 0) {
                ruleRepository.save(ReviewRule.builder()
                        .name("Credentials & Secrets exposure scanner")
                        .category("security")
                        .description("Check for hardcoded API keys, JWT tokens, AWS credentials, database strings, or private SSH keys in the diff.")
                        .severity("CRITICAL")
                        .enabled(true)
                        .build());

                ruleRepository.save(ReviewRule.builder()
                        .name("SQL Injection vulnerabilities check")
                        .category("security")
                        .description("Detect dynamic string concatenations in raw SQL queries or JPA custom queries that bypass sanitization.")
                        .severity("CRITICAL")
                        .enabled(true)
                        .build());

                ruleRepository.save(ReviewRule.builder()
                        .name("JPA Resource Leaks & Session management")
                        .category("bugRisk")
                        .description("Verify all database connection pools, stream reader instances, and JPA transactions are correctly closed or annotations are in order.")
                        .severity("WARNING")
                        .enabled(true)
                        .build());

                ruleRepository.save(ReviewRule.builder()
                        .name("Memory Leak & Infinite loop checks")
                        .category("bugRisk")
                        .description("Identify potential recursive calls without exit conditions, loop conditions that may block threads, or map size growth issues.")
                        .severity("CRITICAL")
                        .enabled(true)
                        .build());

                ruleRepository.save(ReviewRule.builder()
                        .name("N+1 Query problems detection")
                        .category("optimization")
                        .description("Review fetch strategies in Hibernate mapping relations to warn on potential N+1 load operations.")
                        .severity("WARNING")
                        .enabled(true)
                        .build());

                ruleRepository.save(ReviewRule.builder()
                        .name("Strict Style guide conforming")
                        .category("codeSmell")
                        .description("Analyze naming conventions, unnecessary object instantiations, dead code blocks, or nested conditional blocks.")
                        .severity("INFO")
                        .enabled(false)
                        .build());
            }
        };
    }
}
