package com.unix.aiupskilling.mentor.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "skill_achievements", indexes = {
        @Index(name = "idx_skill_achievements_student", columnList = "student_user_id"),
        @Index(name = "idx_skill_achievements_category", columnList = "category"),
        @Index(name = "idx_skill_achievements_verified_at", columnList = "verified_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillAchievement {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "student_user_id", nullable = false)
    private Long studentUserId;

    @Column(name = "skill_slug", length = 60, nullable = false)
    private String skillSlug;

    @Column(name = "skill_name", length = 100, nullable = false)
    private String skillName;

    @Column(length = 40, nullable = false)
    private String category;

    @Column(length = 20, nullable = false)
    private String proficiency; // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

    @Column(nullable = false)
    private Integer progress;

    @Column(name = "verified_at", nullable = false)
    private Instant verifiedAt;

    @Column(name = "source_assessment_id")
    private UUID sourceAssessmentId;

    @PrePersist
    protected void onCreate() {
        if (verifiedAt == null) {
            verifiedAt = Instant.now();
        }
    }
}
