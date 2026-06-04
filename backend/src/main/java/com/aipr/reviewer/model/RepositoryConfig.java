package com.aipr.reviewer.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "repository_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepositoryConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String fullName; // e.g. "acme-org/spring-petclinic"

    @Column(nullable = false)
    private String webhookSecret;

    @Column(nullable = false)
    private String githubToken;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "repository_branches", joinColumns = @JoinColumn(name = "repository_id"))
    @Column(name = "branch_name")
    private List<String> targetBranches;

    @Builder.Default
    private boolean enabled = true;
}
