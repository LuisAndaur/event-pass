package com.eventpass.reservation.infrastructure.messaging;

import com.eventpass.reservation.domain.Reservation;
import com.eventpass.reservation.infrastructure.persistence.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mock Payment Worker — simulates an asynchronous payment processor.
 * Every 15 seconds, picks any PENDING_PAYMENT reservations and "processes"
 * them: ~80% approved, ~20% failed.
 *
 * In production, this would be a separate service consuming from Kafka directly.
 */
@Component
public class MockPaymentWorker {

    private static final Logger log = LoggerFactory.getLogger(MockPaymentWorker.class);
    private static final String PAYMENT_TOPIC = "payment-events";

    private final ReservationRepository reservationRepo;
    private final KafkaTemplate<String, Object> kafka;

    public MockPaymentWorker(ReservationRepository reservationRepo,
                             KafkaTemplate<String, Object> kafka) {
        this.reservationRepo = reservationRepo;
        this.kafka = kafka;
    }

    @Scheduled(fixedDelay = 15000)
    public void processPendingPayments() {
        List<Reservation> pending = reservationRepo.findByStatus(Reservation.Status.PENDING_PAYMENT);

        for (Reservation reservation : pending) {
            boolean approved = Math.random() > 0.2; // 80% approval rate
            PaymentEvent.PaymentStatus status = approved
                    ? PaymentEvent.PaymentStatus.APPROVED
                    : PaymentEvent.PaymentStatus.FAILED;

            PaymentEvent event = new PaymentEvent(
                    reservation.getId(),
                    reservation.getEventId(),
                    reservation.getUserId(),
                    status,
                    reservation.getTotalAmount()
            );

            log.info("Mock payment processed: reservation={}, status={}", reservation.getId(), status);
            kafka.send(PAYMENT_TOPIC, reservation.getId(), event);
        }
    }
}
