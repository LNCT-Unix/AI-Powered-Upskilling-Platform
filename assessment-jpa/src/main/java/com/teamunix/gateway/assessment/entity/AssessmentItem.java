package com.teamunix.gateway.assessment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * One question in the pool. Rows are seeded into the database (see the INSERT example in
 * AssessmentService), so this entity has no id generator - the service only reads items.
 * options is a jsonb column, read as plain text here and parsed in the service.
 */
@Entity
@Table(name = "assessment_items")
public class AssessmentItem {

    @Id
    private UUID id;

    @Column(name = "track_id")
    private UUID trackId;

    private double difficulty;

    private String stem;

    private String options;         // JSON text: ["option 0", "option 1", ...]

    @Column(name = "correct_option")
    private int correctOption;      // 0-based index into options

    private String status;          // ACTIVE items take part in tests

    public UUID getId() { return id; }
    public UUID getTrackId() { return trackId; }
    public double getDifficulty() { return difficulty; }
    public String getStem() { return stem; }
    public String getOptions() { return options; }
    public int getCorrectOption() { return correctOption; }
    public String getStatus() { return status; }
}
