package com.unix.aiupskilling.assessment.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * One question in the pool. Rows are seeded into the database (see AssessmentDataLoader),
 * so this entity has no id generator - the service only reads items.
 * options is a jsonb/text column, read as plain text here and parsed in the service.
 * skillSlug links this question back to the Skill it primarily tests.
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

    @Column(columnDefinition = "text")
    private String options;         // JSON text: ["option 0", "option 1", ...]

    @Column(name = "correct_option")
    private int correctOption;      // 0-based index into options

    private String status;          // ACTIVE items take part in tests

    /** The slug of the Skill this question primarily tests (matches Skill.slug). */
    @Column(name = "skill_slug", length = 100)
    private String skillSlug;

    public AssessmentItem() {}

    public AssessmentItem(UUID id, UUID trackId, double difficulty, String stem, String options,
                          int correctOption, String status) {
        this(id, trackId, difficulty, stem, options, correctOption, status, null);
    }

    public AssessmentItem(UUID id, UUID trackId, double difficulty, String stem, String options,
                          int correctOption, String status, String skillSlug) {
        this.id = id;
        this.trackId = trackId;
        this.difficulty = difficulty;
        this.stem = stem;
        this.options = options;
        this.correctOption = correctOption;
        this.status = status;
        this.skillSlug = skillSlug;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTrackId() { return trackId; }
    public void setTrackId(UUID trackId) { this.trackId = trackId; }
    public double getDifficulty() { return difficulty; }
    public void setDifficulty(double difficulty) { this.difficulty = difficulty; }
    public String getStem() { return stem; }
    public void setStem(String stem) { this.stem = stem; }
    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }
    public int getCorrectOption() { return correctOption; }
    public void setCorrectOption(int correctOption) { this.correctOption = correctOption; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSkillSlug() { return skillSlug; }
    public void setSkillSlug(String skillSlug) { this.skillSlug = skillSlug; }
}
