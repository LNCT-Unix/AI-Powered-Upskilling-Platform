package com.unix.ai_upskilling_platform.authentication.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkIntentResponse {

    private String authorizationPath;
    private long expiresInSeconds;
}
