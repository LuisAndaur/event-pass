package com.eventpass.gateway;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SecretKey secretKey;
    private final long expirationMs;

    public AuthController() {
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isEmpty()) {
            throw new IllegalStateException("JWT_SECRET environment variable is required");
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = Long.parseLong(System.getenv().getOrDefault("JWT_EXPIRATION_MS", "900000"));
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, Object>>> login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "");
        String password = body.getOrDefault("password", "");

        if (email.isEmpty() || password.isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Email and password required")));
        }

        // Mock authentication — in production this would validate against a user service
        if (!password.equals("pass123")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials")));
        }

        String userId = email.hashCode() + "";
        String role = email.contains("organizer") ? "ROLE_ORGANIZADOR" : "ROLE_ASISTENTE";

        Instant now = Instant.now();
        String token = Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(secretKey)
                .compact();

        return Mono.just(ResponseEntity.ok(Map.of(
                "token", token,
                "userId", userId,
                "email", email,
                "role", role,
                "expiresIn", expirationMs
        )));
    }
}
