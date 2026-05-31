package com.eventpass.reservation.infrastructure.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventPublisher {

    private static final String TICKET_TOPIC = "ticket-events";
    private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);

    private final KafkaTemplate<String, Object> kafka;

    public EventPublisher(KafkaTemplate<String, Object> kafka) {
        this.kafka = kafka;
    }

    public void publishTicketReserved(TicketReservedEvent event) {
        log.info("Publishing TicketReservedEvent: reservation={}, event={}, user={}",
                event.getReservationId(), event.getEventId(), event.getUserId());
        kafka.send(TICKET_TOPIC, event.getReservationId(), event);
    }
}
