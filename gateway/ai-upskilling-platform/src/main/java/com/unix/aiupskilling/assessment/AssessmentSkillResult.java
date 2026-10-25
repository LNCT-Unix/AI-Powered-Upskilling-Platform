package com.unix.aiupskilling.assessment;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/** The mapped state of one skill for one finished assessment. Written once, at the end of the test. */
@Entity
@Table(name = "assessment_skill_results")
public class AssessmentSkillResult {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    private String state;           // MASTERED / FRONTIER / LOCKED

    public AssessmentSkillResult() {}

    public AssessmentSkillResult(Assessment assessment, Skill skill, String state) {
        this.assessment = assessment;
        this.skill = skill;
        this.state = state;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Assessment getAssessment() { return assessment; }
    public void setAssessment(Assessment assessment) { this.assessment = assessment; }
    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) { this.skill = skill; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
