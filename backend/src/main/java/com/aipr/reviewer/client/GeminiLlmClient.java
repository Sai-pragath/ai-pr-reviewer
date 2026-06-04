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

@Component("geminiLlmClient")
public class GeminiLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiLlmClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${llm.gemini.api-key:}")
    private String apiKey;

    @Value("${llm.gemini.model:gemini-1.5-pro}")
    private String modelName;

    @Override
    public String analyzeDiffChunk(String diffChunk, String rulesContext, String systemPrompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Gemini API Key not configured. Returning empty analysis.");
            return "[]";
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construct payload according to Gemini REST specification
            Map<String, Object> requestBody = new HashMap<>();

            // System Instruction
            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", Collections.singletonList(Collections.singletonMap("text", systemPrompt)));
            requestBody.put("systemInstruction", systemInstruction);

            // Contents
            Map<String, Object> part = new HashMap<>();
            part.put("text", "Review Rules:\n" + rulesContext + "\n\nProvide inline comments for the following diff chunk:\n" + diffChunk + "\n\nFormat your response as a valid JSON array of comment objects, containing keys: \"filePath\", \"lineNumber\", \"category\", \"severity\", and \"commentText\". Generate comments ONLY for lines modified (marked with +).");
            
            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));
            requestBody.put("contents", Collections.singletonList(content));

            // Generation Config (requesting JSON response type)
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                List candidates = (List) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map responseContent = (Map) candidate.get("content");
                    if (responseContent != null) {
                        List parts = (List) responseContent.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map partMap = (Map) parts.get(0);
                            String text = (String) partMap.get("text");
                            return text;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed call to Gemini API", e);
        }
        return "[]";
    }
}
