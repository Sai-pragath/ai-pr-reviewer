package com.aipr.reviewer.controller;

import com.aipr.reviewer.model.RepositoryConfig;
import com.aipr.reviewer.repository.RepositoryConfigRepository;
import com.aipr.reviewer.service.ReviewService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private RepositoryConfigRepository repositoryConfigRepository;

    @Autowired
    private ReviewService reviewService;

    /**
     * Entrypoint for incoming GitHub Webhook HTTP POST actions.
     */
    @PostMapping("/github")
    public ResponseEntity<String> handleGitHubWebhook(
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestHeader(value = "X-GitHub-Event", required = false) String event,
            @RequestBody String rawPayload) {

        log.info("Received GitHub Webhook event type: {}", event);

        if (event == null || event.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Missing event header");
        }

        try {
            JsonNode payload = objectMapper.readTree(rawPayload);
            
            // Extract repository name to identify configuration
            JsonNode repoNode = payload.get("repository");
            if (repoNode == null) {
                return ResponseEntity.badRequest().body("Missing repository metadata in payload");
            }
            String repoFullName = repoNode.get("full_name").asText();

            Optional<RepositoryConfig> optionalRepo = repositoryConfigRepository.findByFullName(repoFullName);
            if (optionalRepo.isEmpty()) {
                log.warn("Repository '{}' not configured. Register in Admin panel first.", repoFullName);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Repository not configured");
            }

            RepositoryConfig repoConfig = optionalRepo.get();

            // Webhook Signature verification
            if (repoConfig.getWebhookSecret() != null && !repoConfig.getWebhookSecret().trim().isEmpty()) {
                if (signature == null || !verifyHMACSignature(rawPayload, repoConfig.getWebhookSecret(), signature)) {
                    log.warn("HMAC signature verification failed for repository '{}'", repoFullName);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid HMAC signature");
                }
            }

            // GitHub Ping handshake
            if ("ping".equalsIgnoreCase(event)) {
                log.info("Successfully validated connection ping for repository: {}", repoFullName);
                return ResponseEntity.ok("Ping handshake successful");
            }

            // Handle PR Events
            if ("pull_request".equalsIgnoreCase(event)) {
                String action = payload.get("action").asText();
                log.info("Processing Pull Request event. Action = {}", action);

                if ("opened".equalsIgnoreCase(action) || "synchronize".equalsIgnoreCase(action)) {
                    JsonNode prNode = payload.get("pull_request");
                    int prNumber = prNode.get("number").asInt();
                    String prTitle = prNode.get("title").asText();
                    String author = prNode.get("user").get("login").asText();
                    String commitSha = prNode.get("head").get("sha").asText();
                    String targetBranch = prNode.get("base").get("ref").asText();

                    // Check if base target branch is actively tracked
                    if (repoConfig.getTargetBranches() != null && 
                            !repoConfig.getTargetBranches().isEmpty() && 
                            !repoConfig.getTargetBranches().contains(targetBranch)) {
                        log.info("Skipping review. Base branch '{}' is not tracked for repository '{}'", targetBranch, repoFullName);
                        return ResponseEntity.ok("Branch not tracked for review");
                    }

                    // Fire review flow asynchronously
                    reviewService.executePrReview(repoConfig, prNumber, prTitle, author, commitSha);
                    return ResponseEntity.accepted().body("Review triggered asynchronously in background");
                }
                
                return ResponseEntity.ok("PR action skipped (only opened and synchronize are active)");
            }

            return ResponseEntity.ok("Event received, but no actions registered for event: " + event);

        } catch (Exception e) {
            log.error("Failed to process webhook request payload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook handling error: " + e.getMessage());
        }
    }

    /**
     * Validates signature using HMAC SHA-256 and constant-time byte comparisons.
     */
    private boolean verifyHMACSignature(String payload, String secret, String headerSignature) {
        try {
            if (!headerSignature.startsWith("sha256=")) {
                return false;
            }
            String hexSignature = headerSignature.substring(7); // strip "sha256="

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);

            byte[] rawHmac = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : rawHmac) {
                sb.append(String.format("%02x", b));
            }
            String calculatedSignature = sb.toString();

            // Constant-time digest comparison to prevent timing side-channel attacks
            return MessageDigest.isEqual(
                    calculatedSignature.getBytes(StandardCharsets.UTF_8),
                    hexSignature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Signature HMAC verification error", e);
            return false;
        }
    }
}
