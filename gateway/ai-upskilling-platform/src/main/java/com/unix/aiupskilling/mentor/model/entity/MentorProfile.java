package com.unix.aiupskilling.mentor.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mentor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(length = 120)
    private String title;

    @Column(length = 120)
    private String location;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "mentor_expertise",
            joinColumns = @JoinColumn(name = "mentor_user_id")
    )
    @Column(name = "label", length = 40, nullable = false)
    @Builder.Default
    private List<String> expertise = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }
}
