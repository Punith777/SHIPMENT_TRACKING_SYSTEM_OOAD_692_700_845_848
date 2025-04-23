package com.logistics.logistics.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Shipments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shipment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shipment_id")
    private Integer shipmentId;
    
    @Column(nullable = false, length = 20, unique = true)
    private String trackingNumber;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inventory_transfer_id", nullable = false)
    private InventoryTransfer inventoryTransfer;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "origin_warehouse_id", nullable = false)
    private Warehouse originWarehouse;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_warehouse_id", nullable = false)
    private Warehouse destinationWarehouse;
    
    @Column(name = "total_weight", precision = 10, scale = 2)
    private BigDecimal totalWeight;
    
    @Column(name = "total_volume", precision = 10, scale = 2)
    private BigDecimal totalVolume;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_truck_id")
    private Truck assignedTruck;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ShipmentStatus status;
    
    @Column(name = "scheduled_pickup_date")
    private LocalDateTime scheduledPickupDate;
    
    @Column(name = "actual_pickup_date")
    private LocalDateTime actualPickupDate;
    
    @Column(name = "estimated_delivery_date")
    private LocalDateTime estimatedDeliveryDate;
    
    @Column(name = "actual_delivery_date")
    private LocalDateTime actualDeliveryDate;
    
    @Column(name = "notes", length = 500)
    private String notes;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum ShipmentStatus {
        PENDING,
        SCHEDULED_FOR_PICKUP,
        READY_FOR_PICKUP,
        IN_TRANSIT,
        DELIVERED,
        CANCELLED
    }
}
