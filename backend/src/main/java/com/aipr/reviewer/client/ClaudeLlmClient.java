package com.aipr.reviewer.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Component("claudeLlmClient")
public class ClaudeLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(ClaudeLlmClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${llm.claude.api-key:}")
    private String apiKey;

    @Value("${llm.claude.model:claude-3-5-sonnet-20241022}")
    private String modelName;

    @Override
    public String analyzeDiffChunk(String diffChunk, String rulesContext, String systemPrompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Anthropic Claude API Key not configured. Returning empty analysis.");
            return "[]";
        }

        try {
            String url = "https://api.anthropic.com/v1/messages";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", "2023-06-01");

            // Build payload map
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("max_tokens", 4000);
            requestBody.put("system", systemPrompt);

            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", "Review Rules:\n" + rulesContext + "\n\nProvide inline comments for the following diff chunk:\n" + diffChunk + "\n\nFormat your response as a valid JSON array of comment objects, containing keys: \"filePath\", \"lineNumber\", \"category\", \"severity\", and \"commentText\". Generate comments ONLY for lines modified (marked with +). Output raw JSON array and nothing else.");
            messages.add(userMessage);

            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                List contentList = (List) body.get("content");
                if (contentList != null && !contentList.isEmpty()) {
                    Map contentMap = (Map) contentList.get(0);
                    String text = (String) contentMap.get("text");
                    return extractJson(text);
                }
            }
        } catch (Exception e) {
            log.error("Failed call to Anthropic API", e);
        }
        return "[]";
    }

    private String extractJson(String rawText) {
        if (rawText == null) return "[]";
        // Clean markdown code blocks if the LLM output is wrapped in ```json ... ```
        String text = rawText.trim();
        if (text.startsWith("```")) {
            int start = text.indexOf('\n');
            int end = text.lastIndexOf("```");
            if (start != -1 && end != -1 && end > start) {
                text = text.substring(start, end).trim();
            }
        }
        return text;
    }
}
