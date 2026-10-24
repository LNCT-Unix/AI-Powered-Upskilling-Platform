package com.teamunix.gateway.assessment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/** One placement test run for one user and track. Created by start(), updated after every answer. */
@Entity
@Table(name = "assessments")
public class Assessment {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "track_id", nullable = false)
    private UUID trackId;

    private String status;          // IN_PROGRESS or COMPLETED

    private String level;           // BEGINNER / INTERMEDIATE / ADVANCED, set when finished

    private Double theta;           // final ability estimate, set when finished

    @Column(name = "items_administered")
    private Integer itemsAdministered;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "stop_reason")
    private String stopReason;      // MAX_ITEMS / LEVEL_CONFIRMED / NO_QUESTIONS_LEFT

    @Column(name = "completed_at")
    private Instant completedAt;

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getTrackId() { return trackId; }
    public void setTrackId(UUID trackId) { this.trackId = trackId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public Double getTheta() { return theta; }
    public void setTheta(Double theta) { this.theta = theta; }
    public Integer getItemsAdministered() { return itemsAdministered; }
    public void setItemsAdministered(Integer itemsAdministered) { this.itemsAdministered = itemsAdministered; }
    public Integer getCorrectCount() { return correctCount; }
    public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }
    public String getStopReason() { return stopReason; }
    public void setStopReason(String stopReason) { this.stopReason = stopReason; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
