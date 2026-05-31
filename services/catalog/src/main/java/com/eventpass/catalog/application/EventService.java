package com.eventpass.catalog.application;

import com.eventpass.catalog.domain.Event;
import com.eventpass.catalog.infrastructure.cache.EventCacheService;
import com.eventpass.catalog.infrastructure.persistence.EventRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {

    private final EventRepository repository;
    private final EventCacheService cache;

    public EventService(EventRepository repository, EventCacheService cache) {
        this.repository = repository;
        this.cache = cache;
    }

    public List<Event> getAllActiveEvents() {
        return repository.findByActiveTrueOrderByDateAsc();
    }

    public Event getEventById(String id) {
        Event cached = cache.getCachedEvent(id);
        if (cached != null) return cached;

        Event event = repository.findById(id).orElse(null);
        if (event != null) {
            cache.cacheEvent(event);
        }
        return event;
    }

    public Event createEvent(Event event) {
        Event saved = repository.save(event);
        cache.cacheEvent(saved);
        return saved;
    }

    public Event updateEvent(String id, Event updated) {
        Event existing = repository.findById(id).orElse(null);
        if (existing == null) return null;

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setDate(updated.getDate());
        existing.setVenue(updated.getVenue());
        existing.setCategory(updated.getCategory());
        existing.setPrice(updated.getPrice());
        existing.setTotalCapacity(updated.getTotalCapacity());
        existing.setAvailableStock(updated.getAvailableStock());
        existing.setImageUrl(updated.getImageUrl());
        existing.setActive(updated.isActive());

        Event saved = repository.save(existing);
        cache.cacheEvent(saved);
        return saved;
    }
}
