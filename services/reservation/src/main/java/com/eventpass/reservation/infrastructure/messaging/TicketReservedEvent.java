package com.eventpass.reservation.infrastructure.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TicketReservedEvent {

    private String reservationId;
    private String eventId;
    private String userId;
    private int quantity;
    private BigDecimal totalAmount;
    private LocalDateTime timestamp;

    public TicketReservedEvent() {}

    public TicketReservedEvent(String reservationId, String eventId, String userId,
                                int quantity, BigDecimal totalAmount) {
        this.reservationId = reservationId;
        this.eventId = eventId;
        this.userId = userId;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.timestamp = LocalDateTime.now();
    }

    public String getReservationId() { return reservationId; }
    public void setReservationId(String reservationId) { this.reservationId = reservationId; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
