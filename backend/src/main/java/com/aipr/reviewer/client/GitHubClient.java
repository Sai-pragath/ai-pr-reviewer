package com.aipr.reviewer.client;

import com.aipr.reviewer.model.ReviewComment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Component
public class GitHubClient {

    private static final Logger log = LoggerFactory.getLogger(GitHubClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Fetches raw diff text of a Pull Request using GitHub vnd.github.v3.diff API.
     */
    public String fetchPrDiff(String repoFullName, int prNumber, String token) {
        log.info("Fetching diff for PR {}/pull/{}", repoFullName, prNumber);
        try {
            String url = "https://api.github.com/repos/" + repoFullName + "/pulls/" + prNumber;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            headers.set("Accept", "application/vnd.github.v3.diff");
            headers.set("User-Agent", "AI-PR-Reviewer-Agent");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to fetch PR diff from GitHub", e);
        }
        return null;
    }

    /**
     * Posts inline review comments directly to the GitHub PR.
     */
    public boolean postPrReview(String repoFullName, int prNumber, String commitSha, List<ReviewComment> comments, String token) {
        log.info("Posting PR review comments ({}) to {}/pull/{}", comments.size(), repoFullName, prNumber);
        if (comments.isEmpty()) {
            log.info("No comments to post for review.");
            return true;
        }

        try {
            String url = "https://api.github.com/repos/" + repoFullName + "/pulls/" + prNumber + "/reviews";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/vnd.github.v3+json");
            headers.set("User-Agent", "AI-PR-Reviewer-Agent");

            // Map comment objects to GitHub schema
            List<Map<String, Object>> gitHubComments = new ArrayList<>();
            for (ReviewComment comment : comments) {
                Map<String, Object> ghComment = new HashMap<>();
                ghComment.put("path", comment.getFilePath());
                ghComment.put("line", comment.getLineNumber());
                ghComment.put("side", "RIGHT");
                ghComment.put("body", "**[" + comment.getCategory() + " - " + comment.getSeverity() + "]**\n" + comment.getCommentText());
                gitHubComments.add(ghComment);
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("commit_id", commitSha);
            requestBody.put("event", "COMMENT"); // Can be APPROVE, REQUEST_CHANGES, or COMMENT
            requestBody.put("body", "### AI Code Review Report\nAn automated scan has finished. Please see inline details.");
            requestBody.put("comments", gitHubComments);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Failed to post PR review to GitHub API", e);
        }
        return false;
    }
}
