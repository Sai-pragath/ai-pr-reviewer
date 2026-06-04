package com.aipr.reviewer.service;

import com.aipr.reviewer.client.GitHubClient;
import com.aipr.reviewer.client.LlmClient;
import com.aipr.reviewer.model.*;
import com.aipr.reviewer.repository.PullRequestReviewRepository;
import com.aipr.reviewer.repository.ReviewRuleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private GitHubClient gitHubClient;

    @Autowired
    private ReviewRuleRepository ruleRepository;

    @Autowired
    private PullRequestReviewRepository reviewRepository;

    @Autowired
    @Qualifier("claudeLlmClient")
    private LlmClient claudeLlmClient;

    @Autowired
    @Qualifier("geminiLlmClient")
    private LlmClient geminiLlmClient;

    @Autowired
    @Qualifier("stubLlmClient")
    private LlmClient stubLlmClient;

    @Autowired
    private MeterRegistry meterRegistry;

    @Value("${llm.provider:stub}")
    private String llmProvider;

    @Value("${llm.default-system-prompt:You are a senior software engineering staff reviewer. Analyze the pull request diff code chunk. Perform checks for security flaws, buffer issues, SQL injection, logical errors, resource leaks, and performance optimization. Output comment responses in standard JSON format containing file, line, and comments.}")
    private String defaultSystemPrompt;

    /**
     * Executes the PR review flow asynchronously.
     */
    @Async
    public void executePrReview(RepositoryConfig repoConfig, int prNumber, String prTitle, String author, String commitSha) {
        long startTime = System.currentTimeMillis();
        log.info("Starting async code review for PR {}/pull/{}", repoConfig.getFullName(), prNumber);

        PullRequestReview review = PullRequestReview.builder()
                .repoName(repoConfig.getFullName())
                .prNumber(prNumber)
                .title(prTitle)
                .author(author)
                .commitSha(commitSha)
                .createdAt(LocalDateTime.now())
                .status("PENDING")
                .comments(new ArrayList<>())
                .build();

        review = reviewRepository.save(review);

        try {
            // 1. Fetch the unified diff from GitHub
            String diff = gitHubClient.fetchPrDiff(repoConfig.getFullName(), prNumber, repoConfig.getGithubToken());
            if (diff == null || diff.trim().isEmpty()) {
                throw new RuntimeException("Diff payload is null or empty");
            }

            // 2. Fetch active rules to pass to the LLM as context
            List<ReviewRule> activeRules = ruleRepository.findByEnabledTrue();
            StringBuilder rulesBuilder = new StringBuilder();
            activeRules.forEach(rule -> {
                rulesBuilder.append("- Rule Name: ").append(rule.getName()).append("\n");
                rulesBuilder.append("  Category: ").append(rule.getCategory()).append("\n");
                rulesBuilder.append("  Severity: ").append(rule.getSeverity()).append("\n");
                rulesBuilder.append("  Description: ").append(rule.getDescription()).append("\n\n");
            });

            // 3. Resolve the configured LLM client
            LlmClient llmClient = resolveLlmClient();

            // 4. Parse the diff file by file and hunk by hunk
            List<String> diffChunks = chunkDiff(diff);
            List<ReviewComment> parsedComments = new ArrayList<>();

            for (String chunk : diffChunks) {
                String llmResponse = llmClient.analyzeDiffChunk(chunk, rulesBuilder.toString(), defaultSystemPrompt);
                List<ReviewComment> chunkComments = parseLlmComments(llmResponse, review);
                parsedComments.addAll(chunkComments);
            }

            // 5. Post comments inline back to GitHub via REST API
            boolean postedSuccess = false;
            if (!parsedComments.isEmpty()) {
                postedSuccess = gitHubClient.postPrReview(
                        repoConfig.getFullName(),
                        prNumber,
                        commitSha,
                        parsedComments,
                        repoConfig.getGithubToken()
                );
            } else {
                postedSuccess = true; // no comments is a success
            }

            long duration = System.currentTimeMillis() - startTime;
            review.setDurationMs(duration);
            review.setComments(parsedComments);
            review.setStatus(postedSuccess ? "ACTION_POSTED" : "POST_FAILED");
            reviewRepository.save(review);

            // Record metrics
            recordReviewMetrics(repoConfig.getFullName(), review.getStatus(), duration, parsedComments);

            log.info("Completed PR review in {} ms with status {}", duration, review.getStatus());

        } catch (Exception e) {
            log.error("Review processing failed for PR #{}", prNumber, e);
            review.setStatus("FAILED");
            review.setDurationMs(System.currentTimeMillis() - startTime);
            reviewRepository.save(review);
            
            // Record failure metric
            Counter.builder("pr_reviews_total")
                    .tag("repo", repoConfig.getFullName())
                    .tag("status", "FAILED")
                    .register(meterRegistry)
                    .increment();
        }
    }

    private LlmClient resolveLlmClient() {
        if ("claude".equalsIgnoreCase(llmProvider)) return claudeLlmClient;
        if ("gemini".equalsIgnoreCase(llmProvider)) return geminiLlmClient;
        return stubLlmClient;
    }

    /**
     * Chunks a raw unified diff by splitting files and limiting chunk sizes.
     */
    private List<String> chunkDiff(String rawDiff) {
        List<String> chunks = new ArrayList<>();
        String[] files = rawDiff.split("diff --git ");
        
        for (String fileDiff : files) {
            if (fileDiff.trim().isEmpty()) continue;
            
            // Reconstruct file header
            String fullFileDiff = "diff --git " + fileDiff;
            
            // If a single file diff is extremely large, chunk it by hunks
            if (fullFileDiff.length() > 8000) {
                String[] hunks = fullFileDiff.split("@@");
                if (hunks.length > 1) {
                    String header = hunks[0];
                    StringBuilder currentChunk = new StringBuilder(header);
                    
                    for (int i = 1; i < hunks.length; i++) {
                        String hunk = "@@" + hunks[i];
                        if (currentChunk.length() + hunk.length() > 6000) {
                            chunks.add(currentChunk.toString());
                            currentChunk = new StringBuilder(header).append("\n").append(hunk);
                        } else {
                            currentChunk.append("\n").append(hunk);
                        }
                    }
                    chunks.add(currentChunk.toString());
                } else {
                    chunks.add(fullFileDiff);
                }
            } else {
                chunks.add(fullFileDiff);
            }
        }
        return chunks;
    }

    /**
     * Safely parses LLM JSON response into ReviewComment model items.
     */
    private List<ReviewComment> parseLlmComments(String jsonResponse, PullRequestReview review) {
        try {
            if (jsonResponse == null || jsonResponse.trim().isEmpty() || jsonResponse.equals("[]")) {
                return Collections.emptyList();
            }

            // Target mapping keys: "filePath", "lineNumber", "category", "severity", "commentText"
            List<Map<String, Object>> commentMaps = objectMapper.readValue(
                    jsonResponse, new TypeReference<List<Map<String, Object>>>() {}
            );

            List<ReviewComment> comments = new ArrayList<>();
            for (Map<String, Object> map : commentMaps) {
                // Ensure data is valid
                String filePath = (String) map.get("filePath");
                Object lineObj = map.get("lineNumber");
                String category = (String) map.get("category");
                String severity = (String) map.get("severity");
                String commentText = (String) map.get("commentText");

                if (filePath == null || lineObj == null || commentText == null) continue;

                int lineNumber = 0;
                if (lineObj instanceof Number) {
                    lineNumber = ((Number) lineObj).intValue();
                } else {
                    lineNumber = Integer.parseInt(lineObj.toString());
                }

                ReviewComment comment = ReviewComment.builder()
                        .review(review)
                        .filePath(filePath)
                        .lineNumber(lineNumber)
                        .category(category != null ? category : "Code Smell")
                        .severity(severity != null ? severity.toUpperCase() : "INFO")
                        .commentText(commentText)
                        .build();

                comments.add(comment);
            }
            return comments;
        } catch (Exception e) {
            log.error("Failed to parse comments JSON from LLM: {}", jsonResponse, e);
        }
        return Collections.emptyList();
    }

    private void recordReviewMetrics(String repo, String status, long durationMs, List<ReviewComment> comments) {
        // Increment PR Review count metric
        Counter.builder("pr_reviews_total")
                .tag("repo", repo)
                .tag("status", status)
                .register(meterRegistry)
                .increment();

        // Record duration
        meterRegistry.timer("pr_review_duration_seconds", "repo", repo)
                .record(durationMs, TimeUnit.MILLISECONDS);

        // Record comment distributions
        for (ReviewComment comment : comments) {
            Counter.builder("pr_review_comments_total")
                    .tag("repo", repo)
                    .tag("category", comment.getCategory())
                    .tag("severity", comment.getSeverity())
                    .register(meterRegistry)
                    .increment();
        }
    }
}
