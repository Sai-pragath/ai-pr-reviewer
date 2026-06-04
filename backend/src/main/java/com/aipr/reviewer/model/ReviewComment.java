package com.aipr.reviewer.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "review_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "review_id", nullable = false)
    @JsonIgnore
    private PullRequestReview review;

    @Column(nullable = false)
    private int lineNumber;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false)
    private String category; // e.g. "Security Risk", "Code Smell", "Optimization"

    @Column(nullable = false)
    private String severity; // e.g. "CRITICAL", "WARNING", "INFO"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String commentText;
}
