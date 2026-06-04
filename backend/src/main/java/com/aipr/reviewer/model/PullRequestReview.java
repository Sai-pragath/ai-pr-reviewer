package com.aipr.reviewer.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pull_request_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String repoName;

    @Column(nullable = false)
    private int prNumber;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false)
    private String commitSha;

    private LocalDateTime createdAt;

    private long durationMs;

    @Column(nullable = false)
    private String status; // e.g., PENDING, ACTION_POSTED, FAILED

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<ReviewComment> comments;
}
