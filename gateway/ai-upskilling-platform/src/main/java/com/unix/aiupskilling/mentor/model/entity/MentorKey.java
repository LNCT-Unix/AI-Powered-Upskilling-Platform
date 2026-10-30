package com.unix.aiupskilling.mentor.model.entity;

import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mentor_keys", indexes = {
        @Index(name = "idx_mentor_keys_user_status", columnList = "mentor_user_id, status"),
        @Index(name = "idx_mentor_keys_key_value", columnList = "key_value", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorKey {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "mentor_user_id", nullable = false)
    private Long mentorUserId;

    @Column(name = "key_value", length = 13, nullable = false, unique = true)
    private String keyValue;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, nullable = false)
    @Builder.Default
    private MentorKeyStatus status = MentorKeyStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "rotated_from_id")
    private UUID rotatedFromId;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = MentorKeyStatus.ACTIVE;
        }
    }
}
