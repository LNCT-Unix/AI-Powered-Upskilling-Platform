package com.unix.aiupskilling.mentor.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mentor_student_links", indexes = {
        @Index(name = "idx_mentor_student_links_mentor", columnList = "mentor_user_id"),
        @Index(name = "idx_mentor_student_links_student", columnList = "student_user_id"),
        @Index(name = "idx_mentor_student_links_active", columnList = "student_user_id, unlinked_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorStudentLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mentor_user_id", nullable = false)
    private Long mentorUserId;

    @Column(name = "student_user_id", nullable = false)
    private Long studentUserId;

    @Column(name = "key_id")
    private UUID keyId;

    @Column(name = "linked_at", nullable = false)
    private Instant linkedAt;

    @Column(name = "unlinked_at")
    private Instant unlinkedAt;

    @PrePersist
    protected void onCreate() {
        if (linkedAt == null) {
            linkedAt = Instant.now();
        }
    }
}
