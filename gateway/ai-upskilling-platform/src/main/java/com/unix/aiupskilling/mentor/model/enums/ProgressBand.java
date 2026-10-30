package com.unix.aiupskilling.mentor.model.enums;

import lombok.Getter;

@Getter
public enum ProgressBand {
    ADVANCED("Advanced"),
    ON_TRACK("On Track"),
    NEEDS_ATTENTION("Needs Attention");

    private final String label;

    ProgressBand(String label) {
        this.label = label;
    }

    public static ProgressBand fromProgress(int progress) {
        if (progress >= 75) {
            return ADVANCED;
        } else if (progress >= 50) {
            return ON_TRACK;
        } else {
            return NEEDS_ATTENTION;
        }
    }
}
