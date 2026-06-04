package com.aipr.reviewer.controller;

import com.aipr.reviewer.model.RepositoryConfig;
import com.aipr.reviewer.repository.RepositoryConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/repositories")
public class RepositoryConfigController {

    @Autowired
    private RepositoryConfigRepository repositoryConfigRepository;

    @GetMapping
    public List<RepositoryConfig> getAllRepositories() {
        return repositoryConfigRepository.findAll();
    }

    @PostMapping
    public RepositoryConfig connectRepository(@RequestBody RepositoryConfig config) {
        return repositoryConfigRepository.save(config);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RepositoryConfig> updateRepository(@PathVariable Long id, @RequestBody RepositoryConfig updatedConfig) {
        Optional<RepositoryConfig> optionalConfig = repositoryConfigRepository.findById(id);
        if (optionalConfig.isPresent()) {
            RepositoryConfig config = optionalConfig.get();
            config.setFullName(updatedConfig.getFullName());
            config.setWebhookSecret(updatedConfig.getWebhookSecret());
            config.setGithubToken(updatedConfig.getGithubToken());
            config.setTargetBranches(updatedConfig.getTargetBranches());
            config.setEnabled(updatedConfig.isEnabled());
            return ResponseEntity.ok(repositoryConfigRepository.save(config));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disconnectRepository(@PathVariable Long id) {
        if (repositoryConfigRepository.existsById(id)) {
            repositoryConfigRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
