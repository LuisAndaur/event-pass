package com.eventpass.catalog.infrastructure.persistence;

import com.eventpass.catalog.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {
    List<Event> findByActiveTrueOrderByDateAsc();
    List<Event> findByCategoryAndActiveTrue(String category);
}
