package com.aipr.reviewer.client;

public interface LlmClient {
    /**
     * Sends a code diff chunk and rules to the LLM to get code quality review comments.
     * @param diffChunk The unified diff text to review.
     * @param rulesContext Aggregated instructions/guidelines for review.
     * @param systemPrompt Base instructions tailoring LLM role.
     * @return JSON response from LLM containing list of comment suggestions.
     */
    String analyzeDiffChunk(String diffChunk, String rulesContext, String systemPrompt);
}
