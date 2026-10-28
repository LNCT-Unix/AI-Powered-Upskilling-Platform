package com.unix.aiupskilling.assessment.model.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A skill of a track. The prerequisite ids live in the skill_prerequisites table and are
 * mapped as an element collection, so that table needs no entity of its own.
 * The slug is the stable human-readable key from the YAML seed file (e.g. "sql-basics").
 */
@Entity
@Table(name = "skills")
public class Skill {

    @Id
    private UUID id;

    @Column(name = "track_id")
    private UUID trackId;

    /** Stable human-readable key from the seed YAML (e.g. "sql-basics"). Unique within a track. */
    @Column(name = "slug", length = 100)
    private String slug;

    private String name;

    private String cluster;

    private double difficulty;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "skill_prerequisites", joinColumns = @JoinColumn(name = "skill_id"))
    @Column(name = "prerequisite_id")
    private Set<UUID> prerequisites = new HashSet<>();

    public Skill() {}

    public Skill(UUID id, UUID trackId, String name, String cluster, double difficulty, Set<UUID> prerequisites) {
        this(id, trackId, null, name, cluster, difficulty, prerequisites);
    }

    public Skill(UUID id, UUID trackId, String slug, String name, String cluster, double difficulty, Set<UUID> prerequisites) {
        this.id = id;
        this.trackId = trackId;
        this.slug = slug;
        this.name = name;
        this.cluster = cluster;
        this.difficulty = difficulty;
        if (prerequisites != null) {
            this.prerequisites = prerequisites;
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTrackId() { return trackId; }
    public void setTrackId(UUID trackId) { this.trackId = trackId; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCluster() { return cluster; }
    public void setCluster(String cluster) { this.cluster = cluster; }
    public double getDifficulty() { return difficulty; }
    public void setDifficulty(double difficulty) { this.difficulty = difficulty; }
    public Set<UUID> getPrerequisites() { return prerequisites; }
    public void setPrerequisites(Set<UUID> prerequisites) { this.prerequisites = prerequisites; }
}
