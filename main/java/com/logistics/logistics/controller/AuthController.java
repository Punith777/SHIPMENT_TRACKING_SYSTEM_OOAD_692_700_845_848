package com.logistics.logistics.controller;

import com.logistics.logistics.dto.AuthenticationRequest;
import com.logistics.logistics.dto.AuthenticationResponse;
import com.logistics.logistics.dto.RegistrationRequest;
import com.logistics.logistics.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegistrationRequest request) {
        logger.info("Registration request received for username: {}", request.getUsername());
        try {
            AuthenticationResponse response = authService.register(request);
            logger.info("Registration successful for username: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Registration failed for username: {}, error: {}", request.getUsername(), e.getMessage());
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        logger.info("Login request received for username: {}", request.getUsername());
        try {
            // Validate request
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                logger.error("Login failed: username is empty");
                throw new IllegalArgumentException("Username cannot be empty");
            }
            
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                logger.error("Login failed: password is empty");
                throw new IllegalArgumentException("Password cannot be empty");
            }
            
            // Attempt authentication
            AuthenticationResponse response = authService.authenticate(request);
            logger.info("Login successful for username: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            logger.error("Login failed for username: {}, bad credentials", request.getUsername());
            throw e; // Will be handled by AuthExceptionHandler
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            logger.error("Login failed for username: {}, user not found", request.getUsername());
            throw e; // Will be handled by AuthExceptionHandler
        } catch (IllegalArgumentException e) {
            logger.error("Login failed for username: {}, invalid argument: {}", request.getUsername(), e.getMessage());
            throw e; // Will be handled by AuthExceptionHandler
        } catch (Exception e) {
            logger.error("Login failed for username: {}, unexpected error: {}", request.getUsername(), e.getMessage(), e);
            throw new RuntimeException("An unexpected error occurred during login", e);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> testAuth() {
        logger.info("Auth test endpoint called");
        return ResponseEntity.ok("Auth endpoint is working");
    }
}
