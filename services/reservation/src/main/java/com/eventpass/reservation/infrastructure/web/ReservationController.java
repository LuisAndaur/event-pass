package com.eventpass.reservation.infrastructure.web;

import com.eventpass.reservation.application.ReservationService;
import com.eventpass.reservation.domain.Reservation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class ReservationController {

    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @PostMapping("/reserve")
    public ResponseEntity<?> reserveTicket(@RequestBody Map<String, Object> body) {
        try {
            String eventId = (String) body.get("eventId");
            String userId = (String) body.get("userId");
            int quantity = (int) body.get("quantity");
            BigDecimal unitPrice = new BigDecimal(body.get("unitPrice").toString());

            if (eventId == null || userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "eventId and userId required"));
            }

            Reservation reservation = service.reserveTicket(eventId, userId, quantity, unitPrice);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                    "reservationId", reservation.getId(),
                    "status", reservation.getStatus().toString(),
                    "message", "Reservation created. Processing payment..."
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Reservation>> getUserReservations(@PathVariable String userId) {
        return ResponseEntity.ok(service.getUserReservations(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getReservation(@PathVariable String id) {
        Reservation reservation = service.getReservation(id);
        if (reservation == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reservation);
    }

    @GetMapping("/user/{userId}/paid")
    public ResponseEntity<List<Reservation>> getPaidReservations(@PathVariable String userId) {
        return ResponseEntity.ok(service.getUserPaidReservations(userId));
    }
}
