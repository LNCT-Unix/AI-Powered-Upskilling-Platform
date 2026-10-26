package com.unix.aiupskilling.assessment.model.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/** A learning track. This service only reads it (to check it is ACTIVE); rows are seeded elsewhere. */
@Entity
@Table(name = "tracks")
public class Track {

    @Id
    private UUID id;

    private String status;

    public Track() {}

    public Track(UUID id, String status) {
        this.id = id;
        this.status = status;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
