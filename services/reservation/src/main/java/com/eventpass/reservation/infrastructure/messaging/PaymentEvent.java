package com.eventpass.reservation.infrastructure.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentEvent {

    public enum PaymentStatus {
        APPROVED, FAILED
    }

    private String reservationId;
    private String eventId;
    private String userId;
    private PaymentStatus status;
    private BigDecimal amount;
    private LocalDateTime timestamp;

    public PaymentEvent() {}

    public PaymentEvent(String reservationId, String eventId, String userId,
                        PaymentStatus status, BigDecimal amount) {
        this.reservationId = reservationId;
        this.eventId = eventId;
        this.userId = userId;
        this.status = status;
        this.amount = amount;
        this.timestamp = LocalDateTime.now();
    }

    public String getReservationId() { return reservationId; }
    public void setReservationId(String reservationId) { this.reservationId = reservationId; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
