package com.unix.ai_upskilling_platform.authentication.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeLoginCodeRequest {

    @NotBlank(message = "Code must not be blank")
    private String code;
}
