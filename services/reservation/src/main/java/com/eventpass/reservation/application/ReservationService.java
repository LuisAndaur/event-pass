package com.eventpass.reservation.application;

import com.eventpass.reservation.domain.Reservation;
import com.eventpass.reservation.infrastructure.messaging.EventPublisher;
import com.eventpass.reservation.infrastructure.messaging.TicketReservedEvent;
import com.eventpass.reservation.infrastructure.persistence.InventoryRepository;
import com.eventpass.reservation.infrastructure.persistence.InventoryEntity;
import com.eventpass.reservation.infrastructure.persistence.ReservationRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ReservationService {

    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);

    private final ReservationRepository reservationRepo;
    private final InventoryRepository inventoryRepo;
    private final EventPublisher eventPublisher;

    public ReservationService(ReservationRepository reservationRepo,
                              InventoryRepository inventoryRepo,
                              EventPublisher eventPublisher) {
        this.reservationRepo = reservationRepo;
        this.inventoryRepo = inventoryRepo;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Reservation reserveTicket(String eventId, String userId, int quantity, BigDecimal unitPrice) {
        // Pessimistic Lock: SELECT ... FOR UPDATE
        // If inventory doesn't exist yet (first request for this event), create it with default stock
        InventoryEntity inventory = inventoryRepo.findByIdWithPessimisticLock(eventId)
                .orElseGet(() -> {
                    InventoryEntity newInv = new InventoryEntity(eventId, 50000);
                    return inventoryRepo.save(newInv);
                });

        if (inventory.getAvailableStock() < quantity) {
            throw new RuntimeException("Insufficient stock for event " + eventId +
                    ". Requested: " + quantity + ", Available: " + inventory.getAvailableStock());
        }

        // Decrease stock atomically
        inventory.setAvailableStock(inventory.getAvailableStock() - quantity);
        inventoryRepo.save(inventory);

        // Create reservation
        BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(quantity));
        Reservation reservation = new Reservation(eventId, userId, quantity, total);
        reservation = reservationRepo.save(reservation);

        log.info("Reservation created: id={}, event={}, user={}, qty={}, total={}",
                reservation.getId(), eventId, userId, quantity, total);

        // Publish async event to Kafka
        TicketReservedEvent event = new TicketReservedEvent(
                reservation.getId(), eventId, userId, quantity, total);
        eventPublisher.publishTicketReserved(event);

        return reservation;
    }

    public List<Reservation> getUserReservations(String userId) {
        return reservationRepo.findByUserId(userId);
    }

    public List<Reservation> getUserPaidReservations(String userId) {
        return reservationRepo.findByUserIdAndStatus(userId, Reservation.Status.PAID);
    }

    public Reservation getReservation(String id) {
        return reservationRepo.findById(id).orElse(null);
    }
}
