package com.unix.aiupskilling.authentication.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationAcceptedResponse {

    private String email;

    @Builder.Default
    private boolean verificationRequired = true;
}
