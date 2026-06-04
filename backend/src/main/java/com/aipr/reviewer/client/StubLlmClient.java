package com.aipr.reviewer.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component("stubLlmClient")
public class StubLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(StubLlmClient.class);

    @Override
    public String analyzeDiffChunk(String diffChunk, String rulesContext, String systemPrompt) {
        log.info("Running LLM analysis in sandbox/stub mode. Analyzing diff chunk size: {} bytes", diffChunk.length());

        // Simple rules matching to return high-fidelity mock review comments
        if (diffChunk.contains("secretKey") || diffChunk.contains("mySecretKey")) {
            return "[" +
                    "  {" +
                    "    \"filePath\": \"src/main/java/org/springframework/samples/petclinic/security/JwtTokenProvider.java\"," +
                    "    \"lineNumber\": 22," +
                    "    \"category\": \"Security Risk\"," +
                    "    \"severity\": \"CRITICAL\"," +
                    "    \"commentText\": \"STUB: Hardcoded secrets should not be stored in version control. Load secret key from configuration properties file or KMS.\"" +
                    "  }," +
                    "  {" +
                    "    \"filePath\": \"src/main/java/org/springframework/samples/petclinic/security/JwtTokenProvider.java\"," +
                    "    \"lineNumber\": 28," +
                    "    \"category\": \"Security Risk\"," +
                    "    \"severity\": \"WARNING\"," +
                    "    \"commentText\": \"STUB: HS512 algorithm requires at least a 512-bit key. Ensure the injected config property conforms to this requirement.\"" +
                    "  }" +
                    "]";
        } else if (diffChunk.contains("findById(ownerId)") || diffChunk.contains("OwnerController")) {
            return "[" +
                    "  {" +
                    "    \"filePath\": \"src/main/java/org/springframework/samples/petclinic/owner/OwnerController.java\"," +
                    "    \"lineNumber\": 85," +
                    "    \"category\": \"Bug Risk\"," +
                    "    \"severity\": \"CRITICAL\"," +
                    "    \"commentText\": \"STUB: Checking if finding an owner returns null before adding to model map prevents NullPointerException on details render.\"" +
                    "  }" +
                    "]";
        } else if (diffChunk.contains("useWebSocket") || diffChunk.contains("WebSocket")) {
            return "[" +
                    "  {" +
                    "    \"filePath\": \"src/hooks/useWebSocket.ts\"," +
                    "    \"lineNumber\": 21," +
                    "    \"category\": \"Code Smell\"," +
                    "    \"severity\": \"INFO\"," +
                    "    \"commentText\": \"STUB: Adding WebSocket close cleaner in hook return block ensures proper connection resource lifecycle handling.\"" +
                    "  }" +
                    "]";
        }

        // Generic fallback
        return "[" +
                "  {" +
                "    \"filePath\": \"src/main/java/com/aipr/reviewer/ReviewerApplication.java\"," +
                "    \"lineNumber\": 1," +
                "    \"category\": \"Code Smell\"," +
                "    \"severity\": \"INFO\"," +
                "    \"commentText\": \"STUB: Standard code compliance validation check passed. Code format and structure look clean.\"" +
                "  }" +
                "]";
    }
}
