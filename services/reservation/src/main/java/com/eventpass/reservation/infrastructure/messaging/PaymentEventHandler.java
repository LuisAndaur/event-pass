package com.eventpass.reservation.infrastructure.messaging;

import com.eventpass.reservation.domain.Reservation;
import com.eventpass.reservation.infrastructure.persistence.InventoryRepository;
import com.eventpass.reservation.infrastructure.persistence.InventoryEntity;
import com.eventpass.reservation.infrastructure.persistence.ReservationRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventHandler {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventHandler.class);
    private static final String PAYMENT_TOPIC = "payment-events";

    private final ReservationRepository reservationRepo;
    private final InventoryRepository inventoryRepo;

    public PaymentEventHandler(ReservationRepository reservationRepo,
                               InventoryRepository inventoryRepo) {
        this.reservationRepo = reservationRepo;
        this.inventoryRepo = inventoryRepo;
    }

    @KafkaListener(topics = PAYMENT_TOPIC, groupId = "reservation-group")
    @Transactional
    public void handlePaymentEvent(PaymentEvent event) {
        log.info("Received PaymentEvent: reservation={}, status={}",
                event.getReservationId(), event.getStatus());

        Reservation reservation = reservationRepo.findById(event.getReservationId()).orElse(null);
        if (reservation == null) {
            log.error("Reservation not found: {}", event.getReservationId());
            return;
        }

        // Idempotency guard: with horizontally-scaled replicas the MockPaymentWorker
        // may emit duplicate payment events. Only the first one (while the reservation
        // is still PENDING_PAYMENT) is applied; duplicates are ignored safely.
        if (reservation.getStatus() != Reservation.Status.PENDING_PAYMENT) {
            log.info("Ignoring payment event for reservation {} already resolved as {}",
                    reservation.getId(), reservation.getStatus());
            return;
        }

        if (event.getStatus() == PaymentEvent.PaymentStatus.APPROVED) {
            reservation.setStatus(Reservation.Status.PAID);
            reservation.setUpdatedAt(java.time.LocalDateTime.now());
            reservationRepo.save(reservation);
            log.info("Reservation {} marked as PAID", reservation.getId());
        } else {
            // Payment failed - Saga compensation: release stock
            reservation.setStatus(Reservation.Status.FAILED);
            reservation.setUpdatedAt(java.time.LocalDateTime.now());
            reservationRepo.save(reservation);

            InventoryEntity inventory = inventoryRepo.findByIdWithPessimisticLock(event.getEventId()).orElse(null);
            if (inventory != null) {
                inventory.setAvailableStock(inventory.getAvailableStock() + reservation.getQuantity());
                inventoryRepo.save(inventory);
                log.info("Compensation: released {} tickets for event {}",
                        reservation.getQuantity(), event.getEventId());
            }
        }
    }
}
