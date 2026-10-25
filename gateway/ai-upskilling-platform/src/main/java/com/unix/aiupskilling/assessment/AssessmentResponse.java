package com.unix.aiupskilling.assessment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/** One answer the learner gave, in order (seq 1, 2, 3, ...). */
@Entity
@Table(name = "assessment_responses")
public class AssessmentResponse {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;                // simple surrogate key for JPA

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    private int seq;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id")
    private AssessmentItem item;

    @Column(name = "selected_option")
    private Integer selectedOption;

    @Column(name = "is_correct")
    private boolean correct;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Assessment getAssessment() { return assessment; }
    public void setAssessment(Assessment assessment) { this.assessment = assessment; }
    public int getSeq() { return seq; }
    public void setSeq(int seq) { this.seq = seq; }
    public AssessmentItem getItem() { return item; }
    public void setItem(AssessmentItem item) { this.item = item; }
    public Integer getSelectedOption() { return selectedOption; }
    public void setSelectedOption(Integer selectedOption) { this.selectedOption = selectedOption; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
}
