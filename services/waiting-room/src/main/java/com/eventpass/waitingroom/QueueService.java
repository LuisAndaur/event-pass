package com.eventpass.waitingroom;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Set;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;

@Service
public class QueueService {

    private static final String QUEUE_KEY_PREFIX = "queue:event:";
    private static final String PASS_TOKEN_PREFIX = "passtoken:";
    private static final String DRIP_LOCK_KEY = "lock:queue:dripfeed";

    private final StringRedisTemplate redis;
    private final SecretKey secretKey;
    private final long expirationMs;

    public QueueService(StringRedisTemplate redis,
                        @Value("${JWT_SECRET:default-secret-key-change-in-production}") String jwtSecret,
                        @Value("${JWT_EXPIRATION_MS:900000}") long expirationMs) {
        this.redis = redis;
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public long joinQueue(String eventId, String userId) {
        String key = QUEUE_KEY_PREFIX + eventId;
        long timestamp = Instant.now().toEpochMilli();
        redis.opsForZSet().add(key, userId, timestamp);
        return redis.opsForZSet().rank(key, userId);
    }

    public long getPosition(String eventId, String userId) {
        String key = QUEUE_KEY_PREFIX + eventId;
        Long rank = redis.opsForZSet().rank(key, userId);
        return rank != null ? rank : -1;
    }

    public long getQueueSize(String eventId) {
        String key = QUEUE_KEY_PREFIX + eventId;
        Long size = redis.opsForZSet().size(key);
        return size != null ? size : 0;
    }

    public String generatePassToken(String userId, String eventId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("eventId", eventId)
                .claim("type", "PASS_TOKEN")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Scheduled task: every 10 seconds, pop the first users from the queue
     * and generate pass tokens for them. This simulates the "drip-feed"
     * mechanism that protects the Reservation Service.
     */
    @Scheduled(fixedDelay = 10000)
    public void processQueue() {
        // Single-flight across replicas: only the instance that acquires the
        // Redis lock runs the drip-feed this tick. The lock auto-expires (9s)
        // so the next tick is open to any replica. This keeps the throttle rate
        // constant regardless of how many waiting-room replicas are running.
        Boolean acquired = redis.opsForValue()
                .setIfAbsent(DRIP_LOCK_KEY, "1", java.time.Duration.ofSeconds(9));
        if (!Boolean.TRUE.equals(acquired)) return;

        Set<String> keys = redis.keys(QUEUE_KEY_PREFIX + "*");
        if (keys == null) return;

        for (String key : keys) {
            String eventId = key.replace(QUEUE_KEY_PREFIX, "");
            // Pop 5 users from the front of the queue
            for (int i = 0; i < 5; i++) {
                Set<TypedTuple<String>> users = redis.opsForZSet().popMin(key, 1);
                if (users == null || users.isEmpty()) break;

                String userId = users.iterator().next().getValue();
                String token = generatePassToken(userId, eventId);
                String tokenKey = PASS_TOKEN_PREFIX + userId + ":" + eventId;
                redis.opsForValue().set(tokenKey, token);
                redis.expire(tokenKey, java.time.Duration.ofMillis(expirationMs));
            }
        }
    }
}
