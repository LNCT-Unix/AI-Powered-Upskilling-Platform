package com.teamunix.gateway.assessment.entity;

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

    public UUID getId() { return id; }
    public String getStatus() { return status; }
}
