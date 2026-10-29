package com.unix.aiupskilling;

import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class SecurityAndEndpointIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthTokenService authTokenService;

    private MockMvc mockMvc;
    private User testUser;
    private AuthTokens userTokens;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        userRepository.deleteAll();

        testUser = User.builder()
                .email("test.integration@example.com")
                .fullName("Integration Tester")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        testUser = userRepository.save(testUser);

        userTokens = authTokenService.issueTokens(testUser, ClientPlatform.WEB);
    }

    @Test
    @DisplayName("Unauthenticated request to /api/auth/me returns 401 JSON (not HTML)")
    void testMeUnauthenticatedReturnsJson401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Unauthenticated request to /api/users returns 401 JSON")
    void testUsersUnauthenticatedReturnsJson401() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Authenticated request to /api/auth/me with Bearer token returns 200 with UserResponse")
    void testMeAuthenticatedSucceeds() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + userTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(testUser.getId()))
                .andExpect(jsonPath("$.data.email").value("test.integration@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Integration Tester"))
                .andExpect(jsonPath("$.data.role").value("USER"));
    }

    @Test
    @DisplayName("OAuth exchange with invalid code returns 401 JSON")
    void testExchangeInvalidCodeReturns401() throws Exception {
        mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"invalid-or-unknown-code\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("LOGIN_CODE_INVALID"));
    }

    @Test
    @DisplayName("OAuth exchange with blank code returns 400 validation error")
    void testExchangeBlankCodeReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Refresh token rotation via cookie succeeds and returns new credentials")
    void testRefreshViaCookie() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie("refresh_token", userTokens.getRefreshToken()))
                        .header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(cookie().httpOnly("refresh_token", true));
    }

    @Test
    @DisplayName("Refresh token with disallowed Origin is rejected with 403 Forbidden")
    void testRefreshDisallowedOrigin() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie("refresh_token", userTokens.getRefreshToken()))
                        .header("Origin", "http://evil-attacker.com"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Logout endpoint revokes token and clears cookie")
    void testLogoutClearsCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .cookie(new Cookie("refresh_token", userTokens.getRefreshToken()))
                        .header("Origin", "http://localhost:5173"))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("refresh_token", 0));
    }

    @Test
    @DisplayName("Create link intent requires authentication")
    void testCreateLinkIntentRequiresAuth() throws Exception {
        mockMvc.perform(post("/api/auth/oauth-links/google/intent"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Create link intent succeeds for authenticated user without password")
    void testCreateLinkIntentSucceeds() throws Exception {
        mockMvc.perform(post("/api/auth/oauth-links/google/intent")
                        .header("Authorization", "Bearer " + userTokens.getAccessToken()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.authorizationPath").value("/oauth2/authorization/google"))
                .andExpect(cookie().exists("oauth_link_intent"))
                .andExpect(cookie().httpOnly("oauth_link_intent", true));
    }

    @Test
    @DisplayName("Update profile succeeds when authenticated with valid payload")
    void testUpdateProfileAuthenticatedSucceeds() throws Exception {
        String payload = "{\"fullName\":\"Updated Alexandria\",\"avatarUrl\":\"preset:octo-wizard\",\"bio\":\"AI & Systems Explorer\"}";

        mockMvc.perform(put("/api/users/profile")
                        .header("Authorization", "Bearer " + userTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Updated Alexandria"))
                .andExpect(jsonPath("$.data.avatarUrl").value("preset:octo-wizard"))
                .andExpect(jsonPath("$.data.bio").value("AI & Systems Explorer"));
    }

    @Test
    @DisplayName("Update profile unauthenticated returns 401")
    void testUpdateProfileUnauthenticatedReturns401() throws Exception {
        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"New Name\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Update profile with blank fullName returns 400")
    void testUpdateProfileInvalidPayloadReturns400() throws Exception {
        mockMvc.perform(put("/api/users/profile")
                        .header("Authorization", "Bearer " + userTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Get profile authenticated returns current user profile with avatarUrl")
    void testGetProfileAuthenticatedSucceeds() throws Exception {
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + userTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(testUser.getId()))
                .andExpect(jsonPath("$.data.email").value("test.integration@example.com"));
    }
}
