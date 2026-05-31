package com.eventpass.reservation.infrastructure.persistence;

import jakarta.persistence.*;

@Entity
@Table(name = "inventory")
public class InventoryEntity {

    @Id
    private String eventId;

    @Column(nullable = false)
    private int totalCapacity;

    @Column(nullable = false)
    private int availableStock;

    @Version
    private Long version;

    public InventoryEntity() {}

    public InventoryEntity(String eventId, int totalCapacity) {
        this.eventId = eventId;
        this.totalCapacity = totalCapacity;
        this.availableStock = totalCapacity;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public int getTotalCapacity() { return totalCapacity; }
    public void setTotalCapacity(int totalCapacity) { this.totalCapacity = totalCapacity; }

    public int getAvailableStock() { return availableStock; }
    public void setAvailableStock(int availableStock) { this.availableStock = availableStock; }
}
