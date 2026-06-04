package com.aipr.reviewer.controller;

import com.aipr.reviewer.model.PullRequestReview;
import com.aipr.reviewer.repository.PullRequestReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
public class PullRequestReviewController {

    @Autowired
    private PullRequestReviewRepository reviewRepository;

    @GetMapping("/history")
    public List<PullRequestReview> getReviewHistory() {
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }
}
