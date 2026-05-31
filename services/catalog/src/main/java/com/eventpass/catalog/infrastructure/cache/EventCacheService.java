package com.eventpass.catalog.infrastructure.cache;

import com.eventpass.catalog.domain.Event;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class EventCacheService {

    private static final String CACHE_PREFIX = "event:cache:";
    private static final String LIST_CACHE_KEY = "event:list:all";

    private final StringRedisTemplate redis;

    public EventCacheService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void cacheEvent(Event event) {
        String key = CACHE_PREFIX + event.getId();
        redis.opsForValue().set(key, serialize(event), Duration.ofMinutes(10));
    }

    public Event getCachedEvent(String id) {
        String key = CACHE_PREFIX + id;
        String data = redis.opsForValue().get(key);
        return data != null ? deserialize(data) : null;
    }

    public void evictEvent(String id) {
        redis.delete(CACHE_PREFIX + id);
    }

    private String serialize(Event event) {
        return String.join("|||",
                event.getId(),
                event.getTitle(),
                event.getDescription() != null ? event.getDescription() : "",
                event.getDate().toString(),
                event.getVenue(),
                event.getCategory(),
                event.getPrice().toString(),
                String.valueOf(event.getTotalCapacity()),
                String.valueOf(event.getAvailableStock()),
                event.getImageUrl() != null ? event.getImageUrl() : ""
        );
    }

    private Event deserialize(String data) {
        String[] parts = data.split("\\|\\|\\|");
        Event event = new Event();
        event.setId(parts[0]);
        event.setTitle(parts[1]);
        event.setDescription(parts[2].isEmpty() ? null : parts[2]);
        event.setDate(java.time.LocalDateTime.parse(parts[3]));
        event.setVenue(parts[4]);
        event.setCategory(parts[5]);
        event.setPrice(new java.math.BigDecimal(parts[6]));
        event.setTotalCapacity(Integer.parseInt(parts[7]));
        event.setAvailableStock(Integer.parseInt(parts[8]));
        event.setImageUrl(parts[9].isEmpty() ? null : parts[9]);
        return event;
    }
}
