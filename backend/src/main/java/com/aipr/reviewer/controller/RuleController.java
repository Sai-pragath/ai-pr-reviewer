package com.aipr.reviewer.controller;

import com.aipr.reviewer.model.ReviewRule;
import com.aipr.reviewer.repository.ReviewRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/rules")
public class RuleController {

    @Autowired
    private ReviewRuleRepository ruleRepository;

    @Value("${llm.default-system-prompt}")
    private String defaultSystemPrompt;

    @GetMapping
    public List<ReviewRule> getAllRules() {
        return ruleRepository.findAll();
    }

    @PostMapping
    public ReviewRule createRule(@RequestBody ReviewRule rule) {
        return ruleRepository.save(rule);
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ReviewRule> toggleRule(@PathVariable Long id) {
        Optional<ReviewRule> optionalRule = ruleRepository.findById(id);
        if (optionalRule.isPresent()) {
            ReviewRule rule = optionalRule.get();
            rule.setEnabled(!rule.isEnabled());
            return ResponseEntity.ok(ruleRepository.save(rule));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewRule> updateRule(@PathVariable Long id, @RequestBody ReviewRule updatedRule) {
        Optional<ReviewRule> optionalRule = ruleRepository.findById(id);
        if (optionalRule.isPresent()) {
            ReviewRule rule = optionalRule.get();
            rule.setName(updatedRule.getName());
            rule.setCategory(updatedRule.getCategory());
            rule.setDescription(updatedRule.getDescription());
            rule.setSeverity(updatedRule.getSeverity());
            rule.setEnabled(updatedRule.isEnabled());
            return ResponseEntity.ok(ruleRepository.save(rule));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        if (ruleRepository.existsById(id)) {
            ruleRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/prompt")
    public String getSystemPrompt() {
        return defaultSystemPrompt;
    }
}
