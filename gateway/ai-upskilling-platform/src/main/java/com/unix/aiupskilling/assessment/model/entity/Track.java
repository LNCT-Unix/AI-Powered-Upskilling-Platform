package com.unix.aiupskilling.assessment.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/** A learning track (e.g. "Backend Engineering"). Rows are seeded; this service reads and checks status. */
@Entity
@Table(name = "tracks")
public class Track {

    @Id
    private UUID id;

    /** Human-readable URL-safe key (e.g. "backend-engineering"). */
    @Column(length = 100)
    private String slug;

    /** Display name (e.g. "Backend Engineering"). */
    private String name;

    private String status;

    public Track() {}

    public Track(UUID id, String status) {
        this.id = id;
        this.status = status;
    }

    public Track(UUID id, String slug, String name, String status) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.status = status;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
